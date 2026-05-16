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
// =====================================================
// CHECK IDEA SIMILARITY
// =====================================================
router.post(
  "/check-idea-similarity",
  auth,
  recommendController.checkIdeaSimilarity
);

// ==========================
// SELECT IDEA
// ==========================
router.put(
  "/select-idea/:id",
  auth,
  recommendController.selectIdea
);
// =====================================================
// ADD IDEA
// =====================================================
router.post(
  "/add-idea",
  auth,
  recommendController.addIdea
);
// =====================================================
// GET MY IDEAS
// =====================================================
router.get(
  "/my-ideas",
  auth,
  recommendController.getMyIdeas
);

module.exports = router;