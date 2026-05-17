const Idea = require("../models/idea");
const CurrentProject = require("../models/currentProject");
const PreviousProject = require("../models/previousProject");

exports.recommendIdeas = async (req, res) => {
  try {
    // =====================
    // GET SPECIALIZATIONS
    // =====================
    const { specializations } = req.body;

    // =====================
    // VALIDATION
    // =====================
    if (!specializations || specializations.length === 0) {
      return res.status(400).json({
        message: "Specializations required",
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
      "https://earnest-energy-production-aa56.up.railway.app/recommend",

      {
        student_specializations: specializations,

        ideas: ideas.map((idea) => ({
          id: idea._id.toString(),

          title: idea.title,

          description: idea.description,

          specialization: idea.specialization,

          tools: idea.tools,
        })),
      },
    );

    // =====================
    // GET AI RESULTS
    // =====================
    const recommendations = response.data.recommendations || [];

    // =====================
    // EXTRACT IDS
    // =====================
    const recommendedIds = recommendations.map((r) => r.id);

    // =====================
    // GET MATCHED IDEAS
    // =====================
    const mongoose = require("mongoose");

    const objectIds = recommendedIds.map(
      (id) => new mongoose.Types.ObjectId(id),
    );

    const recommendedIdeas = await Idea.find({
      _id: { $in: objectIds },
    });

    // =====================
    // SORT BY AI ORDER
    // =====================
    const sortedIdeas = recommendedIds
      .map((id) =>
        recommendedIdeas.find((idea) => idea._id.toString() === id.toString()),
      )
      .filter(Boolean);

    // =====================
    // RESPONSE
    // =====================
    res.status(200).json({
      message: "Ideas recommended successfully",

      count: sortedIdeas.length,

      ideas: sortedIdeas,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
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
        message: "Idea not found",
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

      status: "pending",
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

      project,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};

exports.checkIdeaSimilarity = async (req, res) => {
  try {
    
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctor can add ideas",
      });
    }

    const { title, description, tools, specialization } = req.body;

  
    if (
      !title ||
      !description ||
      !specialization ||
      specialization.length === 0
    ) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    let similarity = 0;

    let similarProject = null;


    const previousProjects = await PreviousProject.find();

    const currentProjects = await CurrentProject.find();

    const allProjects = [...previousProjects, ...currentProjects].filter(
      (p) => p.description,
    );

    const result = await checkAISimilarity(description, allProjects);

    similarity = result.similarity;

    similarProject = result.similarProject;

    res.status(200).json({
      allowed: similarity < 80,
      similarity,
      similarProject,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};

exports.addIdea = async (req, res) => {
  try {

    const { title, description, specialization } = req.body;

    if (!title || !description || !specialization) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const idea = await Idea.create({
      title,

      description,

      specialization,

      doctor_id: req.user.id,
    });

    res.status(201).json({
      message: "Idea added successfully",

      idea,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getMyIdeas = async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctor",
      });
    }

    const ideas = await Idea.find({
      doctor_id: req.user.id,
    }).sort({
      createdAt: -1,
    });


    res.status(200).json({
      message: "Doctor ideas",

      count: ideas.length,

      ideas,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};

exports.deleteIdea = async (req, res) => {
  try {

    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctor can delete ideas",
      });
    }

  
    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({
        message: "Idea not found",
      });
    }


    if (idea.doctor_id.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You can delete only your ideas",
      });
    }


    await Idea.findByIdAndDelete(req.params.id);


    res.status(200).json({
      success: true,

      message: "Idea deleted successfully",
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};
