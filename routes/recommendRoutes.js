const express = require("express");
const router = express.Router();

const recommendController = require("../controllers/recommendController");
// const auth = require("../middleware/auth"); // سيبيه مؤقتًا لو مش متأكد

// 🎯 recommend ideas
router.post("/recommend-ideas", recommendController.recommendIdeas);

// ❌ امسحي السطر ده مؤقتًا
// router.post("/select-idea", auth, recommendController.selectIdea);

module.exports = router;