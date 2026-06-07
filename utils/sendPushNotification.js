const admin = require("../config/firebase");

const sendPushNotification = async (
  token,
  title,
  body
) => {
  try {
    await admin.messaging().send({
      token,
      notification: {
        title,
        body,
      },
    });

    console.log("Push notification sent");
  } catch (err) {
    console.log(err);
  }
};

module.exports = sendPushNotification;