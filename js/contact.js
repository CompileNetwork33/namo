// =============================================
// NAMO MEDICAL STORE - Contact Page JavaScript
// =============================================

document.addEventListener('DOMContentLoaded', () => {

  const form        = document.getElementById('contact-form');
  const submitBtn   = document.getElementById('contact-submit');
  const successBox  = document.getElementById('form-success');
  const btnText     = submitBtn.querySelector('.btn-submit-text');
  const btnLoading  = submitBtn.querySelector('.btn-submit-loading');

  // ---- Field references ----
  const nameInput    = document.getElementById('contact-name');
  const emailInput   = document.getElementById('contact-email');
  const messageInput = document.getElementById('contact-message');

  // ---- Validators ----
  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  function setError(inputEl, errorId, msg) {
    inputEl.classList.add('error');
    const errEl = document.getElementById(errorId);
    if (errEl) errEl.textContent = msg;
  }

  function clearError(inputEl, errorId) {
    inputEl.classList.remove('error');
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

  messageInput.addEventListener('blur', () => {
    validateField(messageInput, 'error-message',
      v => v.trim().length >= 10,
      'Please write a brief message (at least 10 characters).'
    );
  });

  // Clear error on input
  [nameInput, emailInput, messageInput].forEach(el => {
    el.addEventListener('input', () => {
      el.classList.remove('error');
    });
  });

  // ---- Form submission ----
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validate all required fields
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

    if (!nameOk || !emailOk || !msgOk) {
      // Scroll to first error
      const firstError = form.querySelector('.error');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Simulate sending (replace with actual fetch/API call)
    submitBtn.disabled = true;
    btnText.style.display    = 'none';
    btnLoading.style.display = 'flex';

    setTimeout(() => {
      // Hide form fields, show success
      form.querySelectorAll('.form-row, .form-group, .btn-submit').forEach(el => {
        el.style.display = 'none';
      });
      submitBtn.style.display = 'none';
      successBox.style.display = 'block';

      // Reset for future use (optional)
      setTimeout(() => form.reset(), 100);
    }, 1800);
  });

  // ---- WhatsApp floating pulse (accessibility) ----
  // Subtly animate the WhatsApp QC card icon to draw attention on first load
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
