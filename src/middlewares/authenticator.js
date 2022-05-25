/* eslint-disable class-methods-use-this */
const jwt = require('jsonwebtoken');
const configObj = require('../config');
const { errorResponse } = require('../utils/responses.js');

const unauthorizedResponse = (res, err, message = 'You do not have enough permission to access this resource') => errorResponse(res, 403, err, message);

class Middlewares {
  constructor(config = configObj) {
    this.config = config;
    this.logger = this.config.logger;
    this.verifyAllUserToken = this.verifyAllUserToken.bind(this);
    this.optionalTokenCheck = this.optionalTokenCheck.bind(this);
  }

  async verifyAllUserToken(req, res, next) {
    const { authorization } = req.headers;
    if (!authorization) {
      return errorResponse(res, 403, 'NO_TOKEN_FOUND', 'Unauthorized. No token found in header');
    }
    try {
      // Check for falsy value or set
      const jwtToken = authorization ? authorization.split(' ')[1] : undefined;

      // TODO: Check for malformed token
      // const validAPIKEY = apiKey && apiKey.split('.').length === 3;
      // const validToken = jwtToken && jwtToken.split('.').length === 3;
      if (!jwtToken) { // Valid JWT Check
        return errorResponse(res, 400, { token: 'TOKEN_ERROR' }, 'Token not formatted properly');
      }
      if (jwtToken) {
        req.user = jwt.verify(jwtToken, this.config.SECRET_KEY);
        // we are supposed to use the data here for next level stuff!
        return next();
      }
      return unauthorizedResponse(res);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return unauthorizedResponse(res, 'EXPIRED_TOKEN', error.message);
      } if (error instanceof jwt.JsonWebTokenError) {
        return unauthorizedResponse(res, 'INVALID_OR_BAD_TOKEN', error.message);
      }
      return errorResponse(res, 'UNKNOWN_ERROR_OCURRED', error.message);
    }
  }

  async optionalTokenCheck(req, res, next) {
    req.user = {};
    const { authorization } = req.headers;
    try {
      // Check for falsy value or set
      const jwtToken = authorization ? authorization.split(' ')[1] : undefined;

      if (!jwtToken) { // Valid JWT Check
        return next();
      }
      if (jwtToken) {
        req.user = jwt.verify(jwtToken, this.config.SECRET_KEY);
        // we are supposed to use the data here for next level stuff!
        return next();
      }
      return unauthorizedResponse(res);
    } catch (error) {
      req.user = {};
      return next();
    }
  }

  verifySuperAdmin(req, res, next) {
    if (req.user.is_admin) {
      return next();
    }
    return unauthorizedResponse(res, { err: 'UNAUTHORIZED' });
  }

  // verifyWorkSpaceOwner(req, res, next) {
  //   if (req.user.role === 'WORKSPACE_OWNER') {
  //     return next();
  //   }
  //   return unauthorizedResponse(res);
  // }

  verifyMe(req, res, next) {
    const id = req.params.user_id || req.query.user_id;
    if (id === null || id === undefined || id === '') {
      return unauthorizedResponse(
        res,
        'INVALID_REQUEST_DATA',
        'No request ID found',
      );
    }

    if (req.user._id === id) {
      return next();
    }
    return unauthorizedResponse(res);
  }

  verifyUser(req, res, next) {
    if (!req.user.is_admin) {
      return next();
    }
    return unauthorizedResponse(res);
  }

  verifySuperAdminDevOrStaff(req, res, next) {
    const { role } = req.user;
    if (role === 'SUPER_ADMIN' || role === 'DEVELOPER' || role === 'STAFF') {
      return next();
    }
    return unauthorizedResponse(res);
  }

  /**
  * Verifies the role of the user using the role closure
  *
  * @author Yusuff Mustapha
  * @param {Array} roles - The authorized user type
  * @returns {String} - random string
  */
  verifyRoles(roles = [], me = false) {
    return (req, res, next) => {
      if (!roles.length) return unauthorizedResponse(res);
      if (roles.includes(req.user.role)) return next();
      if (me) {
        const id = req.params.id || req.query.id || undefined;
        return id ? next() : unauthorizedResponse(res, 'INVALID_DATA', 'No request ID found');
      }
      return unauthorizedResponse(res);
    };
  }
}

module.exports = new Middlewares();
