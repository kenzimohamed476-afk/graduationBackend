const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  specialization: {
  type: String
},

  email: {
    type: String,
    unique: true,
    required: true,
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["doctor", "ta", "admin", "library"],
    required: true
  },
  
  fcm_token: {
  type: String,
  default: null
}

}, 
// دي بتفول هو create امتي و update امتي auto
{ timestamps: true });

module.exports = mongoose.model("User", userSchema);