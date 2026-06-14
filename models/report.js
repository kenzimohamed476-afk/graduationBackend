const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CurrentProject",
    },

    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },

    content: String,
    file: String,
    month: String,

    doctor_comment: {
      type: String,
      default: null,
    },

    reviewed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Report", reportSchema);
