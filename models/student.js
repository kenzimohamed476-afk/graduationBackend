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
  },
  { timestamps: true },
);

module.exports = mongoose.model("Student", studentSchema);
