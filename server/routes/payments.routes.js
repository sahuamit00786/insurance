const router = require('express').Router();
const ctrl   = require('../controllers/payments.controller');
const { verifyToken }     = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

router.use(verifyToken);
router.put('/:payId',    checkPermission('clients','update'), ctrl.update);
router.delete('/:payId', checkPermission('clients','delete'), ctrl.remove);

module.exports = router;
