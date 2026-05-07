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
    //  validation 
    const { error } = studentSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: error.details[0].message
      });
    }

    //  check duplicate (collegeCode)
    const existingStudent = await Student.findOne({
      collegeCode: req.body.collegeCode
    });

    if (existingStudent) {
      return res.status(400).json({
        message: "Student already exists"
      });
    }

    //  hash password 
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // create student 
    const student = await Student.create({
      name: req.body.name,
      //email: req.body.email,
     // phone: req.body.phone,
      collegeCode: req.body.collegeCode,
     // specialization: req.body.specialization,
      password: hashedPassword,
      isLeader: req.body.isLeader
    });

    // حذف الباسورد من الريسبونس
    const studentData = student.toObject();
    delete studentData.password;

    // response
    res.status(201).json({
      message: "Student created successfully",
      student: studentData
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

    // check لو ناقص بيانات
    if (!collegeCode || !password) {
      return res.status(400).json({
        message: "College code and password are required"
      });
    }

    //  نجيب الطالب (مع تحويل الرقم لو جاي string)
    const student = await Student.findOne({
      collegeCode: Number(collegeCode)
    });
    
    //Invalid college code or password 

    if (!student) {
      return res.status(401).json({
        message: "Invalid college code or password"
      });
    }

    //  مقارنة الباسورد
    const isMatch = await bcrypt.compare(password, student.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid college code or password"
      });
    }

    //  إنشاء توكن
    const token = jwt.sign(
      {
        id: student._id,
        role: "student" // نحدد نوع المستخدم
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    //  حذف الباسورد
    const studentData = student.toObject();
    delete studentData.password;

    //  response
    res.json({
      message: "Login successful",
      token,
      student: studentData
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// STUDENTS WITHOUT TEAM
// =====================
exports.getStudentsWithoutTeam = async (req, res) => {
  try {
    // الطلبة اللي مش في أي تيم
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
    // 🟢 نجيب التيمات اللي معندهاش مشروع
    const teams = await Team.find({ project_code: null });

    // ناخد الـ IDs بتاعت التيمات
    const teamIds = teams.map(t => t._id);

    // 🟢 نجيب الطلبة اللي في التيمات دي
    const students = await Student.find({
      team_id: { $in: teamIds }
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
    // الطلبة بدون team
    const studentsWithoutTeam = await Student.find({ team_id: null });

    // التيمات بدون مشروع
    const teamsWithoutProject = await Team.find({ project_code: null })
      .populate("leader_id") // يجيب بيانات الليدر
      .populate("members");  // يجيب أعضاء التيم

    res.json({
      studentsWithoutTeam,
      teamsWithoutProject
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};