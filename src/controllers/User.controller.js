const { pick, isEmpty, omit } = require('lodash');
const { User } = require('../models/user.model');
const { Auth } = require('../models/auth.model');
const AuthController = require('./Auth.controller');
const {
  successResponse,
} = require('../utils/responses');

class UserController {
  constructor(dependencies = {}) {
    this.dependencies = dependencies;
    this.logger = dependencies.logger;
    this.e = this.dependencies.errors;
    this.createUser = this.createUser.bind(this);
    this.getAllUsers = this.getAllUsers.bind(this);
    this.me = this.me.bind(this);
    this.getUsersById = this.getUsersById.bind(this);
    this.suspendUser = this.suspendUser.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.getNotifications = this.getNotifications.bind(this);
    // this.hardDeleteUser = this.hardDeleteUser.bind(this);
    // this.unBlockUser = this.unBlockUser.bind(this);
    // this.deleteUser = this.deleteUser.bind(this);
    // this.getUsers = this.getUsers.bind(this);
  }

  async createUser(req, res) {
    const userExists = await User.findOne({ phone_number: req.body.phone_number });
    if (!isEmpty(userExists)) throw new this.e.BadRequestError('User already exists');

    // FAWN this two requests later
    const savedUser = await User.create(req.body);

    await Auth.create({ 
      user: savedUser._id.toString(),
      password: req.body.password,
       verification: {
        token: 11111,
        expires: new Date().setMinutes(new Date().getMinutes() + 30),
     }});
    this.dependencies.notifier.notify({ user: savedUser._id, text: 'You are not verified yet',
     body: 'Please verify your account' })
    const response = { user_data: savedUser, token: AuthController.generateToken(savedUser.toObject()) }
    this.logger.info(`Users: -> ${savedUser.phone_number} created successfully.`);
    return successResponse(res, 201, response, 'Registration successful');
  }

  async createStaff(req, res) {
    if (!req.user.is_admin) {
      req.body.role = 'CUSTOMER';
    }
    req.body.roles = [req.body.role];
    const savedUser = await User.create(req.body);
    await Auth.create({ user: savedUser._id.toString(), password: req.body.password });
    this.logger.info(`Users: -> ${savedUser.phone_number} created successfully.`);
    return successResponse(res, 201, savedUser, 'Registration successful');
  }

  async getAllUsers(req, res) {
    const options = {};
    if (req.query.user_type && req.query.user_type.toLowerCase() === 'customer') {
      options.role = 'CUSTOMER';
    }
    if (req.query.user_type && req.query.user_type.toLowerCase() === 'staff') {
      options.role = { $ne: 'CUSTOMER' };
    }
    const users = await User.find(options).lean();
    this.logger.info('All Users fetched successfully.');
    return successResponse(res, 200, users || [], 'Users fetched successfully');
  }

  async me(req, res) {
    const user = await User.findById(req.user._id).lean();
    if (isEmpty(user)) throw new this.e.DocumentMissingError('User surprisingly not found!');
    this.logger.info('User fetched successfully.');
    return successResponse(res, 200, user, 'User details fetched successfully');
  }

async getNotifications(req, res) {
    const notifications = await this.dependencies.notifier.get(req.user._id)
    this.logger.info('notifcations fetched successfully.');
    return successResponse(res, 200, notifications, 'notifications fetched successfully');
  }


  async getUsersById(req, res) {
    this.logger.info('Request to fetch for users');
    const user = await User.findById(req.params.user_id).lean();
    if (isEmpty(user)) {
      throw new this.e.DocumentMissingError('User not found');
    }
    this.logger.info('User fetched successfully.');
    return successResponse(res, 200, user, 'User fetched successfully');
  }

  async updateUser(req, res) {
    this.logger.info('Request to update user');
    const user = await User.findByIdAndUpdate(req.params.user_id, req.body, { new: true });
    if (isEmpty(user)) {
      throw new this.e.DocumentMissingError('User not found');
    }
    this.logger.info('User updated successfully.');
    return successResponse(res, 200, user, 'User updated successfully');
  }

  async suspendUser(req, res) {
    this.logger.info('Request to suspend user');
    const user = await User.findById(req.params.user_id);
    if (isEmpty(user)) {
      throw new this.e.DocumentMissingError('User not found');
    }
    user.status = user.status !== 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE';
    const action = user.status === 'SUSPENDED' ? 'suspended' : 'is activated';
    const savedUser = await user.save();
    this.logger.info(`User ${action} successfully.`);
    return successResponse(res, 200, savedUser, `User ${action} successfully`);
  }
}

module.exports = UserController;
