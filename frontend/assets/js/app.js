// State
let currentUser = null;
let selectedDate = new Date().toISOString().split('T')[0];
let currentBookingCourt = null;
let currentBookingTime = null;

// DOM Elements
let loadingOverlay, userInfoDiv, bookingDate, courtTabsDiv, scheduleContainer;
let transactionsList, analyticsContent, dashboardTab;

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    // Get DOM elements
    loadingOverlay = document.getElementById('loadingOverlay');
    userInfoDiv = document.getElementById('userInfo');
    bookingDate = document.getElementById('bookingDate');
    courtTabsDiv = document.getElementById('courtTabs');
    scheduleContainer = document.getElementById('scheduleContainer');
    transactionsList = document.getElementById('transactionsList');
    analyticsContent = document.getElementById('analyticsContent');
    dashboardTab = document.getElementById('dashboardTab');
    
    // Load saved user
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }
    
    // Set date
    bookingDate.value = selectedDate;
    bookingDate.addEventListener('change', (e) => {
        selectedDate = e.target.value;
        loadSchedule();
    });
    
    // Render user info
    renderUserInfo();
    
    // Setup navigation
    setupNavigation();
    
    // Load data
    await loadSchedule();
    await loadTransactions();
    
    // Load dashboard if admin
    if (currentUser?.isAdmin) {
        dashboardTab.style.display = 'block';
        await loadDashboard();
    }
});

// Loading functions
function showLoading() {
    if (loadingOverlay) loadingOverlay.classList.add('active');
}

function hideLoading() {
    if (loadingOverlay) loadingOverlay.classList.remove('active');
}

