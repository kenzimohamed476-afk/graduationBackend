const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema({
  documentation_deadline: {
    type: Date,
    default: null,
  },

  min_team_size: {
    type: Number,
    default: 2,
  },

  max_team_size: {
    type: Number,
    default: 5,
  },
});

module.exports =
  mongoose.models.SystemSettings ||
  mongoose.model("SystemSettings", systemSettingsSchema);