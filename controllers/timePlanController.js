const TimePlan = require("../models/timePlan");

const Student = require("../models/student");

const Team = require("../models/team");

const sendNotification = require("../utils/sendNotification");

exports.addTimePlan = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);

    if (!student || !student.isLeader) {
      return res.status(403).json({
        message: "Only leader can add time plan",
      });
    }

    if (!student.team_id) {
      return res.status(400).json({
        message: "Student is not in a team",
      });
    }

    const existingPlan = await TimePlan.findOne({
      project_id: req.body.project_id,
    });

    if (existingPlan) {
      return res.status(400).json({
        message: "Time plan already exists for this project",
      });
    }

    const timePlan = await TimePlan.create({
      ...req.body,
      created_by: student._id,
      team_id: student.team_id,
      leader_id: student._id,
      status: "pending_ta",
    });

    res.status(201).json({
      message: "Time plan created successfully",
      timePlan,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTimePlan = async (req, res) => {
  try {
    const plan = await TimePlan.findOne({
      project_id: req.params.projectId,
    });

    if (!plan) {
      return res.status(404).json({
        message: "Time plan not found",
      });
    }

    res.status(200).json({
      plan,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.approveByTA = async (req, res) => {
  try {
    if (req.user.role !== "ta") {
      return res.status(403).json({
        message: "Only TA can approve",
      });
    }

    const plan = await TimePlan.findByIdAndUpdate(
      req.params.id,
      {
        status: "pending_doctor",
      },
      { new: true },
    );

    if (!plan) {
      return res.status(404).json({
        message: "Time plan not found",
      });
    }

    const team = await Team.findById(plan.team_id).populate("members");

    const users = [
      ...new Set([
        plan.leader_id.toString(),
        ...team.members.map((m) => m._id.toString()),
      ]),
    ];

    for (let user of users) {
      await sendNotification(
        user,
        "Time Plan Submitted",
        "Your time plan has been approved by TA and sent to the doctor",
      );
    }

    res.json({
      message: "Time plan approved by TA",
      plan,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPlansForDoctor = async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctor can view plans",
      });
    }

    const plans = await TimePlan.find({
      status: "pending_doctor",
    }).populate("team_id leader_id project_id");

    res.json({
      message: "Approved plans",
      plans,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.rejectByTA = async (req, res) => {
  try {
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({
        message: "Comment is required",
      });
    }

    const plan = await TimePlan.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        ta_comment: comment,
      },
      { new: true },
    );

    res.status(200).json({
      message: "Time plan rejected",
      plan,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
exports.updateTimePlan = async (req, res) => {
  try {
    const plan = await TimePlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        message: "Time plan not found",
      });
    }

    // صاحب الخطة فقط
    if (plan.created_by.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    plan.tasks = req.body.tasks;

    plan.status = "pending_ta";

    plan.ta_comment = "";
    plan.doctor_comment = "";
    await plan.save();

    res.status(200).json({
      message: "Time plan updated successfully",
      plan,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
exports.approveByDoctor = async (req, res) => {
  try {
    const plan = await TimePlan.findByIdAndUpdate(
      req.params.id,
      {
        status: "approved",
      },
      { new: true },
    );

    if (!plan) {
      return res.status(404).json({
        message: "Time plan not found",
      });
    }

    res.status(200).json({
      message: "Time plan approved by doctor",
      plan,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
exports.rejectByDoctor = async (req, res) => {
  try {
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({
        message: "Comment is required",
      });
    }

    const plan = await TimePlan.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        doctor_comment: comment,
      },
      { new: true },
    );

    res.status(200).json({
      message: "Time plan rejected by doctor",
      plan,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
exports.addTaskToTimePlan = async (req, res) => {
  try {

    const { title, description, deadline } = req.body;

    const plan = await TimePlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        message: "Time plan not found"
      });
    }

    plan.tasks.push({
      title,
      description,
      deadline
    });

    await plan.save();

    res.status(200).json({
      message: "Task added successfully",
      plan
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }
};