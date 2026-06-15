const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {
  getNotifications,
  sendChatNotification,
} = require("../controllers/notificationsController");

router.post(
  "/chat",
  auth,
  sendChatNotification
);

router.get("/", auth, getNotifications);

module.exports = router;