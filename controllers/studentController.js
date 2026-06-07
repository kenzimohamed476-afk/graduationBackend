const Student = require("../models/student");
const Team = require("../models/team");
const studentSchema = require("../validation/studentValidation");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendNotification = require("../utils/sendNotification");


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

exports.getProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id)
      .select("-password")
      .populate("team_id");

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    res.json({
      student,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, specialization } = req.body;

    const student = await Student.findByIdAndUpdate(
      req.user.id,

      {
        name,
        phone,
        specialization,
      },

      {
        new: true,
      },
    ).select("-password");

    res.json({
      message: "Profile updated",
      student,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
