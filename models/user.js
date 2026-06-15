const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
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

    role: {
      type: String,
      enum: ["doctor", "ta", "admin", "library", "manager"],
      required: true,
    },

    specialization: {
      type: String,
    },

    fcm_token: {
      type: String,
      default: null,
    },
  },

  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
