const express = require('express');
const router = express.Router();
const { createTask, getTasks, getTask, updateTask, deleteTask } = require('../controllers/taskController');
const { protect, adminOnly } = require('../middleware/auth');
const { validate, taskSchema, updateTaskSchema } = require('../middleware/validate');

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(adminOnly, validate(taskSchema), createTask);

router.route('/:id')
  .get(getTask)
  .patch(validate(updateTaskSchema), updateTask)
  .delete(adminOnly, deleteTask);

module.exports = router;
