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

    doctor_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "user"
},
    // خليها small letters
    tools: [
      {
        type: String
      }
    ],

    specialization: [
      {
        type: String
      }
    ],
  },

  { timestamps: true }
);

module.exports = mongoose.model(
  "Idea",
  ideaSchema
);