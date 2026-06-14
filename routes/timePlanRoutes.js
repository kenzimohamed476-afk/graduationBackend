const express = require("express");
const router = express.Router();

const timePlanController = require("../controllers/timePlanController");
const auth = require("../middleware/auth");

router.post(
  "/add",
  auth,
  timePlanController.addTimePlan
);

router.get(
  "/project/:projectId",
  auth,
  timePlanController.getTimePlan
);

router.put(
  "/approve-ta/:id",
  auth,
  timePlanController.approveByTA
);

router.put(
  "/approve-doctor/:id",
  auth,
  timePlanController.approveByDoctor
);

router.put(
  "/reject/:id",
  auth,
  timePlanController.rejectPlan
);

router.put(
  "/ta-edit/:id",
  auth,
  timePlanController.editByTA
);

router.put(
  "/doctor-edit/:id",
  auth,
  timePlanController.editByDoctor
);;