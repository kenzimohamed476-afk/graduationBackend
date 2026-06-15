const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      unique: true,
      required: true,
    },

    email: {
      type: String,
      unique: true,
      lowercase: true,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    collegeCode: {
      type: Number,
      required: true,
      unique: true,
    },

    specialization: {
      type: String,
      enum: [
        "Backend",
        "Frontend",
        "Mobile",
        "AI",
        "IoT",
        "Network",
        "Cyber Security",
      ],
    },

    team_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },

    isLeader: {
      type: Boolean,
      default: false,
    },

    fcm_token: {
      type: String,
      default: null,
    },

    lookingForTeam: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Student", studentSchema);
