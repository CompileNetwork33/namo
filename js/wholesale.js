// =============================================
// NAMO MEDICAL STORE - Wholesale Page JS
// =============================================

import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {

  const form        = document.getElementById('ws-enquiry-form');
  const successMsg  = document.getElementById('ws-success');
  const resetBtn    = document.getElementById('ws-reset-btn');
  const submitBtn   = document.getElementById('ws-submit-btn');
  const spinner     = document.getElementById('ws-spinner');
  const submitError = document.getElementById('ws-submit-error');

  if (!form) return;

  // ── Helpers ──────────────────────────────────────────────
  function showError(id, inputEl) {
    document.getElementById(id).classList.add('visible');
    if (inputEl) {
      inputEl.classList.remove('valid');
      inputEl.classList.add('error');
    }
  }
  function clearError(id, inputEl) {
    document.getElementById(id).classList.remove('visible');
    if (inputEl) {
      inputEl.classList.remove('error');
      inputEl.classList.add('valid');
    }
  }

  function isValidPhone(val) {
    const digits = val.replace(/\D/g, '');
    if (digits.length === 10) return /^[6-9]/.test(digits);
    if (digits.length === 12 && digits.startsWith('91')) return /^[6-9]/.test(digits.slice(2));
    return false;
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    spinner.style.display = isLoading ? 'inline-block' : 'none';
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
      if (!isValidPhone(val)) { showError(errId, el); return false; }
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
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideSubmitError();

    let valid = true;

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

    const agree = document.getElementById('ws-agree');
    if (!agree.checked) {
      showError('err-ws-agree', null);
      valid = false;
    } else {
      clearError('err-ws-agree', null);
    }

    if (!valid) {
      form.querySelectorAll('.ws-error.visible').forEach(errEl => {
        const field = errEl.previousElementSibling;
        if (field && window.NamoAnim) window.NamoAnim.shake(field);
      });
      const firstErr = form.querySelector('.error, input.error, select.error, textarea.error');
      if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);

    try {
      const orderVolumeEl = document.getElementById('order-volume');
      const orderVolumeLabel = orderVolumeEl.options[orderVolumeEl.selectedIndex]?.text || orderVolumeEl.value;

      await addDoc(collection(db, 'wholesaleEnquiries'), {
        businessName: document.getElementById('biz-name').value.trim(),
        contactPerson: document.getElementById('contact-person').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        gstLicenseNumber: document.getElementById('gst-license').value.trim(),
        productsInterested: document.getElementById('products-interested').value.trim(),
        orderVolume: orderVolumeLabel,
        timestamp: serverTimestamp(),
      });

      form.style.display = 'none';
      successMsg.style.display = 'block';
      successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      console.error('Wholesale enquiry submission failed:', err);
      showSubmitError(
        'Unable to submit your enquiry right now. Please try again or call our wholesale helpline.'
      );
    } finally {
      setLoading(false);
    }
  });

  // ── Reset Form ────────────────────────────────────────────
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      hideSubmitError();
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
