// In-memory OTP store (for demo/testing only)
const otpStore = {}; // { "email_or_mobile": { otp: "123456", expires: Date } }

import transporter from '../config/nodemailer.js';
import OtpModel from '../models/otpModel.js';
// Generate a random 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Real function to send OTP via email using nodemailer
async function sendOtpEmail(email, otp) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for ClinicConnect Signup',
      text: `Your OTP for signup is: ${otp}`,
      html: `<p>Your OTP for signup is: <b>${otp}</b></p>`
    });
    console.log('OTP email sent:', info.messageId);
    return true;
  } catch (err) {
    console.error('Error sending OTP email:', err);
    return false;
  }
}

import twilio from 'twilio';
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE;
const twilioClient = twilio(accountSid, authToken);
// Real function to send OTP via SMS using Twilio
async function sendOtpSms(mobile, otp) {
  try {
    await twilioClient.messages.create({
      body: `Your OTP is: ${otp}`,
      from: twilioPhone,
      to: mobile.startsWith('+') ? mobile : `+91${mobile}` // add country code if needed
    });
    console.log('OTP SMS sent to', mobile);
    return true;
  } catch (err) {
    console.error('Error sending OTP SMS:', err);
    return false;
  }
}

// Controller to get OTP for signup (email or mobile)
const getOtp = async (req, res) => {
  try {
    const { email, mobile } = req.body;
    if (!email && !mobile) {
      return res.status(400).json({ success: false, message: 'Email or mobile is required' });
    }
    const otp = generateOtp();
    if (email) {
      await sendOtpEmail(email, otp);
      await OtpModel.findOneAndUpdate(
        { identifier: email },
        { otp, expires: new Date(Date.now() + 5 * 60 * 1000), createdAt: new Date() },
        { upsert: true, new: true }
      );
    }
    if (mobile) {
      await sendOtpSms(mobile, otp);
      await OtpModel.findOneAndUpdate(
        { identifier: mobile },
        { otp, expires: new Date(Date.now() + 5 * 60 * 1000), createdAt: new Date() },
        { upsert: true, new: true }
      );
    }
    res.json({ success: true, message: 'OTP sent', otp }); // Remove otp from response in production
  } catch (error) {
    console.error('Error in getOtp:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Controller to verify OTP using MongoDB
const verifyOtp = async (req, res) => {
  const { email, mobile, otp } = req.body;
  const identifier = email || mobile;
  const record = await OtpModel.findOne({ identifier });
  if (!record) {
    return res.status(400).json({ success: false, message: 'No OTP requested.' });
  }
  if (record.otp !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid OTP.' });
  }
  if (new Date() > record.expires) {
    return res.status(400).json({ success: false, message: 'OTP expired.' });
  }
  await OtpModel.deleteOne({ identifier }); // Remove OTP after successful verification
  return res.json({ success: true, message: 'OTP verified.' });
};
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import userModel from "../models/userModel.js"; // Make sure this path is correct
import doctorModel from "../models/doctorModel.js"; // Make sure this path is correct
import appointmentModel from "../models/appointmentModel.js";
import razorpay from "razorpay";

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 3) {
      return res
        .status(400)
        .json({ message: "Password must be at least 3 characters long" });
    }

    // hashing user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
    };

    const newUser = new userModel(userData);
    const user = await newUser.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ success: true, token });
  } catch (error) {
    console.error("Error in registerUser:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// API FOR user Login

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      res.json({ success: false, message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error in loginUser:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// API to get user profile data

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const userData = await userModel.findById(userId).select("-password");
    res.json({ success: true, user: userData });
  } catch (error) {
    console.error("Error in getProfile:", error);
    return res.json({ message: "Internal server error" });
  }
};

// API TO Update user profile data

const updateProfile = async (req, res) => {
  try {
    // const {userId, name, phone,address,dob,gender } = req.user.id;

    const userId = req.user.id;
    const { name, phone, address, dob, gender, email } = req.body;
    const imageFile = req.file;

    console.log("Received file:", imageFile);

    if (!name || !phone || !dob || !gender) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address,
      dob,
      gender,
      email,
    });

    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      const imageURL = imageUpload.secure_url;
      await userModel.findByIdAndUpdate(userId, { image: imageURL });
    }

    res.json({ success: true, message: "profile updated successfully" });
  } catch (error) {
    return res.json({ message: "Internal server error" });
  }
};

