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


// TA approve
router.put(
  "/approve-ta/:id",
  auth,
  timePlanController.approveByTA
);

router.put(
  "/reject-ta/:id",
  auth,
  timePlanController.rejectByTA
); 
module.exports = router;

// Doctor view plans
router.get(
  "/doctor",
  auth,
  timePlanController.getPlansForDoctor
);



router.put(
  "/approve-doctor/:id",
  auth,
  timePlanController.approveByDoctor
);

router.put(
  "/reject-doctor/:id",
  auth,
  timePlanController.rejectByDoctor
); 

router.get(
  "/project/:projectId",
  auth,
  timePlanController.getTimePlan
); 

router.put(
  "/update/:id",
  auth,
  timePlanController.updateTimePlan
); 
