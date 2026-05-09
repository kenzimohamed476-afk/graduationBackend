const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const app = express();

// =====================
// MIDDLEWARE
// =====================
app.use(cors());

app.use(express.json());

// =====================
// ROUTES
// =====================
const projectRoutes = require("./routes/projectRoutes");

const teamRoutes = require("./routes/teamRoutes");

const userRoutes = require("./routes/userRoutes");

const studentRoutes = require("./routes/studentRoutes");

const reportRoutes = require("./routes/reportRoutes");

const timePlanRoutes = require("./routes/timePlanRoutes");

const recommendRoutes = require("./routes/recommendRoutes");

// =====================
// API ROUTES
// =====================
app.use("/api/projects", projectRoutes);

app.use("/api/teams", teamRoutes);

app.use("/api/users", userRoutes);

app.use("/api/students", studentRoutes);

app.use("/api/reports", reportRoutes);

app.use("/api/timeplans", timePlanRoutes);

app.use("/api/ideas", recommendRoutes);

// =====================
// DATABASE
// =====================
mongoose.connect(process.env.MONGO_URI)

.then(() => {

  console.log("Mongo Connected");

})

.catch((err) => {

  console.log(err);

});

mongoose.connection.once("open", () => {

  console.log(
    "Connected to DB:",
    mongoose.connection.name
  );

});

// =====================
// TEST ROUTE
// =====================
app.get("/", (req, res) => {

  res.send("API Running");

});

// =====================
// SERVER
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(`Server running on port ${PORT}`);

});