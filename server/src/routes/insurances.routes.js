const router = require('express').Router();
const ctrl   = require('../controllers/insurances.controller');
const { verifyToken }     = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

router.use(verifyToken);
router.get('/',          checkPermission('clients','view'), ctrl.listAll);
router.put('/:insId',    checkPermission('clients','update'), ctrl.update);
router.delete('/:insId', checkPermission('clients','delete'), ctrl.remove);

module.exports = router;
