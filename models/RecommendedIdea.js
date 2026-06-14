const mongoose = require("mongoose");

const ideaSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    tools: {
      type: [String],
      default: [],
    },

    specialization: {
      type: [String],
      default: [],
    },
  },

  { timestamps: true },
);

module.exports = mongoose.model("RecommendedIdea", ideaSchema);
