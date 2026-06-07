const User = require("../models/user");
const userSchema = require("../validation/userValidation");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendNotification = require("../utils/sendNotification");


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
exports.saveFcmToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Token is required",
      });
    }

    const user = await User.findByIdAndUpdate(
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
      user,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};