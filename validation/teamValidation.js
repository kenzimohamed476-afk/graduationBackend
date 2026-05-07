const Joi = require("joi");

exports.createTeamSchema = Joi.object({
name: Joi.string().required(),
leader_collegeCode: Joi.number().integer().required()
});


// ADD MEMBER VALIDATION

exports.addMemberSchema = Joi.object({
team_id: Joi.string().required(),
student_collegeCode: Joi.number().integer().required()
});