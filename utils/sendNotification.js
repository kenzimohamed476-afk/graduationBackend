const Notification = require("../models/notification");
const User = require("../models/user");
const sendPushNotification = require("./sendPushNotification");

const sendNotification = async (
  user_id,
  title,
  message
) => {
  try {
    // Save notification in database
    await Notification.create({
      user_id,
      title,
      message,
    });

    // Get user
    const user = await User.findById(user_id);

    // Send push notification if token exists
    if (user?.fcm_token) {
      await sendPushNotification(
        user.fcm_token,
        title,
        message
      );
    }
  } catch (err) {
    console.log(err);
  }
};

module.exports = sendNotification;