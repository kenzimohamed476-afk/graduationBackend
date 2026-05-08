const Joi = require("joi");

const studentSchema = Joi.object({
  name: Joi.string().required(),


  password: Joi.string().min(6).required(),

  phone: Joi.string().pattern(/^[0-9]{11}$/).required(),

  collegeCode: Joi.number().integer().min(100000000).max(999999999).required(),

  // not required
  specialization: Joi.string().valid(
    "Backend",
    "Frontend",
    "Mobile",
    "AI",
    "IoT",
    "Network",
    "Cyber Security"
  ),

  isLeader: Joi.boolean().optional()
});

module.exports = studentSchema;