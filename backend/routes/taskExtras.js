const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');
const {
  addComment, getComments,
  addSubtask, toggleSubtask, deleteSubtask, getSubtasks,
} = require('../controllers/commentController');

router.use(protect);

// Comments
router.post('/:taskId/comments', addComment);
router.get('/:taskId/comments', getComments);

// Subtasks
router.post('/:taskId/subtasks', addSubtask);
router.get('/:taskId/subtasks', getSubtasks);
router.patch('/:taskId/subtasks/:sid', toggleSubtask);
router.delete('/:taskId/subtasks/:sid', deleteSubtask);

module.exports = router;
