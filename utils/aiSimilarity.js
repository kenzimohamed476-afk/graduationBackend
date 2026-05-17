const axios = require("axios");

exports.checkAISimilarity = async (description, projects) => {
let similarity = 0;

let similarProject = null;

try {
    const response = await axios.post(
    "https://earnest-energy-production-aa56.up.railway.app/check",

    {
        problem: description,

    projects: projects.map((p) => ({
        id: p._id.toString(),

        description: p.description,
        })),
    },
    );

    const results = response.data.results || [];

    for (let rec of results) {
    const sim = Number(rec.similarity);

    if (sim > similarity) {
        similarity = sim;

        similarProject = rec;
    }
    }
} catch (err) {
    console.log("AI ERROR:", err.message);
}

return {
    similarity,
    similarProject,
};
};