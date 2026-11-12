const state = {
  status: 'waiting', currentRequest: 17,
  expiry: new Date('2026-10-31T23:59:00+07:00'), newExpiry: null,
  uploadedGuarantee: null, flowStep: 1,
  notifications: [{ title: 'Permintaan perpanjangan diterima', text: 'PP-2026-0017 · Respons paling lambat 31 Oktober 2026 23:59 WIB', time: '23 Okt 2026 · 08:35 WIB' }]
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const modal = $('#confirmModal');
const apendoModal = $('#apendoModal');
const statusEl = $('#requestStatus');
const statusDetail = $('#statusDetail');
const actionRow = $('#actionRow');
const repeatBox = $('#repeatBox');
const historyBody = $('#historyBody');
const listView = $('#listView');
const detailView = $('#detailView');
const listRequestStatus = $('#listRequestStatus');

const labels = {
  waiting: ['Menunggu Respons', 'waiting'], accepted: ['Berhasil', 'success'], rejected: ['Ditolak', 'danger'],
  'no-response': ['Tidak Direspons', 'muted'], unfinished: ['Tidak Selesai', 'danger']
};

function formatDate(date) {
  const parts = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Jakarta' }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type)?.value || '';
  return `${value('day')} ${value('month')} ${value('year')} ${value('hour')}:${value('minute')} WIB`;
}
function addCalendarDays(base, days) { const result = new Date(base.getTime()); result.setDate(result.getDate() + Number(days)); return result; }
function formatDateInput(date) {
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Jakarta' }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type)?.value || '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}
function parseValidityDate(value) { return value ? new Date(`${value}T23:59:00+07:00`) : null; }
function formatBytes(bytes) { if (!bytes) return '0 KB'; return bytes < 1048576 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1048576).toFixed(1)} MB`; }
function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
function toast(message) { const item = document.createElement('div'); item.className = 'toast'; item.textContent = message; $('#toastRegion').append(item); setTimeout(() => item.remove(), 3400); }
function addNotification(title, text) { state.notifications.unshift({ title, text, time: 'Baru saja · Simulasi' }); renderNotifications(); toast(title); }
function renderNotifications() {
  $('#notificationCount').textContent = state.notifications.length;
  $('#notificationList').innerHTML = state.notifications.map((n) => `<article class="notification-item"><span class="dot"></span><div><p><strong>${n.title}</strong><br>${n.text}</p><small>${n.time}</small></div></article>`).join('');
}

function updateStatus(kind, detail = '') {
  state.status = kind;
  const [label, klass] = labels[kind];
  statusEl.className = `status-badge ${klass}`; statusEl.textContent = label;
  const terminal = kind !== 'waiting'; actionRow.hidden = terminal; repeatBox.hidden = !terminal;
  const listLabels = {
    waiting: ['Permintaan Perpanjangan Masa Berlaku', 'waiting'], accepted: ['Perpanjangan Masa Berlaku: Berhasil', 'success'],
    rejected: ['Perpanjangan Masa Berlaku: Ditolak', 'danger'], 'no-response': ['Perpanjangan: Tidak Direspons', 'muted'], unfinished: ['Perpanjangan: Tidak Selesai', 'danger']
  };
  const [listLabel, listClass] = listLabels[kind];
  listRequestStatus.className = `tag request-tag ${listClass}`; listRequestStatus.textContent = listLabel;
  $('#openRequest').textContent = kind === 'waiting' ? 'Tinjau permintaan' : 'Lihat riwayat';
  if (detail) { statusDetail.hidden = false; statusDetail.className = `status-detail ${klass}`; statusDetail.innerHTML = detail; }
  else { statusDetail.hidden = true; statusDetail.innerHTML = ''; }
}

function appendHistory(status, klass, description, target = '30 Nov 2026') {
  const row = document.createElement('tr');
  row.innerHTML = `<td>27 Okt 2026<br><small>10:15 WIB · Simulasi</small></td><td>PP-2026-${String(state.currentRequest).padStart(4, '0')}</td><td>${target}<br><small>23:59 WIB</small></td><td><span class="status-badge ${klass}">${status}</span></td><td>${description}</td>`;
  historyBody.prepend(row);
}
function openConfirm(title, bodyHtml, actionsHtml) { $('#confirmTitle').textContent = title; $('#confirmBody').innerHTML = bodyHtml; $('#confirmActions').innerHTML = actionsHtml; modal.hidden = false; document.body.style.overflow = 'hidden'; }
function closeModal(target = modal) { target.hidden = true; if (modal.hidden && apendoModal.hidden) document.body.style.overflow = ''; }

$('#acceptButton').addEventListener('click', () => {
  openConfirm('Konfirmasi Penerimaan', `<p>Apakah Anda akan menerima permintaan perpanjangan masa berlaku penawaran <strong>PP-2026-0017</strong>?</p><div class="confirmation-flow"><span>1</span><strong>Input masa berlaku baru</strong><i>›</i><span>2</span><strong>Jaminan (opsional)</strong><i>›</i><span>3</span><strong>Review &amp; e-sign</strong></div><div class="neutral-note compact-note"><strong>Catatan:</strong> Dokumen dan tanda tangan pada prototype ini hanya simulasi.</div>`, '<button class="button secondary" data-close-modal>Batal</button><button class="button primary" id="confirmAccept">Ya, Lanjutkan</button>');
  $('#confirmAccept').addEventListener('click', () => { closeModal(); openApendo(); });
});

$('#rejectButton').addEventListener('click', () => {
  openConfirm('Konfirmasi Penolakan', `<p>Anda akan menolak permintaan perpanjangan <strong>PP-2026-0017</strong>. Alasan wajib diisi dan akan tercatat pada riwayat simulasi.</p><label class="field-label" for="rejectReason">Alasan penolakan <span class="required">*</span></label><textarea class="reason-field" id="rejectReason" placeholder="Contoh: Masa berlaku penawaran tidak dapat diperpanjang karena keterbatasan dukungan harga dari prinsipal."></textarea><p class="field-hint" id="reasonError">Minimal 10 karakter.</p>`, '<button class="button secondary" data-close-modal>Batal</button><button class="button primary" id="confirmReject">Kirim Penolakan</button>');
  $('#confirmReject').addEventListener('click', () => {
    const reason = $('#rejectReason').value.trim();
    if (reason.length < 10) { $('#reasonError').classList.add('error'); $('#rejectReason').focus(); return; }
    closeModal();
    updateStatus('rejected', `<strong>Ditolak pada 27 Oktober 2026 10:15 WIB</strong><br>Alasan: ${escapeHtml(reason)}<br><small>Notifikasi mock telah dicatat untuk Pokja Pemilihan.</small>`);
    appendHistory('Ditolak', 'danger', `Ditolak Penyedia. Alasan: ${escapeHtml(reason)}`);
    addNotification('Penolakan berhasil dicatat', 'Status permintaan PP-2026-0017 telah diperbarui. Notifikasi Pokja bersifat mock.');
  });
});

function resetProcessIndicators() {
  ['progressGuarantee', 'progressDoc', 'progressSign', 'progressSync'].forEach((id) => { const el = $(`#${id}`); el.classList.remove('done'); el.querySelector('span').textContent = '○'; });
  $('#processingSpinner').className = 'spinner';
}
function openApendo() {
  state.flowStep = 1; state.uploadedGuarantee = null; state.newExpiry = null;
  $('#newValidityDate').value = ''; $('#newValidityDate').min = formatDateInput(addCalendarDays(state.expiry, 1));
  $('#currentValidityText').textContent = formatDate(state.expiry);
  $('#acknowledge').checked = false; $('#reviewAcknowledge').checked = false; $('#signAcknowledge').checked = false; $('#guaranteeFile').value = '';
  $('#dateError').classList.remove('error'); resetProcessIndicators(); renderGuaranteeDocument(); updateExpiryPreview(); renderFlowStep();
  apendoModal.hidden = false; document.body.style.overflow = 'hidden';
}
function updateExpiryPreview() {
  const value = $('#newValidityDate').value;
  const candidate = parseValidityDate(value);
  const valid = Boolean(candidate && candidate > state.expiry);
  state.newExpiry = valid ? candidate : null;
  $('#dateError').classList.toggle('error', Boolean(value) && !valid);
  if (!valid) {
    $('#newExpiryPreview').textContent = 'Pilih tanggal masa berlaku baru';
    $('#expiryPreviewHint').textContent = 'Tanggal lama tetap berlaku sampai proses e-sign berhasil.';
    $('#guaranteeMinimumDate').textContent = 'Menunggu tanggal baru';
    return;
  }
  const formatted = formatDate(candidate);
  $('#newExpiryPreview').textContent = `${formatDate(state.expiry)} → ${formatted}`;
  $('#expiryPreviewHint').textContent = 'Tanggal baru akan aktif setelah proses e-sign berhasil.';
  $('#guaranteeMinimumDate').textContent = formatted; $('#reviewNewExpiry').textContent = formatted; $('#signNewExpiry').textContent = formatted;
}
function setStepper(step) {
  $$('.stepper li').forEach((item, index) => { item.className = index + 1 < step ? 'done' : index + 1 === step ? 'active' : ''; item.querySelector('span').textContent = index + 1 < step ? '✓' : String(index + 1); });
}
function setFlowActions() {
  const previous = state.flowStep > 1 ? '<button class="button secondary" id="flowBackButton">Kembali</button>' : '<button class="button secondary" data-close-apendo>Batal</button>';
  const nextLabels = { 1: 'Lanjutkan ke Jaminan', 2: state.uploadedGuarantee ? 'Review Surat Penawaran' : 'Lewati & Review Surat', 3: 'Lanjutkan ke E-sign', 4: 'Tanda Tangani & Kirim' };
  $('#apendoActions').innerHTML = `${previous}<button class="button primary" id="flowNextButton">${nextLabels[state.flowStep]}</button>`;
  $('#flowBackButton')?.addEventListener('click', () => { state.flowStep -= 1; renderFlowStep(); });
  $('#flowNextButton').addEventListener('click', handleFlowNext);
}
function renderFlowStep() {
  $('#apendoProgress').hidden = true;
  $('#apendoStepOne').hidden = state.flowStep !== 1; $('#apendoStepGuarantee').hidden = state.flowStep !== 2; $('#apendoStepReview').hidden = state.flowStep !== 3; $('#apendoStepSign').hidden = state.flowStep !== 4;
  $('#apendoActions').hidden = false; setStepper(state.flowStep); setFlowActions();
  if (state.flowStep >= 3) syncReviewSummary();
  $('.apendo-modal').scrollTop = 0;
}
function handleFlowNext() {
  if (state.flowStep === 1) {
    updateExpiryPreview();
    if (!state.newExpiry) { $('#dateError').classList.add('error'); $('#newValidityDate').focus(); return; }
    if (!$('#acknowledge').checked) { toast('Centang konfirmasi pemeriksaan tanggal untuk melanjutkan.'); return; }
  }
  if (state.flowStep === 3 && !$('#reviewAcknowledge').checked) { toast('Konfirmasikan bahwa surat penawaran telah ditinjau.'); return; }
  if (state.flowStep === 4) { if (!$('#signAcknowledge').checked) { toast('Centang pernyataan kewenangan tanda tangan elektronik.'); return; } processExtension(); return; }
  state.flowStep += 1; renderFlowStep();
}
function renderGuaranteeDocument() {
  const container = $('#guaranteeDocument');
  if (!state.uploadedGuarantee) { container.innerHTML = '<span class="empty-document">Tidak diperbarui</span>'; syncReviewSummary(); if (state.flowStep === 2) setFlowActions(); return; }
  container.innerHTML = `<div class="uploaded-document"><button class="document-link" id="viewGuarantee" type="button">${escapeHtml(state.uploadedGuarantee.name)} <span aria-hidden="true">◉</span></button><small>Ukuran: ${formatBytes(state.uploadedGuarantee.size)} · Ditambahkan: Baru saja</small></div><button class="remove-document" id="removeGuarantee" type="button" aria-label="Hapus dokumen">×</button>`;
  $('#viewGuarantee').addEventListener('click', () => toast('Preview dokumen jaminan dibuka dalam mode simulasi.'));
  $('#removeGuarantee').addEventListener('click', () => { state.uploadedGuarantee = null; $('#guaranteeFile').value = ''; renderGuaranteeDocument(); toast('Pembaruan dokumen dibatalkan. Dokumen lama tetap digunakan.'); });
  syncReviewSummary(); if (state.flowStep === 2) setFlowActions();
}
function syncReviewSummary() {
  const name = state.uploadedGuarantee?.name || 'Tidak diperbarui';
  $('#reviewGuaranteeName').textContent = name; $('#signGuaranteeName').textContent = name;
  if (state.newExpiry) { $('#reviewNewExpiry').textContent = formatDate(state.newExpiry); $('#signNewExpiry').textContent = formatDate(state.newExpiry); }
}

