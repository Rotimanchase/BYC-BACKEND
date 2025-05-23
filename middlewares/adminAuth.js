import jwt from 'jsonwebtoken';
import config from 'config';

function adminAuth(req, res, next) {
  const token = req.header('x-auth-token') || req.header('X-Auth-Token');
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided' });
  }
  try {
    const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

export default adminAuth;