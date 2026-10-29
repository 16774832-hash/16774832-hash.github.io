(() => {
  const cards = [...document.querySelectorAll('.asset-card')];
  const selected = new Set();
  const visibleSelection = document.querySelector('#select-visible');
  const selectedCount = document.querySelector('#selected-count');
  const clearSelection = document.querySelector('#clear-selection');
  const downloadSelected = document.querySelector('#download-selected');
  const status = document.querySelector('#selection-status');
  let archiveBusy = false;

  const decode = value => {
    try { return decodeURIComponent(value); } catch { return value; }
  };
  const assetPathOf = card => decode(card.querySelector('.asset-image[data-full]')?.dataset.full || '');
  const filenameOf = path => path.split(/[\\/]/).filter(Boolean).pop() || '素材';
  const isCardVisible = card => !card.hidden && !!card.closest('.collection-section') && !card.closest('.collection-section').hidden;

  function renderSelection() {
    selectedCount.textContent = String(selected.size);
    clearSelection.disabled = selected.size === 0 || archiveBusy;
    downloadSelected.disabled = selected.size === 0 || archiveBusy;
    for (const card of cards) {
      const isSelected = selected.has(assetPathOf(card));
      card.classList.toggle('is-selected', isSelected);
      const checkbox = card.querySelector('.asset-select input');
      if (checkbox) {
        checkbox.checked = isSelected;
        checkbox.disabled = archiveBusy;
      }
    }
    const visible = cards.filter(isCardVisible);
    const count = visible.filter(card => selected.has(assetPathOf(card))).length;
    visibleSelection.checked = visible.length > 0 && count === visible.length;
    visibleSelection.indeterminate = count > 0 && count < visible.length;
    visibleSelection.disabled = visible.length === 0 || archiveBusy;
  }

  function addCardControls(card) {
    const preview = card.querySelector('.asset-image[data-full]');
    const meta = card.querySelector('.asset-meta');
    const image = preview?.querySelector('img');
    if (!preview || !meta || !image) return;
    const id = assetPathOf(card);
    card.dataset.assetId = id;

    const actions = document.createElement('div');
    actions.className = 'asset-actions';

    const selectLabel = document.createElement('label');
    selectLabel.className = 'asset-select';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.setAttribute('aria-label', `选择${image.alt || filenameOf(id)}`);
    selectLabel.append(checkbox, document.createTextNode('选中'));
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) selected.add(id);
      else selected.delete(id);
      renderSelection();
    });

    const download = document.createElement('a');
    download.className = 'single-download';
    download.href = preview.dataset.full;
    download.download = filenameOf(id);
    download.title = '下载这张素材';
    download.setAttribute('aria-label', `下载${image.alt || filenameOf(id)}`);
    download.textContent = '单张下载 ↓';

    actions.append(selectLabel, download);
    meta.append(actions);
  }

  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let value = n;
      for (let k = 0; k < 8; k++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      table[n] = value >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let value = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) value = crcTable[(value ^ bytes[i]) & 0xff] ^ (value >>> 8);
    return (value ^ 0xffffffff) >>> 0;
  }

  function zipTimestamp(date) {
    return {
      time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
      date: ((Math.max(1980, date.getFullYear()) - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
    };
  }

  function zipHeader(size, nameLength, crc, timestamp, offset = 0, central = false) {
    const bytes = new Uint8Array(central ? 46 + nameLength : 30 + nameLength);
    const view = new DataView(bytes.buffer);
    if (central) {
      view.setUint32(0, 0x02014b50, true);
      view.setUint16(4, 20, true); view.setUint16(6, 20, true);
      view.setUint16(8, 0x0800, true); view.setUint16(10, 0, true);
      view.setUint16(12, timestamp.time, true); view.setUint16(14, timestamp.date, true);
      view.setUint32(16, crc, true); view.setUint32(20, size, true); view.setUint32(24, size, true);
      view.setUint16(28, nameLength, true); view.setUint16(30, 0, true); view.setUint16(32, 0, true);
      view.setUint16(34, 0, true); view.setUint16(36, 0, true); view.setUint32(38, 0, true);
      view.setUint32(42, offset, true);
    } else {
      view.setUint32(0, 0x04034b50, true); view.setUint16(4, 20, true);
      view.setUint16(6, 0x0800, true); view.setUint16(8, 0, true);
      view.setUint16(10, timestamp.time, true); view.setUint16(12, timestamp.date, true);
      view.setUint32(14, crc, true); view.setUint32(18, size, true); view.setUint32(22, size, true);
      view.setUint16(26, nameLength, true); view.setUint16(28, 0, true);
    }
    return bytes;
  }

  function buildZip(files) {
    const parts = [];
    const directory = [];
    let offset = 0;
    const now = new Date();
    for (const file of files) {
      const name = new TextEncoder().encode(file.name.replace(/^\/+/, '').replace(/\\/g, '/'));
      if (name.length > 65535 || file.bytes.length > 0xffffffff || offset > 0xffffffff) {
        throw new Error('素材或压缩包超过 ZIP 格式支持的大小');
      }
      const crc = crc32(file.bytes);
      const timestamp = zipTimestamp(now);
      const header = zipHeader(file.bytes.length, name.length, crc, timestamp);
      parts.push(header, name, file.bytes);
      directory.push({ header: zipHeader(file.bytes.length, name.length, crc, timestamp, offset, true), name });
      offset += header.length + name.length + file.bytes.length;
    }
    const directoryOffset = offset;
    for (const entry of directory) {
      parts.push(entry.header, entry.name);
      offset += entry.header.length + entry.name.length;
    }
    const end = new Uint8Array(22);
    const view = new DataView(end.buffer);
    view.setUint32(0, 0x06054b50, true);
    view.setUint16(8, files.length, true); view.setUint16(10, files.length, true);
    view.setUint32(12, offset - directoryOffset, true); view.setUint32(16, directoryOffset, true);
    parts.push(end);
    return new Blob(parts, { type: 'application/zip' });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  async function downloadZip() {
    if (archiveBusy || selected.size === 0) return;
    const chosen = cards.filter(card => selected.has(assetPathOf(card)));
    archiveBusy = true;
    downloadSelected.textContent = '准备打包…';
    status.textContent = `正在读取 0 / ${chosen.length} 张素材…`;
    renderSelection();
    const files = [];
    try {
      for (let index = 0; index < chosen.length; index++) {
        const trigger = chosen[index].querySelector('.asset-image[data-full]');
        const name = assetPathOf(chosen[index]);
        const response = await fetch(new URL(trigger.dataset.full, document.baseURI));
        if (!response.ok) throw new Error(`无法读取素材：${filenameOf(name)}（${response.status}）`);
        files.push({ name, bytes: new Uint8Array(await response.arrayBuffer()) });
        downloadSelected.textContent = `打包中 ${index + 1}/${chosen.length}`;
        status.textContent = `正在读取 ${index + 1} / ${chosen.length} 张素材…`;
      }
      const archive = buildZip(files);
      const date = new Date().toISOString().slice(0, 10);
      downloadBlob(archive, `景小艾素材_${chosen.length}张_${date}.zip`);
      status.textContent = `已打包下载 ${chosen.length} 张素材`;
    } catch (error) {
      status.textContent = location.protocol === 'file:'
        ? '本地 file:// 页面无法读取多张素材打包；请通过网页地址使用 ZIP 下载'
        : `打包失败：${error.message}`;
    } finally {
      archiveBusy = false;
      downloadSelected.textContent = '下载所选 ZIP';
      renderSelection();
    }
  }

  cards.forEach(addCardControls);
  renderSelection();
  visibleSelection.addEventListener('change', () => {
    for (const card of cards) {
      if (!isCardVisible(card)) continue;
      if (visibleSelection.checked) selected.add(assetPathOf(card));
      else selected.delete(assetPathOf(card));
    }
    renderSelection();
  });
  clearSelection.addEventListener('click', () => { selected.clear(); renderSelection(); });
  downloadSelected.addEventListener('click', downloadZip);
  document.querySelector('#search')?.addEventListener('input', () => requestAnimationFrame(renderSelection));
  document.querySelectorAll('.filter-chip').forEach(chip => chip.addEventListener('click', () => requestAnimationFrame(renderSelection)));
})();
