const Team = require("../models/team");
const Student = require("../models/student");
const sendNotification = require("../utils/sendNotification");
const JoinRequest = require("../models/joinRequest");
const TeamInvitation = require("../models/teamInvitation");

exports.addMember = async (req, res) => {
  try {
    const { team_id, student_collegeCode } = req.body;

    const userId = req.user.id;

    
    const team = await Team.findById(team_id);

    if (!team) {
      return res.status(404).json({
        message: "Team not found"
      });
    }
    if (team.leader_id.toString() !== userId) {
      return res.status(403).json({
        message: "Only leader can add members"
      });
    }
    const student = await Student.findOne({
      collegeCode: Number(student_collegeCode)
    });
    if (!student) {
      return res.status(400).json({
        message: "Invalid student college code"
      });
    }

    //  لو الطالب بالفعل في team
    if (student.team_id) {
      return res.status(400).json({
        message: "Student already in a team"
      });
    }

    // منع التكرار
    if (team.members.includes(student._id)) {
      return res.status(400).json({
        message: "Student already in this team"
      });
    }

    //  حد أقصى للأعضاء
    if (team.members.length >= 5) {
      return res.status(400).json({
        message: "Team is full"
      });
    }

    //  إضافة الطالب للتيم
    team.members.push(student._id);
    await team.save();

    //  تحديث الطالب
    student.team_id = team._id;
    await student.save();

    //  response
    res.json({
      message: "Member added successfully",
      team
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getTeamsWithoutProject = async (req, res) => {
  try {
    
    const teams = await Team.find({  project_id: null })
      .populate("leader_id") // يجيب بيانات الليدر
      .populate("members");  // يجيب بيانات الأعضاء

    res.json(teams);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendJoinRequest = async (req, res) => {
  try {
    const { team_id } = req.body;
    const userId = req.user.id;

    const student = await Student.findById(userId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    //  لو already في team
    if (student.team_id) {
      return res.status(400).json({
        message: "You are already in a team"
      });
    }

    //  منع التكرار
    const existing = await JoinRequest.findOne({
      student_id: student._id,
      team_id
    });

    if (existing) {
      return res.status(400).json({
        message: "Request already sent"
      });
    }

    const request = await JoinRequest.create({
      student_id: student._id,
      team_id
    });

    res.status(201).json({
      message: "Request sent",
      request
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// =====================
// GET TEAM REQUESTS
// =====================
exports.getTeamRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const team = await Team.findOne({ leader_id: userId });

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const requests = await JoinRequest.find({
      team_id: team._id,
      status: "pending"
    }).populate("student_id");

    res.json(requests);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// =====================
// HANDLE REQUEST
// =====================
exports.handleRequest = async (req, res) => {
  try {
    const { request_id, action } = req.body; // accept / reject
    const userId = req.user.id;

    const request = await JoinRequest.findById(request_id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const team = await Team.findById(request.team_id);

    // ❌ تأكد إنه leader
    if (team.leader_id.toString() !== userId) {
      return res.status(403).json({
        message: "Only leader can handle requests"
      });
    }

    if (action === "accept") {
      // ➕ add member
      team.members.push(request.student_id);
      await team.save();

      await Student.findByIdAndUpdate(request.student_id, {
        team_id: team._id
      });

      request.status = "accepted";
    } else {
      request.status = "rejected";
    }

    await request.save();

    res.json({ message: "Request handled" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.leaveTeam = async (req, res) => {

  try {
    const student = await Student.findById(
      req.user.id
    );

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    if (!student.team_id) {
      return res.status(400).json({
        message: "Student is not in a team"
      });
    }

  
    const team = await Team.findById(
      student.team_id
    );

    if (!team) {
      return res.status(404).json({
        message: "Team not found"
      });
    }

    // =====================
    // IF STUDENT IS LEADER
    // =====================
    if (
      team.leader_id.toString() ===
      student._id.toString()
    ) {

      const { new_leader_id } =
        req.body;

      // لازم يختار ليدر جديد
      if (!new_leader_id) {
        return res.status(400).json({
          message:
            "Leader must choose new leader"
        });
      }

      // مينفعش يختار نفسه
      if (
        new_leader_id ===
        student._id.toString()
      ) {
        return res.status(400).json({
          message:
            "Invalid new leader"
        });
      }

      // نتأكد إنه member
      const isMember =
        team.members.some(

          (memberId) =>

            memberId.toString() ===
            new_leader_id
        );

      if (!isMember) {
        return res.status(400).json({
          message:
            "New leader must be team member"
        });
      }

      // remove old leader
      team.members =
        team.members.filter(

          (memberId) =>

            memberId.toString() !==
            student._id.toString()
        );

      // set new leader
      team.leader_id =
        new_leader_id;

      await team.save();

      // update new leader
      await Student.findByIdAndUpdate(

        new_leader_id,

        {
          isLeader: true
        }
      );

      // remove old leader team
      student.team_id = null;

      student.isLeader = false;

      await student.save();

      return res.status(200).json({

        success: true,

        message:
          "Leader left team successfully"
      });
    }

    // =====================
    // REMOVE NORMAL MEMBER
    // =====================
    team.members = team.members.filter(

      (memberId) =>

        memberId.toString() !==
        student._id.toString()
    );

    await team.save();

    // =====================
    // REMOVE TEAM ID
    // =====================
    student.team_id = null;

    student.isLeader = false;

    await student.save();

    // =====================
    // RESPONSE
    // =====================
    res.status(200).json({

      success: true,

      message:
        "Left team successfully"
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: err.message
    });
  }
};
exports.sendInvitation = async (req, res) => {
  try {

    const { receiver_id } = req.body;

    const sender = await Student.findById(
      req.user.id
    );

    if (!sender) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    const receiver =
      await Student.findById(receiver_id);

    if (!receiver) {
      return res.status(404).json({
        message: "Receiver not found"
      });
    }

    const existing =
      await TeamInvitation.findOne({
        sender_id: sender._id,
        receiver_id
      });

    if (existing) {
      return res.status(400).json({
        message: "Invitation already sent"
      });
    }

    const invitation =
      await TeamInvitation.create({
        sender_id: sender._id,
        receiver_id
      });

    res.status(201).json({
      message: "Invitation sent",
      invitation
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }
};
exports.getInvitations = async (req, res) => {
  try {

    const invitations =
      await TeamInvitation.find({
        receiver_id: req.user.id,
        status: "pending"
      })
      .populate(
        "sender_id",
        "name collegeCode specialization phone"
      );

    res.status(200).json({
      invitations
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }
};
exports.handleInvitation = async (req, res) => {
  try {

    const { invitation_id, action } = req.body;

    const invitation =
      await TeamInvitation.findById(
        invitation_id
      );

    if (!invitation) {
      return res.status(404).json({
        message: "Invitation not found"
      });
    }

    if (
      invitation.receiver_id.toString() !==
      req.user.id
    ) {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    if (action === "reject") {

      invitation.status = "rejected";

      await invitation.save();

      return res.status(200).json({
        message: "Invitation rejected"
      });
    }

    const sender = await Student.findById(
      invitation.sender_id
    );

    if (!sender.team_id) {
      return res.status(400).json({
        message: "Sender has no team"
      });
    }

    const team = await Team.findById(
      sender.team_id
    );

    if (!team) {
      return res.status(404).json({
        message: "Team not found"
      });
    }

    team.members.push(req.user.id);

    await team.save();

    await Student.findByIdAndUpdate(
      req.user.id,
      {
        team_id: team._id,
        lookingForTeam: false
      }
    );

    invitation.status = "accepted";

    await invitation.save();

    res.status(200).json({
      message: "Invitation accepted"
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }
};