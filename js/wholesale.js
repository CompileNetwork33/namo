// =============================================
// NAMO MEDICAL STORE - Wholesale Page JS
// =============================================

document.addEventListener('DOMContentLoaded', () => {

  const form        = document.getElementById('ws-enquiry-form');
  const successMsg  = document.getElementById('ws-success');
  const resetBtn    = document.getElementById('ws-reset-btn');
  const submitBtn   = document.getElementById('ws-submit-btn');
  const spinner     = document.getElementById('ws-spinner');

  if (!form) return;

  // ── Helpers ──────────────────────────────────────────────
  function showError(id, inputEl) {
    document.getElementById(id).classList.add('visible');
    if (inputEl) {
      getFieldEl(inputEl).classList.remove('valid');
      getFieldEl(inputEl).classList.add('error');
    }
  }
  function clearError(id, inputEl) {
    document.getElementById(id).classList.remove('visible');
    if (inputEl) {
      getFieldEl(inputEl).classList.remove('error');
      getFieldEl(inputEl).classList.add('valid');
    }
  }
  function getFieldEl(el) {
    // For textarea, return the textarea itself; else the input/select
    return el;
  }

  // ── Live validation on blur ───────────────────────────────
  function attachLiveValidation() {
    const fields = [
      { id: 'biz-name',            errId: 'err-biz-name' },
      { id: 'contact-person',      errId: 'err-contact-person' },
      { id: 'phone',               errId: 'err-phone' },
      { id: 'email',               errId: 'err-email' },
      { id: 'gst-license',         errId: 'err-gst-license' },
      { id: 'products-interested', errId: 'err-products-interested' },
      { id: 'order-volume',        errId: 'err-order-volume' },
    ];
    fields.forEach(({ id, errId }) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('blur', () => validateField(id, errId, el));
      el.addEventListener('input', () => {
        if (el.classList.contains('error')) validateField(id, errId, el);
      });
    });
    const agree = document.getElementById('ws-agree');
    if (agree) {
      agree.addEventListener('change', () => {
        if (agree.checked) clearError('err-ws-agree', null);
        else showError('err-ws-agree', null);
      });
    }
  }

  function validateField(id, errId, el) {
    const val = el.value.trim();
    if (id === 'phone') {
      const digits = val.replace(/\D/g, '');
      if (digits.length < 10) { showError(errId, el); return false; }
      clearError(errId, el); return true;
    }
    if (id === 'email') {
      const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRx.test(val)) { showError(errId, el); return false; }
      clearError(errId, el); return true;
    }
    if (!val) { showError(errId, el); return false; }
    clearError(errId, el); return true;
  }

  attachLiveValidation();

  // ── Submit Handler ────────────────────────────────────────
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let valid = true;

    // Required text / select fields
    const textFields = [
      { id: 'biz-name',            errId: 'err-biz-name' },
      { id: 'contact-person',      errId: 'err-contact-person' },
      { id: 'phone',               errId: 'err-phone' },
      { id: 'email',               errId: 'err-email' },
      { id: 'gst-license',         errId: 'err-gst-license' },
      { id: 'products-interested', errId: 'err-products-interested' },
      { id: 'order-volume',        errId: 'err-order-volume' },
    ];

    textFields.forEach(({ id, errId }) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (!validateField(id, errId, el)) valid = false;
    });

    // Checkbox
    const agree = document.getElementById('ws-agree');
    if (!agree.checked) {
      showError('err-ws-agree', null);
      valid = false;
    } else {
      clearError('err-ws-agree', null);
    }

    if (!valid) {
      // Scroll to first error
      const firstErr = form.querySelector('.error, input.error, select.error, textarea.error');
      if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // ── Simulate Submission ───────────────────────────────
    submitBtn.disabled = true;
    spinner.style.display = 'inline-block';

    setTimeout(() => {
      form.style.display = 'none';
      successMsg.style.display = 'block';
      successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      submitBtn.disabled = false;
      spinner.style.display = 'none';
    }, 1400);
  });

  // ── Reset Form ────────────────────────────────────────────
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      // Clear all error/valid states
      form.querySelectorAll('input, select, textarea').forEach(el => {
        el.classList.remove('error', 'valid');
      });
      form.querySelectorAll('.ws-error').forEach(el => el.classList.remove('visible'));
      successMsg.style.display = 'none';
      form.style.display = 'block';
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

});
