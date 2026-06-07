const API_BASE = '/api';

class API {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    
    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Terjadi kesalahan');
    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.data.token) {
      this.token = data.data.token;
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }
    return data;
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async getAvailableSlots(date, courtId) {
    return this.request(`/bookings/slots?date=${date}&courtId=${courtId}`);
  }

  async createBooking(bookingData) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });
  }

  async getTransactions() {
    return this.request('/transactions');
  }

  async getAnalytics() {
    return this.request('/analytics');
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

window.api = new API();