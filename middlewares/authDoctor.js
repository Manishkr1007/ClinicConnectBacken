import jwt from 'jsonwebtoken';


const authDoctor = async (req, res, next) => {
  // Support session-based (Passport) and JWT auth
  if (req.user && req.user.id) {
    // Session-based doctor (set by Passport)
    return next();
  }
  try {
    const dtoken = req.headers.dtoken || req.headers.authorization;
    if (!dtoken) {
      return res.json({ success: false, message: 'No token provided' });
    }
    // If using 'Bearer <token>' format
    const jwtToken = dtoken.startsWith('Bearer ') ? dtoken.slice(7) : dtoken;
    const token_decode = jwt.verify(jwtToken, process.env.JWT_SECRET);
    req.user = { id: token_decode.id };
    next();
  } catch (error) {
    console.error("❌ JWT verify error:", error);
    console.error("❌ Auth error:", error.message);
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

export default authDoctor;
