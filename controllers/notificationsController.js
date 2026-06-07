const Notification = require("../models/notification");

// =====================
// GET NOTIFICATIONS
// =====================
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user_id: req.user.id,
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

// =====================
// MARK AS READ
// =====================
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      {
        isRead: true,
      },
      {
        new: true,
      }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// =====================
// UNREAD COUNT
// =====================
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user_id: req.user.id,
      isRead: false,
    });

    res.status(200).json({
      count,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};