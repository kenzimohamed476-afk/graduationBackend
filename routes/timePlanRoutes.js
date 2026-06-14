const express = require("express");
const router = express.Router();

const timePlanController = require("../controllers/timePlanController");
const auth = require("../middleware/auth");

// Add time plan
router.post(
  "/add",
  auth,
  timePlanController.addTimePlan
);

// TA edit
router.put(
  "/ta-edit/:id",
  auth,
  timePlanController.editByTA
);

// TA approve
router.put(
  "/approve-ta/:id",
  auth,
  timePlanController.approveByTA
);

// Doctor view plans
router.get(
  "/doctor",
  auth,
  timePlanController.getPlansForDoctor
);

// Doctor edit
router.put(
  "/doctor-edit/:id",
  auth,
  timePlanController.editByDoctor
);

router.get(
  "/project/:projectId",
  auth,
  timePlanController.getTimePlan
); 

module.exports = router;