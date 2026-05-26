const router = require('express').Router();
const { login, me, updateProfile, forgotPassword, verifyOtp, resetPassword } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth');

router.post('/login',           login);
router.get('/me',               verifyToken, me);
router.put('/profile',          verifyToken, updateProfile);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp',      verifyOtp);
router.post('/reset-password',  resetPassword);

module.exports = router;
