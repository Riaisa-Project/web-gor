const generateTransactionId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `TRX${timestamp}${random}`;
};

const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const generateTimeSlots = () => {
  const slots = [];
  for (let i = 7; i <= 23; i++) {
    slots.push(`${i.toString().padStart(2, '0')}:00`);
  }
  return slots;
};

const calculateDuration = (startTime, endTime) => {
  const startHour = parseInt(startTime.split(':')[0]);
  const endHour = parseInt(endTime.split(':')[0]);
  return endHour - startHour;
};

const validateBookingTime = (startTime, endTime) => {
  const duration = calculateDuration(startTime, endTime);
  if (duration <= 0) return { valid: false, message: 'Jam selesai harus lebih besar dari jam mulai' };
  if (duration > 4) return { valid: false, message: 'Maksimal booking 4 jam' };
  return { valid: true };
};

module.exports = {
  generateTransactionId,
  formatRupiah,
  generateTimeSlots,
  calculateDuration,
  validateBookingTime
};