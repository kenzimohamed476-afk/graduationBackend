const Notification = require("../models/notification");

exports.getNotifications = async (req, res) => {
  try {

    const notifications =
      await Notification.find({
        user_id: req.user.id
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      notifications
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }
};
