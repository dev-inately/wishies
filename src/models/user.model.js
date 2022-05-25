const { Schema, model, Types } = require('mongoose');
const { DEFAULT_PROFILE_IMG, USER_ROLES, USER_STATUS } = require('../utils/constants');

const userSchema = new Schema({
  first_name: {
    type: String,
    maxlength: 60,
    trim: true,
  },
  last_name: {
    type: String,
    maxlength: 60,
    trim: true,
  },
  email: {
    type: String,
    maxlength: 60,
    trim: true,
    lowercase: true,
  },
  phone_number: {
    type: String,
    maxlength: 15,
    required: true
    // regex this later
    // validate: () {}
  },
  profile_img: {
    type: String,
    maxlength: 200,
    default: DEFAULT_PROFILE_IMG,
  },
  role: {
    type: String,
    enum: USER_ROLES,
    default: 'CUSTOMER',
  },
  is_admin: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    default: 'UNVERIFIED',
    enum: USER_STATUS,
  },
  is_onboarded: {
    type: Boolean,
    default: false
  },
},

{ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = {
  userSchema,
  User: model('user', userSchema),
};
