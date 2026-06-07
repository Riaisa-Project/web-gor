const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Silakan login terlebih dahulu' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token tidak valid' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak. Admin only.' });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };