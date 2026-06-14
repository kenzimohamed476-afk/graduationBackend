const express = require("express");
const router = express.Router();

const {
  getNotifications,
  markAsRead,
  getUnreadCount,
} = require("../controllers/notificationsController");

const auth = require("../middleware/auth");

// Get all notifications
router.get(
  "/",
  auth,
  getNotifications
);

// Get unread notifications count
router.get(
  "/unread-count",
  auth,
  getUnreadCount
);

// Mark notification as read
router.patch(
  "/:id/read",
  auth,
  markAsRead
);

module.exports = router;