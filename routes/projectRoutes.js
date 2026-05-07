const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const projectController = require("../controllers/projectController");

// add project
router.post("/add", auth, projectController.addProject);

// update status (doctor / ta)
router.put("/update-status/:id", auth, projectController.updateStatus);

// admin approve
router.put("/admin-approve/:id", auth, projectController.adminApproveProject);

// upload docs
router.put("/documentation/:id", auth, projectController.uploadDocumentation);

// finalize project
router.put("/finalize/:id", auth, projectController.finalizeProject);

// doctor dashboard with plans
router.get("/doctor-with-plans", auth, projectController.getDoctorProjectsWithPlans);

module.exports = router;