const Idea = require("../models/idea");

// ==========================
// RECOMMEND IDEAS
// ==========================
exports.recommendIdeas = async (req, res) => {
  try {
    const { specializations } = req.body;

    // validation
    if (!specializations || specializations.length === 0) {
      return res.status(400).json({
        message: "Specializations required",
      });
    }

    // allowed specializations
    const allowedSpecs = [
      "AI",
      "Web",
      "Mobile",
      "Cyber Security",
      "Data Science",
    ];

    const isValid = specializations.every((spec) =>
      allowedSpecs.includes(spec),
    );

    if (!isValid) {
      return res.status(400).json({
        message: "Invalid specialization",
      });
    }

    // 🧠 aggregation (safe ضد null)
    const ideas = await Idea.aggregate([
      {
        $addFields: {
          matchCount: {
            $size: {
              $setIntersection: [
                { $ifNull: ["$specializations", []] }, // 🔥 fix null
                specializations,
              ],
            },
          },
        },
      },
      {
        $match: {
          matchCount: { $gt: 0 },
        },
      },
      {
        $sort: { matchCount: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // random 5
    const shuffled = ideas.sort(() => 0.5 - Math.random());
    const recommendedIdeas = shuffled.slice(0, 5);

    // response
    res.json({
      message: "Ideas recommended successfully",
      count: recommendedIdeas.length,
      ideas: recommendedIdeas,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
