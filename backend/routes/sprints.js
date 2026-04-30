const express = require('express');
const router = express.Router();
const { createSprint, getSprints } = require('../controllers/sprintController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getSprints)
  .post(adminOnly, createSprint);

module.exports = router;
