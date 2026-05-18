const router = require('express').Router();
const ctrl   = require('../controllers/documents.controller');
const { verifyToken }     = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

router.use(verifyToken);
router.get('/:docId/file', ctrl.serveFile);
router.delete('/:docId',   checkPermission('clients','delete'), ctrl.remove);

module.exports = router;
