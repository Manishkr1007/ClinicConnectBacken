import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import session from 'express-session';
import passport from 'passport';
import './config/passport.js';
import { Router } from 'express';
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import adminRouter from './routes/adminRoute.js';
import doctorRouter from './routes/doctorRoute.js';
import userRouter from './routes/userRoute.js';
import loginRouter from './routes/loginRoute.js';


// app config

const app = express();
const PORT = process.env.PORT || 4001;  
connectDB();
connectCloudinary();

// middleware

const allowedOrigins = [
  'https://clinic-connect-admin-eosin.vercel.app',
  'https://clinic-connect-frontend-seven.vercel.app',
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

// Session and Passport middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'clinicconnectsecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Google Auth router
const googleAuthRouter = Router();

// Initiate Google OAuth
googleAuthRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Handle Google OAuth callback
googleAuthRouter.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: true }),
  (req, res) => {
    // Redirect to frontend with auth=google after successful login
    res.redirect(process.env.FRONTEND_URL);
  }
);

app.use('/api/auth', googleAuthRouter);


app.use((req, res, next) => {
  console.log('🧪 Incoming body:', req.body);
  next();
});

// Api end points

app.use('/api/admin',adminRouter)
app.use('/api/doctor', doctorRouter)
app.use('/api/user',userRouter)
app.use('/', loginRouter);



app.get('/', (req, res) => {
  res.send('Hello World api is running');
});



// start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

