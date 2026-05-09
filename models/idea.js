const mongoose = require("mongoose");

const ideaSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    Tools: [
      {
        type: String
      }
    ],

    specialization: [
      {
        type: String
      }
    ]
  },

  { timestamps: true }
);

module.exports = mongoose.model(
  "Idea",
  ideaSchema
);