$('#newValidityDate').addEventListener('input', updateExpiryPreview);
$('#guaranteeFile').addEventListener('change', (event) => {
  const file = event.target.files[0]; if (!file) return;
  const extension = file.name.split('.').pop().toLowerCase();
  if (!['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'].includes(extension)) { event.target.value = ''; toast('Format file belum didukung pada simulasi ini.'); return; }
  state.uploadedGuarantee = { name: file.name, size: file.size }; renderGuaranteeDocument(); toast('Dokumen jaminan berhasil ditambahkan.');
});
$('#useSampleGuarantee').addEventListener('click', () => { state.uploadedGuarantee = { name: 'jaminan-penawaran-perpanjangan.pdf', size: 286720 }; renderGuaranteeDocument(); toast('Dokumen contoh berhasil ditambahkan.'); });

async function processExtension() {
  $('#apendoStepSign').hidden = true; $('#apendoProgress').hidden = false; $('#apendoActions').hidden = true; setStepper(4);
  const steps = [
    ['progressGuarantee', state.uploadedGuarantee ? 'Memverifikasi dokumen jaminan…' : 'Melewati pembaruan jaminan…', state.uploadedGuarantee ? 'Memeriksa dokumen pengganti jaminan penawaran simulasi.' : 'Jaminan penawaran tidak diperbarui. Dokumen lama tetap digunakan.'],
    ['progressDoc', 'Memperbarui surat penawaran…', 'Membuat versi surat penawaran dengan tanggal masa berlaku baru.'],
    ['progressSign', 'Memproses tanda tangan elektronik…', 'Melakukan tanda tangan elektronik mock melalui APENDO simulasi.'],
    ['progressSync', 'Menyinkronkan status…', 'Mencatat dokumen, waktu, dan status pada SPSE simulasi.']
  ];
  for (const [id, title, text] of steps) { $('#processingTitle').textContent = title; $('#processingText').textContent = text; await new Promise((resolve) => setTimeout(resolve, 520)); $(`#${id}`).classList.add('done'); $(`#${id} span`).textContent = '✓'; }
  $('#processingSpinner').classList.add('done'); $('#processingTitle').textContent = 'Perpanjangan berhasil'; $('#processingText').textContent = `Masa berlaku penawaran telah diperbarui menjadi ${formatDate(state.newExpiry)}.`;
  $$('.stepper li').forEach((item) => { item.className = 'done'; item.querySelector('span').textContent = '✓'; });
  $('#apendoActions').hidden = false; $('#apendoActions').innerHTML = '<button class="button primary" id="finishApendo">Selesai</button>'; $('#finishApendo').addEventListener('click', finishExtension);
}
function finishExtension() {
  const newExpiry = state.newExpiry;
  const guaranteeDescription = state.uploadedGuarantee ? `Jaminan diperbarui: ${escapeHtml(state.uploadedGuarantee.name)}` : 'Jaminan penawaran tidak diperbarui';
  closeModal(apendoModal); state.expiry = newExpiry; $('#offerExpiryText').textContent = `: ${formatDate(newExpiry)}`;
  updateStatus('accepted', `<strong>Berhasil pada 27 Oktober 2026 10:15 WIB</strong><br>Masa berlaku baru: ${formatDate(newExpiry)}<br>${guaranteeDescription}<br><small>Surat penawaran dan tanda tangan elektronik pada prototype ini adalah mock.</small>`);
  appendHistory('Berhasil', 'success', `Masa berlaku baru diaktifkan · ${guaranteeDescription}`, formatDate(newExpiry).replace(' 23:59 WIB', ''));
  addNotification('Perpanjangan berhasil', `Masa berlaku penawaran diperbarui menjadi ${formatDate(newExpiry)}.`);
}

