const mongoose = require("mongoose");

const previousProjectSchema = new mongoose.Schema(
  {
    project_code: String,
    title: String,
    description: String,
    specialization: {
      type: [String],
      default: [],
    },
    tools: {
      type: [String],
      default: [],
    },
    doctor: String,
    ta: String,
    year: String,
    futureWork: String,
    status: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "PreviousProject",
  previousProjectSchema,
  "previous_projects",
);
