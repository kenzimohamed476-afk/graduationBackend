const Report = require("../models/report");
const Student = require("../models/student");
const CurrentProject = require("../models/currentProject");
const Notification = require("../models/notification");

// =====================
// ADD REPORT (Leader only)
// =====================
exports.addReport = async (req, res) => {
  try {

    const student = await Student.findById(req.user.id);

    if (!student || !student.isLeader) {
      return res.status(403).json({
        message: "Only leader can submit report"
      });
    }

    const { project_id, content, file, month } = req.body;

    const report = await Report.create({
      project_id,
      student_id: student._id,
      content,
      file,
      month
    });

    res.status(201).json({
      message: "Report submitted successfully",
      report
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// =====================
// ADD COMMENT BY DOCTOR
// =====================
exports.addDoctorComment = async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctor"
      });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        message: "Report not found"
      });
    }

    report.doctor_comment = req.body.comment;
    report.reviewed = true;

    await report.save();

    //  notify leader
    await Notification.create({
      user_id: report.student_id,
      message: "Doctor reviewed your report"
    });

    res.json({
      message: "Comment added",
      report
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// =====================
// GET REPORTS FOR DOCTOR
// =====================
exports.getReportsForDoctor = async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctor"
      });
    }

    const projects = await CurrentProject.find({
      doctor_id: req.user.id
    });

    const projectIds = projects.map(p => p._id);

    const reports = await Report.find({
      project_id: { $in: projectIds }
    })
      .populate("project_id")
      .populate("student_id");

    res.json({
      message: "Reports for your projects",
      reports
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};