const bookAppointment = async (req, res) => {
  try {
    const { docId, slotDate, slotTime } = req.body;
    const userId = req.user.id;

    const docData = await doctorModel.findById(docId).select("-password");
    if (!docData) {
      return res.json({ success: false, message: "Doctor not found" });
    }

    let slots_booked = docData.slots_booked || {};

    // Check and update the booked slots
    if (!slots_booked[slotDate]) {
      slots_booked[slotDate] = [];
    } else if (slots_booked[slotDate].includes(slotTime)) {
      return res.json({ success: false, message: "Slot already booked" });
    }

    // Book the slot
    slots_booked[slotDate].push(slotTime);

    // Get user data
    const userData = await userModel.findById(userId).select("-password");
    delete docData.slots_booked;

    // Create appointment
    const appointmentData = {
      userId,
      docId,
      userData,
      docData,
      slotTime,
      slotDate,
      amount: docData.fees,
      date: Date.now(),
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    // Save updated slots in doctor
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    return res.json({
      success: true,
      message: "Appointment booked successfully",
    });
  } catch (error) {
    console.error("Error in bookAppointment:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// API FOR MY AppointmentData for user
const listAppointment = async (req, res) => {
  try {
    const userId = req.user.id;

    const appointments = await appointmentModel.find({ userId });
    res.json({ success: true, appointments });
  } catch (error) {
    console.error("Error in listAppointment:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// API TO CANCEL APPOINTMENT

const cancelAppointment = async (req, res) => {
  console.log('--- cancelAppointment ---');
  console.log('Headers:', req.headers);
  console.log('User:', req.user);
  console.log('Session:', req.session);
  try {
    const { appointmentId } = req.body;
    const userId = req.user.id;

    // Find the appointment
    const appointmentData = await appointmentModel.findById(appointmentId);

    // varify appointment user
    if (appointmentData.userId !== userId) {
      return res.json({
        success: false,
        message: "You are not authorized to cancel this appointment",
      });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });

    //  releasing doctor slots

    const { docId, slotDate, slotTime } = appointmentData;
    const doctorData = await doctorModel.findById(docId);
    let slots_booked = doctorData.slots_booked;
    slots_booked[slotDate] = slots_booked[slotDate].filter(
      (e) => e !== slotTime
    );

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    return res.json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    console.error("Error in cancelAppointment:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Api to make online payment using razorpay

const paymentRazorpay = async (req, res) => {
  console.log('--- paymentRazorpay ---');
  console.log('Headers:', req.headers);
  console.log('User:', req.user);
  console.log('Session:', req.session);
  // creation of an order
  try {
    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData || appointmentData.cancelled) {
      return res.json({ success: false, message: "Invalid appointment" });
    }

    // creating options for razorpay payment

    const options = {
      amount: appointmentData.amount * 100, // Amount in paise
      currency: process.env.CURRENCY,
      receipt: appointmentId,
    };
    const order = await razorpayInstance.orders.create(options);
    if (!order) {
      return res
        .status(500)
        .json({ success: false, message: "Error creating order" });
    }
    res.json({ success: true, order });
  } catch (error) {
    console.error("Error in paymentRazorpay:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// API to verify payment of razorpay

const varifyPayment = async (req, res) => {
  console.log('--- varifyPayment ---');
  console.log('Headers:', req.headers);
  console.log('User:', req.user);
  console.log('Session:', req.session);
  try {
    const { razorpay_order_id } = req.body;
    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

    if (orderInfo.status == "paid") {
      await appointmentModel.findByIdAndUpdate(orderInfo.receipt, {
        payment: true,
      });
      return res.json({ success: true, message: "Payment successful" });
    } else {
      return res.json({ success: false, message: "Payment failed" });
    }
  } catch (error) {
    console.error("Error in varifyPayment:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  paymentRazorpay,
  varifyPayment,
  getOtp,
  verifyOtp,
};
