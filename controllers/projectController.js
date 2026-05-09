const CurrentProject = require("../models/currentProject");
const PreviousProject = require("../models/previousProject");
const Team = require("../models/team");
const Student = require("../models/student");
const TimePlan = require("../models/timePlan");
const axios = require("axios");
//check
exports.checkSimilarity = async (req, res) => {
  try {

    const { description } = req.body;

    if (!description) {
      return res.status(400).json({
        message: "Description is required"
      });
    }

    let similarity = 0;
    let similarProject = null;

    const previousProjects =
      await PreviousProject.find();

    const currentProjects =
      await CurrentProject.find();

    const allProjects = [
      ...previousProjects,
      ...currentProjects
    ].filter(p => p.description);

    try {

      const response = await axios.post(
        "https://ai-project-production-29cf.up.railway.app/check",
        {
          problem: description,

          projects: allProjects.map(p => ({
            id: p._id.toString(),
            description: p.description
          }))
        }
      );

      const results =
        response.data.results || [];

      for (let rec of results) {

        const sim =
          Number(rec.similarity);

        if (sim > similarity) {

          similarity = sim;
          similarProject = rec;

        }
      }

    } catch (err) {

      console.log(
        "AI ERROR:",
        err.message
      );
    }

    let similarProjectDetails = null;

    if (similarProject) {

      similarProjectDetails =
        await PreviousProject.findById(
          similarProject.id
        ) ||
        await CurrentProject.findById(
          similarProject.id
        );
    }

    res.json({

      allowed: similarity < 80,

      similarity,

      similarProject:
        similarProjectDetails

    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });
  }
};


