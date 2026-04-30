const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');
const {
  addComment, getComments,
  addSubtask, toggleSubtask, deleteSubtask, getSubtasks,
} = require('../controllers/commentController');

router.use(protect);

// Comments
router.post('/:id/comments', addComment);
router.get('/:id/comments', getComments);

// Subtasks
router.post('/:id/subtasks', addSubtask);
router.get('/:id/subtasks', getSubtasks);
router.patch('/:id/subtasks/:sid', toggleSubtask);
router.delete('/:id/subtasks/:sid', deleteSubtask);

module.exports = router;
