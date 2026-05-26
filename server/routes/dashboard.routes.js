const router = require('express').Router();
const { getStats, getUpcomingBirthdays, getExpiry, getMaturity } = require('../controllers/dashboard.controller');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);
router.get('/stats',          getStats);
router.get('/upcoming-birthdays', getUpcomingBirthdays);
router.get('/expiry',         getExpiry);
router.get('/maturity',       getMaturity);

module.exports = router;
