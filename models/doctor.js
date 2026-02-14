const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true
  },
  password: String,
  role: {
    type: String,
    default: "doctor"
  }
});

module.exports = mongoose.model("Doctor", doctorSchema);
