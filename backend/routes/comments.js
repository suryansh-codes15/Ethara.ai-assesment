const express = require('express');
const router = express.Router();
const { addComment, getComments } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', addComment);
router.get('/task/:taskId', getComments);

module.exports = router;
