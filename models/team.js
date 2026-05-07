const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({

leader_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Student",
  required: true
},

  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student"
    }
  ],

project_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "CurrentProject",
  default: null
}

}, { timestamps: true });

module.exports = mongoose.model("Team", teamSchema);