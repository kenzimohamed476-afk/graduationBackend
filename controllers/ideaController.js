const Idea = require("../models/idea");
const axios = require("axios");


// =====================
// UPDATE STATUS
// =====================
exports.updateStatus = async (req, res) => {
  try {

    const { status } = req.body;

    // لو rejected نحذف الفكرة
    if (status === "rejected") {
      await Idea.findByIdAndDelete(req.params.id);

      return res.json({
        message: "Idea rejected and deleted",
      });
    }

    // لو accepted نخليها active
    const idea = await Idea.findByIdAndUpdate(
      req.params.id,
      { status: "accepted" },
      { new: true }
    );

    res.json({
      message: "Idea accepted and active",
      idea,
    });

  } catch (err) {
    res.status(500).json(err.message);
  }
};


// =====================
// ADD IDEA
// =====================
exports.addIdea = async (req, res) => {
  try {
    console.log(req.body);


    const {
      Name,
      Year,
      Supervisors,
      Tools,
      Specialization,
      Introduction,
      FutureWork,
    } = req.body;

    const ideas = await Idea.find();

    const previousDescriptions = ideas
      .map((i) => i.Introduction)
      .filter(Boolean);

    const response = await axios.post(
      "https://naively-uninvoked-zane.ngrok-free.dev/check-duplication",
      {
        problem: Introduction,
        previousIdeas: previousDescriptions,
      }
    );

    const aiData = response.data;

    // 👇 نحسب أعلى نسبة similarity
    let maxSimilarity = 0;

    if (aiData.duplicates && aiData.duplicates.length > 0) {
      maxSimilarity = Math.max(
        ...aiData.duplicates.map(d => d.similarity_percentage)
      );
    }

    // ❌ لو أكبر من 80% نرفض
    if (maxSimilarity > 80) {
      return res.status(400).json({
        message: "Idea is too similar",
        similarity: maxSimilarity,
        duplicates: aiData.duplicates,
      });
    }

    // ✅ لو أقل من 80% تتحفظ pending
    const savedIdea = await Idea.create({
      Name,
      Year,
      Supervisors,
      Tools,
      Specialization,
      Introduction,
      FutureWork,
      status: "pending",
    });

    res.status(201).json({
      message: "Idea saved",
      status: "pending",
      savedIdea,
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: "Server Error" });
  }
};
;
