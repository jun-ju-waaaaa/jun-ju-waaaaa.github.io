'use strict';

const { PDFDocument, degrees } = PDFLib;
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// State
let pdfBytes = null;
let pdfJsDoc = null;
let pageCount = 0;
let rotations = []; // additional rotation per page (CW degrees: 0/90/180/270)
let resultUrl = null;

// DOM refs
const dropArea    = document.getElementById('dropArea');
const fileInput   = document.getElementById('fileInput');
const fileButton  = document.getElementById('fileButton');
const uploadCard  = document.getElementById('uploadCard');
const pagesCard   = document.getElementById('pagesCard');
const pageGrid    = document.getElementById('pageGrid');
const processCard = document.getElementById('processCard');
const resultCard  = document.getElementById('resultCard');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn    = document.getElementById('resetBtn');
const rotAllLeft  = document.getElementById('rotateAllLeft');
const rotAllRight = document.getElementById('rotateAllRight');
const saveBtn     = document.getElementById('saveBtn');
const fileNameLabel  = document.getElementById('fileNameLabel');
const pageCountLabel = document.getElementById('pageCountLabel');

// ── ファイル選択 ─────────────────────────────────
fileButton.addEventListener('click', () => fileInput.click());
dropArea.addEventListener('click', e => { if (e.target !== fileButton) fileInput.click(); });
fileInput.addEventListener('change', () => {
  if (fileInput.files.length) handleFile(fileInput.files[0]);
  fileInput.value = '';
});

// ── ドラッグ&ドロップ ────────────────────────────
dropArea.addEventListener('dragover', e => { e.preventDefault(); dropArea.classList.add('dragover'); });
dropArea.addEventListener('dragleave', () => dropArea.classList.remove('dragover'));
dropArea.addEventListener('drop', e => {
  e.preventDefault();
  dropArea.classList.remove('dragover');
  const f = e.dataTransfer.files[0];
  if (f) handleFile(f);
});
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => {
  e.preventDefault();
  const f = e.dataTransfer.files[0];
  if (f) handleFile(f);
});

// ── ファイル読み込み ─────────────────────────────
async function handleFile(file) {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    alert('PDFファイルを選択してください。');
    return;
  }

  uploadCard.classList.add('hidden');
  processCard.classList.remove('hidden');
  setProgress(0, 'PDF読み込み中...');

  try {
    // Uint8Array で保持することで ArrayBuffer の所有権移転を防ぐ
    pdfBytes = new Uint8Array(await file.arrayBuffer());
    fileNameLabel.textContent = esc(file.name);

    // pdf-lib でページ数・既存回転を取得（コピーを渡す）
    const pdfLibDoc = await PDFDocument.load(pdfBytes.slice(0));
    pageCount = pdfLibDoc.getPageCount();
    rotations = new Array(pageCount).fill(0);
    pageCountLabel.textContent = `${pageCount}ページ`;

    setProgress(20, 'サムネイル準備中...');

    // pdf.js でサムネイル描画（コピーを渡す）
    pdfJsDoc = await pdfjsLib.getDocument({ data: pdfBytes.slice(0) }).promise;

    processCard.classList.add('hidden');
    buildPageGrid();
    pagesCard.classList.remove('hidden');

    // サムネイルを順次描画（UIをブロックしない）
    renderAllThumbnails();

  } catch (err) {
    console.error(err);
    processCard.classList.add('hidden');
    uploadCard.classList.remove('hidden');
    alert('PDFの読み込みに失敗しました。\nパスワード保護されたPDFは対応していません。');
  }
}

// ── ページグリッド構築 ───────────────────────────
function buildPageGrid() {
  pageGrid.innerHTML = '';
  for (let i = 0; i < pageCount; i++) {
    pageGrid.appendChild(createPageCard(i));
  }
}

function createPageCard(i) {
  const card = document.createElement('div');
  card.className = 'page-card';
  card.id = `card-${i}`;

  // サムネイル
  const thumbBox = document.createElement('div');
  thumbBox.className = 'thumb-box';

  const canvasWrap = document.createElement('div');
  canvasWrap.className = 'canvas-wrap';
  canvasWrap.id = `cwrap-${i}`;

  const spinner = document.createElement('div');
  spinner.className = 'thumb-spinner';
  spinner.textContent = '読込中';
  spinner.id = `spinner-${i}`;

  const canvas = document.createElement('canvas');
  canvas.className = 'page-canvas';
  canvas.id = `canvas-${i}`;
  canvas.style.display = 'none';

  canvasWrap.appendChild(spinner);
  canvasWrap.appendChild(canvas);
  thumbBox.appendChild(canvasWrap);

  // ページ情報
  const info = document.createElement('div');
  info.className = 'page-info';

  const pageNum = document.createElement('div');
  pageNum.className = 'page-num';
  pageNum.textContent = `${i + 1} / ${pageCount}`;

  const rotIndicator = document.createElement('div');
  rotIndicator.className = 'rot-indicator';
  rotIndicator.id = `rot-${i}`;
  rotIndicator.textContent = '—';

  const pageBtns = document.createElement('div');
  pageBtns.className = 'page-btns';

  const leftBtn = document.createElement('button');
  leftBtn.className = 'page-btn';
  leftBtn.title = '左90°回転';
  leftBtn.textContent = '↺'; // ↺
  leftBtn.addEventListener('click', () => rotatePage(i, -90));

  const rightBtn = document.createElement('button');
  rightBtn.className = 'page-btn';
  rightBtn.title = '右90°回転';
  rightBtn.textContent = '↻'; // ↻
  rightBtn.addEventListener('click', () => rotatePage(i, 90));

  pageBtns.appendChild(leftBtn);
  pageBtns.appendChild(rightBtn);

  info.appendChild(pageNum);
  info.appendChild(rotIndicator);
  info.appendChild(pageBtns);

  card.appendChild(thumbBox);
  card.appendChild(info);
  return card;
}

