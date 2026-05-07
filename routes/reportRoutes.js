const express = require("express");
const router = express.Router();

const reportController = require("../controllers/reportController");
const auth = require("../middleware/auth"); // 🔥 ضيفي ده

// add report
router.post("/add", auth, reportController.addReport);

// doctor view reports
router.get("/doctor", auth, reportController.getReportsForDoctor);

// add comment
router.put("/comment/:id", auth, reportController.addDoctorComment);

module.exports = router;