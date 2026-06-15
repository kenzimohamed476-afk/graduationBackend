const Joi = require("joi");

const studentSchema = Joi.object({
  name: Joi.string().required(),

  password: Joi.string().min(6).required(),

  phone: Joi.string().pattern(/^[0-9]{11}$/).required(),
  email: Joi.string().email().required(),
  collegeCode: Joi.number().integer().min(10000000).max(99999999).required(),

  specialization: Joi.string().valid(
    "Backend",
    "Frontend",
    "Mobile",
    "AI",
    "IoT",
    "Network",
    "Cyber Security",
  ),

  isLeader: Joi.boolean().optional(),
});

module.exports = studentSchema;
