const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const recommendController = require("../controllers/recommendController");

const allowRoles = require("../middleware/allowRoles");

router.post("/recommend-ideas", recommendController.recommendIdeas);

router.post("/check-idea-similarity",auth,recommendController.checkIdeaSimilarity,);

router.put("/select-idea/:id", auth, recommendController.selectIdea);

router.post("/add",verifyToken,allowRoles("doctor"),addIdea);

router.get("/my-ideas", auth, recommendController.getMyIdeas);
router.delete("/delete-idea/:id", auth, recommendController.deleteIdea);
module.exports = router;
