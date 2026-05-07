const User = require("../models/user");
const userSchema = require("../validation/userValidation");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


// ============================================================
// REGISTER
// ============================================================
exports.addUser = async (req, res) => {
  try {
    //  validation
    const { error } = userSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: error.details[0].message
      });
    }

    // check email 
    const existingUser = await User.findOne({
      email: req.body.email
    });
    if (existingUser) {
      return res.status(400).json({
        message: "email already exists"
      });
    }
    //  hashedPassword
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    //  add on mongo
    const user = await User.create({
  
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      role: req.body.role
    });
    // delete pass عشان ميتبعتش ف res
    const userData = user.toObject();
    delete userData.password;
    
    res.status(201).json({
      message: "User created successfully",
      user: userData
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ============================================================
// LOGIN
// ============================================================
exports.login = async (req, res) => {
  try {
    const { email , password } = req.body;

    //  لو ناقص بيانات
    if (!email || !password) {
      return res.status(400).json({
        message: "email and password are required"
      });
    }

   //   لو فالريكوست عندي باعت string بحوله ل number 
  
    const user = await User.findOne({
      email: String(email)
    });

    // Invalid college code or password

    if (!user) {
      return res.status(401).json({
        message: "Invalid college code or password"
      });
    }

    // مقارنة الباسورد
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid college code or password"
      });
    }

    //  إنشاء توكن
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    //  حذف الباسورد
    const userData = user.toObject();
    delete userData.password;

    res.json({
      message: "Login successful",
      token,
      user: userData
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};