// =============================================
// NAMO MEDICAL STORE - Prescription Page JS
// Firestore only — prescription photos via WhatsApp
// =============================================

import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {

  const form        = document.getElementById('rx-form');
  const successMsg  = document.getElementById('rx-success');
  const resetBtn    = document.getElementById('rx-reset-btn');
  const submitBtn   = document.getElementById('rx-submit-btn');
  const spinner     = document.getElementById('rx-spinner');
  const submitError = document.getElementById('rx-submit-error');
  const waBtn       = document.getElementById('rx-whatsapp-btn');

  if (!form) return;

  // Replace with your WhatsApp business number (country code + number, no + or spaces)
  const WHATSAPP_NUMBER = '919501743529';

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
      ? 'Saving…'
      : 'Submit Order Details';
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

  function buildWhatsAppUrl(name, phone) {
    const text = encodeURIComponent(
      `Hello Namo Medical,\n\nI have submitted my order details on your website.\n\nName: ${name}\nPhone: ${phone}\n\nPlease find my prescription photo attached.`
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
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

  // ── Form Submit ─────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideSubmitError();
    let valid = true;

    ['rx-name', 'rx-phone', 'rx-address'].forEach(id => {
      if (!validateField(id)) valid = false;
    });

    if (!valid) {
      const firstErr = form.querySelector('input.error, textarea.error');
      if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const name = document.getElementById('rx-name').value.trim();
    const phone = document.getElementById('rx-phone').value.trim();
    const address = document.getElementById('rx-address').value.trim();
    const notes = document.getElementById('rx-notes').value.trim() || '';

    setLoading(true);

    try {
      await addDoc(collection(db, 'prescriptionOrders'), {
        name,
        phone,
        address,
        notes,
        timestamp: serverTimestamp(),
        status: 'pending',
      });

      if (waBtn) {
        waBtn.href = buildWhatsAppUrl(name, phone);
      }

      form.style.display = 'none';
      successMsg.style.display = 'block';
      successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      console.error('Prescription submission failed:', err);
      showSubmitError(
        'Something went wrong while saving your details. Please try again or call us.'
      );
    } finally {
      setLoading(false);
    }
  });

  // ── Reset ───────────────────────────────────────────────
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
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
