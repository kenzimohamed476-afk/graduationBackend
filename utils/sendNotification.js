const Notification = require("../models/notification");

const sendNotification = async (
  user_id,
  title,
  message
) => {
  try {
    await Notification.create({
      user_id,
      title,
      message,
    });
  } catch (err) {
    console.log(err);
  }
};

module.exports = sendNotification;