// Toast notification
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// User functions
function renderUserInfo() {
    if (!userInfoDiv) return;
    
    if (currentUser) {
        userInfoDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <span><i class="fas fa-user"></i> ${currentUser.name}</span>
                <button class="btn" onclick="logout()">Logout</button>
            </div>
        `;
    } else {
        userInfoDiv.innerHTML = `
            <button class="btn btn-primary" onclick="showLoginModal()">Login / Register</button>
        `;
    }
}

async function login(email, password) {
    showLoading();
    try {
        const data = await api.login(email, password);
        currentUser = data.data.user;
        renderUserInfo();
        showToast('Login berhasil!');
        if (currentUser.isAdmin) {
            dashboardTab.style.display = 'block';
            await loadDashboard();
        }
        await loadSchedule();
        await loadTransactions();
        return true;
    } catch (error) {
        showToast(error.message, 'error');
        return false;
    } finally {
        hideLoading();
    }
}

function logout() {
    api.logout();
    currentUser = null;
    renderUserInfo();
    dashboardTab.style.display = 'none';
    showToast('Logout berhasil');
    location.reload();
}

function showLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3><i class="fas fa-sign-in-alt"></i> Login</h3>
            <input type="email" id="loginEmail" placeholder="Email" class="form-control" style="margin: 10px 0;">
            <input type="password" id="loginPassword" placeholder="Password" class="form-control" style="margin: 10px 0;">
            <button class="btn btn-primary" onclick="handleLogin()" style="margin-right: 10px;">Login</button>
            <button class="btn" onclick="showRegisterModal()">Register</button>
            <button class="btn" onclick="this.closest('.modal').remove()">Close</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function showRegisterModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3><i class="fas fa-user-plus"></i> Register</h3>
            <input type="text" id="regName" placeholder="Nama Lengkap" class="form-control" style="margin: 10px 0;">
            <input type="email" id="regEmail" placeholder="Email" class="form-control" style="margin: 10px 0;">
            <input type="tel" id="regPhone" placeholder="No. Telepon" class="form-control" style="margin: 10px 0;">
            <input type="password" id="regPassword" placeholder="Password (min 6 karakter)" class="form-control" style="margin: 10px 0;">
            <button class="btn btn-primary" onclick="handleRegister()" style="margin-right: 10px;">Register</button>
            <button class="btn" onclick="showLoginModal()">Back to Login</button>
            <button class="btn" onclick="this.closest('.modal').remove()">Close</button>
        </div>
    `;
    document.querySelector('.modal')?.remove();
    document.body.appendChild(modal);
}

async function handleLogin() {
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;
    if (!email || !password) {
        showToast('Email dan password wajib diisi', 'error');
        return;
    }
    const success = await login(email, password);
    if (success) {
        document.querySelector('.modal')?.remove();
    }
}

async function handleRegister() {
    const name = document.getElementById('regName')?.value;
    const email = document.getElementById('regEmail')?.value;
    const phone = document.getElementById('regPhone')?.value;
    const password = document.getElementById('regPassword')?.value;
    
    if (!name || !email || !phone || !password) {
        showToast('Semua field wajib diisi', 'error');
        return;
    }
    if (password.length < 6) {
        showToast('Password minimal 6 karakter', 'error');
        return;
    }
    
    showLoading();
    try {
        await api.register({ name, email, phone, password });
        showToast('Registrasi berhasil! Silakan login.');
        document.querySelector('.modal')?.remove();
        showLoginModal();
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Schedule functions
async function loadSchedule() {
    if (!scheduleContainer) return;
    
    showLoading();
    try {
        const courts = [1, 2, 3];
        scheduleContainer.innerHTML = '';
        courtTabsDiv.innerHTML = '';
        
        for (let i = 0; i < courts.length; i++) {
            const courtId = courts[i];
            const data = await api.getAvailableSlots(selectedDate, courtId);
            
            const scheduleDiv = document.createElement('div');
            scheduleDiv.className = 'schedule-grid';
            scheduleDiv.id = `court-${courtId}`;
            scheduleDiv.style.display = i === 0 ? 'grid' : 'none';
            
            if (data.data && data.data.slots) {
                data.data.slots.forEach(slot => {
                    const card = document.createElement('div');
                    card.className = `time-card ${slot.available ? 'available' : 'booked'}`;
                    card.innerHTML = `
                        <div class="time-val">${slot.time}</div>
                        <div class="time-status">${slot.available ? 'Tersedia' : 'Terisi'}</div>
                    `;
                    if (slot.available) {
                        card.onclick = () => showBookingModal(courtId, slot.time);
                    }
                    scheduleDiv.appendChild(card);
                });
            }
            
            scheduleContainer.appendChild(scheduleDiv);
            
            const tab = document.createElement('button');
            tab.className = i === 0 ? 'court-tab active' : 'court-tab';
            tab.innerHTML = `<i class="fas fa-table-tennis"></i> Lapangan ${courtId}`;
            tab.onclick = () => {
                document.querySelectorAll('[id^="court-"]').forEach(el => el.style.display = 'none');
                scheduleDiv.style.display = 'grid';
                document.querySelectorAll('.court-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            };
            courtTabsDiv.appendChild(tab);
        }
    } catch (error) {
        console.error(error);
        scheduleContainer.innerHTML = '<p style="text-align: center; color: red;">Gagal memuat jadwal</p>';
    } finally {
        hideLoading();
    }
}

function showBookingModal(courtId, startTime) {
    if (!currentUser) {
        showToast('Silakan login terlebih dahulu', 'error');
        showLoginModal();
        return;
    }
    
    currentBookingCourt = courtId;
    currentBookingTime = startTime;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3><i class="fas fa-calendar-check"></i> Booking Lapangan ${courtId}</h3>
            <p><strong>Tanggal:</strong> ${selectedDate}</p>
            <p><strong>Jam Mulai:</strong> ${startTime}</p>
            <hr style="margin: 15px 0;">
            <input type="text" id="customerName" placeholder="Nama Lengkap" value="${currentUser.name || ''}" class="form-control" style="margin: 10px 0;">
            <input type="tel" id="customerPhone" placeholder="No. Telepon" value="${currentUser.phone || ''}" class="form-control" style="margin: 10px 0;">
            <select id="duration" class="form-control" style="margin: 10px 0;">
                <option value="1">1 jam - Rp 50.000</option>
                <option value="2" selected>2 jam - Rp 100.000</option>
                <option value="3">3 jam - Rp 150.000</option>
                <option value="4">4 jam - Rp 200.000</option>
            </select>
            <div style="margin: 10px 0;">
                <label>
                    <input type="checkbox" id="isMember"> Member (Diskon Rp 10.000)
                </label>
            </div>
            <div class="price-preview" style="background: #f3f4f6; padding: 10px; border-radius: 10px; margin: 10px 0;">
                <p><strong>Total:</strong> Rp <span id="previewTotal">100.000</span></p>
            </div>
            <button class="btn btn-primary" onclick="confirmBooking()" style="width: 100%; margin-top: 10px;">
                <i class="fas fa-check-circle"></i> Konfirmasi Booking
            </button>
            <button class="btn" onclick="this.closest('.modal').remove()" style="width: 100%; margin-top: 10px;">Batal</button>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Update price preview
    const durationSelect = document.getElementById('duration');
    const memberCheckbox = document.getElementById('isMember');
    const previewTotal = document.getElementById('previewTotal');
    
    function updatePrice() {
        let duration = parseInt(durationSelect.value);
        let total = duration * 50000;
        if (memberCheckbox.checked) total -= 10000;
        previewTotal.textContent = total.toLocaleString('id-ID');
    }
    
    durationSelect.addEventListener('change', updatePrice);
    memberCheckbox.addEventListener('change', updatePrice);
}

async function confirmBooking() {
    const name = document.getElementById('customerName')?.value;
    const phone = document.getElementById('customerPhone')?.value;
    const duration = parseInt(document.getElementById('duration')?.value);
    const isMember = document.getElementById('isMember')?.checked;
    
    if (!name || !phone) {
        showToast('Nama dan nomor telepon wajib diisi', 'error');
        return;
    }
    
    const startHour = parseInt(currentBookingTime.split(':')[0]);
    const endHour = startHour + duration;
    const endTime = `${endHour.toString().padStart(2, '0')}:00`;
    
    showLoading();
    try {
        const result = await api.createBooking({
            courtId: currentBookingCourt,
            date: selectedDate,
            startTime: currentBookingTime,
            endTime: endTime,
            customerName: name,
            customerPhone: phone,
            isMember: isMember
        });
        
        document.querySelector('.modal')?.remove();
        
        // Show payment options
        if (result.data.transactionId) {
            showPaymentModal(result.data.transactionId, result.data.price.total, name);
        } else {
            showToast(`Booking berhasil! Total: Rp ${result.data.price.total.toLocaleString('id-ID')}`, 'success');
            await loadSchedule();
            await loadTransactions();
        }
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function showPaymentModal(transactionId, amount, customerName) {
    // Get customer email if exists
    const customerEmail = currentUser?.email || `${customerName}@user.com`;
    const customerPhone = currentUser?.phone || '';
    
    const paymentModal = new PaymentModal(transactionId, amount, customerName, customerEmail, customerPhone);
    await paymentModal.show();
}

// Transactions functions
async function loadTransactions() {
    if (!transactionsList) return;
    
    try {
        const result = await api.getTransactions();
        
        if (result.data && result.data.length > 0) {
            transactionsList.innerHTML = `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>User</th>
                                <th>Lapangan</th>
                                <th>Tanggal</th>
                                <th>Jam</th>
                                <th>Total</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${result.data.map(trx => `
                                <tr>
                                    <td>${trx.id?.substring(0, 8) || '-'}</td>
                                    <td>${trx.userName || '-'}</td>
                                    <td>Lapangan ${trx.court || '-'}</td>
                                    <td>${trx.dateStr || '-'}</td>
                                    <td>${trx.startVal || ''} - ${trx.endVal || ''}</td>
                                    <td>Rp ${parseInt(trx.totalVal || 0).toLocaleString('id-ID')}</td>
                                    <td>
                                        <span class="${trx.status === 'Lunas' ? 'badge-success' : trx.status === 'Pending' ? 'badge-warning' : 'badge-danger'}">
                                            ${trx.status || 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            transactionsList.innerHTML = '<p style="text-align: center; padding: 40px;">Belum ada transaksi</p>';
        }
    } catch (error) {
        console.error(error);
        transactionsList.innerHTML = '<p style="text-align: center; color: red;">Gagal memuat transaksi</p>';
    }
}

// Dashboard functions
async function loadDashboard() {
    if (!analyticsContent) return;
    
    try {
        const result = await api.getAnalytics();
        const totalRevenue = result.data.reduce((sum, item) => sum + parseFloat(item.total_revenue || 0), 0);
        const totalBookings = result.data.reduce((sum, item) => sum + (item.regular_bookings_count || 0) + (item.membership_bookings_count || 0), 0);
        
        analyticsContent.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
                    <div class="stat-info">
                        <h4>Total Revenue</h4>
                        <div class="stat-value">Rp ${totalRevenue.toLocaleString('id-ID')}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-calendar-check"></i></div>
                    <div class="stat-info">
                        <h4>Total Booking</h4>
                        <div class="stat-value">${totalBookings}</div>
                    </div>
                </div>
            </div>
            ${result.data.length > 0 ? `
                <div class="table-container" style="margin-top: 20px;">
                    <h4>Statistik Bulanan</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>Bulan</th>
                                <th>Revenue</th>
                                <th>Regular</th>
                                <th>Member</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${result.data.map(item => `
                                <tr>
                                    <td>${item.month_year}</td>
                                    <td>Rp ${parseFloat(item.total_revenue).toLocaleString('id-ID')}</td>
                                    <td>${item.regular_bookings_count}</td>
                                    <td>${item.membership_bookings_count}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}
        `;
    } catch (error) {
        console.error(error);
        analyticsContent.innerHTML = '<p style="text-align: center; color: red;">Gagal memuat dashboard</p>';
    }
}

// Navigation
function setupNavigation() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const section = tab.dataset.section;
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            const targetSection = document.getElementById(`${section}Section`);
            if (targetSection) targetSection.classList.add('active');
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            if (section === 'transactions') loadTransactions();
            if (section === 'dashboard') loadDashboard();
        });
    });
}

// Expose functions to global
window.login = login;
window.logout = logout;
window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.confirmBooking = confirmBooking;
window.showPaymentModal = showPaymentModal;