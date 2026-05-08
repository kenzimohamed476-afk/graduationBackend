const CurrentProject = require("../models/currentProject");
const PreviousProject = require("../models/previousProject");
const Team = require("../models/team");
const Student = require("../models/student");
const TimePlan = require("../models/timePlan"); // 🔥 كان ناقص
const axios = require("axios");


// =====================
// ADD PROJECT + CREATE TEAM
// =====================
exports.addProject = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const { title, description, tools, specialization, doctor_id, ta_id, year, team } = req.body;

    if (!title || !description || !team) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 🔥 compare by collegeCode
    if (Number(req.user.collegeCode) !== Number(team.leader_collegeCode)) {
      return res.status(403).json({
        message: "Only the selected leader can submit the project"
      });
    }

    // validate leader
    if (!team.members.some(m => Number(m.collegeCode) === Number(team.leader_collegeCode))) {
      return res.status(400).json({
        message: "Leader must be one of the team members"
      });
    }

    // remove duplicates
    const codes = team.members.map(m => Number(m.collegeCode));
    if (new Set(codes).size !== codes.length) {
      return res.status(400).json({
        message: "Duplicate members not allowed"
      });
    }

    // get students
    const students = await Student.find({
      collegeCode: { $in: codes }
    });

    if (students.length !== codes.length) {
      return res.status(400).json({
        message: "One or more students not found"
      });
    }

    // map collegeCode → _id
    const idMap = {};
    students.forEach(s => idMap[s.collegeCode] = s._id);

    const memberIds = codes.map(c => idMap[c]);

    // already in team
    const existingMembers = await Student.find({
      _id: { $in: memberIds },
      team_id: { $ne: null }
    });

    if (existingMembers.length > 0) {
      return res.status(400).json({
        message: "One or more students already in a team"
      });
    }

    if (memberIds.length > 5) {
      return res.status(400).json({
        message: "Max 5 members allowed"
      });
    }

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

      for (let rec of results) {
        if (rec.similarity > similarity) {
          similarity = rec.similarity;
          similarProject = rec;
        }
      }

    } catch (err) {
      console.log("AI ERROR:", err.message);
    }

    let similarProjectDetails = null;

    if (similarProject) {
      similarProjectDetails = await PreviousProject.findById(similarProject.id);
    }

    // 🔥 threshold
    if (similarity >= 50) {
      return res.status(400).json({
        message: "Project rejected due to similarity",
        similarity,
        similarProject: similarProjectDetails
      });
    }

    // =====================
    // CREATE TEAM
    // =====================
    const newTeam = await Team.create({
      leader_id: idMap[team.leader_collegeCode],
      members: memberIds
    });

    for (let member of team.members) {
      if (!member.specialization) {
        return res.status(400).json({
          message: "Each member must have specialization"
        });
      }

      await Student.findOneAndUpdate(
        { collegeCode: Number(member.collegeCode) },
        {
          team_id: newTeam._id,
          specialization: member.specialization
        }
      );
    }

    await Student.findOneAndUpdate(
      { collegeCode: Number(team.leader_collegeCode) },
      { isLeader: true }
    );

    // =====================
    // SAVE PROJECT
    // =====================
    const savedProject = await CurrentProject.create({
      title,
      description,
      tools,
      specialization,
      doctor_id: doctor_id || null,
      ta_id: ta_id || null,
      team_id: newTeam._id,
      year,
      status: "pending",
      similarity_score: similarity,
    });

    res.status(201).json({
      message: "Project created successfully",
      similarity,
      similarProject: similarProjectDetails,
      savedProject,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// =====================
// UPDATE STATUS
// =====================
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


// =====================
// ADMIN APPROVE
// =====================
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


// =====================
// UPLOAD DOCS
// =====================
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


// =====================
// FINALIZE
// =====================
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


// =====================
// DOCTOR DASHBOARD
// =====================
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