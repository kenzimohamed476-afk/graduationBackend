const User = require("../models/student");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


// Register
exports.register = async (req, res) => {

  const { name, email, password } = req.body;

  if (!email.endsWith("@modernacademy.edu.eg")) {
    return res.status(400).json("Modern Academy students only");
  }

  try {

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json("Email already exists");
    }

    // 🔥 hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    res.status(201).json("Student created");

  } catch (err) {
    res.status(400).json(err.message);
  }
};


// Login
exports.login = async (req, res) => {

  const user = await User.findOne({
    email: req.body.email
  });

  if (!user)
    return res.status(400).json("User not found");

  const isMatch = await bcrypt.compare(
    req.body.password,
    user.password
  );

  if (!isMatch)
    return res.status(400).json("Wrong password");

  const token = jwt.sign(
    {
      id: user._id,
      role: "student"
    },
    "SECRET_KEY"
  );

  res.json({ token });
};
