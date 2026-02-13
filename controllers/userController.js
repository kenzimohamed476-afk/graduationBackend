const User = require("../models/student");

// Register
exports.register = async (req, res) => {

if (!email.endsWith("@modernacademy.edu.eg")) {
    return res.status(400).json("This Services for Modern Acadmey Students");
}

try {
    const user = await User.create(req.body);
    res.json(user);
} catch (err) {
    res.status(400).json(err.message); }
};

// Login
exports.login = async (req, res) => {
try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
    return res.status(400).json("User not found");
    }

    if (user.password !== req.body.password) {
    return res.status(400).json("Wrong password");
    }

    res.json(user);
  } catch (err) {
    res.status(400).json(err.message);
  }
};
