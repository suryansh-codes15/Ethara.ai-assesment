const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getNotifications, markAllRead, dismissNotification } = require('../controllers/notificationController');

router.use(protect);
router.get('/', getNotifications);
router.post('/read-all', markAllRead);
router.delete('/:id', dismissNotification);

module.exports = router;
