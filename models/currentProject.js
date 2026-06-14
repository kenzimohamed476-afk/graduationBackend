const mongoose = require("mongoose");

const currentProjectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    tools: {
      type: [String],
      default: [],
    },

    specialization: {
      type: [String],
      required: true,
    },

    team_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    ta_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected", "ongoing", "finished"],
      default: "draft",
    },

    doctor_status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    ta_status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    similarity_score: {
      type: Number,
      default: 0,
    },

    project_code: {
      type: String,
      unique: true,
      sparse: true,
    },

    futureWork: {
      type: String,
      default: null,
    },

    year: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "CurrentProject",
  currentProjectSchema,
  "current_projects",
);
