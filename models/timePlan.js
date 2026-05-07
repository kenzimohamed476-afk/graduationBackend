const mongoose = require("mongoose");

const timePlanSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CurrentProject",
    required: true
  },

  team_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true
  },

  leader_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student"
  },

  // 🟢 الخطة نفسها
  plan: [
    {
      title: String,        // مثال: UI Design
      description: String,  // شرح
      deadline: Date        // معاد
    }
  ],

  // 🟢 حالة المعيد
  ta_status: {
    type: String,
    enum: ["pending", "approved", "edited"],
    default: "pending"
  },

  // 🟢 حالة الدكتور
  doctor_status: {
    type: String,
    enum: ["pending", "approved", "edited"],
    default: "pending"
  }

}, { timestamps: true });

module.exports = mongoose.model("TimePlan", timePlanSchema);