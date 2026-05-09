const Student = require("../models/student");
const Team = require("../models/team");
const studentSchema = require("../validation/studentValidation");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// =====================
// REGISTER STUDENT
// =====================
exports.addStudent = async (req, res) => {
  try {
    // ✅ Validation
    const { error } = studentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
      });
    }

    // ✅ Check duplicate
    const existingStudent = await Student.findOne({
      collegeCode: Number(req.body.collegeCode),
    });

    if (existingStudent) {
      return res.status(400).json({
        message: "Student already exists",
      });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // ✅ Create student
    const student = await Student.create({
      name: req.body.name,
      phone: req.body.phone,
      collegeCode: Number(req.body.collegeCode),
      password: hashedPassword,
      isLeader: false,
    });

    //  Remove password
    const studentData = student.toObject();
    delete studentData.password;

    res.status(201).json({
      message: "Student created successfully",
      student: studentData,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =====================
// LOGIN STUDENT
// =====================
exports.login = async (req, res) => {
  try {
    const { collegeCode, password } = req.body;

    if (!collegeCode || !password) {
      return res.status(400).json({
        message: "College code and password are required",
      });
    }

    // ✅ Get student
    const student = await Student.findOne({
      collegeCode: Number(collegeCode),
    });

    if (!student) {
      return res.status(401).json({
        message: "Invalid college code or password",
      });
    }

    // ✅ Compare password
    const isMatch = await bcrypt.compare(password, student.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid college code or password",
      });
    }

    // ✅ Create token
    const token = jwt.sign(
      {
        id: student._id,
        collegeCode: student.collegeCode,
        role: "student",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // ❌ Remove password
    const studentData = student.toObject();
    delete studentData.password;

    res.json({
      message: "Login successful",
      token,
      student: studentData,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =====================
// STUDENTS WITHOUT TEAM
// =====================
exports.getStudentsWithoutTeam = async (req, res) => {
  try {
    const students = await Student.find({ team_id: null });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =====================
// STUDENTS WITHOUT PROJECT
// =====================
exports.getStudentsWithoutProject = async (req, res) => {
  try {
    const teams = await Team.find({ project_code: null });
    const teamIds = teams.map((t) => t._id);

    const students = await Student.find({
      team_id: { $in: teamIds },
    });

    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =====================
// ADMIN DASHBOARD
// =====================
exports.getAdminDashboard = async (req, res) => {
  try {
    const studentsWithoutTeam = await Student.find({ team_id: null });

    const teamsWithoutProject = await Team.find({ project_code: null })
      .populate("leader_id")
      .populate("members");

    res.json({
      studentsWithoutTeam,
      teamsWithoutProject,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getStudentDashboard = async (req, res) => {
  try {
    // =====================
    // GET STUDENT
    // =====================
    const student = await Student.findById(req.user.id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    // =====================
    // GET TEAM
    // =====================
    const team = await Team.findById(student.team_id)
      .populate("members")
      .populate("leader_id");

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
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

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // =====================
    // RESPONSE
    // =====================
    res.json({
      message: "Student dashboard data",

      student: {
        id: student._id,
        name: student.name,
        email: student.email,
      },

      project: {
        id: project._id,
        title: project.title,
        description: project.description,
        status: project.status,
        similarity_score: project.similarity_score,
      },

      supervisor: project.doctor_id,

      teachingAssistant: project.ta_id,

      team: {
        id: team._id,

        leader: team.leader_id,

        members: team.members,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
