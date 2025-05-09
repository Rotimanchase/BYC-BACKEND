import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: 'Access denied. No token provided' });
  }

  // Extract token - handle both "Bearer token" and just "token" formats
  let token;
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    token = authHeader;
  }
  

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    console.error('JWT_SECRET is not defined');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    
    req.user = decoded;
    req.userId = decoded._id || decoded.id;
    
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

export default auth;