const Joi = require("joi");

const userSchema = Joi.object({

// collegeCode: Joi.number().integer().min(100000000).max(999999999).required(),
  name: Joi.string().required(),

  email: Joi.string().email().optional(),

  password: Joi.string().min(6).required(),

  role: Joi.string().valid("doctor", "ta", "admin", "library").required()
});

module.exports = userSchema;