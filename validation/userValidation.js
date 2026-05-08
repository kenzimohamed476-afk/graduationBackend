const Joi = require("joi");

const userSchema = Joi.object({

  name: Joi.string().required(),

  email: Joi.string()
    .email()
    .required(),

  password: Joi.string()
    .min(6)
    .required(),

  specialization:
    Joi.string().optional(),

  role: Joi.string()
    .valid(
      "doctor",
      "ta",
      "admin",
      "library"
    )
    .required()

});

module.exports = userSchema;