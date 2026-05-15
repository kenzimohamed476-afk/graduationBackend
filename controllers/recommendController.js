const Idea = require("../models/idea");

// ==========================
// RECOMMEND IDEAS
// ==========================
exports.recommendIdeas = async (req, res) => {

  try {

    const {
      specializations
    } = req.body;

    if (
      !specializations ||
      specializations.length === 0
    ) {

      return res.status(400).json({
        message:
          "Specializations required"
      });
    }

    const ideas = await Idea.find({

      specialization: {
        $in: specializations
      }

    }).limit(10);

    res.json({

      message:
        "Ideas recommended successfully",

      count: ideas.length,

      ideas

    });

  } catch (err) {

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