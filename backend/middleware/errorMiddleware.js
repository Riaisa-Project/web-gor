const errorMiddleware = (err, req, res, next) => {
  console.error(err.stack);

  const status = err.status || 500;
  const message = err.message || 'Terjadi kesalahan pada server';

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
    this.name = 'AppError';
  }
}

module.exports = { errorMiddleware, AppError };