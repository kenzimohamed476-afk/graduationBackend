const mongoose = require("mongoose");

const previousProjectSchema = new mongoose.Schema({
  project_code: String,
  title: String,
  description: String,
  Specialization: String,
  Tools: String,
  Doctor: String,
  TA: String,
  Year: String,
  FutureWork: String,
  status: String
});

module.exports = mongoose.model(
  "PreviousProject",
  previousProjectSchema,
  "previous_projects"
);