// =============================================
// NAMO MEDICAL STORE - Admin Login JS
// =============================================

import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm    = document.getElementById('admin-login-form');
  const emailInput   = document.getElementById('admin-email');
  const passInput    = document.getElementById('admin-password');
  const submitBtn    = document.getElementById('login-submit-btn');
  const btnText      = submitBtn ? submitBtn.querySelector('.btn-text') : null;
  const btnSpinner   = submitBtn ? submitBtn.querySelector('.btn-spinner') : null;
  const errorAlert   = document.getElementById('login-error');
  const errorText    = document.getElementById('login-error-text');

  // If already logged in, redirect straight to dashboard
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.href = 'admin-dashboard.html';
    }
  });

  function showError(message) {
    if (errorAlert && errorText) {
      errorText.textContent = message;
      errorAlert.style.display = 'flex';
    }
  }

  function hideError() {
    if (errorAlert) {
      errorAlert.style.display = 'none';
    }
  }

  function setLoading(isLoading) {
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    if (btnText) btnText.style.display = isLoading ? 'none' : 'inline-block';
    if (btnSpinner) btnSpinner.style.display = isLoading ? 'inline-block' : 'none';
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError();

      const email = emailInput ? emailInput.value.trim() : '';
      const password = passInput ? passInput.value : '';

      if (!email || !password) {
        showError('Please enter both email and password.');
        return;
      }

      setLoading(true);

      try {
        await signInWithEmailAndPassword(auth, email, password);
        // Successful login will automatically trigger onAuthStateChanged redirect
        window.location.href = 'admin-dashboard.html';
      } catch (error) {
        console.error('Firebase Auth Error:', error.code, error.message);
        let msg = 'Failed to sign in. Please check your credentials.';

        switch (error.code) {
          case 'auth/invalid-credential':
          case 'auth/wrong-password':
          case 'auth/user-not-found':
            msg = 'Invalid email or password. Please try again.';
            break;
          case 'auth/invalid-email':
            msg = 'Please enter a valid email address.';
            break;
          case 'auth/user-disabled':
            msg = 'This admin account has been disabled.';
            break;
          case 'auth/too-many-requests':
            msg = 'Too many failed login attempts. Please try again later.';
            break;
          case 'auth/network-request-failed':
            msg = 'Network error. Please check your internet connection.';
            break;
        }

        showError(msg);
      } finally {
        setLoading(false);
      }
    });
  }
});
