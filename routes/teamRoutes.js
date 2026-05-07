const express = require("express");
const router = express.Router();
const teamController = require("../controllers/teamController");
const verifyToken = require("../middleware/auth");

router.post("/create", verifyToken, teamController.createTeam);
router.post("/add-member", verifyToken, teamController.addMember);
router.get("/no-project", verifyToken, teamController.getTeamsWithoutProject);

// 
router.post("/join-request", verifyToken, teamController.sendJoinRequest);
router.get("/requests", verifyToken, teamController.getTeamRequests);
router.post("/handle-request", verifyToken, teamController.handleRequest);
module.exports = router;