const router = require('express').Router();
const ctrl      = require('../controllers/clients.controller');
const docCtrl   = require('../controllers/documents.controller');
const payCtrl   = require('../controllers/payments.controller');
const insCtrl   = require('../controllers/insurances.controller');
const noteCtrl  = require('../controllers/notes.controller');
const { verifyToken }      = require('../middleware/auth');
const { checkPermission }  = require('../middleware/permission');
const { upload }           = require('../middleware/upload');

router.use(verifyToken);

router.get('/',    checkPermission('clients','view'),   ctrl.list);
router.post('/',   checkPermission('clients','edit'),   ctrl.create);
router.get('/:id', checkPermission('clients','view'),   ctrl.getOne);
router.put('/:id', checkPermission('clients','update'), ctrl.update);
router.delete('/:id', checkPermission('clients','delete'), ctrl.remove);

// Documents
router.get('/:clientId/documents',  checkPermission('clients','view'), docCtrl.list);
router.post('/:clientId/documents', checkPermission('clients','edit'), upload.single('file'), docCtrl.upload);

// Payments
router.get('/:clientId/payments',  checkPermission('clients','view'), payCtrl.list);
router.post('/:clientId/payments', checkPermission('clients','edit'), payCtrl.create);

// Insurances
router.get('/:clientId/insurances',  checkPermission('clients','view'), insCtrl.list);
router.post('/:clientId/insurances', checkPermission('clients','edit'), insCtrl.create);

// Notes
router.get('/:clientId/notes',                checkPermission('clients','view'),   noteCtrl.list);
router.post('/:clientId/notes',               checkPermission('clients','edit'),   noteCtrl.create);
router.put('/:clientId/notes/:noteId',        checkPermission('clients','update'), noteCtrl.update);
router.delete('/:clientId/notes/:noteId',     checkPermission('clients','delete'), noteCtrl.remove);

module.exports = router;
