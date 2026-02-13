const Doctor = require('../models/doctor');
// Register
exports.register = async (req, res) => {
    const{ name , email , password}= req.body;

if (!email.endsWith("@modernacademy.edu.eg")) {
    return res.status(400).json("This service is for Modern Academy members.");
    
}
try {

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ email });

    if (existingDoctor) {
    return res.status(400).json("Email already saved");
    }
    
    const doctor = await Doctor.create({
    name,
    email,
    password
    });
    res.status(201).json(doctor);
} catch (err) {
    res.status(400).json(err.message);
}
};

// Login
exports.login = async (req, res) => {
try {
    const user = await Doctor.findOne({ email: req.body.email });

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