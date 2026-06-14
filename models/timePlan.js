const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  deadline: {
    type: Date,
    required: true,
  },

  status: {
    type: String,
    enum: ["pending", "done"],
    default: "pending",
  },
});

const timePlanSchema = new mongoose.Schema(
  {
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CurrentProject",
      required: true,
    },

    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    team_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },

    leader_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    tasks: [taskSchema],

    status: {
      type: String,
      enum: [
        "pending_ta",
        "edited_by_ta",
        "pending_doctor",
        "approved",
        "rejected",
      ],
      default: "pending_ta",
    },
    ta_comment: {
      type: String,
      default: "",
    },

    doctor_comment: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("TimePlan", timePlanSchema);
