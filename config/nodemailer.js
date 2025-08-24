import nodemailer from 'nodemailer';


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Should be noreply@yourdomain.com or your noreply Gmail
    pass: process.env.EMAIL_PASS,
  },
});


export default transporter;
