const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const projectController = require("../controllers/projectController");

const allowRoles = require("../middleware/allowRoles");

router.post("/check-similarity", auth, projectController.checkSimilarity);

router.post("/add", auth, projectController.addProject);

router.put("/update-status/:id",auth,allowRoles("doctor", "ta"),projectController.updateStatus,);

router.put("/change-ta/:id", auth, projectController.changeTA);

router.get("/doctor/dashboard", auth, allowRoles("doctor"),projectController.getDoctorDashboard);

router.get("/ta/dashboard", auth,  allowRoles("ta"),projectController.getTADashboard);

router.get("/student/dashboard", auth, projectController.getStudentDashboard);

router.get("/admin/dashboard", auth,  allowRoles("admin"),projectController.getAdminDashboard);

router.put("/admin-approve/:id", auth, allowRoles("admin"), projectController.adminApproveProject);

router.put("/documentation/:id", auth, projectController.uploadDocumentation);

router.put("/finalize/:id", auth, projectController.finalizeProject);

router.get("/:id", auth, projectController.getProjectDetails);

router.put(
  "/documentation-deadline/:id",
  auth,
  allowRoles("doctor"),
  projectController.setDocumentationDeadline
);
module.exports = router;
