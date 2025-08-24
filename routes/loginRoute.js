// Simple login page for failed Google auth (for demo)
import express from 'express';
const router = express.Router();

router.get('/login', (req, res) => {
  res.send('<h2>Login failed. <a href="/auth/google">Try Google Login</a></h2>');
});

export default router;
