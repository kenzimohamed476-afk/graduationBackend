const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const projectController = require("../controllers/projectController");

// =====================================================
// CHECK SIMILARITY
// =====================================================
router.post(
  "/check-similarity",
  auth,
  projectController.checkSimilarity
);

// =====================================================
// ADD PROJECT
// =====================================================
router.post(
  "/add",
  auth,
  projectController.addProject
);

// =====================================================
// DOCTOR / TA UPDATE STATUS
// =====================================================
router.put(
  "/update-status/:id",
  auth,
  projectController.updateStatus
);

// =====================================================
// CHANGE TA
// =====================================================
router.put(
  "/change-ta/:id",
  auth,
  projectController.changeTA
);

// =====================================================
// ADMIN DASHBOARD
// مهم يتحط قبل /:id
// =====================================================
router.get(
  "/admin/dashboard",
  auth,
  projectController.getAdminDashboard
);

// =====================================================
// ADMIN APPROVE PROJECT
// =====================================================
router.put(
  "/admin-approve/:id",
  auth,
  projectController.adminApproveProject
);

// =====================================================
// UPLOAD DOCUMENTATION
// =====================================================
router.put(
  "/documentation/:id",
  auth,
  projectController.uploadDocumentation
);

// =====================================================
// FINALIZE PROJECT
// =====================================================
router.put(
  "/finalize/:id",
  auth,
  projectController.finalizeProject
);

// =====================================================
// GET PROJECT DETAILS
// =====================================================
router.get(
  "/:id",
  auth,
  projectController.getProjectDetails
);

module.exports = router;