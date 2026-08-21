// =============================================
// NAMO MEDICAL STORE - Prescription Page JS
// =============================================

import { db, storage } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js';

document.addEventListener('DOMContentLoaded', () => {

  const form       = document.getElementById('rx-form');
  const successMsg = document.getElementById('rx-success');
  const resetBtn   = document.getElementById('rx-reset-btn');
  const submitBtn  = document.getElementById('rx-submit-btn');
  const spinner    = document.getElementById('rx-spinner');
  const submitError = document.getElementById('rx-submit-error');

  if (!form) return;

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

  // ── Validation helpers ──────────────────────────────────
  function showError(errId, fieldEl, customMsg) {
    const errEl = document.getElementById(errId);
    if (errEl) {
      if (customMsg) errEl.textContent = customMsg;
      errEl.classList.add('visible');
    }
    if (fieldEl) {
      fieldEl.classList.remove('valid');
      fieldEl.classList.add('error');
    }
  }

  function clearError(errId, fieldEl) {
    const errEl = document.getElementById(errId);
    if (errEl) errEl.classList.remove('visible');
    if (fieldEl) {
      fieldEl.classList.remove('error');
      fieldEl.classList.add('valid');
    }
  }

  function isValidPhone(val) {
    const digits = val.replace(/\D/g, '');
    // Indian numbers: 10 digits, optionally with country code 91
    if (digits.length === 10) return /^[6-9]/.test(digits);
    if (digits.length === 12 && digits.startsWith('91')) return /^[6-9]/.test(digits.slice(2));
    return false;
  }

  function validateField(id) {
    const el = document.getElementById(id);
    if (!el) return true;
    const val = el.value.trim();

    if (id === 'rx-phone') {
      if (!isValidPhone(val)) { showError('err-rx-phone', el); return false; }
      clearError('err-rx-phone', el); return true;
    }
    if (!val) {
      showError('err-' + id, el); return false;
    }
    clearError('err-' + id, el);
    return true;
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    spinner.style.display = isLoading ? 'inline-block' : 'none';
    document.getElementById('rx-btn-text').textContent = isLoading
      ? 'Uploading…'
      : 'Send Prescription & Order';
  }

  function showSubmitError(msg) {
    if (!submitError) return;
    submitError.textContent = msg;
    submitError.style.display = 'block';
  }

  function hideSubmitError() {
    if (!submitError) return;
    submitError.textContent = '';
    submitError.style.display = 'none';
  }

  // ── Live validation on blur ─────────────────────────────
  ['rx-name', 'rx-phone', 'rx-address'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('blur', () => validateField(id));
    el.addEventListener('input', () => {
      if (el.classList.contains('error')) validateField(id);
    });
  });

  // ── File Upload Logic ───────────────────────────────────
  const uploadArea    = document.getElementById('rx-upload-area');
  const fileInput     = document.getElementById('rx-file');
  const uploadContent = document.getElementById('rx-upload-content');
  const uploadPreview = document.getElementById('rx-upload-preview');
  const previewImg    = document.getElementById('rx-preview-img');
  const previewName   = document.getElementById('rx-preview-name');
  const previewSize   = document.getElementById('rx-preview-size');
  const removeFileBtn = document.getElementById('rx-remove-file');

  let selectedFile = null;

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function validateFile(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      showError('err-rx-file', null, 'Please upload a JPG, PNG, WEBP, or PDF file.');
      uploadArea.classList.add('error-state');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      showError('err-rx-file', null, 'File is too large. Maximum size is 10 MB.');
      uploadArea.classList.add('error-state');
      return false;
    }
    return true;
  }

  function showPreview(file) {
    selectedFile = file;
    previewName.textContent = file.name;
    previewSize.textContent = formatBytes(file.size);

    if (file.type === 'application/pdf') {
      previewImg.style.display = 'none';
      let pdfThumb = uploadPreview.querySelector('.rx-pdf-thumb');
      if (!pdfThumb) {
        pdfThumb = document.createElement('div');
        pdfThumb.className = 'rx-pdf-thumb';
        pdfThumb.innerHTML = '<i class="far fa-file-pdf"></i>';
        uploadPreview.insertBefore(pdfThumb, uploadPreview.firstChild);
      }
      pdfThumb.style.display = 'flex';
    } else {
      const reader = new FileReader();
      reader.onload = e => {
        previewImg.src = e.target.result;
        previewImg.style.display = 'block';
      };
      reader.readAsDataURL(file);
      const pdfThumb = uploadPreview.querySelector('.rx-pdf-thumb');
      if (pdfThumb) pdfThumb.style.display = 'none';
    }

    uploadContent.style.display = 'none';
    uploadPreview.style.display = 'flex';
    uploadArea.classList.add('has-file');
    uploadArea.classList.remove('error-state');
    clearError('err-rx-file', null);
  }

  function clearFile() {
    selectedFile = null;
    fileInput.value = '';
    previewImg.src = '';
    uploadContent.style.display = 'block';
    uploadPreview.style.display = 'none';
    uploadArea.classList.remove('has-file', 'drag-over', 'error-state');
  }

  function handleFileSelect(file) {
    if (!file) return;
    if (!validateFile(file)) {
      clearFile();
      return;
    }
    showPreview(file);
  }

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      handleFileSelect(fileInput.files[0]);
    }
  });

  removeFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    clearFile();
  });

  // Drag & drop
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  });

  // ── Unique filename for Storage ─────────────────────────
  function buildUniqueFilename(file) {
    const ext = file.name.includes('.')
      ? file.name.split('.').pop().toLowerCase()
      : 'bin';
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    return `prescriptions/${unique}.${ext}`;
  }

  // ── Form Submit ─────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideSubmitError();
    let valid = true;

    ['rx-name', 'rx-phone', 'rx-address'].forEach(id => {
      if (!validateField(id)) valid = false;
    });

    if (!selectedFile) {
      showError('err-rx-file', null, 'Please upload your prescription photo or PDF.');
      uploadArea.classList.add('error-state');
      valid = false;
    } else if (!validateFile(selectedFile)) {
      valid = false;
    } else {
      clearError('err-rx-file', null);
      uploadArea.classList.remove('error-state');
    }

    if (!valid) {
      const firstErr = form.querySelector(
        'input.error, textarea.error, .rx-upload-area.error-state'
      );
      if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);

    try {
      // 1. Upload prescription file to Firebase Storage
      const storagePath = buildUniqueFilename(selectedFile);
      const fileRef = ref(storage, storagePath);
      await uploadBytes(fileRef, selectedFile);
      const prescriptionImageUrl = await getDownloadURL(fileRef);

      // 2. Save order to Firestore
      await addDoc(collection(db, 'prescriptionOrders'), {
        name: document.getElementById('rx-name').value.trim(),
        phone: document.getElementById('rx-phone').value.trim(),
        address: document.getElementById('rx-address').value.trim(),
        notes: document.getElementById('rx-notes').value.trim() || '',
        prescriptionImageUrl,
        timestamp: serverTimestamp(),
        status: 'pending',
      });

      form.style.display = 'none';
      successMsg.style.display = 'block';
      successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      console.error('Prescription submission failed:', err);
      showSubmitError(
        'Something went wrong while submitting your prescription. Please try again or call us.'
      );
    } finally {
      setLoading(false);
    }
  });

  // ── Reset ───────────────────────────────────────────────
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      clearFile();
      hideSubmitError();
      form.querySelectorAll('input, textarea').forEach(el => {
        el.classList.remove('error', 'valid');
      });
      form.querySelectorAll('.rx-error').forEach(el => el.classList.remove('visible'));
      successMsg.style.display = 'none';
      form.style.display = 'block';
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

});
