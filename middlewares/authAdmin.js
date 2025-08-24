import jwt from 'jsonwebtoken';



const authAdmin = async (req, res, next) => {
  // Support session-based (Passport) and JWT auth
  if (req.user && req.user.email === process.env.ADMIN_EMAIL) {
    // Session-based admin (set by Passport)
    return next();
  }
  try {
    const atoken = req.headers.atoken || req.headers.authorization;
    if (!atoken) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    // If using 'Bearer <token>' format
    const jwtToken = atoken.startsWith('Bearer ') ? atoken.slice(7) : atoken;
    const token_decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
    if (token_decoded.email !== process.env.ADMIN_EMAIL) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    req.user = { email: token_decoded.email };
    next();
  } catch (error) {
    console.error("❌ Auth error:", error.message);
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

export default authAdmin;

