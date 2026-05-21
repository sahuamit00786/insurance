const router = require('express').Router();
const ctrl   = require('../controllers/lookup.controller');
const { verifyToken }     = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

router.use(verifyToken);
router.get('/categories',     ctrl.listCategories);
router.post('/categories',    checkPermission('lookup','edit'), ctrl.createCategory);
router.get('/items',          ctrl.listAllValues);
router.get('/:slug/values',   ctrl.listValues);
router.post('/:slug/values',  checkPermission('lookup','edit'),   ctrl.createValueBySlug);
router.post('/values',        checkPermission('lookup','edit'),   ctrl.createValue);
router.put('/values/:id',     checkPermission('lookup','update'), ctrl.updateValue);
router.delete('/values/:id',  checkPermission('lookup','delete'), ctrl.deleteValue);

module.exports = router;
