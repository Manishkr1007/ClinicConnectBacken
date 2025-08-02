import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import adminRouter from './routes/adminRoute.js';
import doctorRouter from './routes/doctorRoute.js';
import userRouter from './routes/userRoute.js';


// app config

const app = express();
const PORT = process.env.PORT || 4001;  
connectDB();
connectCloudinary();

// middleware

const allowedOrigins = [
  'https://clinic-connect-admin-eosin.vercel.app',
  'https://clinic-connect-frontend-b5fu3tcoo-manishkrs-projects.vercel.app',
  'http://localhost:5173', // Backend API
  'http://localhost:5174', // React app
];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'token', 'atoken', 'dtoken']
  // credentials: true
}));


app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded


app.use((req, res, next) => {
  console.log('🧪 Incoming body:', req.body);
  next();
});

// Api end points
app.use('/api/admin',adminRouter)
app.use('/api/doctor', doctorRouter)
app.use('/api/user',userRouter)



app.get('/', (req, res) => {
  res.send('Hello World api is running');
});



// start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

