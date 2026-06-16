const Team = require("../models/team");
const Student = require("../models/student");
const sendNotification = require("../utils/sendNotification");
const TeamInvitation = require("../models/teamInvitation");
const SystemSettings = require("../models/systemSettings");
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

    // الطالب بالفعل في فريق
    if (student.team_id) {
      return res.status(400).json({
        message: "Student already in a team",
      });
    }

    // إعدادات النظام
    const settings = await SystemSettings.findOne();
    const maxTeamSize = settings?.max_team_size || 5;

    // الطالب موجود بالفعل في الفريق
    const alreadyMember = team.members.some(
      (memberId) => memberId.toString() === student._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({
        message: "Student already in this team",
      });
    }

    // التحقق من الحد الأقصى
    // العدد الحالي = الليدر + الأعضاء
const currentTeamSize = team.members.length + 1;

if (currentTeamSize >= maxTeamSize) {
  return res.status(400).json({
    message: `Team is full. Maximum size is ${maxTeamSize}`,
  });
}

    // إضافة الطالب للفريق
    team.members.push(student._id);
    await team.save();

    // تحديث بيانات الطالب
    student.team_id = team._id;
    await student.save();

    return res.status(200).json({
      success: true,
      message: "Member added successfully",
      team,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
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

    const settings = await SystemSettings.findOne();
    const minTeamSize = settings?.min_team_size || 2;

    // =====================
    // IF STUDENT IS LEADER
    // =====================
    if (team.leader_id.toString() === student._id.toString()) {

      const currentTeamSize = team.members.length + 1;

      // لو بعد خروج الليدر العدد هيبقى أقل من الحد الأدنى
      if ((currentTeamSize - 1) < minTeamSize) {

        const allMembers = [
          team.leader_id,
          ...team.members,
        ];

        for (const memberId of allMembers) {
          await Student.findByIdAndUpdate(memberId, {
            team_id: null,
            isLeader: false,
          });
        }

        await Team.findByIdAndDelete(team._id);

        return res.status(200).json({
          success: true,
          message: "Team disbanded due to insufficient members",
        });
      }

      const { new_leader_id } = req.body;

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

      team.members = team.members.filter(
        (memberId) => memberId.toString() !== student._id.toString()
      );

      team.leader_id = new_leader_id;

      await team.save();

      for (const memberId of team.members) {
        await sendNotification(
          memberId,
          "Member Left Team",
          `${student.name} left the team`
        );
      }

      await Student.findByIdAndUpdate(new_leader_id, {
        isLeader: true,
      });

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

    const currentTeamSize = team.members.length + 1;

    if (currentTeamSize < minTeamSize) {

      const allMembers = [
        team.leader_id,
        ...team.members,
      ];

      for (const memberId of allMembers) {
        await Student.findByIdAndUpdate(memberId, {
          team_id: null,
          isLeader: false,
        });
      }

      await Team.findByIdAndDelete(team._id);

      student.team_id = null;
      student.isLeader = false;

      await student.save();

      return res.status(200).json({
        success: true,
        message: "Team disbanded due to insufficient members",
      });
    }

    await team.save();

    for (const memberId of team.members) {
      await sendNotification(
        memberId,
        "Member Left Team",
        `${student.name} left the team`
      );
    }

    student.team_id = null;
    student.isLeader = false;

    await student.save();

    return res.status(200).json({
      success: true,
      message: "Left team successfully",
    });

  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: err.message,
    });
  }
};