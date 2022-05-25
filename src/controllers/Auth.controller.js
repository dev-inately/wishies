const { pick, isEmpty } = require('lodash');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models/user.model');
const { Auth } = require('../models/auth.model');
const { successResponse } = require('../utils/responses');
// const randomStringGen = require('../utils/randomStringGen');

class AuthController {
  constructor(dependencies = {}) {
    this.dependencies = dependencies;
    this.logger = this.dependencies.logger;
    this.e = this.dependencies.errors;
    this.secretKey = this.dependencies.env.SECRET_KEY;
    this.login = this.login.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.verifySMSCode = this.verifySMSCode.bind(this);
    this.generateSMSCode = this.generateSMSCode.bind(this);

    // this.forgotPassword = this.forgotPassword.bind(this);
    // this.confirmEmailAddress = this.confirmEmailAddress.bind(this);
    // this.resetUserPassword = this.resetUserPassword.bind(this);
  }

  async login(req, res) {
    const id = req.body.identifier
    const user = await User.findOne({ $and: [ { $or: [{email: id },{phone_number: id}] } ]}).lean();
    if (isEmpty(user)) {
      throw new this.e.UnauthorizedError('User not found. Please check your credentials',
        { statusCode: 401 });
    }
    if (user.status === 'SUSPENDED') {
      this.logger.info(`User with email ${req.body.email} is blocked and tried to login`);
      throw new this.e.UnauthorizedError('You have been suspended and cant login to this system', { statusCode: 401 });
    }

    const userCredentials = await Auth.findOne({ user: user._id.toString() }).lean();
    const checkPassword = await bcrypt.compare(req.body.password, userCredentials.password);
    if (!checkPassword) {
      this.logger.info(`User with email ${user.phone_number} tried to sign in with a wrong password`);
      throw new this.e.UnauthorizedError('Account details supplied is incorrect, please check and try again',
        { statusCode: 401 });
    }
    const token = this.constructor.generateToken(user);
    this.logger.info(`User with email ${req.body.email} signed in successfully.`);
    return successResponse(res, 200, { user_data: user, token, expires: '7 day' }, 'Login successful');
  }

  async changePassword(req, res) {
    this.logger.info('Request to change user password');
    if (req.body.old_password === req.body.new_password) {
      throw new this.e.BadRequestError('Cannot change password to old password');
    }
    const user = await Auth.findOne({ user: req.user._id });
    if (isEmpty(user)) throw new this.e.DocumentMissingError('User not found');
    const passmatch = await bcrypt.compare(req.body.old_password, user.password);

    if (!passmatch) throw new this.e.BadRequestError('Incorrect old password. Unable to change password');

    user.old_passwords.push(user.password);
    user.markModified('old_passwords');
    user.password = req.body.new_password;
    await user.save();
    this.logger.info('Password changed successfully');
    return successResponse(res, 202, {}, 'Password changed successfully');
  }
  
  async verifySMSCode(req, res) {
    this.logger.info('Request to verify sms code');
    const [user, auth ] = await Promise.all([User.findById(req.user._id), Auth.findOne({ user: req.user._id }) ]);

    if (isEmpty(user)) throw new this.e.DocumentMissingError('User not found');
    if (user.status === 'ACTIVE') return successResponse(res, 200, {}, "User verified already");
    
    if (!auth.verification.token || new Date() > auth.verification.expires) {
      throw new this.e.BadRequestError("Verification code has expired, please request for another");
    }
    if (req.body.token !== auth.verification.token) {
      throw new this.e.BadRequestError(
        "Incorrect verification code"
      );
    }
    user.status = 'ACTIVE'
    auth.verification.token = null
    auth.verification.expires =  null
    await Promise.all([user.save(), auth.save()]);
    this.dependencies.notifier.notify({
      user: user._id,
      text: "You account has been verified successfully",
      body: "You account has been verified successfully. You now have full access to the platform",
    });


    this.logger.info('Account verified successfully');
    return successResponse(res, 200, {}, 'Account verified successfully');
  }  
  
  async generateSMSCode(req, res) {
    this.logger.info('Request to generate verification code');

    // call the random number generator service here
    const [user, auth ] = await Promise.all([User.findById(req.user._id), Auth.findOne({ user: req.user._id }) ]);

    if (isEmpty(user)) throw new this.e.DocumentMissingError('User not found');
    if (user.status === 'ACTIVE') return successResponse(res, 200, {}, "User verified already");
    
    // 30 minutes expiry
    auth.verification.token = 11111
    auth.verification.expires = new Date().setMinutes(new Date().getMinutes()+ 30) 
    // call sms service here
    await auth.save();


    this.logger.info('Sms sent successfully');
    return successResponse(res, 200, {}, 'SMS sent successfully');
  }

  static generateToken(payload, expiresIn = process.env.EXPIRES_IN || '700d') {
    return jwt.sign(payload,
      process.env.SECRET_KEY, { expiresIn });
  }
}

module.exports = AuthController;
