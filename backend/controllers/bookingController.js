const Booking = require('../models/Booking');
const User = require('../models/User');
const { AppError } = require('../middleware/errorMiddleware');
const db = require('../config/database');

const generateTimeSlots = () => {
  const slots = [];
  for (let i = 7; i <= 23; i++) {
    slots.push(`${i.toString().padStart(2, '0')}:00`);
  }
  return slots;
};

const getAvailableSlots = async (req, res, next) => {
  try {
    const { date, courtId } = req.query;
    
    if (!date || !courtId) {
      throw new AppError('Tanggal dan lapangan wajib diisi', 400);
    }
    
    const bookings = await Booking.findByDateAndCourt(date, parseInt(courtId));
    
    // Get court price
    const courtResult = await db.query('SELECT * FROM courts WHERE id = $1', [courtId]);
    const court = courtResult.rows[0];
    
    const slots = generateTimeSlots();
    const availableSlots = slots.map(slot => {
      const slotHour = parseInt(slot.split(':')[0]);
      const isBooked = bookings.some(booking => {
        const startHour = parseInt(booking.start_time.split(':')[0]);
        const endHour = parseInt(booking.end_time.split(':')[0]);
        return slotHour >= startHour && slotHour < endHour;
      });
      return {
        time: slot,
        available: !isBooked,
        bookedBy: isBooked ? bookings.find(b => {
          const startHour = parseInt(b.start_time.split(':')[0]);
          const endHour = parseInt(b.end_time.split(':')[0]);
          return slotHour >= startHour && slotHour < endHour;
        })?.user_name : null
      };
    });
    
    res.json({
      success: true,
      data: {
        court,
        date,
        slots: availableSlots
      }
    });
  } catch (error) {
    next(error);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const { courtId, date, startTime, endTime, customerName, customerPhone, isMember } = req.body;
    
    // Validate time range
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    const duration = endHour - startHour;
    
    if (duration <= 0) {
      throw new AppError('Jam selesai harus lebih besar dari jam mulai', 400);
    }
    
    if (duration > 4) {
      throw new AppError('Maksimal booking 4 jam', 400);
    }
    
    // Check for double booking
    const existingBookings = await Booking.findByDateAndCourt(date, courtId);
    const isDoubleBooking = existingBookings.some(booking => {
      const bookingStart = parseInt(booking.start_time.split(':')[0]);
      const bookingEnd = parseInt(booking.end_time.split(':')[0]);
      return (startHour < bookingEnd && endHour > bookingStart);
    });
    
    if (isDoubleBooking) {
      throw new AppError('Waktu yang dipilih sudah dibooking', 409);
    }
    
    // Create or get user
    let user = await User.findByPhone(customerPhone);
    if (!user) {
      user = await User.create({
        name: customerName,
        phone: customerPhone,
        email: `${Date.now()}@temp.com`,
        password: 'temporary123'
      });
    }
    
    // Get court price
    const courtResult = await db.query('SELECT * FROM courts WHERE id = $1', [courtId]);
    const court = courtResult.rows[0];
    
    // Calculate price
    const subtotal = duration * court.price_per_hour;
    const discount = isMember ? subtotal * 0.05 : 0;
    const total = subtotal - discount;
    
    // Create booking
    const booking = await Booking.create({
      userId: user.id,
      courtId,
      bookingDate: date,
      startTime,
      endTime,
      type: isMember ? 'Membership' : 'Regular',
      status: 'Pending'
    });
    
    // Create transaction
    const transactionId = `TRX${Date.now()}${Math.floor(Math.random() * 1000)}`;
    await db.query(
      `INSERT INTO transactions (id, booking_id, total_price, status, payment_method) 
       VALUES ($1, $2, $3, $4, $5)`,
      [transactionId, booking.id, total, 'Pending', null]
    );
    
    res.status(201).json({
      success: true,
      data: {
        booking,
        transactionId,
        price: {
          subtotal,
          discount,
          total
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getUserBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.getUserBookings(req.userId);
    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAvailableSlots, createBooking, getUserBookings };