const router = require('express').Router();
const ctrl   = require('../controllers/templates.controller');
const { verifyToken }     = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

router.use(verifyToken);
router.get('/',           checkPermission('templates','view'),   ctrl.list);
router.post('/',          checkPermission('templates','edit'),   ctrl.create);
router.get('/:id',        checkPermission('templates','view'),   ctrl.getOne);
router.put('/:id',        checkPermission('templates','update'), ctrl.update);
router.delete('/:id',     checkPermission('templates','delete'), ctrl.remove);
router.post('/:id/preview', ctrl.preview);

module.exports = router;
