const User = require("../models/user");

const Student = require("../models/student");

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const PreviousProject = require("../models/previousProject");

const CurrentProject = require("../models/currentProject");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "email and password are required",
      });
    }

    const user = await User.findOne({
      email: String(email),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    const userData = user.toObject();
    delete userData.password;

    res.json({
      message: "Login successful",
      token,
      user: userData,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      user,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({
      role: "doctor",
    }).select("name email specialization");

    res.json({
      doctors,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getTAs = async (req, res) => {
  try {
    const tas = await User.find({
      role: "ta",
    }).select("name email specialization");

    res.json({
      tas,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getLibraryDashboard = async (req, res) => {
  try {
    if (req.user.role !== "library") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const totalProjects = await PreviousProject.countDocuments();

    const thisYearProjects = await CurrentProject.countDocuments({
      status: "ongoing",
    });

    res.status(200).json({
      totalProjects,
      thisYearProjects,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.addPreviousProject = async (req, res) => {
  try {
    if (req.user.role !== "library") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const {
      project_code,
      title,
      description,
      specialization,
      tools,
      doctor,
      ta,
      year,
      futureWork,
    } = req.body;

    if (!project_code || !title || !year) {
      return res.status(400).json({
        message: "Project code, title and year are required",
      });
    }

    const existingProject = await PreviousProject.findOne({
      project_code,
    });

    if (existingProject) {
      return res.status(400).json({
        message: "Project code already exists",
      });
    }

    const project = await PreviousProject.create({
      project_code,
      title,
      description,
      specialization,
      tools,
      doctor,
      ta,
      year,
      futureWork,
      status: "finished",
    });

    res.status(201).json({
      message: "Project added successfully",
      project,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getAllPreviousProjects = async (req, res) => {
  try {
    if (req.user.role !== "library") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const projects = await PreviousProject.find();

    res.status(200).json({
      projects,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getCurrentProjectsForLibrary = async (req, res) => {
  try {
    if (req.user.role !== "library") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const projects = await CurrentProject.find({
      status: "ongoing",
    })
      .populate("doctor_id", "name")
      .populate("ta_id", "name");

    res.status(200).json({
      projects,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.submitProjectDocumentation = async (req, res) => {
  try {
    if (req.user.role !== "library") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const project = await CurrentProject.findById(req.params.id)
      .populate("doctor_id", "name")
      .populate("ta_id", "name")
      .populate("team_id");

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    await PreviousProject.create({
      project_code: project.project_code,
      title: project.title,
      description: project.description,

      specialization: project.specialization,
      tools: project.tools,
      doctor: project.doctor_id?.name || "",
      ta: project.ta_id?.name || "",
      year: project.year || new Date().getFullYear().toString(),
      futureWork: project.futureWork || "",

      status: "finished",
    });

    await CurrentProject.findByIdAndDelete(project._id);

    res.status(200).json({
      message: "Project moved to previous projects successfully",
    });
  } catch (err) {
    console.log(err);

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

    let account = await User.findByIdAndUpdate(
      req.user.id,
      {
        fcm_token: token,
      },
      {
        new: true,
      },
    );

    if (!account) {
      account = await Student.findByIdAndUpdate(
        req.user.id,
        {
          fcm_token: token,
        },
        {
          new: true,
        },
      );
    }

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    res.status(200).json({
      message: "FCM token saved successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
