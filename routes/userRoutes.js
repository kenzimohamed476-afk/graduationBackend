const express = require("express");

const router = express.Router();

const userController = require("../controllers/userController");

// register
router.post("/add", userController.addUser);

// login
router.post("/login", userController.login);

// get doctors
router.get("/doctors",userController.getDoctors);

// get tas
router.get("/tas",userController.getTAs);

module.exports = router;