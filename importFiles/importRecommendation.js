const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");

const Idea = require("../models/idea");

mongoose.connect(
  "mongodb+srv://kenzimohamed476_db_user:8MB7kGdwRRvOHrgW@cluster0.xqkrcxg.mongodb.net/graduation_project?retryWrites=true&w=majority&appName=Cluster0",
);

const results = [];

fs.createReadStream("idearecommender.csv")

  .pipe(csv({ separator: ";" }))

  .on("data", (data) => {

    console.log(
      Object.keys(data)
    );

    if (
      data.title &&
      data.description
    ) {

      results.push({

        title:
          data.title.trim(),

        description:
          data.description.trim(),

        Tools:
          data.Tools
            ? data.Tools
                .split(",")
                .map(item =>
                  item.trim()
                )
            : [],

        specialization:
          data.specialization
            ? data.specialization
                .split("/")
                .map(item =>
                  item.trim()
                )
            : []

      });
    }
  })

  .on("end", async () => {

    try {

      for (const idea of results) {

        await Idea.create(
          idea
        );
      }

      const ideas =
        await Idea.find();

      console.log(
        "IDEAS COUNT:",
        ideas.length
      );

      console.log(
        "DB NAME:",
        mongoose.connection.name
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