const router = require('express').Router();
const ctrl   = require('../controllers/staff.controller');
const { verifyToken }     = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

router.use(verifyToken);
router.get('/',    checkPermission('staff','view'),   ctrl.list);
router.post('/',   checkPermission('staff','edit'),   ctrl.create);
router.get('/:id', checkPermission('staff','view'),   ctrl.getOne);
router.put('/:id', checkPermission('staff','update'), ctrl.update);
router.delete('/:id', checkPermission('staff','delete'), ctrl.remove);
router.get('/:id/permissions',  checkPermission('staff','view'),   ctrl.getPermissions);
router.put('/:id/permissions',  checkPermission('staff','update'), ctrl.updatePermissions);

module.exports = router;
