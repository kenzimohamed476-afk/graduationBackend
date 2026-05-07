const express = require("express");
const router = express.Router();

const timePlanController = require("../controllers/timePlanController");
const auth = require("../middleware/auth");

// add time plan
router.post("/add", auth, timePlanController.addTimePlan);
router.put("/approve/:id", auth, timePlanController.approveByTA);
router.get("/doctor", auth, timePlanController.getPlansForDoctor);
router.put("/doctor-edit/:id", auth, timePlanController.editByDoctor);
router.put("/ta-edit/:id", auth, timePlanController.editByTA);

module.exports = router;