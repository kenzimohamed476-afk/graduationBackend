const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const allowRoles = require("../middleware/allowRoles");

const recommendController = require("../controllers/recommendController");

// =====================
// RECOMMEND IDEAS
// =====================
router.post("/recommend-ideas", recommendController.recommendIdeas);

// =====================
// CHECK IDEA SIMILARITY
// =====================
router.post(
  "/check-idea-similarity",
  auth,
  allowRoles("doctor"),
  recommendController.checkIdeaSimilarity,
);

// =====================
// SELECT IDEA
// =====================
router.put("/select-idea/:id", auth, recommendController.selectIdea);

// =====================
// ADD IDEA
// =====================
router.post("/add", auth, allowRoles("doctor"), recommendController.addIdea);

// =====================
// GET MY IDEAS
// =====================
router.get(
  "/my-ideas",
  auth,
  allowRoles("doctor"),
  recommendController.getMyIdeas,
);

// =====================
// DELETE IDEA
// =====================
router.delete(
  "/delete-idea/:id",
  auth,
  allowRoles("doctor"),
  recommendController.deleteIdea,
);

module.exports = router;
