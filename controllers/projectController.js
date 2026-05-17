const CurrentProject = require("../models/currentProject");
const PreviousProject = require("../models/previousProject");
const Team = require("../models/team");
const Student = require("../models/student");
const TimePlan = require("../models/timePlan");
const User = require("../models/user");
const mongoose = require("mongoose");
const { checkAISimilarity } = require("../utils/aiSimilarity");

exports.checkSimilarity = async (req, res) => {

  try {

    // =====================
    // CHECK LOGIN USER
    // =====================
    const student = await Student.findById(
      req.user.id
    );

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    // =====================
    // GET BODY
    // =====================
    const {
      description,
      team
    } = req.body;

    // =====================
    // VALIDATION
    // =====================
    if (!description || !team) {

      return res.status(400).json({
        message:
          "Description and team are required",
      });
    }

    // =====================
    // VALIDATE LEADER
    // =====================
    if (

      !team.members.some(

        (m) =>

          Number(m.collegeCode) ===
          Number(team.leader_collegeCode)
      )
    ) {

      return res.status(400).json({
        message:
          "Leader must be one of the team members",
      });
    }

    // =====================
    // REMOVE DUPLICATES
    // =====================
    const codes =
      team.members.map(

        (m) =>
          Number(m.collegeCode)
      );

    if (
      new Set(codes).size !==
      codes.length
    ) {

      return res.status(400).json({
        message:
          "Duplicate members not allowed",
      });
    }

    // =====================
    // GET STUDENTS
    // =====================
    const students =
      await Student.find({

        collegeCode: {
          $in: codes,
        },
      });

    if (
      students.length !==
      codes.length
    ) {

      return res.status(400).json({
        message:
          "One or more students not found",
      });
    }

    // =====================
    // MAP IDS
    // =====================
    const idMap = {};

    students.forEach((s) => {
      idMap[s.collegeCode] = s._id;
    });

    const memberIds =
      codes.map((c) => idMap[c]);

    // =====================
    // GET TEAM
    // =====================
    const currentTeam =
      student.team_id

        ? await Team.findById(
            student.team_id
          )

        : null;

    // =====================
    // CHECK ACTIVE PROJECT
    // =====================
    if (currentTeam) {

      const existingProject =
        await CurrentProject.findOne({

          team_id: currentTeam._id,

          status: {
            $ne: "rejected"
          }
        });

      if (existingProject) {

        return res.status(400).json({
          message:
            "Team already has an active project",
        });
      }
    }

    // =====================
    // MAX MEMBERS
    // =====================
    if (memberIds.length > 5) {

      return res.status(400).json({
        message:
          "Max 5 members allowed",
      });
    }

    // =====================
    // ONLY LEADER CAN CONTINUE
    // =====================
    if (

      Number(student.collegeCode) !==

      Number(
        team.leader_collegeCode
      )
    ) {

      return res.status(403).json({
        message:
          "Only the selected leader can continue",
      });
    }

    // =====================
    // CREATE TEAM IF NOT EXISTS
    // =====================
    let finalTeam = currentTeam;

    if (!finalTeam) {

      finalTeam =
        await Team.create({

          leader_id:
            idMap[
              team.leader_collegeCode
            ],

          members: memberIds,
        });

      // =====================
      // UPDATE STUDENTS
      // =====================
      for (
        let member of team.members
      ) {

        if (
          !member.specialization
        ) {

          return res.status(400).json({
            message:
              "Each member must have specialization",
          });
        }

        await Student.findOneAndUpdate(

          {
            collegeCode:
              Number(
                member.collegeCode
              ),
          },

          {
            team_id:
              finalTeam._id,

            specialization:
              member.specialization,
          }
        );
      }

      // =====================
      // SET LEADER
      // =====================
      await Student.findOneAndUpdate(

        {
          collegeCode:
            Number(
              team.leader_collegeCode
            ),
        },

        {
          isLeader: true,
        }
      );
    }

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
    // REMOVE CURRENT TEAM PROJECT
    // =====================
    const allProjects = [

      ...previousProjects,

      ...currentProjects.filter(

        (p) =>

          p.description &&

          p.team_id?.toString() !==
          finalTeam?._id?.toString()
      ),
    ];

    // =====================
    // AI CHECK
    // =====================
    const result =
      await checkAISimilarity(
        description,
        allProjects
      );

    similarity = result.similarity;

    similarProject =
      result.similarProject;

    // =====================
    // GET SIMILAR PROJECT DETAILS
    // =====================
    let similarProjectDetails =
      null;

    if (similarProject) {

      similarProjectDetails =

        (await PreviousProject.findById(
          similarProject.id
        )) ||

        (await CurrentProject.findById(
          similarProject.id
        ));
    }

    // =====================
    // RESPONSE
    // =====================
    res.json({

      allowed: similarity < 80,

      similarity,

      team_id: finalTeam?._id,

      similarProject:
        similarProjectDetails,
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};
exports.addProject = async (req, res) => {
  try {
    // =====================
    // CHECK LOGIN USER
    // =====================
    const student = await Student.findById(req.user.id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
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
      similarity_score,
    } = req.body;

    // =====================
    // REQUIRED FIELDS
    // =====================
    if (!title || !description || !doctor_id || !ta_id) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    // =====================
    // VALIDATE SIMILARITY
    // =====================
    if (
      similarity_score === undefined ||
      similarity_score < 0 ||
      similarity_score > 100
    ) {
      return res.status(400).json({
        message: "Invalid similarity score",
      });
    }

    // =====================
    // REJECT HIGH SIMILARITY
    // =====================
    if (similarity_score >= 80) {
      return res.status(400).json({
        message: "Project rejected بسبب similarity عالية",
      });
    }

    // =====================
    // CHECK TEAM
    // =====================
    if (!student.team_id) {
      return res.status(400).json({
        message: "Student must be in a team first",
      });
    }

    // =====================
    // GET TEAM
    // =====================
    const team = await Team.findById(student.team_id);

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }

    // =====================
    // ONLY LEADER CAN SUBMIT
    // =====================
    if (team.leader_id.toString() !== student._id.toString()) {
      return res.status(403).json({
        message: "Only leader can submit project",
      });
    }

    // =====================
    // CHECK ACTIVE PROJECT
    // rejected projects allowed
    // =====================
    const existingProject = await CurrentProject.findOne({
      team_id: team._id,

      status: {
        $ne: "rejected",
      },
    });

    if (existingProject) {
      return res.status(400).json({
        message: "Team already has an active project",
      });
    }

    // =====================
    // SAVE PROJECT
    // =====================
    const savedProject = await CurrentProject.create({
      // BASIC DATA
      title,
      description,
      tools,
      specialization,

      // DOCTOR + TA
      doctor_id,
      ta_id,

      // TEAM LINK
      team_id: team._id,

      // YEAR
      year,

      // STATUS
      status: "pending",

      doctor_status: "pending",

      ta_status: "pending",

      // SIMILARITY
      similarity_score,
    });

    // =====================
    // LINK PROJECT TO TEAM
    // =====================
    team.project_id = savedProject._id;

    await team.save();

    // =====================
    // RESPONSE
    // =====================
    res.status(201).json({
      message: "Project submitted successfully",

      savedProject,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};
exports.updateStatus = async (req, res) => {
  try {
    // =====================
    // GET STATUS
    // =====================
    const { status } = req.body;

    // =====================
    // VALIDATE STATUS
    // =====================
    const allowedStatus = ["approved", "rejected"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    // =====================
    // GET PROJECT
    // =====================
    const project = await CurrentProject.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // =====================
    // PREVENT CHANGING FINAL STATUS
    // =====================
    if (
      project.status === "approved" ||
      project.status === "rejected" ||
      project.status === "ongoing"
    ) {
      return res.status(400).json({
        message: "Project status can no longer be changed",
      });
    }

    // =====================
    // TA MUST WAIT FOR DOCTOR
    // =====================
    if (req.user.role === "ta" && project.doctor_status !== "approved") {
      return res.status(403).json({
        message: "Doctor must approve first",
      });
    }

    // =====================
    // DOCTOR ALREADY DECIDED
    // =====================
    if (req.user.role === "doctor" && project.doctor_status !== "pending") {
      return res.status(400).json({
        message: "Doctor already updated status",
      });
    }

    // =====================
    // TA ALREADY DECIDED
    // =====================
    if (req.user.role === "ta" && project.ta_status !== "pending") {
      return res.status(400).json({
        message: "TA already updated status",
      });
    }

    // =====================
    // UPDATE STATUS
    // =====================
    if (req.user.role === "doctor") {
      project.doctor_status = status;
    }

    if (req.user.role === "ta") {
      project.ta_status = status;
    }

    // =====================
    // DOCTOR REJECTS
    // =====================
    if (project.doctor_status === "rejected") {
      // FINAL STATUS
      project.status = "rejected";

      // REMOVE TA STATUS
      project.ta_status = null;

      // REMOVE TA
      project.ta_id = null;
    }

    // =====================
    // FINAL APPROVAL
    // =====================
    if (
      project.doctor_status === "approved" &&
      project.ta_status === "approved"
    ) {
      project.status = "approved";
    }

    // =====================
    // SAVE
    // =====================
    await project.save();

    // =====================
    // RESPONSE
    // =====================
    res.status(200).json({
      message: "Status updated successfully",

      project,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};
exports.uploadDocumentation = async (req, res) => {
  try {
    const { documentation } = req.body;

    const project = await CurrentProject.findByIdAndUpdate(
      req.params.id,

      { documentation },

      { new: true },
    );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    res.json({
      message: "Documentation uploaded",

      project,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
exports.finalizeProject = async (req, res) => {
  try {
    const project = await CurrentProject.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const newPrevious = await PreviousProject.create({
      project_code: project.project_code,

      title: project.title,

      description: project.description,

      Specialization: Array.isArray(project.specialization)
        ? project.specialization.join(",")
        : project.specialization,

      Tools: Array.isArray(project.tools)
        ? project.tools.join(",")
        : project.tools,

      Year: project.year,

      status: "finished",
    });

    await CurrentProject.findByIdAndDelete(project._id);

    res.json({
      message: "Moved to previous projects",

      newPrevious,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
exports.getDoctorDashboard = async (req, res) => {
  try {
    const doctor = await User.findById(req.user.id).select("-password");

    // =====================
    // GET DOCTOR PROJECTS
    // =====================

    const projects = await CurrentProject.find({
      doctor_id: new mongoose.Types.ObjectId(req.user.id),
    })

      .populate({
        path: "team_id",

        populate: {
          path: "members",

          select: "name collegeCode specialization",
        },
      })

      .populate("ta_id", "name")

      .sort({
        createdAt: -1,
      });

    // =====================
    // PENDING COUNT
    // =====================

    const pendingProjects = projects.filter(
      (p) => p.doctor_status === "pending",
    ).length;

    // =====================
    // ACCEPTED COUNT
    // =====================

    const acceptedProjects = projects.filter(
      (p) => p.doctor_status === "approved",
    ).length;

    // =====================
    // RESPONSE
    // =====================

    res.status(200).json({
      message: "Doctor dashboard data",

      doctor,

      pendingProjects,

      acceptedProjects,

      recentIdeas: projects,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};
exports.getProjectDetails = async (req, res) => {
  try {
    const project = await CurrentProject.findById(req.params.id)

      .populate({
        path: "team_id",

        populate: {
          path: "members",

          select: "name collegeCode specialization",
        },
      })

      .populate("doctor_id", "name")

      .populate("ta_id", "name");

    // =====================
    // CHECK PROJECT
    // =====================
    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // =====================
    // RESPONSE
    // =====================
    res.status(200).json({
      message: "Project details",

      project: {
        _id: project._id,

        title: project.title,

        description: project.description,

        tools: project.tools,

        specialization: project.specialization,

        // FINAL STATUS
        status: project.status,

        // DOCTOR STATUS
        doctor_status: project.doctor_status,

        // TA STATUS
        ta_status: project.ta_status,

        // SIMILARITY
        similarity_score: project.similarity_score,

        // TEAM
        team: project.team_id,

        // DOCTOR
        doctor: project.doctor_id,

        // TA
        ta: project.ta_id,
      },
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};
exports.getStudentDashboard = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    // =====================
    // NO TEAM
    // =====================
    if (!student.team_id) {
      return res.status(200).json({
        message: "No team yet",

        student,

        team: null,

        project: null,

        supervisor: null,

        teachingAssistant: null,
      });
    }

    // =====================
    // GET TEAM
    // =====================
    const team = await Team.findById(student.team_id)
      .populate("members")
      .populate("leader_id");

    // =====================
    // NO TEAM FOUND
    // =====================
    if (!team) {
      return res.status(200).json({
        message: "Team not found",

        student,

        team: null,

        project: null,

        supervisor: null,

        teachingAssistant: null,
      });
    }

    // =====================
    // GET PROJECT
    // =====================
    const project = await CurrentProject.findOne({
      team_id: team._id,
    })
      .populate("doctor_id")
      .populate("ta_id");

    res.status(200).json({
      message: "Student dashboard data",

      student,

      team,

      project,

      supervisor: project?.doctor_id || null,

      teachingAssistant: project?.ta_id || null,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};
exports.getTADashboard = async (req, res) => {
  try {
    const ta = await User.findById(req.user.id).select("-password");
    const projects = await CurrentProject.find({
      ta_id: new mongoose.Types.ObjectId(req.user.id),

      doctor_status: "approved",
    })

      .populate({
        path: "team_id",

        populate: {
          path: "members",

          select: "name collegeCode specialization",
        },
      })

      .populate("doctor_id", "name")

      .sort({
        createdAt: -1,
      });

    // =====================
    // PENDING COUNT
    // =====================
    const pendingProjects = projects.filter(
      (p) => p.ta_status === "pending",
    ).length;

    // =====================
    // ACCEPTED COUNT
    // =====================
    const acceptedProjects = projects.filter(
      (p) => p.ta_status === "approved",
    ).length;

    // =====================
    // RESPONSE
    // =====================
    res.status(200).json({
      message: "TA dashboard data",

      ta,

      pendingProjects,

      acceptedProjects,

      recentIdeas: projects,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};
exports.changeTA = async (req, res) => {
  try {
    // =====================
    // CHECK LOGIN USER
    // =====================
    const student = await Student.findById(req.user.id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    // =====================
    // GET PROJECT
    // =====================
    const project = await CurrentProject.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // =====================
    // GET TEAM
    // =====================
    const team = await Team.findById(project.team_id);

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }

    // =====================
    // ONLY LEADER CAN CHANGE TA
    // =====================
    if (team.leader_id.toString() !== student._id.toString()) {
      return res.status(403).json({
        message: "Only leader can change TA",
      });
    }

    // =====================
    // DOCTOR MUST APPROVE FIRST
    // =====================
    if (project.doctor_status !== "approved") {
      return res.status(400).json({
        message: "Doctor must approve first",
      });
    }

    // =====================
    // ONLY IF TA REJECTED
    // =====================
    if (project.ta_status !== "rejected") {
      return res.status(400).json({
        message: "TA did not reject this project",
      });
    }

    // =====================
    // GET NEW TA
    // =====================
    const { ta_id } = req.body;

    if (!ta_id) {
      return res.status(400).json({
        message: "TA id is required",
      });
    }

    // =====================
    // PREVENT SAME TA
    // =====================
    if (project.ta_id.toString() === ta_id) {
      return res.status(400).json({
        message: "Choose a different TA",
      });
    }

    // =====================
    // CHECK TA EXISTS
    // =====================
    const ta = await User.findById(ta_id);

    if (!ta || ta.role !== "ta") {
      return res.status(400).json({
        message: "Invalid TA",
      });
    }

    // =====================
    // UPDATE TA
    // =====================
    project.ta_id = ta_id;

    project.ta_status = "pending";

    project.status = "pending";

    // =====================
    // SAVE
    // =====================
    await project.save();

    // =====================
    // RESPONSE
    // =====================
    res.json({
      message: "TA changed successfully",

      project,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};
exports.getAdminDashboard = async (req, res) => {
  try {
    // =====================
    // GET PROJECTS
    // =====================
    const projects = await CurrentProject.find()

      .populate("doctor_id", "name")

      .populate("ta_id", "name")

      .populate({
        path: "team_id",

        populate: {
          path: "members",

          select: "name collegeCode",
        },
      })

      .sort({
        createdAt: -1,
      });

    // =====================
    // PROJECTS WITHOUT CODE
    // approved but no code yet
    // =====================
    const projectsWithoutCode = projects.filter(
      (p) => p.status === "approved" && !p.project_code,
    );

    // =====================
    // ONGOING PROJECTS
    // =====================
    const ongoingProjects = projects.filter((p) => p.status === "ongoing");

    // =====================
    // RESPONSE
    // =====================
    res.status(200).json({
      message: "Admin dashboard data",

      projectsWithoutCodeCount: projectsWithoutCode.length,

      ongoingProjectsCount: ongoingProjects.length,

      projectsWithoutCode,

      ongoingProjects,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};
exports.adminApproveProject = async (req, res) => {
  try {
    // =====================
    // GET BODY
    // =====================
    const { project_code } = req.body;

    // =====================
    // VALIDATE PROJECT CODE
    // =====================
    if (!project_code) {
      return res.status(400).json({
        message: "Project code is required",
      });
    }

    // =====================
    // GET PROJECT
    // =====================
    const project = await CurrentProject.findById(req.params.id);

    // =====================
    // CHECK PROJECT EXISTS
    // =====================
    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // =====================
    // PROJECT MUST BE APPROVED FIRST
    // =====================
    if (project.status !== "approved") {
      return res.status(400).json({
        message: "Project must be approved first",
      });
    }

    // =====================
    // CHECK DUPLICATE CODE
    // =====================
    const existingCode = await CurrentProject.findOne({
      project_code,
    });

    if (existingCode) {
      return res.status(400).json({
        message: "Project code already exists",
      });
    }

    // =====================
    // UPDATE PROJECT
    // =====================
    project.project_code = project_code;

    project.status = "ongoing";

    // =====================
    // SAVE
    // =====================
    await project.save();

    // =====================
    // RESPONSE
    // =====================
    res.status(200).json({
      message: "Project approved successfully",

      project,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};
