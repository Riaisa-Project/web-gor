const { body, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  };
};

const bookingValidation = [
  body('courtId').isInt({ min: 1, max: 3 }).withMessage('Lapangan tidak valid'),
  body('date').isDate().withMessage('Tanggal tidak valid'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Format jam mulai salah'),
  body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Format jam selesai salah'),
  body('customerName').notEmpty().withMessage('Nama customer wajib diisi'),
  body('customerPhone').matches(/^[0-9]{10,13}$/).withMessage('Nomor telepon tidak valid'),
];

const userValidation = [
  body('name').notEmpty().withMessage('Nama wajib diisi'),
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('phone').matches(/^[0-9]{10,13}$/).withMessage('Nomor telepon tidak valid'),
];

module.exports = { validate, bookingValidation, userValidation };