function applyDemoState(kind) {
  if (kind === 'waiting') { updateStatus('waiting'); toast('State dikembalikan ke Menunggu Respons.'); return; }
  if (kind === 'no-response') { updateStatus(kind, '<strong>Batas respons telah berakhir pada 31 Oktober 2026 23:59 WIB.</strong><br>Tidak ada respons Penyedia yang tercatat. Status penyedia mengikuti ketentuan yang berlaku.'); appendHistory('Tidak Direspons', 'muted', 'Masa berlaku penawaran berakhir tanpa respons Penyedia'); addNotification('Batas respons telah berakhir', 'Permintaan PP-2026-0017 berstatus Tidak Direspons.'); }
  if (kind === 'unfinished') { updateStatus(kind, '<strong>Proses perpanjangan belum selesai.</strong><br>Penyedia telah menerima permintaan, tetapi input tanggal, review surat, atau e-sign tidak diselesaikan.'); appendHistory('Tidak Selesai', 'danger', 'Proses perpanjangan simulasi tidak diselesaikan'); addNotification('Perpanjangan tidak selesai', 'Proses simulasi berhenti sebelum sinkronisasi status.'); }
  if (kind === 'accepted') { const target = addCalendarDays(new Date('2026-10-31T23:59:00+07:00'), 30); state.expiry = target; $('#offerExpiryText').textContent = `: ${formatDate(target)}`; updateStatus(kind, `<strong>Berhasil pada 27 Oktober 2026 10:15 WIB</strong><br>Masa berlaku baru: ${formatDate(target)}<br><small>Surat penawaran dan tanda tangan elektronik pada prototype ini adalah mock.</small>`); appendHistory('Berhasil', 'success', 'Perpanjangan 30 hari kalender selesai'); addNotification('State Berhasil diterapkan', 'Masa berlaku penawaran diperbarui pada simulasi.'); }
  if (kind === 'rejected') { updateStatus(kind, '<strong>Ditolak pada 27 Oktober 2026 10:15 WIB</strong><br>Alasan: Simulasi penolakan melalui kontrol demo.<br><small>Notifikasi mock telah dicatat untuk Pokja Pemilihan.</small>'); appendHistory('Ditolak', 'danger', 'Penolakan diterapkan melalui kontrol demo'); addNotification('State Ditolak diterapkan', 'Notifikasi Pokja bersifat mock.'); }
}

