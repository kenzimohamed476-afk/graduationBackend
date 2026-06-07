const TimePlan = require("../models/timePlan");
const Student = require("../models/student");
const CurrentProject = require("../models/currentProject");
const Notification = require("../models/notification");
const Team = require("../models/team");
const sendNotification = require("../utils/sendNotification");


// =====================
// ADD TIME PLAN (Leader only)
// =====================
exports.addTimePlan = async (req, res) => {
  try {

    // 🔐 نجيب الطالب من التوكن
    const student = await Student.findById(req.user.id);

    if (!student || !student.isLeader) {
      return res.status(403).json({
        message: "Only leader can add time plan"
      });
    }

    // ❗ لازم يكون عنده تيم
    if (!student.team_id) {
      return res.status(400).json({
        message: "Student is not in a team"
      });
    }

    // ❗ منع تكرار الخطة لنفس المشروع
    const existingPlan = await TimePlan.findOne({
      project_id: req.body.project_id
    });

    if (existingPlan) {
      return res.status(400).json({
        message: "Time plan already exists for this project"
      });
    }

    // 🟢 إنشاء الخطة
    const timePlan = await TimePlan.create({
      ...req.body,
      team_id: student.team_id,
      leader_id: student._id,
      ta_status: "pending",
      doctor_status: "pending"
    });

    res.status(201).json({
      message: "Time plan created successfully",
      timePlan
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =====================
// EDIT BY TA
// =====================
exports.editByTA = async (req, res) => {
  try {

    if (req.user.role !== "ta") {
      return res.status(403).json({
        message: "Only TA can edit"
      });
    }

    const plan = await TimePlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        message: "Time plan not found"
      });
    }

    const updatedPlan = await TimePlan.findByIdAndUpdate(
      req.params.id,
      {
        plan: req.body.plan,
        ta_status: "edited",
        doctor_status: "pending"
      },
      { new: true }
    );

    // 🔔 notify team
    const team = await Team.findById(plan.team_id).populate("members");

    const users = [...new Set([plan.leader_id.toString(), ...team.members.map(m => m._id.toString())])];

    for (let user of users) {
      await Notification.create({
        user_id: user,
        message: "TA updated your time plan"
      });
    }

    res.json({
      message: "TA updated the plan",
      updatedPlan
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =====================
// APPROVE BY TA
// =====================
exports.approveByTA = async (req, res) => {
  try {

    if (req.user.role !== "ta") {
      return res.status(403).json({
        message: "Only TA can approve"
      });
    }

    const plan = await TimePlan.findByIdAndUpdate(
      req.params.id,
      { ta_status: "approved" },
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({
        message: "Time plan not found"
      });
    }

    // 🔔 notify team
    const team = await Team.findById(plan.team_id).populate("members");

    const users = [...new Set([plan.leader_id.toString(), ...team.members.map(m => m._id.toString())])];

    for (let user of users) {
      await Notification.create({
        user_id: user,
        message: "Time plan approved by TA"
      });
    }

    res.json({
      message: "Time plan approved by TA",
      plan
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =====================
// GET PLANS FOR DOCTOR
// =====================
exports.getPlansForDoctor = async (req, res) => {
  try {

    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctor can view plans"
      });
    }

    const plans = await TimePlan.find({
      ta_status: "approved"
    }).populate("team_id leader_id project_id");

    res.json({
      message: "Approved plans",
      plans
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =====================
// EDIT BY DOCTOR
// =====================
exports.editByDoctor = async (req, res) => {
  try {

    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctor"
      });
    }

    const plan = await TimePlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        message: "Time plan not found"
      });
    }

    // ❗ لازم يكون approved الأول
    if (plan.ta_status !== "approved") {
      return res.status(400).json({
        message: "Plan must be approved by TA first"
      });
    }

    const updatedPlan = await TimePlan.findByIdAndUpdate(
      req.params.id,
      {
        plan: req.body.plan,
        doctor_status: "edited"
      },
      { new: true }
    );

    // 🔔 notify team
    const team = await Team.findById(plan.team_id).populate("members");

    const users = [...new Set([plan.leader_id.toString(), ...team.members.map(m => m._id.toString())])];

    for (let user of users) {
      await Notification.create({
        user_id: user,
        message: "Doctor updated your time plan"
      });
    }

    res.json({
      message: "Doctor updated the plan",
      updatedPlan
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};