// =============================================
// NAMO MEDICAL STORE - Contact Page JavaScript
// =============================================

import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {

  const form        = document.getElementById('contact-form');
  const submitBtn   = document.getElementById('contact-submit');
  const successBox  = document.getElementById('form-success');
  const submitError = document.getElementById('contact-submit-error');
  const btnText     = submitBtn.querySelector('.btn-submit-text');
  const btnLoading  = submitBtn.querySelector('.btn-submit-loading');

  // ---- Field references ----
  const nameInput    = document.getElementById('contact-name');
  const emailInput   = document.getElementById('contact-email');
  const phoneInput   = document.getElementById('contact-phone');
  const messageInput = document.getElementById('contact-message');

  // ---- Validators ----
  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  function isValidPhone(v) {
    const digits = v.replace(/\D/g, '');
    if (digits.length === 10) return /^[6-9]/.test(digits);
    if (digits.length === 12 && digits.startsWith('91')) return /^[6-9]/.test(digits.slice(2));
    return false;
  }

  function setError(inputEl, errorId, msg) {
    inputEl.classList.add('error');
    inputEl.classList.remove('success');
    const errEl = document.getElementById(errorId);
    if (errEl) errEl.textContent = msg;
  }

  function clearError(inputEl, errorId) {
    inputEl.classList.remove('error');
    inputEl.classList.add('success');
    const errEl = document.getElementById(errorId);
    if (errEl) errEl.textContent = '';
  }

  function validateField(inputEl, errorId, validatorFn, msg) {
    if (!validatorFn(inputEl.value)) {
      setError(inputEl, errorId, msg);
      return false;
    }
    clearError(inputEl, errorId);
    return true;
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    btnText.style.display    = isLoading ? 'none' : '';
    btnLoading.style.display = isLoading ? 'flex' : 'none';
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

  // Live validation on blur
  nameInput.addEventListener('blur', () => {
    validateField(nameInput, 'error-name',
      v => v.trim().length >= 2,
      'Please enter your full name (at least 2 characters).'
    );
  });

  emailInput.addEventListener('blur', () => {
    validateField(emailInput, 'error-email',
      v => isValidEmail(v),
      'Please enter a valid email address.'
    );
  });

  phoneInput.addEventListener('blur', () => {
    const val = phoneInput.value.trim();
    if (!val) {
      phoneInput.classList.remove('error');
      const errEl = document.getElementById('error-phone');
      if (errEl) errEl.textContent = '';
      return;
    }
    validateField(phoneInput, 'error-phone',
      v => isValidPhone(v),
      'Please enter a valid 10-digit phone number.'
    );
  });

  messageInput.addEventListener('blur', () => {
    validateField(messageInput, 'error-message',
      v => v.trim().length >= 10,
      'Please write a brief message (at least 10 characters).'
    );
  });

  // Clear error on input
  [nameInput, emailInput, phoneInput, messageInput].forEach(el => {
    el.addEventListener('input', () => {
      el.classList.remove('error');
    });
  });

  // ---- Form submission ----
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideSubmitError();

    const nameOk = validateField(nameInput, 'error-name',
      v => v.trim().length >= 2,
      'Please enter your full name (at least 2 characters).'
    );
    const emailOk = validateField(emailInput, 'error-email',
      v => isValidEmail(v),
      'Please enter a valid email address.'
    );
    const msgOk = validateField(messageInput, 'error-message',
      v => v.trim().length >= 10,
      'Please write a brief message (at least 10 characters).'
    );

    // Phone is optional, but must be valid if provided
    let phoneOk = true;
    const phoneVal = phoneInput.value.trim();
    if (phoneVal) {
      phoneOk = validateField(phoneInput, 'error-phone',
        v => isValidPhone(v),
        'Please enter a valid 10-digit phone number.'
      );
    }

    if (!nameOk || !emailOk || !msgOk || !phoneOk) {
      form.querySelectorAll('.error').forEach(el => {
        if (window.NamoAnim) window.NamoAnim.shake(el);
      });
      const firstError = form.querySelector('.error');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, 'contactMessages'), {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneVal || '',
        message: messageInput.value.trim(),
        timestamp: serverTimestamp(),
      });

      form.querySelectorAll('.form-row, .form-group, .btn-submit').forEach(el => {
        el.style.display = 'none';
      });
      if (submitError) submitError.style.display = 'none';
      submitBtn.style.display = 'none';
      successBox.style.display = 'block';
      form.reset();
    } catch (err) {
      console.error('Contact form submission failed:', err);
      showSubmitError(
        'Unable to send your message right now. Please try again or call us directly.'
      );
    } finally {
      setLoading(false);
    }
  });

  // ---- WhatsApp floating pulse (accessibility) ----
  const waCard = document.getElementById('qc-whatsapp');
  if (waCard) {
    setTimeout(() => {
      waCard.style.transition = 'transform .4s cubic-bezier(.175,.885,.32,1.275), box-shadow .4s ease';
      waCard.style.transform  = 'translateY(-6px)';
      waCard.style.boxShadow  = '0 12px 32px rgba(16,185,129,.25)';
      setTimeout(() => {
        waCard.style.transform = '';
        waCard.style.boxShadow = '';
      }, 700);
    }, 900);
  }

});
