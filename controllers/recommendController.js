const Idea = require("../models/idea");
const CurrentProject = require("../models/currentProject");
const PreviousProject = require("../models/previousProject");
const axios = require("axios");
// ==========================
// RECOMMEND IDEAS
// ==========================
exports.recommendIdeas = async (req, res) => {

  try {

    // =====================
    // GET SPECIALIZATIONS
    // =====================
    const { specializations } = req.body;

    // =====================
    // VALIDATION
    // =====================
    if (
      !specializations ||
      specializations.length === 0
    ) {

      return res.status(400).json({
        message: "Specializations required"
      });
    }

    // =====================
    // GET ALL IDEAS
    // =====================
    const ideas = await Idea.find();

    // =====================
    // AI RECOMMENDATION
    // =====================
    const response = await axios.post(

      "https://earnest-energy-production-aa56.up.railway.app/check",

      {
        student_specializations: specializations,

        ideas: ideas.map((idea) => ({

          id: idea._id,

          title: idea.title,

          description: idea.description,

          specialization: idea.specialization,

          tools: idea.tools

        }))
      }
    );

    // =====================
    // GET AI RESULTS
    // =====================
    const recommendations =
      response.data.recommendations || [];

    // =====================
    // EXTRACT IDS
    // =====================
    const recommendedIds =
      recommendations.map((r) => r.id);

    // =====================
    // GET MATCHED IDEAS
    // =====================
    const recommendedIdeas =
      await Idea.find({

        _id: {
          $in: recommendedIds
        }

      });

    // =====================
    // SORT BY AI ORDER
    // =====================
    const sortedIdeas =
      recommendedIds.map((id) =>

        recommendedIdeas.find(
          (idea) =>
            idea._id.toString() === id.toString()
        )

      ).filter(Boolean);

    // =====================
    // RESPONSE
    // =====================
    res.status(200).json({

      message:
        "Ideas recommended successfully",

      count: sortedIdeas.length,

      ideas: sortedIdeas
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: err.message
    });
  }
};
exports.selectIdea = async (req, res) => {

  try {

    // =====================
    // GET IDEA
    // =====================
    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({
        message: "Idea not found"
      });
    }

    // =====================
    // CREATE CURRENT PROJECT
    // =====================
    const project = await CurrentProject.create({

      title: idea.title,

      description: idea.description,

      tools: idea.tools,

      specialization: idea.specialization,

      doctor_id: idea.doctor_id || null,

      ta_id: idea.ta_id || null,

      status: "pending"
    });

    // =====================
    // DELETE IDEA
    // =====================
    await Idea.findByIdAndDelete(req.params.id);

    // =====================
    // RESPONSE
    // =====================
    res.status(201).json({

      message: "Idea selected successfully",

      project
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: err.message
    });
  }
};
// =====================================================
// CHECK IDEA SIMILARITY
// =====================================================
exports.checkIdeaSimilarity = async (req, res) => {

  try {

    // =====================
    // CHECK ROLE
    // =====================
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctor can add ideas"
      });
    }

    // =====================
    // GET BODY
    // =====================
    const {
      title,
      description,
      tools,
      specialization
    } = req.body;

    // =====================
    // VALIDATION
    // =====================
    if (
      !title ||
      !description ||
      !specialization ||
      specialization.length === 0
    ) {
      return res.status(400).json({
        message: "Missing required fields"
      });
    }

    // =====================
    // DEFAULT VALUES
    // =====================
    let similarity = 0;

    let similarProject = null;

    // =====================
    // GET PROJECTS
    // =====================
    const previousProjects =
      await PreviousProject.find();

    const currentProjects =
      await CurrentProject.find();

    // =====================
    // MERGE PROJECTS
    // =====================
    const allProjects = [

      ...previousProjects,

      ...currentProjects

    ].filter((p) => p.description);

    // =====================
    // AI CHECK
    // =====================
    try {

      const response = await axios.post(

        "https://earnest-energy-production-aa56.up.railway.app/check",

        {
          problem: description,

          projects: allProjects.map(
            (p) => ({
              id: p._id.toString(),

              description: p.description,
            })
          ),
        }
      );

      const results =
        response.data.results || [];

      for (let rec of results) {

        const sim =
          Number(rec.similarity);

        if (sim > similarity) {

          similarity = sim;

          similarProject = rec;
        }
      }

    } catch (err) {

      console.log(
        "AI ERROR:",
        err.message
      );
    }

    // =====================
    // RESPONSE
    // =====================
    res.status(200).json({

      allowed: similarity < 80,

      similarity,

      similarProject
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: err.message
    });
  }
};
// =====================================================
// ADD IDEA
// =====================================================
exports.addIdea = async (req, res) => {

  try {

    // =====================
    // CHECK ROLE
    // =====================
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctor can add ideas"
      });
    }

    // =====================
    // GET BODY
    // =====================
    const {
      title,
      description,
      tools,
      specialization
    } = req.body;

    // =====================
    // VALIDATION
    // =====================
    if (
      !title ||
      !description ||
      !specialization
    ) {
      return res.status(400).json({
        message: "Missing required fields"
      });
    }

    // =====================
    // CREATE IDEA
    // =====================
    const idea = await Idea.create({

      title,

      description,

      tools,

      specialization
    });

    // =====================
    // RESPONSE
    // =====================
    res.status(201).json({

      message:
        "Idea added successfully",

      idea
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: err.message
    });
  }
};
// =====================================================
// GET DOCTOR IDEAS
// =====================================================
exports.getMyIdeas = async (req, res) => {

  try {

    // =====================
    // CHECK ROLE
    // =====================
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctor"
      });
    }

    // =====================
    // GET IDEAS
    // =====================
    const ideas = await Idea.find({

      doctor_id: req.user.id

    }).sort({

      createdAt: -1
    });

    // =====================
    // RESPONSE
    // =====================
    res.status(200).json({

      message: "Doctor ideas",

      count: ideas.length,

      ideas
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: err.message
    });
  }
};