$('#applyDemoState').addEventListener('click', () => applyDemoState($('#demoState').value));
$('#resetDemo').addEventListener('click', () => window.location.reload());
$('#repeatRequest').addEventListener('click', () => { state.currentRequest += 1; updateStatus('waiting'); appendHistory('Menunggu Respons', 'waiting', 'Permintaan ulang dibuat pada demo'); addNotification('Permintaan ulang diterima', `PP-2026-${String(state.currentRequest).padStart(4, '0')} tersedia untuk direspons.`); $('#extensionPanel').scrollIntoView({ behavior: 'smooth', block: 'center' }); });

function showList() { detailView.hidden = true; listView.hidden = false; window.scrollTo({ top: 0, behavior: 'smooth' }); }
function showDetail(focusRequest = false) { listView.hidden = true; detailView.hidden = false; requestAnimationFrame(() => { if (focusRequest) $('#extensionPanel').scrollIntoView({ behavior: 'smooth', block: 'center' }); else window.scrollTo({ top: 0, behavior: 'smooth' }); }); }
$$('.open-request').forEach((button) => button.addEventListener('click', () => showDetail(true)));
$('#backToList').addEventListener('click', showList); $('#homeNav').addEventListener('click', showList); $('#brandHome').addEventListener('click', showList);
function filterTenders() {
  const query = $('#tenderSearch').value.trim().toLowerCase(); const status = $('#statusFilter').value; let visible = 0;
  $$('.tender-row').forEach((row) => { const match = row.dataset.search.toLowerCase().includes(query) && (status === 'all' || row.dataset.status === status); row.hidden = !match; if (match) visible += 1; });
  $('#emptyFilter').hidden = visible > 0;
}
$('#tenderSearch').addEventListener('input', filterTenders); $('#statusFilter').addEventListener('change', filterTenders);
$('#resetFilters').addEventListener('click', () => { $('#tenderSearch').value = ''; $('#statusFilter').value = 'all'; $('#agencyFilter').selectedIndex = 0; filterTenders(); });
$$('.close-info').forEach((button) => button.addEventListener('click', () => { button.closest('.important-info').hidden = true; }));
document.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-modal]')) closeModal(); if (event.target.closest('[data-close-apendo]')) closeModal(apendoModal);
  if (event.target.closest('[data-close-drawer]')) { $('#notificationDrawer').classList.remove('open'); $('#notificationDrawer').setAttribute('aria-hidden', 'true'); }
});
$('#notificationButton').addEventListener('click', () => { $('#notificationDrawer').classList.add('open'); $('#notificationDrawer').setAttribute('aria-hidden', 'false'); });
$('#packageNav').addEventListener('click', () => toast('Paket Baru tidak termasuk dalam scope prototype ini.'));
$$('.page-tab').forEach((tab) => tab.addEventListener('click', () => { const tabs = [...tab.closest('.page-tabs').querySelectorAll('.page-tab')]; tabs.forEach((item) => { item.classList.remove('active'); item.setAttribute('aria-selected', 'false'); }); tab.classList.add('active'); tab.setAttribute('aria-selected', 'true'); if (tabs.indexOf(tab) !== 0) toast('Tab ditampilkan untuk kemiripan navigasi; alur utama berada di Informasi Tender.'); }));

renderNotifications();
