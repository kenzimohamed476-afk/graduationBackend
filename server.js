const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();



app.use(cors());
app.use(express.json());

// 🔥 مهم جدا — routes هنا
const ideaRoutes = require("./routes/ideaRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
app.use("/doctor", doctorRoutes);
app.use("/api/ideas", ideaRoutes);


// DB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("Mongo Connected"))
.catch(err => console.log(err));

mongoose.connection.once("open", () => {
console.log("Connected to DB:", mongoose.connection.name);
});

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
console.log(`Server running on port ${PORT}`)
);
