const express = require('express');
const router = express.Router();
const ideaController = require('../controllers/ideaController');

router.post('/', ideaController.addIdea);
const { addIdea, getIdeas, updateStatus } = require('../controllers/ideaController');

router.put('/status/:id', updateStatus);
module.exports = router;
const auth = require("../middleware/auth");

router.put("/idea/:id/status",
auth,
updateStatus
);




