const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getVelocity, getHeatmap, getLeaderboard } = require('../controllers/analyticsController');

router.use(protect);
router.get('/velocity', getVelocity);
router.get('/heatmap', getHeatmap);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
