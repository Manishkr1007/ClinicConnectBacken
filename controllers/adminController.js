import validator from "validator";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import userModel from '../models/userModel.js'
import "dotenv/config";
import jwt from "jsonwebtoken";

const addDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
    } = req.body;
    const imageFile = req.file;

    console.log("🟢 Incoming request with:", req.body, req.file);

    if (
      !name ||
      !email ||
      !password ||
      !speciality ||
      !degree ||
      !experience ||
      !about ||
      !fees ||
      !address ||
      !imageFile
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 3) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      folder: "doctors",
      resource_type: "image",
    });

  

    const doctorData = {
      name,
      email,
      image: imageUpload.secure_url,
      password: hashedPassword,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
      date: Date.now(),
    };

    const newDoctor = new doctorModel(doctorData);
    await newDoctor.save();

    console.log("✅ Doctor saved to DB");
    res
      .status(201)
      .json({ success: "true", message: "Doctor added successfully" });
  } catch (error) {
    console.error("❌ Final Catch Error:", error.message);
    res
      .status(500)
      .json({
        success: "false",
        message: "Failed to save doctor",
        error: error.message,
      });
  }
};

const loginAdmin = async (req, res) => {
  
  try {
  

    if (!req.body) {
      return res
        .status(400)
        .json({ success: false, message: "Request body missing" });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      return res.json({ success: true, token });
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("❌ Login Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Login failed", error: error.message });
  }
};

// const loginAdmin = async (req,res) => {
//   try {

//     console.log("🧪 Raw body:", req.body); // ✅ Add this
// if (!req.body) {
//   return res.status(400).json({ success: false, message: "Request body missing" });
// }
//     const { email,password } = req.body // 🔥 This will crash if body is undefined

//     console.log("🟢 Login attempt with:", email, password);

//     if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
//       const token = jwt.sign(email+password,process.env.JWT_SECRET);
//       res.json({ success:true,token });
//     } else {
//        res.json({ success: 'false', message: 'Invalid email or password' });
//     }

//   } catch (error) {
//     console.error("❌ Login Error:", error.message);
//     return res.status(500).json({ success: 'false', message: 'Login failed', error: error.message });
//   }
// };

// Api to get all doctors list for admin panel

const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select("-password");
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Api to get all appointments for admin panel

const appointmentsAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({});
    res.json({ success: true, appointments });
  } catch (error) {
    console.error("❌ Error fetching appointments:", error.message);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch appointments",
        error: error.message,
      });
  }
};

//Api for appointment Cancellation

const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    // Find the appointment
    const appointmentData = await appointmentModel.findById(appointmentId);

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


// Api to get Dashboard data for Admin Panel


const adminDashboard = async (req,res) => {

  try {

    const doctors = await doctorModel.find({})
    const users = await userModel.find({})
    const appointments = await appointmentModel.find({})

    const dashData = {
      doctors : doctors.length,
      appointments : appointments.length,
      patients : users.length,
      latestAppointments : appointments.reverse().slice(0,5)
    }
    res.json({success:true,dashData})

  }

  catch (error){

  }
}





export {
  allDoctors,
  addDoctor,
  loginAdmin,
  appointmentsAdmin,
  appointmentCancel,
  adminDashboard
};
