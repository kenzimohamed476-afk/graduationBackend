const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");

mongoose.connect(
  "mongodb+srv://kenzimohamed476_db_user:8MB7kGdwRRvOHrgW@cluster0.xqkrcxg.mongodb.net/graduation_project?retryWrites=true&w=majority&appName=Cluster0"
);

// =====================
// FLEXIBLE SCHEMA
// =====================
const projectSchema =
  new mongoose.Schema(
    {},
    { strict: false }
  );

const Project = mongoose.model(
  "previous_projects",
  projectSchema
);

const results = [];

// =====================
// READ CSV
// =====================
fs.createReadStream(
  "./Similaritycheck.csv"
)

  .pipe(csv({ separator: "," }))

  .on("data", (data) => {

    results.push(data);

  })

  .on("end", async () => {

    try {

      console.log(
        "RESULTS:",
        results.length
      );

      await Project.deleteMany();

      await Project.insertMany(results);

      console.log(
        "Data Imported Successfully 🔥"
      );

      mongoose.connection.close();

    } catch (err) {

      console.log(err);

    }

  });