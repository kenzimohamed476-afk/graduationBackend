const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const userController = require("../controllers/userController");

const projectController = require("../controllers/projectController");

// register
router.post("/add", userController.addUser);

// login
router.post("/login", userController.login);

// get doctors
router.get("/doctors", userController.getDoctors);

// get tas
router.get("/tas", userController.getTAs);

// doctor dashboard
router.get("/doctor/dashboard",auth,projectController.getDoctorDashboard);

module.exports = router;