class PaymentModal {
  constructor(transactionId, amount, customerName, customerEmail, customerPhone) {
    this.transactionId = transactionId;
    this.amount = amount;
    this.customerName = customerName;
    this.customerEmail = customerEmail;
    this.customerPhone = customerPhone;
  }

  async show() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3 style="margin-bottom: 20px;">Pilih Metode Pembayaran</h3>
        <div class="payment-methods">
          <div class="payment-option" data-method="qris">
            <div>
              <i class="fas fa-qrcode"></i>
              <span>QRIS</span>
            </div>
            <i class="fas fa-chevron-right"></i>
          </div>
          <div class="payment-option" data-method="transfer">
            <div>
              <i class="fas fa-university"></i>
              <span>Transfer Bank</span>
            </div>
            <i class="fas fa-chevron-right"></i>
          </div>
        </div>
        <button class="btn" onclick="this.closest('.modal').remove()" style="margin-top: 20px; width: 100%;">Batal</button>
      </div>
    `;
    document.body.appendChild(modal);
    
    modal.querySelectorAll('.payment-option').forEach(opt => {
      opt.addEventListener('click', async () => {
        const method = opt.dataset.method;
        modal.remove();
        if (method === 'qris') await this.showQRIS();
        else await this.showBankTransfer();
      });
    });
  }
  
  async showQRIS() {
    const modal = this.createModal('Mengenerate QRIS...');
    try {
      const response = await fetch('/api/payments/qris/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: this.amount,
          transactionId: this.transactionId,
          customerName: this.customerName
        })
      });
      const result = await response.json();
      if (result.success) {
        modal.querySelector('.modal-content').innerHTML = `
          <div style="text-align: center;">
            <h3>Scan QRIS untuk Membayar</h3>
            <img src="${result.data.qrCode}" style="width: 250px; margin: 20px auto;">
            <p style="font-size: 18px; font-weight: bold;">Total: Rp ${this.amount.toLocaleString('id-ID')}</p>
            <p style="color: #f59e0b;">QR Code berlaku 30 menit</p>
            <button class="btn btn-primary" onclick="window.checkPaymentStatus('${this.transactionId}')">Cek Status</button>
            <button class="btn" onclick="this.closest('.modal').remove()">Tutup</button>
          </div>
        `;
      }
    } catch (error) {
      modal.querySelector('.modal-content').innerHTML = `<p style="color: red;">Error: ${error.message}</p><button onclick="this.closest('.modal').remove()">Tutup</button>`;
    }
  }
  
  async showBankTransfer() {
    const response = await fetch('/api/payments/bank-accounts');
    const banks = await response.json();
    const modal = this.createModal('');
    modal.querySelector('.modal-content').innerHTML = `
      <h3>Transfer ke Rekening</h3>
      ${banks.data.map(bank => `
        <div class="bank-account">
          <div><strong>${bank.bank_name}</strong><br>${bank.account_number}<br><small>a.n ${bank.account_name}</small></div>
          <button class="btn" onclick="navigator.clipboard.writeText('${bank.account_number}')">Copy</button>
        </div>
      `).join('')}
      <div style="margin-top: 20px;">
        <label>Upload Bukti Transfer</label>
        <input type="file" id="proofImage" accept="image/*" style="margin: 10px 0; width: 100%;">
        <select id="bankSelect" style="width: 100%; padding: 10px;">
          <option value="">Pilih Bank</option>
          ${banks.data.map(bank => `<option value="${bank.bank_name}">${bank.bank_name}</option>`).join('')}
        </select>
        <button class="btn btn-primary" id="submitProof" style="margin-top: 10px; width: 100%;">Konfirmasi</button>
      </div>
      <button class="btn" onclick="this.closest('.modal').remove()" style="margin-top: 15px; width: 100%;">Tutup</button>
    `;
    document.getElementById('submitProof')?.addEventListener('click', async () => {
      const file = document.getElementById('proofImage').files[0];
      const bank = document.getElementById('bankSelect').value;
      if (!file || !bank) return alert('Pilih bank dan upload bukti');
      const reader = new FileReader();
      reader.onload = async (e) => {
        await fetch('/api/payments/upload-proof', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ transactionId: this.transactionId, bankAccount: bank, proofImage: e.target.result })
        });
        alert('Bukti terupload, menunggu konfirmasi admin');
        modal.remove();
      };
      reader.readAsDataURL(file);
    });
  }
  
  createModal(content) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `<div class="modal-content">${content}</div>`;
    document.body.appendChild(modal);
    return modal;
  }
}

window.checkPaymentStatus = async (transactionId) => {
  const interval = setInterval(async () => {
    const res = await fetch(`/api/payments/check-status/${transactionId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const result = await res.json();
    if (result.data?.status === 'Lunas') {
      clearInterval(interval);
      alert('Pembayaran berhasil!');
      location.reload();
    }
  }, 3000);
};

window.PaymentModal = PaymentModal;