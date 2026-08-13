// =============================================
// NAMO MEDICAL STORE - Prescription Page JS
// =============================================

document.addEventListener('DOMContentLoaded', () => {

  const form       = document.getElementById('rx-form');
  const successMsg = document.getElementById('rx-success');
  const resetBtn   = document.getElementById('rx-reset-btn');
  const submitBtn  = document.getElementById('rx-submit-btn');
  const spinner    = document.getElementById('rx-spinner');

  if (!form) return;

  // ── Validation helpers ──────────────────────────────────
  function showError(errId, fieldEl) {
    const errEl = document.getElementById(errId);
    if (errEl) errEl.classList.add('visible');
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
    return digits.length >= 10;
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

  function showPreview(file) {
    selectedFile = file;
    previewName.textContent = file.name;
    previewSize.textContent = formatBytes(file.size);

    if (file.type === 'application/pdf') {
      // Show a PDF icon placeholder instead of an image
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

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      showPreview(fileInput.files[0]);
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
    if (file) {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowed.includes(file.type)) {
        showError('err-rx-file', null);
        uploadArea.classList.add('error-state');
        return;
      }
      showPreview(file);
    }
  });

  // ── Form Submit ─────────────────────────────────────────
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    // Text fields
    ['rx-name', 'rx-phone', 'rx-address'].forEach(id => {
      if (!validateField(id)) valid = false;
    });

    // File validation
    if (!selectedFile) {
      showError('err-rx-file', null);
      uploadArea.classList.add('error-state');
      valid = false;
    } else {
      clearError('err-rx-file', null);
      uploadArea.classList.remove('error-state');
    }

    if (!valid) {
      // Scroll to first error field
      const firstErr = form.querySelector(
        'input.error, textarea.error, .rx-upload-area.error-state'
      );
      if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Simulate submission
    submitBtn.disabled = true;
    spinner.style.display = 'inline-block';
    document.getElementById('rx-btn-text').textContent = 'Sending…';

    setTimeout(() => {
      form.style.display = 'none';
      successMsg.style.display = 'block';
      successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      submitBtn.disabled = false;
      spinner.style.display = 'none';
      document.getElementById('rx-btn-text').textContent = 'Send Prescription & Order';
    }, 1400);
  });

  // ── Reset ───────────────────────────────────────────────
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      clearFile();
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
