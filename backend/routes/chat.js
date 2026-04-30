const express = require('express');
const router = express.Router();
const { addMessage, getMessages } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/:projectId', addMessage);
router.get('/:projectId', getMessages);

module.exports = router;
