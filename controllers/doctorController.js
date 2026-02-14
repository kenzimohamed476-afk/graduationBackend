const Doctor = require("../models/doctor");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// REGISTER
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!email.endsWith("@modernacademy.edu.eg")) {
    return res.status(400).json("Modern Academy only");
  }

  try {
    const existingDoctor = await Doctor.findOne({ email });

    if (existingDoctor) {
      return res.status(400).json("Email already saved");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const doctor = await Doctor.create({
      name,
      email,
      password: hashedPassword,
      role: "doctor",
    });

    res.status(201).json("Doctor created");
  } catch (err) {
    res.status(400).json(err.message);
  }
};

// LOGIN
exports.login = async (req, res) => {
  const user = await Doctor.findOne({
    email: req.body.email,
  });

  if (!user) return res.status(400).json("User not found");

  const isMatch = await bcrypt.compare(req.body.password, user.password);

  if (!isMatch) return res.status(400).json("Wrong password");

  const token = jwt.sign(
    {
      id: user._id,
      role: "doctor",
    },
    "SECRET_KEY",
  );

  res.json({ token });
};
