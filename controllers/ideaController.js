const Idea = require('../models/idea');
const axios = require('axios');

exports.addIdea = async (req, res) => {
try {

    const {
    Name,
    Year,
    Supervisors,
    Tools,
    Specialization,
    Introduction,
    FutureWork
    } = req.body;


    const ideas = await Idea.find();

    
    const previousDescriptions = ideas
        .map(i => i.Introduction)
        .filter(Boolean); 
    const response = await axios.post(
    'https://naively-uninvoked-zane.ngrok-free.dev/check-duplication',
    {
        problem: Introduction,
        previousIdeas: previousDescriptions
    }
    );

    const aiData = response.data;

    // لو الفكرة مكررة
    if (aiData.status === "rejected") {
    return res.status(400).json({
        message: "Idea is too similar",
        duplicates: aiData.duplicates
    });
    }

    const savedIdea = await Idea.create({
        Name,
        Year,
        Supervisors,
        Tools,
        Specialization,
        Introduction,
        FutureWork
    });

    res.status(201).json({
        message: "Idea saved successfully",
        savedIdea
    });

    } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: "Server Error" });
    }
};
