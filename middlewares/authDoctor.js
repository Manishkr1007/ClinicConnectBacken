import jwt from 'jsonwebtoken';

const authDoctor = async (req, res, next) => {
  try {
     
    const  dtoken  = req.headers.dtoken;  // same pattern as admin with atoken

    if (!dtoken) {
      return res.json({ success: false, message: 'No token provided' });
    }

    const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET); 

       req.user = { id: token_decode.id };  // Assign user object here

    next();
  } catch (error) {
     console.error("❌ JWT verify error:", error);
    console.error("❌ Auth error:", error.message);
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};  

export default authDoctor;
