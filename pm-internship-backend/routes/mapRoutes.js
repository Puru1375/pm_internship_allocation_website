const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getMapData } = require('../controllers/mapController');

router.get('/', protect, getMapData);

module.exports = router;