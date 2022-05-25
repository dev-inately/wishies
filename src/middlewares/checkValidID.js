const Joi = require('joi');
const { errorResponse } = require('../utils/responses');
/**
* Checks if the id in the request query or request params
* is a valid MongoDB ID
*
* @author Yusuff Mustapha
*/
module.exports = (req, res, next) => {
  const id = Object.keys(req.params).filter((key) => key.endsWith('_id'))[0];
  const MongoDBIDSchema = Joi.string().regex(/^[a-fA-F0-9]{24}$/)
    .message('Supplied ID is not valid in the request path.');
  const { error } = MongoDBIDSchema.validate(req.params[id]);
  return error ? errorResponse(res, 422, { error: 'INVALID_ID' }, error.message) : next();
};
