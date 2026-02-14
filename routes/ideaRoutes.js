const express = require("express");
const router = express.Router();

const { addIdea, getIdeas, updateStatus } =
require("../controllers/ideaController");

const auth = require("../middleware/auth");

// add idea
router.post("/", addIdea);

// update status (doctor only)
router.put("/status/:id", auth, updateStatus);

module.exports = router;



