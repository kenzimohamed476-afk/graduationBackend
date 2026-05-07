const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

module.exports = router;
// register user 

router.post("/add", userController.addUser);
// login user
router.post("/login", userController.login);

// module.exports = router;