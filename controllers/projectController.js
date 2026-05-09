const CurrentProject = require("../models/currentProject");
const PreviousProject = require("../models/previousProject");
const Team = require("../models/team");
const Student = require("../models/student");
const TimePlan = require("../models/timePlan");
const axios = require("axios");


// =====================================================
// CHECK SIMILARITY + CREATE TEAM
// =====================================================
// دي أول خطوة في السيستم
//
// هنا:
// ✅ بيتعمل Team
// ✅ بيتربط الطلاب بالتيم
// ✅ بيتحدد Leader
//
// بعد كدا:
// ✅ AI يعمل similarity check
//
// لو similarity >= 80
// ❌ المشروع يترفض
// لكن:
// ✅ التيم يفضل موجود
//
// لو similarity < 80
// الطالب يكمل باقي الفلو
//
// مهم:
// ❌ هنا مفيش project بيتحفظ
// =====================================================
exports.checkSimilarity = async (req, res) => {

  try {

    // =====================
    // CHECK LOGIN USER
    // =====================
    const student =await Student.findById(req.user.id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    // =====================
    // GET BODY
    // =====================
    const {description,team} = req.body;

    // =====================
    // VALIDATION
    // =====================
    if (!description || !team) {
      return res.status(400).json({
        message:
          "Description and team are required"
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
        message:
          "Leader must be one of the team members"
      });
    }

    // =====================
    // REMOVE DUPLICATES
    // =====================
    const codes =
      team.members.map(m =>
        Number(m.collegeCode)
      );

    if (new Set(codes).size !== codes.length) {

      return res.status(400).json({
        message:
          "Duplicate members not allowed"
      });
    }

    // =====================
    // GET STUDENTS
    // =====================
    const students =
      await Student.find({
        collegeCode: { $in: codes }
      });

    if (students.length !== codes.length) {

      return res.status(400).json({
        message:
          "One or more students not found"
      });
    }

    // =====================
    // MAP IDS
    // =====================
    const idMap = {};
    students.forEach(s => {
      idMap[s.collegeCode] = s._id;
    });

    const memberIds =codes.map(c => idMap[c]);

    // =====================
    // CHECK IF IN TEAM
    // =====================
    const existingMembers =
      await Student.find({

        _id: { $in: memberIds },

        team_id: { $ne: null }
      });

    if (existingMembers.length > 0) {

      return res.status(400).json({
        message:
          "One or more students already in a team"
      });
    }

    // =====================
    // MAX MEMBERS
    // =====================
    if (memberIds.length > 5) {

      return res.status(400).json({
        message:
          "Max 5 members allowed"
      });
    }

    // =====================
    // ONLY LEADER CAN CONTINUE
    // =====================
    if (
      Number(student.collegeCode) !==
      Number(team.leader_collegeCode)
    ) {

      return res.status(403).json({
        message:
          "Only the selected leader can continue"
      });
    }

    // =====================
    // CREATE TEAM
    // =====================
    const newTeam =
      await Team.create({

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
    // DEFAULT VALUES
    // =====================
    let similarity = 0;

    let similarProject = null;

    // =====================
    // GET OLD PROJECTS
    // =====================
    const previousProjects =
      await PreviousProject.find();

    const currentProjects =
      await CurrentProject.find();

    // =====================
    // MERGE ALL PROJECTS
    // =====================
    const allProjects = [
      ...previousProjects,
      ...currentProjects
    ].filter(p => p.description);

    // =====================
    // AI CHECK
    // =====================
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

    // =====================
    // GET SIMILAR PROJECT DETAILS
    // =====================
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

    // =====================
    // RESPONSE
    // =====================
    res.json({

      // لو أقل من 80
      // يكمل
      allowed: similarity < 80,

      similarity,

      // مهم جدًا
      // هنرجع team id
      // عشان نستخدمه بعدين
      team_id:
        newTeam._id,

      similarProject:
        similarProjectDetails

    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: err.message
    });
  }
};



// =====================================================
// ADD PROJECT
// =====================================================
// دي آخر خطوة في الفلو
//
// هنا فقط:
// ✅ يتحفظ المشروع
// ✅ يتربط بالتيم
// ✅ يتبعت للدكتور
//
// لأن الطالب بالفعل:
// ✅ عدى similarity
// ✅ اختار doctor
// ✅ اختار TA
// ✅ عمل review
// =====================================================
exports.addProject = async (req, res) => {

  try {

    // =====================
    // CHECK LOGIN USER
    // =====================
    const student =
      await Student.findById(req.user.id);

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
      year
    } = req.body;

    // =====================
    // REQUIRED FIELDS
    // =====================
    if (
      !title ||
      !description ||
      !doctor_id ||
      !ta_id
    ) {

      return res.status(400).json({
        message: "Missing required fields"
      });
    }

    // =====================
    // CHECK TEAM
    // =====================
    if (!student.team_id) {

      return res.status(400).json({
        message:
          "Student must be in a team first"
      });
    }

    // =====================
    // GET TEAM
    // =====================
    const team =
      await Team.findById(student.team_id);

    if (!team) {

      return res.status(404).json({
        message: "Team not found"
      });
    }

    // =====================
    // ONLY LEADER CAN SUBMIT
    // =====================
    if (
      team.leader_id.toString() !==
      student._id.toString()
    ) {

      return res.status(403).json({
        message:
          "Only leader can submit project"
      });
    }

    // =====================
    // CHECK IF TEAM ALREADY HAS PROJECT
    // =====================
    const existingProject =
      await CurrentProject.findOne({
        team_id: team._id
      });

    if (existingProject) {

      return res.status(400).json({
        message:
          "Team already has a project"
      });
    }

    // =====================
    // SAVE PROJECT
    // =====================
    const savedProject =
      await CurrentProject.create({

        // BASIC DATA
        title,
        description,
        tools,
        specialization,

        // DOCTOR + TA
        doctor_id,
        ta_id,

        // TEAM LINK
        team_id:
          team._id,

        // YEAR
        year,

        // المشروع اتبعت للدكتور
        status: "pending",

        doctor_status: "pending",

        ta_status: "pending",

        similarity_score: 0

      });

    // =====================
    // LINK PROJECT TO TEAM
    // =====================
    team.project_id =
      savedProject._id;

    await team.save();

    // =====================
    // RESPONSE
    // =====================
    res.status(201).json({

      message:
        "Project submitted successfully",

      savedProject

    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: err.message
    });
  }
};// =====================================================
// UPDATE STATUS
// =====================================================
// الدكتور أو الـ TA
// يوافق أو يرفض المشروع
// =====================================================
exports.updateStatus = async (req, res) => {

  // =====================
  // ONLY DOCTOR OR TA
  // =====================
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

    // =====================
    // GET STATUS
    // =====================
    const { status } = req.body;

    let updateField = {};

    // =====================
    // DOCTOR STATUS
    // =====================
    if (req.user.role === "doctor") {

      updateField.doctor_status =
        status;
    }

    // =====================
    // TA STATUS
    // =====================
    if (req.user.role === "ta") {

      updateField.ta_status =
        status;
    }

    // =====================
    // UPDATE PROJECT
    // =====================
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

    // =====================
    // IF BOTH APPROVED
    // =====================
    if (
      project.doctor_status === "approved" &&
      project.ta_status === "approved"
    ) {

      project.status = "approved";

      await project.save();
    }

    // =====================
    // RESPONSE
    // =====================
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



// =====================================================
// ADMIN APPROVE PROJECT
// =====================================================
// بعد موافقة الدكتور والـ TA
// الأدمن يحول المشروع لـ ongoing
// =====================================================
exports.adminApproveProject =
  async (req, res) => {

  // =====================
  // ONLY ADMIN
  // =====================
  if (req.user.role !== "admin") {

    return res.status(403).json({
      message:
        "Only admin can approve project"
    });
  }

  try {

    // =====================
    // GET PROJECT CODE
    // =====================
    const { project_code } = req.body;

    // =====================
    // FIND PROJECT
    // =====================
    const project =
      await CurrentProject.findById(
        req.params.id
      );

    if (!project) {

      return res.status(404).json({
        message: "Project not found"
      });
    }

    // =====================
    // UPDATE PROJECT
    // =====================
    project.project_code =
      project_code;

    project.status = "ongoing";

    await project.save();

    // =====================
    // RESPONSE
    // =====================
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



// =====================================================
// UPLOAD DOCUMENTATION
// =====================================================
exports.uploadDocumentation =
  async (req, res) => {

  try {

    // =====================
    // GET DOCUMENTATION
    // =====================
    const { documentation } =
      req.body;

    // =====================
    // UPDATE PROJECT
    // =====================
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

    // =====================
    // RESPONSE
    // =====================
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



// =====================================================
// FINALIZE PROJECT
// =====================================================
// نقل المشروع من current_projects
// إلى previous_projects
// =====================================================
exports.finalizeProject =
  async (req, res) => {

  try {

    // =====================
    // FIND PROJECT
    // =====================
    const project =
      await CurrentProject.findById(
        req.params.id
      );

    if (!project) {

      return res.status(404).json({
        message: "Project not found"
      });
    }

    // =====================
    // CREATE PREVIOUS PROJECT
    // =====================
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

    // =====================
    // DELETE CURRENT PROJECT
    // =====================
    await CurrentProject.findByIdAndDelete(
      project._id
    );

    // =====================
    // RESPONSE
    // =====================
    res.json({

      message:
        "Moved to previous projects",

      newPrevious
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });
  }
};



// =====================================================
// DOCTOR DASHBOARD
// =====================================================
// يرجع:
// projects + approved plans
// =====================================================
exports.getDoctorProjectsWithPlans =
  async (req, res) => {

  try {

    // =====================
    // ONLY DOCTOR
    // =====================
    if (req.user.role !== "doctor") {

      return res.status(403).json({
        message: "Only doctor"
      });
    }

    // =====================
    // GET PROJECTS
    // =====================
    const projects =
      await CurrentProject.find({

        doctor_id:
          req.user.id

      })
        .populate("team_id")
        .populate("ta_id");

    const result = [];

    // =====================
    // GET APPROVED TIME PLANS
    // =====================
    for (let project of projects) {

      const plan =
        await TimePlan.findOne({

          project_id:
            project._id,

          ta_status:
            "approved"
        });

      result.push({

        project,

        timePlan:
          plan || null
      });
    }

    // =====================
    // RESPONSE
    // =====================
    res.json({

      message:
        "Doctor projects with plans",

      data: result
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });
  }
};