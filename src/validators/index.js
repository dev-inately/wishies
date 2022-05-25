// const baseValidator = require('./base');

// const USER_RULE = require('./user.rules');
// const AUTH_RULE = require('./auth.rules');

// module.exports = {
//   createUser: (req, res, next) => baseValidator(USER_RULE.createUserSchema, req, res, next),
//   login: (req, res, next) => baseValidator(AUTH_RULE.loginSchema, req, res, next),
//   updateUser: (req, res, next) => baseValidator(USER_RULE.updateUserSchema, req, res, next),
//   changePassword: (req, res, next) => baseValidator(AUTH_RULE.changePasswordSchema, req, res, next),
//   verifyToken: (req, res, next) => baseValidator(AUTH_RULE.verifyTokenSchema, req, res, next),
// };

// // const RULES = {
// //   USER_RULE,
// //   AUTH_RULE,
// // };

// // module.exports = (rule, req, res, next) => {
// //   const y = Object.keys(RULES).filter((x) => RULES[x][rule] || RULES[x][`${rule}Schema`]);
// //   if (!y) throw new Error('Rule doesn\'t exist. Please check the rule name!');
// //   return baseValidator(y, req, res, next);
// // };



/* eslint-disable import/no-dynamic-require */
const path = require('path');
const fs = require('fs');
const baseValidator = require('./base');

const allRules = {};
const rules = fs.readdirSync(path.join(__dirname));

rules.forEach((h) => {
  // eslint-disable-next-line global-require
  const validator = require(`./${h}`);
  Object.keys(validator).forEach((rule) => {
    allRules[rule] = (req, res, next) => baseValidator(validator[rule], req, res, next);
  });
});

function get(name) {
  if (!allRules[name]) {
    throw new Error(`Invalid Rule Name ${name}`);
  }
  return allRules[name];
}

module.exports = get;
