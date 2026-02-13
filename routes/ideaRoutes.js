const express = require('express');
const router = express.Router();
const ideaController = require('../controllers/ideaController');

router.post('/', ideaController.addIdea);

module.exports = router;



