const mongoose = require('mongoose');

const ideaSchema = new mongoose.Schema({
  Name: String,
  Year: String,
  Supervisors: String,
  Tools: String,
  Specialization: String,
  Introduction: String,
  FutureWork: String,
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
});

module.exports = mongoose.model('Idea', ideaSchema);


