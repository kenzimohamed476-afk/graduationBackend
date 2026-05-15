const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const recommendController = require("../controllers/recommendController");

// ==========================
// RECOMMEND IDEAS
// ==========================
router.post(
  "/recommend-ideas",
  recommendController.recommendIdeas
);

// ==========================
// SELECT IDEA
// ==========================
router.put(
  "/select-idea/:id",
  auth,
  recommendController.selectIdea
);

module.exports = router;