import jwt from 'jsonwebtoken';






const authUser = (req, res, next) => {
  // Support session-based (Passport) and JWT auth
  if (req.user) {
    // Session-based user (set by Passport)
    return next();
  }
  // JWT fallback
  try {
    const token = req.headers.token || req.headers.authorization;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    // If using 'Bearer <token>' format
    const jwtToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};


export default authUser;

