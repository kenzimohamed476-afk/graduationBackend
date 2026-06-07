const Notification = require("../models/notification");
const User = require("../models/user");
const Student = require("../models/student");
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

    // Search in User collection
    let account = await User.findById(user_id);

    // If not found, search in Student collection
    if (!account) {
      account = await Student.findById(user_id);
    }

    // Send push notification if token exists
    if (account?.fcm_token) {
      await sendPushNotification(
        account.fcm_token,
        title,
        message
      );
    }
  } catch (err) {
    console.log(err);
  }
};

module.exports = sendNotification;