const router = require('express').Router();
const ctrl   = require('../controllers/appointments.controller');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);
router.get('/',     ctrl.list);
router.post('/',    ctrl.create);
router.put('/:id',  ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
