import jwt from 'jsonwebtoken';


const authAdmin = async (req, res, next) => {
  try {
    const { atoken } = req.headers;
    if (!atoken) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token_decoded = jwt.verify(atoken, process.env.JWT_SECRET);

    // 🔥 Now check decoded.email instead of comparing full string
    if (token_decoded.email !== process.env.ADMIN_EMAIL) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    next();
  } catch (error) {
    console.error("❌ Auth error:", error.message);
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

export default authAdmin;

