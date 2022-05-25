const { Schema, model } = require('mongoose');
const bcrypt = require('bcrypt');
const { SALT_ROUNDS } = require('../config');

const AuthModelSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  old_passwords: [
    {
      type: String,
      default: [],
    },
  ],
  verification: {
    token: {
      type: String,
    },
    expires: {
      type: Number,
      default: 0,
    },
  },
  reset_password: {
    token: {
      type: String,
    },
    expires: {
      type: Number,
      default: 0,
    },
  },
});

AuthModelSchema.index({ user: 1 });

// eslint-disable-next-line func-names
AuthModelSchema.pre('save', function (next) {
  if (!this.isModified('password')) return next();
  this.password = bcrypt.hashSync(this.password, parseInt(SALT_ROUNDS, 10));
  return next();
});


module.exports = {
  AuthModelSchema, // So schema can be reused in multi db setup
  Auth: model('auth', AuthModelSchema),
};
