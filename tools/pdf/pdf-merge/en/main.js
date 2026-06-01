'use strict';

const { PDFDocument } = PDFLib;

let files = [];
let mergedUrl = null;

const dropArea        = document.getElementById('dropArea');
const fileInput       = document.getElementById('fileInput');
const fileButton      = document.getElementById('fileButton');
const uploadCard      = document.getElementById('uploadCard');
const fileListSection = document.getElementById('fileListSection');
const fileListEl      = document.getElementById('fileList');
const addMoreBtn      = document.getElementById('addMoreBtn');
const mergeBtn        = document.getElementById('mergeBtn');
const processingSection = document.getElementById('processingSection');
const progressBar     = document.getElementById('progressBar');
const progressText    = document.getElementById('progressText');
const progressPct     = document.getElementById('progressPct');
const resultSection   = document.getElementById('resultSection');
const downloadBtn     = document.getElementById('downloadBtn');
const resetBtn        = document.getElementById('resetBtn');

// ── File selection ────────────────────────────
fileButton.addEventListener('click', () => fileInput.click());
dropArea.addEventListener('click', e => { if (e.target !== fileButton) fileInput.click(); });
addMoreBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => { addFiles(fileInput.files); fileInput.value = ''; });

// ── Drag & drop ──────────────────────────────
dropArea.addEventListener('dragover', e => { e.preventDefault(); dropArea.classList.add('dragover'); });
dropArea.addEventListener('dragleave', () => dropArea.classList.remove('dragover'));
dropArea.addEventListener('drop', e => {
  e.preventDefault();
  dropArea.classList.remove('dragover');
  addFiles(e.dataTransfer.files);
});

// Also accept drops anywhere on the page
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => {
  e.preventDefault();
  if (e.target.closest('#fileListSection') || e.target.closest('#uploadCard')) return;
  addFiles(e.dataTransfer.files);
});

function addFiles(newFiles) {
  for (const f of newFiles) {
    if (f.type === 'application/pdf') files.push(f);
  }
  renderFileList();
}

function renderFileList() {
  if (files.length === 0) {
    fileListSection.classList.add('hidden');
    uploadCard.classList.remove('hidden');
    return;
  }

  uploadCard.classList.add('hidden');
  fileListSection.classList.remove('hidden');
  fileListEl.innerHTML = '';

  files.forEach((f, i) => {
    const li = document.createElement('li');
    li.className = 'file-item';
    li.innerHTML = `
      <span class="file-num">${i + 1}</span>
      <span class="file-name" title="${escHtml(f.name)}">${escHtml(f.name)}</span>
      <span class="file-size">${formatSize(f.size)}</span>
      <div class="file-actions">
        <button class="icon-btn" data-action="up"   data-i="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Move up">↑</button>
        <button class="icon-btn" data-action="down" data-i="${i}" ${i === files.length - 1 ? 'disabled' : ''} aria-label="Move down">↓</button>
        <button class="icon-btn icon-btn-danger" data-action="remove" data-i="${i}" aria-label="Remove">×</button>
      </div>
    `;
    fileListEl.appendChild(li);
  });

  fileListEl.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.i, 10);
      const action = btn.dataset.action;
      if (action === 'up' && i > 0) {
        [files[i - 1], files[i]] = [files[i], files[i - 1]];
      } else if (action === 'down' && i < files.length - 1) {
        [files[i], files[i + 1]] = [files[i + 1], files[i]];
      } else if (action === 'remove') {
        files.splice(i, 1);
      }
      renderFileList();
    });
  });

  mergeBtn.disabled = files.length < 2;
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ── Merge ─────────────────────────────────────
mergeBtn.addEventListener('click', mergePDFs);

async function mergePDFs() {
  if (files.length < 2) return;

  fileListSection.classList.add('hidden');
  processingSection.classList.remove('hidden');
  setProgress(0, 'Preparing...');

  try {
    const merged = await PDFDocument.create();

    for (let i = 0; i < files.length; i++) {
      const pct = Math.round((i / files.length) * 90);
      setProgress(pct, `Processing file ${i + 1} of ${files.length}...`);

      const bytes = await files[i].arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const indices = pdf.getPageIndices();
      const pages = await merged.copyPages(pdf, indices);
      pages.forEach(p => merged.addPage(p));
    }

    setProgress(95, 'Merging...');
    const mergedBytes = await merged.save();
    setProgress(100, 'Done');

    if (mergedUrl) URL.revokeObjectURL(mergedUrl);
    const blob = new Blob([mergedBytes], { type: 'application/pdf' });
    mergedUrl = URL.createObjectURL(blob);

    downloadBtn.href = mergedUrl;
    downloadBtn.download = 'merged.pdf';

    processingSection.classList.add('hidden');
    resultSection.classList.remove('hidden');

  } catch (err) {
    console.error(err);
    processingSection.classList.add('hidden');
    fileListSection.classList.remove('hidden');
    alert('Failed to merge PDFs.\nPassword-protected or corrupted files cannot be merged.');
  }
}

function setProgress(pct, text) {
  progressBar.style.width = pct + '%';
  progressPct.textContent = pct + '%';
  progressText.textContent = text;
}

// ── Reset ─────────────────────────────────────
resetBtn.addEventListener('click', () => {
  files = [];
  if (mergedUrl) { URL.revokeObjectURL(mergedUrl); mergedUrl = null; }
  resultSection.classList.add('hidden');
  fileListSection.classList.add('hidden');
  uploadCard.classList.remove('hidden');
  setProgress(0, '');
});
