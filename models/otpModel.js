import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  identifier: { type: String, required: true }, // email or mobile
  otp: { type: String, required: true },
  expires: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // auto-remove after 10 min
});

const OtpModel = mongoose.models.Otp || mongoose.model('Otp', otpSchema);

export default OtpModel;
