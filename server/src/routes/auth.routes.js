const router = require('express').Router();
const { login, me, updateProfile } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', verifyToken, me);
router.put('/profile', verifyToken, updateProfile);

module.exports = router;
