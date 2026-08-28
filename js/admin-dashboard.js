// =============================================
// NAMO MEDICAL STORE - Admin Dashboard JS
// =============================================

import { auth, db } from './firebase-config.js';
import { signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
  const userEmailEl = document.getElementById('admin-user-email');
  const logoutBtn   = document.getElementById('admin-logout-btn');
  const refreshBtn  = document.getElementById('admin-refresh-btn');
  const searchInput = document.getElementById('admin-search-input');

  // Tab elements
  const tabBtns     = document.querySelectorAll('.admin-tab-btn');
  const tabPanels   = document.querySelectorAll('.admin-tab-content');

  // Table tbody references
  const tbodyRx       = document.getElementById('tbody-rx');
  const tbodyContacts = document.getElementById('tbody-contacts');
  const tbodyWs       = document.getElementById('tbody-wholesale');

  // Stat badges
  const statTotalRx   = document.getElementById('stat-total-rx');
  const statPendingRx = document.getElementById('stat-pending-rx');
  const statContact   = document.getElementById('stat-total-contact');
  const statWs        = document.getElementById('stat-total-ws');

  const badgeRx       = document.getElementById('badge-rx-count');
  const badgeContact  = document.getElementById('badge-contact-count');
  const badgeWs       = document.getElementById('badge-ws-count');

  // State cache for searching
  let rxData = [];
  let contactData = [];
  let wsData = [];
  let unsubscribes = [];

  // 1. Auth Protection Check
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // User not authenticated -> redirect to login
      window.location.href = 'admin-login.html';
    } else {
      if (userEmailEl) userEmailEl.textContent = user.email || 'Admin';
      initDashboard();
    }
  });

  // 2. Logout Handler
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await signOut(auth);
        window.location.href = 'admin-login.html';
      } catch (err) {
        console.error('Logout error:', err);
        showToast('Logout failed. Please try again.', 'error');
      }
    });
  }

  // 3. Tab Switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const targetId = btn.getAttribute('data-tab');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add('active');

      // Re-apply search filter for current tab
      filterTableRows();
    });
  });

  // 4. Toast Helper
  function showToast(message, type = 'success') {
    const container = document.getElementById('admin-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `admin-toast ${type === 'error' ? 'admin-toast-error' : 'admin-toast-success'}`;
    toast.innerHTML = `
      <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
      <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // 5. Utility Functions
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatTimestamp(ts) {
    if (!ts) return 'Just now';
    let date;
    if (typeof ts.toDate === 'function') {
      date = ts.toDate();
    } else if (ts.seconds) {
      date = new Date(ts.seconds * 1000);
    } else if (ts instanceof Date) {
      date = ts;
    } else {
      date = new Date(ts);
    }
    if (isNaN(date.getTime())) return 'Recently';

    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  function normalizeStatus(status) {
    if (!status) return 'Pending';
    const s = String(status).toLowerCase();
    if (s === 'processing') return 'Processing';
    if (s === 'out_for_delivery' || s === 'out for delivery') return 'Out for Delivery';
    if (s === 'delivered') return 'Delivered';
    return 'Pending';
  }

  function getStatusCssClass(statusVal) {
    const s = String(statusVal).toLowerCase().replace(/\s+/g, '_');
    if (s === 'processing') return 'status-processing';
    if (s === 'out_for_delivery' || s === 'out for delivery') return 'status-out_for_delivery';
    if (s === 'delivered') return 'status-delivered';
    return 'status-pending';
  }

  // 6. Initialize Firestore Listeners
  function initDashboard() {
    // Unsubscribe existing if re-initializing
    unsubscribes.forEach(unsub => unsub());
    unsubscribes = [];

    // --- A. Prescription Orders ---
    try {
      const qRx = query(collection(db, 'prescriptionOrders'), orderBy('timestamp', 'desc'));
      const unsubRx = onSnapshot(qRx, (snapshot) => {
        rxData = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        renderPrescriptions(rxData);
      }, (err) => {
        console.error('Prescriptions listener error:', err);
        // Fallback without orderBy if index is building or timestamp is null
        fallbackFetch('prescriptionOrders', (data) => {
          rxData = data;
          renderPrescriptions(rxData);
        });
      });
      unsubscribes.push(unsubRx);
    } catch (e) {
      console.warn('Error attaching rx listener:', e);
    }

    // --- B. Contact Messages ---
    try {
      const qContacts = query(collection(db, 'contactMessages'), orderBy('timestamp', 'desc'));
      const unsubContacts = onSnapshot(qContacts, (snapshot) => {
        contactData = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        renderContacts(contactData);
      }, (err) => {
        console.error('Contacts listener error:', err);
        fallbackFetch('contactMessages', (data) => {
          contactData = data;
          renderContacts(contactData);
        });
      });
      unsubscribes.push(unsubContacts);
    } catch (e) {
      console.warn('Error attaching contact listener:', e);
    }

    // --- C. Wholesale Enquiries ---
    try {
      const qWs = query(collection(db, 'wholesaleEnquiries'), orderBy('timestamp', 'desc'));
      const unsubWs = onSnapshot(qWs, (snapshot) => {
        wsData = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        renderWholesale(wsData);
      }, (err) => {
        console.error('Wholesale listener error:', err);
        fallbackFetch('wholesaleEnquiries', (data) => {
          wsData = data;
          renderWholesale(wsData);
        });
      });
      unsubscribes.push(unsubWs);
    } catch (e) {
      console.warn('Error attaching wholesale listener:', e);
    }
  }

  function fallbackFetch(collName, callback) {
    onSnapshot(collection(db, collName), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const tA = a.timestamp ? (a.timestamp.seconds || 0) : 0;
        const tB = b.timestamp ? (b.timestamp.seconds || 0) : 0;
        return tB - tA;
      });
      callback(list);
    });
  }

  // 7. RENDER: Prescription Orders Table
  function renderPrescriptions(items) {
    if (statTotalRx) statTotalRx.textContent = items.length;
    if (badgeRx) badgeRx.textContent = items.length;

    const pendingCount = items.filter(item => normalizeStatus(item.status) === 'Pending').length;
    if (statPendingRx) statPendingRx.textContent = pendingCount;

    if (!tbodyRx) return;

    if (items.length === 0) {
      tbodyRx.innerHTML = `
        <tr>
          <td colspan="7" class="table-empty">
            <i class="fas fa-inbox" style="font-size: 2rem; color: #CBD5E1; display: block; margin-bottom: 0.5rem;"></i>
            No prescription orders found yet.
          </td>
        </tr>
      `;
      return;
    }

    tbodyRx.innerHTML = items.map(item => {
      const cleanPhone = (item.phone || '').replace(/\D/g, '');
      const formattedStatus = normalizeStatus(item.status);
      const statusCss = getStatusCssClass(formattedStatus);

      const waText = encodeURIComponent(
        `Hello ${item.name || 'Customer'},\n\nRegarding your prescription order at Namo Medical Store (Status: ${formattedStatus}). How can we assist you?`
      );

      return `
        <tr data-doc-id="${item.id}" class="table-row-item">
          <td style="white-space: nowrap;">
            <span class="cell-title">${formatTimestamp(item.timestamp)}</span>
          </td>
          <td>
            <span class="cell-title">${escapeHtml(item.name || 'N/A')}</span>
          </td>
          <td>
            <span class="cell-title">${escapeHtml(item.phone || 'N/A')}</span>
          </td>
          <td class="cell-address">
            ${escapeHtml(item.address || 'N/A')}
          </td>
          <td class="cell-notes">
            ${item.notes ? escapeHtml(item.notes) : '<em style="color:#94A3B8;">None</em>'}
          </td>
          <td>
            <div class="status-select-wrap">
              <select class="status-select ${statusCss}" data-id="${item.id}">
                <option value="Pending" ${formattedStatus === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="Processing" ${formattedStatus === 'Processing' ? 'selected' : ''}>Processing</option>
                <option value="Out for Delivery" ${formattedStatus === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
                <option value="Delivered" ${formattedStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
              </select>
            </div>
          </td>
          <td>
            <div class="action-group">
              ${cleanPhone ? `
                <a href="https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${waText}"
                   target="_blank" rel="noopener noreferrer" class="btn-action-icon btn-action-wa" title="WhatsApp Customer">
                  <i class="fab fa-whatsapp"></i>
                </a>
                <a href="tel:${cleanPhone}" class="btn-action-icon btn-action-phone" title="Call Customer">
                  <i class="fas fa-phone-alt"></i>
                </a>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach Status Dropdown Event Handlers
    tbodyRx.querySelectorAll('.status-select').forEach(selectEl => {
      selectEl.addEventListener('change', async (e) => {
        const orderId = e.target.getAttribute('data-id');
        const newStatus = e.target.value;

        // Update CSS styling
        e.target.className = `status-select ${getStatusCssClass(newStatus)}`;

        try {
          const docRef = doc(db, 'prescriptionOrders', orderId);
          await updateDoc(docRef, { status: newStatus });
          showToast(`Order status updated to "${newStatus}"`);
        } catch (err) {
          console.error('Error updating order status:', err);
          showToast('Failed to update status in Firestore.', 'error');
        }
      });
    });

    filterTableRows();
  }

  // 8. RENDER: Contact Messages Table
  function renderContacts(items) {
    if (statContact) statContact.textContent = items.length;
    if (badgeContact) badgeContact.textContent = items.length;

    if (!tbodyContacts) return;

    if (items.length === 0) {
      tbodyContacts.innerHTML = `
        <tr>
          <td colspan="6" class="table-empty">
            <i class="fas fa-inbox" style="font-size: 2rem; color: #CBD5E1; display: block; margin-bottom: 0.5rem;"></i>
            No contact messages received yet.
          </td>
        </tr>
      `;
      return;
    }

    tbodyContacts.innerHTML = items.map(item => {
      const cleanPhone = (item.phone || '').replace(/\D/g, '');

      return `
        <tr class="table-row-item">
          <td style="white-space: nowrap;">
            <span class="cell-title">${formatTimestamp(item.timestamp)}</span>
          </td>
          <td>
            <span class="cell-title">${escapeHtml(item.name || 'N/A')}</span>
          </td>
          <td>
            <a href="mailto:${escapeHtml(item.email || '')}" style="color:#2563EB; text-decoration:none;">
              ${escapeHtml(item.email || 'N/A')}
            </a>
          </td>
          <td>
            ${escapeHtml(item.phone || 'N/A')}
          </td>
          <td class="cell-msg">
            ${escapeHtml(item.message || 'N/A')}
          </td>
          <td>
            <div class="action-group">
              ${item.email ? `
                <a href="mailto:${escapeHtml(item.email)}?subject=Re:%20Namo%20Medical%20Enquiry"
                   class="btn-action-icon btn-action-email" title="Reply via Email">
                  <i class="fas fa-reply"></i>
                </a>
              ` : ''}
              ${cleanPhone ? `
                <a href="tel:${cleanPhone}" class="btn-action-icon btn-action-phone" title="Call Sender">
                  <i class="fas fa-phone-alt"></i>
                </a>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    filterTableRows();
  }

  // 9. RENDER: Wholesale Enquiries Table
  function renderWholesale(items) {
    if (statWs) statWs.textContent = items.length;
    if (badgeWs) badgeWs.textContent = items.length;

    if (!tbodyWs) return;

    if (items.length === 0) {
      tbodyWs.innerHTML = `
        <tr>
          <td colspan="8" class="table-empty">
            <i class="fas fa-inbox" style="font-size: 2rem; color: #CBD5E1; display: block; margin-bottom: 0.5rem;"></i>
            No wholesale enquiries received yet.
          </td>
        </tr>
      `;
      return;
    }

    tbodyWs.innerHTML = items.map(item => {
      const cleanPhone = (item.phone || '').replace(/\D/g, '');

      return `
        <tr class="table-row-item">
          <td style="white-space: nowrap;">
            <span class="cell-title">${formatTimestamp(item.timestamp)}</span>
          </td>
          <td>
            <span class="cell-title">${escapeHtml(item.businessName || 'N/A')}</span>
          </td>
          <td>
            <span class="cell-title">${escapeHtml(item.contactPerson || 'N/A')}</span>
          </td>
          <td>
            <div>${escapeHtml(item.phone || 'N/A')}</div>
            <a href="mailto:${escapeHtml(item.email || '')}" class="cell-sub" style="color:#2563EB;">
              ${escapeHtml(item.email || 'N/A')}
            </a>
          </td>
          <td>
            <span class="cell-title" style="font-family: monospace; font-size: 0.825rem;">
              ${escapeHtml(item.gstLicenseNumber || 'N/A')}
            </span>
          </td>
          <td class="cell-msg">
            ${escapeHtml(item.productsInterested || 'N/A')}
          </td>
          <td>
            <span class="tab-badge" style="background:#EDE9FE; color:#6D28D9; font-weight:600;">
              ${escapeHtml(item.orderVolume || 'N/A')}
            </span>
          </td>
          <td>
            <div class="action-group">
              ${item.email ? `
                <a href="mailto:${escapeHtml(item.email)}?subject=Namo%20Medical%20Wholesale%20Enquiry"
                   class="btn-action-icon btn-action-email" title="Email Business">
                  <i class="fas fa-envelope"></i>
                </a>
              ` : ''}
              ${cleanPhone ? `
                <a href="tel:${cleanPhone}" class="btn-action-icon btn-action-phone" title="Call Business">
                  <i class="fas fa-phone-alt"></i>
                </a>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    filterTableRows();
  }

  // 10. Real-time Search Filtering
  function filterTableRows() {
    if (!searchInput) return;
    const queryStr = searchInput.value.trim().toLowerCase();

    const activePanel = document.querySelector('.admin-tab-content.active');
    if (!activePanel) return;

    const rows = activePanel.querySelectorAll('tbody tr.table-row-item');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      if (!queryStr || text.includes(queryStr)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', filterTableRows);
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      refreshBtn.querySelector('i').classList.add('fa-spin');
      initDashboard();
      setTimeout(() => {
        refreshBtn.querySelector('i').classList.remove('fa-spin');
        showToast('Data refreshed successfully');
      }, 600);
    });
  }
});
