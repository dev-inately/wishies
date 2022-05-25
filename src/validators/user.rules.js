const Joi = require('joi');
const { omit } = require('lodash');

const requiredString = Joi.string().required();
const requiredNumber = Joi.string().required();
const mongoID = Joi.string().regex(/^[a-fA-F0-9]{24}$/);
const keys = (object) => Joi.object().keys(object);

const createUser = keys({
  first_name: requiredString.max(60).description('User\'s first name (60 characters max)'),
  last_name: requiredString.max(60).description('User\'s last name (60 characters max)'),
  password: requiredString.min(8).max(50).description('User\'s password (8 min, 50 characters max)'),
  email: Joi.string().email().max(50).description('User\'s valid email address'),
  country: Joi.string().default('NG'),
  state: Joi.string().default('UNKNOWN'),
  phone_number: requiredString.max(11).description('User\'s valid phone number'),
  role: Joi.string().default('CUSTOMER').description('The role of the user to created'),
  meta: Joi.object(),
  address: Joi.string().allow('', null),
});

const updateUser = keys({
  first_name: Joi.string().max(60).description('User\'s first name (60 characters max)'),
  last_name: Joi.string().max(60).description('User\'s last name (60 characters max)'),
  phone_number: Joi.string().max(15).description('User\'s valid phone number'),
  profile_img: Joi.string(),
  meta: Joi.object(),
  address: Joi.string().allow('', null),
  country: Joi.string().default('NG'),
  state: Joi.string().default('UNKNOWN'),
});

module.exports = { createUser, updateUser };
