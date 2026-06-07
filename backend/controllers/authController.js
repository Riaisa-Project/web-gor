const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { AppError } = require('../middleware/errorMiddleware');

const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new AppError('Email sudah terdaftar', 400);
    }
    
    const user = await User.create({ name, email, phone, password });
    const token = generateToken(user.id, user.is_admin ? 'admin' : 'user');
    
    res.status(201).json({
      success: true,
      data: { 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isAdmin: user.is_admin
        },
        token 
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findByEmail(email);
    if (!user) {
      throw new AppError('Email atau password salah', 401);
    }
    
    const isValid = await User.verifyPassword(password, user.password);
    if (!isValid) {
      throw new AppError('Email atau password salah', 401);
    }
    
    const token = generateToken(user.id, user.is_admin ? 'admin' : 'user');
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isAdmin: user.is_admin
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      throw new AppError('User tidak ditemukan', 404);
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getProfile };