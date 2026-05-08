const mongoose = require("mongoose");
const Student = require("./student");

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

teamSchema.post(
  "findOneAndDelete",
  async function (doc) {

    if (doc) {
      await Student.updateMany(
        { team_id: doc._id },
        {
          team_id: null,
          isLeader: false
        }
      );
    }
  }
);

module.exports = mongoose.model("Team", teamSchema);