// =====================
// ADD PROJECT + CREATE TEAM
// =====================
exports.addProject = async (req, res) => {

  try {

    // =====================
    // CHECK LOGIN USER
    // =====================
    const student = await Student.findById(req.user.id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    // =====================
    // GET BODY
    // =====================
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

    // =====================
    // REQUIRED FIELDS
    // =====================
    if (!title || !description || !team) {
      return res.status(400).json({
        message: "Missing required fields"
      });
    }

    // =====================
    // VALIDATE LEADER
    // =====================
    if (
      !team.members.some(
        m =>
          Number(m.collegeCode) ===
          Number(team.leader_collegeCode)
      )
    ) {
      return res.status(400).json({
        message: "Leader must be one of the team members"
      });
    }

    // =====================
    // REMOVE DUPLICATES
    // =====================
    const codes = team.members.map(m =>
      Number(m.collegeCode)
    );

    if (new Set(codes).size !== codes.length) {
      return res.status(400).json({
        message: "Duplicate members not allowed"
      });
    }

    // =====================
    // GET STUDENTS
    // =====================
    const students = await Student.find({
      collegeCode: { $in: codes }
    });

    if (students.length !== codes.length) {
      return res.status(400).json({
        message: "One or more students not found"
      });
    }

    // =====================
    // MAP IDS
    // =====================
    const idMap = {};

    students.forEach(s => {
      idMap[s.collegeCode] = s._id;
    });

    const memberIds = codes.map(c => idMap[c]);

    // =====================
    // CHECK IF IN TEAM
    // =====================
    const existingMembers = await Student.find({
      _id: { $in: memberIds },
      team_id: { $ne: null }
    });

    if (existingMembers.length > 0) {
      return res.status(400).json({
        message: "One or more students already in a team"
      });
    }

    // =====================
    // MAX MEMBERS
    // =====================
    if (memberIds.length > 5) {
      return res.status(400).json({
        message: "Max 5 members allowed"
      });
    }

    // =====================
    // AI CHECK
    // =====================
    let similarity = 0;
    let similarProject = null;

    const previousProjects =await PreviousProject.find();

    const currentProjects =await CurrentProject.find();

    const allProjects = [
      ...previousProjects,
      ...currentProjects
    ].filter(p => p.description);
    

    try {

      const response = await axios.post(
        "https://ai-project-production-29cf.up.railway.app/check",
        {
          problem: description,

          projects: allProjects.map(p => ({
            id: p._id.toString(),
            description: p.description
          }))
        }
      );

      const results =
        response.data.results || [];

      console.log(
        "AI RESULTS:",
        JSON.stringify(results)
      );

      for (let rec of results) {

        const sim =
          Number(rec.similarity);

        if (sim > similarity) {

          similarity = sim;
          similarProject = rec;

        }
      }

      console.log(
        "FINAL SIMILARITY:",
        similarity
      );

    } catch (err) {

      console.log(
        "AI ERROR:",
        err.message
      );

      // AI FAIL SHOULD NOT STOP SYSTEM
    }

    // =====================
    // GET SIMILAR PROJECT
    // =====================
    let similarProjectDetails = null;

    if (similarProject) {

      similarProjectDetails =
        await PreviousProject.findById(
          similarProject.id
        ) ||
        await CurrentProject.findById(
          similarProject.id
        ).populate("team_id");
    }

    // =====================
    // REJECT IF TOO SIMILAR
    // =====================
    if (similarity >= 80) {

      return res.status(400).json({
        message:
          "Project rejected due to similarity",

        similarity,

        similarProject:
          similarProjectDetails
      });
    }

    // =====================
    // ONLY LEADER CAN SUBMIT
    // =====================
    if (
      Number(student.collegeCode) !==
      Number(team.leader_collegeCode)
    ) {
      return res.status(403).json({
        message:
          "Only the selected leader can submit the project"
      });
    }

    // =====================
    // CREATE TEAM
    // =====================
    const newTeam = await Team.create({

      leader_id:
        idMap[team.leader_collegeCode],

      members: memberIds

    });

    // =====================
    // UPDATE STUDENTS
    // =====================
    for (let member of team.members) {

      if (!member.specialization) {
        return res.status(400).json({
          message:
            "Each member must have specialization"
        });
      }

      await Student.findOneAndUpdate(
        {
          collegeCode:
            Number(member.collegeCode)
        },
        {
          team_id: newTeam._id,
          specialization:
            member.specialization
        }
      );
    }

    // =====================
    // SET LEADER
    // =====================
    await Student.findOneAndUpdate(
      {
        collegeCode:
          Number(team.leader_collegeCode)
      },
      {
        isLeader: true
      }
    );

    // =====================
    // SAVE PROJECT
    // =====================
    const savedProject =
      await CurrentProject.create({

        title,
        description,
        tools,
        specialization,

        doctor_id:
          doctor_id || null,

        ta_id:
          ta_id || null,

        team_id:
          newTeam._id,

        year,

        status: "pending",

        similarity_score:
          similarity

      });

    // =====================
    // RESPONSE
    // =====================
    res.status(201).json({

      message:
        "Project created successfully",

      similarity,

      similarProject:
        similarProjectDetails,

      savedProject

    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: err.message
    });
  }
};


// =====================
// UPDATE STATUS
// =====================
exports.updateStatus = async (req, res) => {

  if (
    req.user.role !== "doctor" &&
    req.user.role !== "ta"
  ) {
    return res.status(403).json({
      message:
        "Only doctor or TA can update status"
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

    const project =
      await CurrentProject.findByIdAndUpdate(
        req.params.id,
        updateField,
        { new: true }
      );

    if (!project) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    if (
      project.doctor_status === "approved" &&
      project.ta_status === "approved"
    ) {

      project.status = "approved";

      await project.save();
    }

    res.json({
      message: "Status updated",
      project
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });
  }
};


// =====================
// ADMIN APPROVE
// =====================
exports.adminApproveProject =
  async (req, res) => {

  if (req.user.role !== "admin") {

    return res.status(403).json({
      message:
        "Only admin can approve project"
    });
  }

  try {

    const { project_code } = req.body;

    const project =
      await CurrentProject.findById(
        req.params.id
      );

    if (!project) {

      return res.status(404).json({
        message: "Project not found"
      });
    }

    project.project_code =
      project_code;

    project.status = "ongoing";

    await project.save();

    await Team.findByIdAndUpdate(
      project.team_id,
      { project_code }
    );

    res.json({
      message:
        "Project is now ongoing",
      project
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });
  }
};


// =====================
// UPLOAD DOCS
// =====================
exports.uploadDocumentation =
  async (req, res) => {

  try {

    const { documentation } =
      req.body;

    const project =
      await CurrentProject.findByIdAndUpdate(
        req.params.id,
        { documentation },
        { new: true }
      );

    if (!project) {

      return res.status(404).json({
        message: "Project not found"
      });
    }

    res.json({
      message:
        "Documentation uploaded",
      project
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });
  }
};


// =====================
// FINALIZE PROJECT
// =====================
exports.finalizeProject =
  async (req, res) => {

  try {

    const project =
      await CurrentProject.findById(
        req.params.id
      );

    if (!project) {

      return res.status(404).json({
        message: "Project not found"
      });
    }

    const newPrevious =
      await PreviousProject.create({

        project_code:
          project.project_code,

        title:
          project.title,

        description:
          project.description,

        Specialization:
          Array.isArray(
            project.specialization
          )
            ? project.specialization.join(",")
            : project.specialization,

        Tools:
          Array.isArray(project.tools)
            ? project.tools.join(",")
            : project.tools,

        Year:
          project.year,

        status: "finished"

      });

    await CurrentProject.findByIdAndDelete(
      project._id
    );

    res.json({
      message: "Moved to library",
      newPrevious
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });
  }
};


// =====================
// DOCTOR DASHBOARD
// =====================
exports.getDoctorProjectsWithPlans =
  async (req, res) => {

  try {

    if (req.user.role !== "doctor") {

      return res.status(403).json({
        message: "Only doctor"
      });
    }

    const projects =
      await CurrentProject.find({
        doctor_id: req.user.id
      })
        .populate("team_id")
        .populate("ta_id");

    const result = [];

    for (let project of projects) {

      const plan =
        await TimePlan.findOne({
          project_id: project._id,
          ta_status: "approved"
        });

      result.push({
        project,
        timePlan: plan || null
      });
    }

    res.json({
      message:
        "Doctor projects with time plans",

      data: result
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });
  }
};