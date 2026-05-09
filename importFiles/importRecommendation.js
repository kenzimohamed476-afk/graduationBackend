const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");

const Idea = require("../models/idea");

mongoose.connect(
  "mongodb+srv://kenzimohamed476_db_user:8MB7kGdwRRvOHrgW@cluster0.xqkrcxg.mongodb.net/graduation_project?retryWrites=true&w=majority&appName=Cluster0",
);

const results = [];

fs.createReadStream("idearecommender.csv")
  .pipe(csv())
  .on("data", (data) => {
    data.tools = data.tools
      ? data.tools.split(",").map((item) => item.trim())
      : [];

    data.specializations = data.specializations
      ? data.specializations.split(",").map((item) => item.trim())
      : [];

    results.push(data);
  })

  .on("end", async () => {
    try {
      await Idea.insertMany(results);

      console.log("Recommendation Data Imported 🔥");

      mongoose.connection.close();
    } catch (err) {
      console.log(err);
    }
  });
