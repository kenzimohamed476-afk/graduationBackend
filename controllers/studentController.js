const Student = require("../models/student");
const Team = require("../models/team");
const TeamInvitation = require("../models/teamInvitation");
const studentSchema = require("../validation/studentValidation");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendNotification = require("../utils/sendNotification");

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
      email:req.body.email,
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

exports.getStudentsWithoutTeam = async (req, res) => {
  try {
    const students = await Student.find({ team_id: null });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

exports.saveFcmToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Token is required",
      });
    }

    const student = await Student.findByIdAndUpdate(
      req.user.id,
      {
        fcm_token: token,
      },
      {
        new: true,
      }
    );

    res.status(200).json({
      message: "FCM token saved successfully",
      student,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.enableLookingForTeam = async (req, res) => {
  try {

    const { specialization } = req.body;

    const student = await Student.findById(req.user.id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    student.specialization = specialization;

    student.lookingForTeam = true;

    await student.save();

    res.status(200).json({
      message: "You are now available for teams",
      student
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }
};
exports.disableLookingForTeam = async (req, res) => {
  try {

    const student = await Student.findById(
      req.user.id
    );

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    student.lookingForTeam = false;

    await student.save();

    res.status(200).json({
      message: "Removed from available students"
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }
};

exports.getAvailableStudents = async (req, res) => {
  try {

    const students = await Student.find({
      lookingForTeam: true,
      team_id: null
    }).select(
      "name phone collegeCode specialization"
    );

    res.status(200).json({
      students
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }
};

exports.sendInvitation = async (req, res) => {
  try {
    const { receiver_id } = req.body;

    const sender = await Student.findById(req.user.id);

    if (!sender) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    const receiver = await Student.findById(receiver_id);
    if (sender._id.toString() === receiver._id.toString()) {
      return res.status(400).json({
        message: "You cannot send invitation to yourself",
      });
    }
    if (!receiver) {
      return res.status(404).json({
        message: "Receiver not found",
      });
    }

    const existing = await TeamInvitation.findOne({
      sender_id: sender._id,
      receiver_id,
      status: "pending",
    });

    if (existing) {
      return res.status(400).json({
        message: "Invitation already sent",
      });
    }

    const invitation = await TeamInvitation.create({
      sender_id: sender._id,
      receiver_id,
    });

    await sendNotification(
      receiver._id,
      "New Team Invitation",
      `${sender.name} invited you to join their team`,
    );

    res.status(201).json({
      message: "Invitation sent",
      invitation,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getInvitations = async (req, res) => {
  try {

    const invitations = await TeamInvitation.find({
      receiver_id: req.user.id,
    })
    .populate(
      "sender_id",
      "name collegeCode specialization phone"
    )
    .sort({ createdAt: -1 });

    res.status(200).json({
      invitations,
    });

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }
};
exports.handleInvitation = async (req, res) => {
  try {
    const { invitation_id, action } = req.body;

    const invitation = await TeamInvitation.findById(invitation_id);

    if (!invitation) {
      return res.status(404).json({
        message: "Invitation not found",
      });
    }

    if (invitation.receiver_id.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const receiver = await Student.findById(req.user.id);

    if (action === "reject") {
      invitation.status = "rejected";

      await invitation.save();

      await sendNotification(
        invitation.sender_id,
        "Invitation Rejected",
        `${receiver.name} rejected your invitation`,
      );

      return res.status(200).json({
        message: "Invitation rejected",
      });
    }

    invitation.status = "accepted";

    await invitation.save();

    await sendNotification(
      invitation.sender_id,
      "Invitation Accepted",
      `${receiver.name} accepted your invitation`,
    );

    res.status(200).json({
      message: "Invitation accepted",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
