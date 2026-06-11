const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const userController = require("../controllers/userController");

const projectController = require("../controllers/projectController");

const {saveFcmToken,} = require("../controllers/userController");
router.get("/library/dashboard",auth,userController.getLibraryDashboard);
// login
router.post("/login", userController.login);
router.post(
  "/library/old-project",
  auth,
  userController.addPreviousProject
);
router.get(
  "/library/projects",
  auth,
  userController.getAllPreviousProjects
);
router.get(
  "/profile",
  auth,
  userController.getProfile
);
// get doctors
router.get("/doctors", userController.getDoctors);

// get tas
router.get("/tas", userController.getTAs);

// doctor dashboard
router.get("/doctor/dashboard",auth,projectController.getDoctorDashboard);
router.post(
  "/fcm-token",
  auth,
  saveFcmToken
);
module.exports = router;