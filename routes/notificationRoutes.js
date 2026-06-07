const express = require("express");
const router = express.Router();

const {
  getNotifications,
  markAsRead,
  getUnreadCount,
} = require("../controllers/notificationsController");

const auth = require("../middleware/auth");

router.get("/", auth, getNotifications);

router.get(
  "/unread-count",
  auth,
  getUnreadCount
);

router.patch(
  "/:id/read",
  auth,
  markAsRead
);

module.exports = router;