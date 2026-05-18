const router = require('express').Router();
const ctrl   = require('../controllers/reports.controller');
const { verifyToken }     = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

router.use(verifyToken);
router.get('/generate', checkPermission('reports','view'), ctrl.generate);

module.exports = router;
