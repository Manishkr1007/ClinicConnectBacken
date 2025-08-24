import express from 'express';
import { loginUser, registerUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, paymentRazorpay, varifyPayment, getOtp, verifyOtp } from '../controllers/useController.js';
import authUser from '../middlewares/authUser.js';
import upload from '../middlewares/multer.js';


const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.get('/get-profile', authUser,getProfile);
userRouter.post('/update-profile',upload.single('image'), authUser, updateProfile);
userRouter.post('/book-appointment', authUser,bookAppointment);
userRouter.get('/appointments', authUser, listAppointment);
userRouter.post('/cancel-appointment', authUser, cancelAppointment);
userRouter.post('/payment-razorpay', authUser, paymentRazorpay);

// Returns the currently authenticated user (for session-based auth)
userRouter.get('/me', (req, res) => {
	if (req.user) {
		res.json({ user: req.user });
	} else {
		res.status(401).json({ user: null, message: 'Not authenticated' });
	}
});

userRouter.post('/varify-payment', authUser, varifyPayment);
userRouter.post('/get-otp', getOtp);
userRouter.post("/verify-otp", verifyOtp);

export default userRouter;