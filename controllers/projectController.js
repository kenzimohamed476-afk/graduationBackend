const CurrentProject = require("../models/currentProject");
const PreviousProject = require("../models/previousProject");
const Team = require("../models/team");
const Student = require("../models/student");
const axios = require("axios");

// =====================
// ADD PROJECT + CREATE TEAM 🔥
// =====================
exports.addProject = async (req, res) => {
  try {

    // 🔐 AUTH
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    // 🟢 DATA
    const {
      title,
      description,
      tools,
      specialization,
      doctor_id,
      ta_id,
      year,
      team
    } = req.body;

    // ❗ validation
    if (!title || !description || !team) {
      return res.status(400).json({
        message: "Missing required fields"
      });
    }

    // 🔐 CHECK LEADER
    if (req.user.id !== team.leader_id) {
      return res.status(403).json({
        message: "Only the selected leader can submit the project"
      });
    }

    // ❗ VALIDATE LEADER IN MEMBERS
    if (!team.members.some(m => m.id === team.leader_id)) {
      return res.status(400).json({
        message: "Leader must be one of the team members"
      });
    }

    // ❗ REMOVE DUPLICATES
    const ids = team.members.map(m => m.id);
    const uniqueMembers = [...new Set(ids)];

    if (uniqueMembers.length !== ids.length) {
      return res.status(400).json({
        message: "Duplicate members not allowed"
      });
    }

    // ❗ CHECK MEMBERS EXIST
    const students = await Student.find({
      _id: { $in: ids }
    });

    if (students.length !== ids.length) {
      return res.status(400).json({
        message: "One or more students not found"
      });
    }

    // ❗ CHECK NOT IN TEAM
    const existingMembers = await Student.find({
      _id: { $in: ids },
      team_id: { $ne: null }
    });

    if (existingMembers.length > 0) {
      return res.status(400).json({
        message: "One or more students already in a team"
      });
    }

    // ❗ LIMIT SIZE
    if (ids.length > 5) {
      return res.status(400).json({
        message: "Max 5 members allowed"
      });
    }

    // 🧑‍🤝‍🧑 CREATE TEAM
    const newTeam = await Team.create({
      leader_id: team.leader_id,
      members: ids
    });

    // 👤 UPDATE STUDENTS
    for (let member of team.members) {
      if (!member.specialization) {
        return res.status(400).json({
          message: "Each member must have specialization"
        });
      }

      await Student.findByIdAndUpdate(member.id, {
        team_id: newTeam._id,
        specialization: member.specialization
      });
    }

    // 🟢 SET LEADER
    await Student.findByIdAndUpdate(team.leader_id, {
      isLeader: true
    });

    const team_id = newTeam._id;

    // =====================
    // 🤖 AI CHECK
    // =====================
    const previousProjects = await PreviousProject.find();
    let similarity = 0;
    let similarProject = null;

    try {
      const response = await axios.post(
        "https://ai-project-2n3z.onrender.com/check",
        {
          problem: description,
          projects: previousProjects.map(p => ({
            id: p._id.toString(),
            abstract: p.description
          }))
        }
      );

      const results = response.data.results || [];

      // 🔍 أعلى similarity
      for (let rec of results) {
        if (rec.similarity > similarity) {
          similarity = rec.similarity;
          similarProject = rec;
        }
      }

    } catch (err) {
      console.log("AI ERROR:", err.message);
    }

    // 🧠 نجيب تفاصيل المشروع من DB
    let similarProjectDetails = null;

    if (similarProject) {
      similarProjectDetails = await PreviousProject.findById(similarProject.id);
    }
    if (similarity >= 80) {
    return res.status(400).json({
      message: "Project rejected due to high similarity",
      similarity,
      similarProject: similarProjectDetails
    });
}
    

    // 💾 SAVE PROJECT
    const savedProject = await CurrentProject.create({
      title,
      description,
      tools,
      specialization,
      doctor_id: doctor_id || null,
      ta_id: ta_id || null,
      team_id,
      year,
      status: "pending",
      similarity_score: similarity,
    });

    // 📤 RESPONSE
    res.status(201).json({
      message: "Project created successfully",
      similarity,
      similarProject: similarProjectDetails, // 🔥 التفاصيل الكاملة
      savedProject,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.updateStatus = async (req, res) => {
  if (req.user.role !== "doctor" && req.user.role !== "ta") {
    return res.status(403).json({
      message: "Only doctor or TA can update status"
    });
  }

  try {
    const { status } = req.body;

    let updateField = {};

    if (req.user.role === "doctor") {
      updateField.doctor_status = status;
    }

    if (req.user.role === "ta") {
      updateField.ta_status = status;
    }

    const project = await CurrentProject.findByIdAndUpdate(
      req.params.id,
      updateField,
      { new: true }
    );

    if (
      project.doctor_status === "approved" &&
      project.ta_status === "approved"
    ) {
      project.status = "approved";
      await project.save();
    }

    res.json({ message: "Status updated", project });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.adminApproveProject = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Only admin can approve project"
    });
  }

  try {
    const { project_code } = req.body;

    const project = await CurrentProject.findById(req.params.id);

    project.project_code = project_code;
    project.status = "ongoing";

    await project.save();

    await Team.findByIdAndUpdate(project.team_id, { project_code });

    res.json({ message: "Project is now ongoing", project });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.uploadDocumentation = async (req, res) => {
  try {
    const { documentation } = req.body;

    const project = await CurrentProject.findByIdAndUpdate(
      req.params.id,
      { documentation },
      { new: true }
    );

    res.json({ message: "Documentation uploaded", project });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.finalizeProject = async (req, res) => {
  try {
    const project = await CurrentProject.findById(req.params.id);

    const newPrevious = await PreviousProject.create({
      project_code: project.project_code,
      title: project.title,
      description: project.description,
      Specialization: project.specialization.join(","),
      Tools: project.tools.join(","),
      Year: project.year,
      status: "finished",
    });

    await CurrentProject.findByIdAndDelete(project._id);

    res.json({
      message: "Moved to library",
      newPrevious
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getDoctorProjectsWithPlans = async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctor"
      });
    }

    const projects = await CurrentProject.find({
      doctor_id: req.user.id
    })
      .populate("team_id")
      .populate("ta_id");

    const result = [];

    for (let project of projects) {
      const plan = await TimePlan.findOne({
        project_id: project._id,
        ta_status: "approved"
      });

      result.push({
        project,
        timePlan: plan || null
      });
    }

    res.json({
      message: "Doctor projects with time plans",
      data: result
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};