const express = require('express');
const router = express.Router();
const {
  createProject, getProjects, getProject,
  updateProject, deleteProject, addMember, removeMember
} = require('../controllers/projectController');
const { protect, adminOnly } = require('../middleware/auth');
const { validate, projectSchema, addMemberSchema } = require('../middleware/validate');

router.use(protect);

router.route('/')
  .get(getProjects)
  .post(adminOnly, validate(projectSchema), createProject);

router.route('/:id')
  .get(getProject)
  .put(adminOnly, validate(projectSchema), updateProject)
  .delete(adminOnly, deleteProject);

router.post('/:id/add-member', adminOnly, validate(addMemberSchema), addMember);
router.post('/:id/remove-member', adminOnly, validate(addMemberSchema), removeMember);

module.exports = router;
