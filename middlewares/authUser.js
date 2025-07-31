import jwt from 'jsonwebtoken';


// const authUser = async (req, res, next) => {
//   try {
//     const { token } = req.headers;
//     if (!token) {
//       return res.json({ success: false, message: 'Not authorised login' });
//     }

//     const token_decoded = jwt.verify(token, process.env.JWT_SECRET);
//      req.body.userId = token_decoded.id;
//      next();
     
//   } catch (error) {
//     console.error("❌ Auth error:", error.message);
//     res.status(401).json({ success: false, message: 'Unauthorized' });
//   }
// };


const authUser = (req, res, next) => {
  try {
    const token = req.headers.token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // 👈 store user ID here
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};


export default authUser;

