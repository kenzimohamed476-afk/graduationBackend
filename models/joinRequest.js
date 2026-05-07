const mongoose = require("mongoose");

const joinRequestSchema = new mongoose.Schema({
student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student"
},

team_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team"
},

status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending"
}

}, { timestamps: true });

module.exports = mongoose.model("JoinRequest", joinRequestSchema);