const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const projectController = require("../controllers/projectController");

// check similarity
router.post(
  "/check-similarity",
  auth,
  projectController.checkSimilarity
);

// add project
router.post(
  "/add",
  auth,
  projectController.addProject
);

// doctor / ta update status
router.put(
  "/update-status/:id",
  auth,
  projectController.updateStatus
);

// change TA
router.put(
  "/change-ta/:id",
  auth,
  projectController.changeTA
);

// admin approve
router.put(
  "/admin-approve/:id",
  auth,
  projectController.adminApproveProject
);

// upload documentation
router.put(
  "/documentation/:id",
  auth,
  projectController.uploadDocumentation
);

// finalize project
router.put(
  "/finalize/:id",
  auth,
  projectController.finalizeProject
);

// get project details
router.get(
  "/:id",
  auth,
  projectController.getProjectDetails
);

module.exports = router;