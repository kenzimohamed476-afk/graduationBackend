const mongoose = require("mongoose");

const currentProjectSchema = new mongoose.Schema({
title: {
  type: String,
  required: true
},

description: {
  type: String,
  required: true
},

tools: {
    type: [String],
    default: []
  },

specialization: {
    type: [String],
   // enum: [ "AI","Cyber","Network","Backend","Fullstack","IoT","Embedded","Mobile","Web","Cloud"],
    required: true
  },

  // 🟢 الربط مع الفريق
  team_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Team",
  //required: true
},

  // 🟢 الربط مع الدكتور
  doctor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  
  ta_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

 status: {
  type: String,
  enum: [
    "draft",
    "pending",
    "approved",
    "rejected",
    "ongoing",
    "finished"
  ],
  default: "draft"
},

  doctor_status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  ta_status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  similarity_score: {
    type: Number,
    default: 0
  },

project_code: {
  type: String,
  sparse: true,
},

  FutureWork: {
    type: String,
    default: null
  },

  documentation: {
    type: String,
    default: null
  },

  year: String

}, { timestamps: true });

module.exports = mongoose.model(
  "CurrentProject",
  currentProjectSchema,
  "current_projects"
);