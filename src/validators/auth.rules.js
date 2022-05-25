const Joi = require('joi');
const { omit } = require('lodash');

const requiredString = Joi.string().required();
const requiredNumber = Joi.string().required();
const mongoID = Joi.string().regex(/^[a-fA-F0-9]{24}$/);
const keys = (object) => Joi.object().keys(object);

const login = keys({
  password: requiredString.min(8).max(50).description('User\'s password (8 min, 50 characters max)'),
  identifier: Joi.alternatives(
    requiredString.email().max(50).description('User\'s valid email address'),
    requiredNumber.max(11).description('User\'s valid phone number'),
  )
  //  requiredString.email().max(50).description('User\'s valid email address'),
});

const changePassword = keys({
  new_password: requiredString.min(8).max(50).description('User\'s password (8 min, 50 characters max)'),
  old_password: requiredString.min(8).max(50).description('User\'s password (8 min, 50 characters max)'),
});

const verifyToken = keys({
  token: requiredNumber.length(5).description('Verification token code')
})

module.exports = { login, changePassword, verifyToken };
