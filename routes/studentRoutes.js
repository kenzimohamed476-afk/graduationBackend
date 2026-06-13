const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const studentController = require("../controllers/studentController");
const projectController = require("../controllers/projectController");


router.post("/add", studentController.addStudent);

router.post("/login", studentController.login);

router.get("/no-team", auth, studentController.getStudentsWithoutTeam);

router.get("/no-project", auth, studentController.getStudentsWithoutProject);

router.post("/fcm-token", auth, studentController.saveFcmToken);

router.get("/dashboard", auth, projectController.getStudentDashboard);

router.get("/profile", auth, studentController.getProfile);

router.put("/profile", auth, studentController.updateProfile);

router.get("/available", auth, studentController.getAvailableStudents);

router.patch("/looking-for-team", auth, studentController.enableLookingForTeam);

router.post("/send-invitation",auth,studentController.sendInvitation,);

router.get("/invitations",auth,studentController.getInvitations,);

router.post("/handle-invitation",auth,studentController.handleInvitation,);

module.exports = router;