// ── サムネイル描画 ───────────────────────────────
async function renderAllThumbnails() {
  for (let i = 0; i < pageCount; i++) {
    await renderThumbnail(i);
  }
}

async function renderThumbnail(idx) {
  try {
    const page = await pdfJsDoc.getPage(idx + 1);
    const baseVp = page.getViewport({ scale: 1.0 });
    const scale = Math.min(260 / baseVp.width, 360 / baseVp.height);
    const vp = page.getViewport({ scale });

    const canvas = document.getElementById(`canvas-${idx}`);
    canvas.width = vp.width;
    canvas.height = vp.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;

    const spinner = document.getElementById(`spinner-${idx}`);
    if (spinner) spinner.remove();
    canvas.style.display = 'block';
  } catch {
    const spinner = document.getElementById(`spinner-${idx}`);
    if (spinner) spinner.textContent = '—';
  }
}

// ── 回転操作 ─────────────────────────────────────
function rotatePage(idx, delta) {
  rotations[idx] = ((rotations[idx] + delta) % 360 + 360) % 360;
  updateCardVisual(idx);
}

function updateCardVisual(i) {
  const r = rotations[i];
  const wrap   = document.getElementById(`cwrap-${i}`);
  const card   = document.getElementById(`card-${i}`);
  const rotInd = document.getElementById(`rot-${i}`);

  if (wrap) wrap.style.transform = `rotate(${r}deg)`;

  if (r === 0) {
    rotInd.textContent = '—';
    card.classList.remove('rotated');
  } else {
    rotInd.textContent = `+${r}°`;
    card.classList.add('rotated');
  }
}

// ── 全ページ一括回転 ─────────────────────────────
rotAllLeft.addEventListener('click', () => {
  for (let i = 0; i < pageCount; i++) rotatePage(i, -90);
});

rotAllRight.addEventListener('click', () => {
  for (let i = 0; i < pageCount; i++) rotatePage(i, 90);
});

// ── 保存 ─────────────────────────────────────────
saveBtn.addEventListener('click', savePDF);

async function savePDF() {
  pagesCard.classList.add('hidden');
  processCard.classList.remove('hidden');
  setProgress(0, '処理中...');

  try {
    const pdfDoc = await PDFDocument.load(pdfBytes.slice(0));
    const pages  = pdfDoc.getPages();

    for (let i = 0; i < pages.length; i++) {
      if (rotations[i] !== 0) {
        // PDF Rotate も CSS rotate() もどちらも CW 正なので単純に加算
        const current  = pages[i].getRotation().angle;
        const newAngle = (current + rotations[i]) % 360;
        pages[i].setRotation(degrees(newAngle));
      }
      setProgress(Math.round(((i + 1) / pages.length) * 90),
        `${i + 1} / ${pages.length} ページ処理中...`);
    }

    setProgress(95, '保存中...');
    const saved = await pdfDoc.save();
    setProgress(100, '完了');

    if (resultUrl) URL.revokeObjectURL(resultUrl);
    const blob = new Blob([saved], { type: 'application/pdf' });
    resultUrl = URL.createObjectURL(blob);

    downloadBtn.href = resultUrl;
    downloadBtn.download = 'rotated.pdf';

    processCard.classList.add('hidden');
    resultCard.classList.remove('hidden');

  } catch (err) {
    console.error(err);
    processCard.classList.add('hidden');
    pagesCard.classList.remove('hidden');
    alert('保存に失敗しました。');
  }
}

function setProgress(pct, text) {
  document.getElementById('progressBar').style.width = pct + '%';
  document.getElementById('progressPct').textContent = pct + '%';
  document.getElementById('progressText').textContent = text;
}

// ── リセット ─────────────────────────────────────
resetBtn.addEventListener('click', reset);

function reset() {
  pdfBytes  = null;
  pdfJsDoc  = null;
  pageCount = 0;
  rotations = [];
  if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
  pageGrid.innerHTML = '';
  resultCard.classList.add('hidden');
  pagesCard.classList.add('hidden');
  processCard.classList.add('hidden');
  uploadCard.classList.remove('hidden');
  setProgress(0, '');
}

// ── ユーティリティ ───────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
