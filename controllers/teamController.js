const Team = require("../models/team");
const Student = require("../models/student");
const sendNotification = require("../utils/sendNotification");
const TeamInvitation = require("../models/teamInvitation");

exports.addMember = async (req, res) => {
  try {
    const { team_id, student_collegeCode } = req.body;

    const userId = req.user.id;

    const team = await Team.findById(team_id);

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }
    if (team.leader_id.toString() !== userId) {
      return res.status(403).json({
        message: "Only leader can add members",
      });
    }
    const student = await Student.findOne({
      collegeCode: Number(student_collegeCode),
    });
    if (!student) {
      return res.status(400).json({
        message: "Invalid student college code",
      });
    }

    //  لو الطالب بالفعل في team
    if (student.team_id) {
      return res.status(400).json({
        message: "Student already in a team",
      });
    }

    // منع التكرار
    if (team.members.includes(student._id)) {
      return res.status(400).json({
        message: "Student already in this team",
      });
    }

    //  حد أقصى للأعضاء
    if (team.members.length >= 5) {
      return res.status(400).json({
        message: "Team is full",
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
      team,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTeamsWithoutProject = async (req, res) => {
  try {
    const teams = await Team.find({ project_id: null })
      .populate("leader_id") // يجيب بيانات الليدر
      .populate("members"); // يجيب بيانات الأعضاء

    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.leaveTeam = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    if (!student.team_id) {
      return res.status(400).json({
        message: "Student is not in a team",
      });
    }

    const team = await Team.findById(student.team_id);

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }

    // =====================
    // IF STUDENT IS LEADER
    // =====================
    if (team.leader_id.toString() === student._id.toString()) {
      const { new_leader_id } = req.body;

      // Check if there's only 1 member left (will be 0 after leader leaves)
      // In this case, delete the team
      if (team.members.length < 2) {
        // Delete the team
        await Team.findByIdAndDelete(student.team_id);

        // remove old leader from team
        student.team_id = null;
        student.isLeader = false;

        await student.save();

        return res.status(200).json({
          success: true,
          message: "Team disbanded due to insufficient members",
        });
      }

      if (!new_leader_id) {
        return res.status(400).json({
          message: "Leader must choose new leader",
        });
      }

      if (new_leader_id === student._id.toString()) {
        return res.status(400).json({
          message: "Invalid new leader",
        });
      }

      const isMember = team.members.some(
        (memberId) => memberId.toString() === new_leader_id
      );

      if (!isMember) {
        return res.status(400).json({
          message: "New leader must be team member",
        });
      }

      // remove old leader
      team.members = team.members.filter(
        (memberId) => memberId.toString() !== student._id.toString()
      );

      // set new leader
      team.leader_id = new_leader_id;

      await team.save();

      // notify remaining members
      for (const memberId of team.members) {
        await sendNotification(
          memberId,
          "Member Left Team",
          `${student.name} left the team`
        );
      }

      // make new leader
      await Student.findByIdAndUpdate(
        new_leader_id,
        {
          isLeader: true,
        }
      );

      // remove old leader from team
      student.team_id = null;
      student.isLeader = false;

      await student.save();

      return res.status(200).json({
        success: true,
        message: "Leader left team successfully",
      });
    }

    // =====================
    // REMOVE NORMAL MEMBER
    // =====================
    team.members = team.members.filter(
      (memberId) => memberId.toString() !== student._id.toString()
    );

    // Check if team will have minimum 2 members (leader + at least 1 member)
    // If only leader remains, delete the team
    if (team.members.length < 1) {
      // Delete the team (only leader left)
      await Team.findByIdAndDelete(team._id);

      // Update leader to remove team_id
      await Student.findByIdAndUpdate(
        team.leader_id,
        {
          team_id: null,
          isLeader: false,
        }
      );

      // Remove team from current student
      student.team_id = null;
      student.isLeader = false;

      await student.save();

      return res.status(200).json({
        success: true,
        message: "Team disbanded due to insufficient members",
      });
    }

    await team.save();

    // notify remaining members
    for (const memberId of team.members) {
      await sendNotification(
        memberId,
        "Member Left Team",
        `${student.name} left the team`
      );
    }

    // =====================
    // REMOVE TEAM ID
    // =====================
    student.team_id = null;
    student.isLeader = false;

    await student.save();

    res.status(200).json({
      success: true,
      message: "Left team successfully",
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};