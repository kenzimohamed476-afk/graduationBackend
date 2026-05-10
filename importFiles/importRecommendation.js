const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");

const Idea = require("../models/idea");

mongoose.connect(
  "mongodb+srv://kenzimohamed476_db_user:8MB7kGdwRRvOHrgW@cluster0.xqkrcxg.mongodb.net/graduation_project?retryWrites=true&w=majority&appName=Cluster0"
);

const results = [];

fs.createReadStream("./idearecommender.csv")

  .pipe(csv({
    separator: ";",
    headers: [
      "title",
      "description",
      "Tools",
      "specialization"
    ],
    skipLines: 1
  }))

  .on("data", (data) => {

    const title =
      data.title?.trim();

    const description =
      data.description?.trim();

    if (!title || !description) {
      return;
    }

    const tools =
      data.Tools
        ? data.Tools
            .split(";")
            .map(item =>
              item.trim()
            )
        : [];

    const specialization =
      data.specialization
        ? data.specialization
            .split("/")
            .map(item =>
              item.trim()
            )
        : [];

    results.push({

      title,

      description,

      tools,

      specialization

    });

  })

  .on("end", async () => {

    try {

      console.log(
        "RESULTS COUNT:",
        results.length
      );

      await Idea.deleteMany();

      await Idea.insertMany(results);

      const ideas =
        await Idea.find();

      console.log(
        "IDEAS COUNT:",
        ideas.length
      );

      console.log(
        "FIRST IDEA:",
        ideas[0]
      );

      console.log(
        "Recommendation Data Imported 🔥"
      );

      mongoose.connection.close();

    } catch (err) {

      console.log(err);

    }

  });