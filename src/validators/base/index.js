const { ValidationError } = require('../../utils/errors');

const baseValidator = (schema, req, res, next) => {
  // Send error one by one, so i will know if you're doing trial and error
  // so as to kick you out fast with rate limiter
  const { error, value } = schema.validate(req.body);
  if (error) {
    delete error._original;
    // Send to global Error handler
    throw new ValidationError(error.details[0].message, { statusCode: 422, errors: error });
  }
  req.rawBody = req.body;
  req.body = value;
  next();
};

module.exports = baseValidator;
