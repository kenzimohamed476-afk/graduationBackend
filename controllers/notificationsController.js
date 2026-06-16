const Notification = require("../models/notification");
const Student = require("../models/student");
const User = require("../models/user");
const admin = require("../config/firebase");

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      receiver_id: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      notifications,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
exports.sendChatNotification = async (req, res) => {
  try {
    const { receiver_id, sender_name, message } = req.body;

    let receiver = await Student.findById(receiver_id);

    if (!receiver) {
      receiver = await User.findById(receiver_id);
    }

    if (!receiver) {
      return res.status(404).json({
        message: "Receiver not found",
      });
    }

    if (!receiver.fcm_token) {
      return res.status(200).json({
        message: "Receiver has no FCM token",
      });
    }

    await admin.messaging().send({
      token: receiver.fcm_token,
      notification: {
        title: "New Message",
        body: `Message from ${sender_name}`,
      },
    });

    res.status(200).json({
      message: "Notification sent successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
