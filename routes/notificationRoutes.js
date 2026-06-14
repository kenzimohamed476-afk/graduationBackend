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



module.exports = router;