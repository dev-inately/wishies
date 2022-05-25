const request = require('supertest');
const _ = require('lodash');
const testData = require('./test-data');
const db = require('./db');

const app = require('../src/app');
const { superAdmin } = require('./test-data');

let server;
/**
 * Connect to a new in-memory database before running any tests.
 */
beforeAll(async () => {
  await db.connect();
  const connection = db.getDB();
  testData.sampleSuperAdmin.roles = [testData.sampleSuperAdmin.role];
  const result = await connection.models.user.create(testData.sampleSuperAdmin);
  testData.superAdmin = result.toObject();
  await connection.models.auth.create({
    user: testData.superAdmin._id,
    password: testData.sampleSuperAdmin.password,
  });
  server = request(app);
});

/**
 * Remove and close the db and server.
 */
afterAll(async () => {
  await db.clearDatabase();
  await db.closeDatabase();
});

describe('Home', () => {
  it('should get home', async () => {
    const res = await server
      .get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message');
  });
});

describe('Authentication', () => {
  it('should not login -> No user found', async () => {
    const res = await server
      .post('/api/v1/auth/login')
      .send(_.pick(testData.sampleCustomer, ['email', 'password']));

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('status');
    expect(res.body.error).not.toBeNull();
    expect(res.body.message).toEqual('User not found. Please check your credentials');
  });

  it('should not login -> Credentials incorrect', async () => {
    const incorrectCred = { ...testData.sampleSuperAdmin, ...{ password: '!adminPassword' } };
    const res = await server
      .post('/api/v1/auth/login')
      .send(_.pick(incorrectCred, ['email', 'password']));

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('status');
    expect(res.body.error).not.toBeNull();
    expect(res.body.message).toEqual('Account details supplied is incorrect, please check and try again');
  });

  it('should login super admin', async () => {
    const res = await server
      .post('/api/v1/auth/login')
      .send(_.pick(testData.sampleSuperAdmin, ['email', 'password']));

    // Save the credentials here!
    testData.superAdmin.token = res.body.data.token;
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('status');
    expect(res.body.data.token).not.toBeNull();
    expect(res.body.data.token.length).toBeGreaterThan(30);
    expect(res.body.data.user_data.email).toEqual(testData.sampleSuperAdmin.email);
    expect(res.body.data.user_data.first_name).toEqual(testData.sampleSuperAdmin.first_name);
    expect(res.body.data.user_data.last_name).toEqual(testData.sampleSuperAdmin.last_name);

    expect(res.body.data.user_data._id).toEqual(testData.superAdmin._id.toString());
    expect(res.body.message).toEqual('Login successful');
  });
});

describe('Users', () => {
  describe('User Creation', () => {
    it('should create customer', async () => {
      const res = await server
        .post('/api/v1/auth/register')
        .send(testData.sampleCustomer);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).not.toBeNull();
    });

    it('should not create user -> Missing email', async () => {
      const res = await server
        .post('/api/v1/auth/register')
        .send(_.omit(testData.sampleCustomer, ['email']));

      expect(res.statusCode).toEqual(422);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('error');
      expect(res.body.status).toEqual('fail');

      expect(res.body.message).toEqual('"email" is required');
    });

    it('should not create user -> Duplicate email', async () => {
      const res = await server
        .post('/api/v1/auth/register')
        .send(testData.sampleCustomer);

      expect(res.statusCode).toEqual(400);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('error');
      expect(res.body.status).toEqual('fail');

      expect(res.body.message).toEqual('User already exists');
    });

    it('should not create supervisor -> Missing admin token', async () => {
      const res = await server
        .post('/api/v1/auth/add-staff')
        .send(testData.sampleSupervisor);

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('status');
      expect(res.body.status).toEqual('fail');
      expect(res.body.error).not.toBeNull();
    });

    it('should create supervisor', async () => {
      const res = await server
        .post('/api/v1/auth/add-staff')
        .set('Authorization', `Bearer ${testData.superAdmin.token}`)
        .send(testData.sampleSupervisor);
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).not.toBeNull();

      expect(res.body.data.email).toEqual(testData.sampleSupervisor.email);
      expect(res.body.data.first_name).toEqual(testData.sampleSupervisor.first_name);
      expect(res.body.data.last_name).toEqual(testData.sampleSupervisor.last_name);
      expect(res.body.data.roles).toContain(testData.sampleSupervisor.role);
      expect(res.body.message).toEqual('Registration successful');
    });

    it('should create visa officer', async () => {
      const res = await server
        .post('/api/v1/auth/add-staff')
        .set('Authorization', `Bearer ${testData.superAdmin.token}`)
        .send(testData.sampleVisaOfficer);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).not.toBeNull();

      expect(res.body.data.email).toEqual(testData.sampleVisaOfficer.email);
      expect(res.body.data.first_name).toEqual(testData.sampleVisaOfficer.first_name);
      expect(res.body.data.last_name).toEqual(testData.sampleVisaOfficer.last_name);
      expect(res.body.data.roles).toContain(testData.sampleVisaOfficer.role);
      expect(res.body.message).toEqual('Registration successful');
    });

    it('should create accountant', async () => {
      const res = await server
        .post('/api/v1/auth/add-staff')
        .set('Authorization', `Bearer ${testData.superAdmin.token}`)
        .send(testData.sampleAccountant);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).not.toBeNull();

      expect(res.body.data.email).toEqual(testData.sampleAccountant.email);
      expect(res.body.data.first_name).toEqual(testData.sampleAccountant.first_name);
      expect(res.body.data.last_name).toEqual(testData.sampleAccountant.last_name);
      expect(res.body.data.roles).toContain(testData.sampleAccountant.role);
      expect(res.body.message).toEqual('Registration successful');
    });

    it('should login supervisor', async () => {
      const res = await server
        .post('/api/v1/auth/login')
        .send(_.pick(testData.sampleSupervisor, ['email', 'password']));

      // Save the credentials here!
      testData.supervisor.token = res.body.data.token;
      Object.assign(testData.supervisor, res.body.data.user_data);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('status');

      expect(res.body.data.token).not.toBeNull();
      expect(res.body.data.token.length).toBeGreaterThan(30);
      expect(res.body.data.user_data.email).toEqual(testData.sampleSupervisor.email);
      expect(res.body.data.user_data.first_name).toEqual(testData.sampleSupervisor.first_name);
      expect(res.body.data.user_data.last_name).toEqual(testData.sampleSupervisor.last_name);

      expect(res.body.message).toEqual('Login successful');
    });

    it(
      'should not create visa-officer -> supervisor doesnt have permission to-> will create customer instead',
      async () => {
        const res = await server
          .post('/api/v1/auth/add-staff')
          .set('Authorization', `Bearer ${testData.supervisor.token}`)
          .send({ ...testData.sampleVisaOfficer, email: 'another-supervisor@email.com' });

        expect(res.statusCode).toEqual(403);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('status');

        expect(res.body.error).not.toBeNull();
        expect(res.body.status).toEqual('fail');

        expect(res.body.message).toEqual('You do not have enough permission to access this resource');
      },
    );
  });

  describe('User Fetch Request', () => {
    it('should fetch all user', async () => {
      const res = await server
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${testData.superAdmin.token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('status');

      expect(res.body.message).toEqual('Users fetched successfully');
    });

    it('should fetch only fetch CUSTOMER', async () => {
      const res = await server
        .get('/api/v1/users?user_type=customer')
        .set('Authorization', `Bearer ${testData.superAdmin.token}`);

      // Save the credentials here!
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('status');
      res.body.data.forEach((user) => {
        expect(user.roles).toContain('CUSTOMER');
      });

      expect(res.body.message).toEqual('Users fetched successfully');
    });

    it('should fetch only Staffs', async () => {
      const res = await server
        .get('/api/v1/users?user_type=staff')
        .set('Authorization', `Bearer ${testData.superAdmin.token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('status');
      res.body.data.forEach((user) => {
        expect(user.roles).not.toContain('CUSTOMER');
      });

      expect(res.body.message).toEqual('Users fetched successfully');
    });

    it('should not fetch all user -> Not an admin', async () => {
      const res = await server
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${testData.supervisor.token}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('status');

      expect(res.body.error).not.toBeNull();
      expect(res.body.status).toEqual('fail');

      expect(res.body.message).toEqual('You do not have enough permission to access this resource');
    });

    it('should fetch admin details', async () => {
      const res = await server
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${testData.superAdmin.token}`);

      // Save the credentials here!
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('status');
      const superAdminDetails = _.omit(testData.superAdmin, ['token', '__v', 'role', '$__', 'created_at', 'updated_at']);

      Object.keys(superAdminDetails).forEach((key) => {
        expect(testData.superAdmin[key].toString()).toEqual(res.body.data[key].toString());
      });

      expect(res.body.message).toEqual('User details fetched successfully');
    });

    it('should fetch supervisor details', async () => {
      const res = await server
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${testData.supervisor.token}`);

      // Save the credentials here!
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('status');
      const supervisorDetails = _.omit(testData.supervisor, ['token', '__v', 'role', '$__', 'created_at', 'updated_at']);

      Object.keys(supervisorDetails).forEach((key) => {
        expect(testData.supervisor[key].toString()).toEqual(res.body.data[key].toString());
      });

      expect(res.body.message).toEqual('User details fetched successfully');
    });

    it('should fetch user by ID', async () => {
      const res = await server
        .get(`/api/v1/users/${testData.supervisor._id}`)
        .set('Authorization', `Bearer ${testData.superAdmin.token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('status');
      const supervisorDetails = _.omit(testData.supervisor, ['token', '__v', 'role', '$__', 'created_at', 'updated_at']);

      Object.keys(supervisorDetails).forEach((key) => {
        expect(testData.supervisor[key].toString()).toEqual(res.body.data[key].toString());
      });

      expect(res.body.message).toEqual('User fetched successfully');
    });

    it('should fetch NOT user by ID -> Insufficient permission', async () => {
      const res = await server
        .get(`/api/v1/users/${testData.superAdmin._id}`)
        .set('Authorization', `Bearer ${testData.supervisor.token}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('status');

      expect(res.body.error).not.toBeNull();
      expect(res.body.status).toEqual('fail');

      expect(res.body.message).toEqual('You do not have enough permission to access this resource');
    });
  });

  describe('User Update', () => {
    it('should update user details', async () => {
      const res = await server
        .put(`/api/v1/users/${testData.supervisor._id}`)
        .send({ phone_number: '+3232423423234', first_name: 'Richard' })
        .set('Authorization', `Bearer ${testData.supervisor.token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('status');
      const supervisorDetails = {
        ..._.omit(testData.supervisor, ['token', '__v', 'role', '$__', 'created_at', 'updated_at']),
        first_name: 'Richard',
        phone_number: '+3232423423234',
      };
      Object.keys(supervisorDetails).forEach((key) => {
        expect(supervisorDetails[key].toString()).toEqual(res.body.data[key].toString());
      });

      expect(res.body.message).toEqual('User updated successfully');

      testData.supervisor.first_name = 'Richard';
      testData.supervisor.phone_number = '+3232423423234';
    });

    it('should not fetch update user details-> Another user cant update on-behalf', async () => {
      const res = await server
        .put(`/api/v1/users/${testData.supervisor._id}`)
        .send({ phone_number: '+3232423423234', first_name: 'Richard' })
        .set('Authorization', `Bearer ${testData.superAdmin.token}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('status');

      expect(res.body.error).not.toBeNull();
      expect(res.body.status).toEqual('fail');

      expect(res.body.message).toEqual('You do not have enough permission to access this resource');
    });
  });

  describe('User Suspension', () => {
    it('should not suspend yourself -> Only admin can', async () => {
      const res = await server
        .patch(`/api/v1/users/${testData.supervisor._id}/suspend`)
        .set('Authorization', `Bearer ${testData.supervisor.token}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('status');

      expect(res.body.error).not.toBeNull();
      expect(res.body.status).toEqual('fail');

      expect(res.body.message).toEqual('You do not have enough permission to access this resource');
    });

    it('should suspend user', async () => {
      const res = await server
        .patch(`/api/v1/users/${testData.supervisor._id}/suspend`)
        .set('Authorization', `Bearer ${testData.superAdmin.token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('status');
      const supervisorDetails = {
        ..._.omit(testData.supervisor, ['token', '__v', 'role', '$__', 'created_at', 'updated_at']),
        status: 'SUSPENDED',
      };
      Object.keys(supervisorDetails).forEach((key) => {
        expect(supervisorDetails[key].toString()).toEqual(res.body.data[key].toString());
      });

      expect(res.body.message).toEqual('User suspended successfully');
      testData.supervisor.status = 'SUSPENDED';
    });

    it('should NOT login suspended', async () => {
      const res = await server
        .post('/api/v1/auth/login')
        .send(_.pick(testData.sampleSupervisor, ['email', 'password']));

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('status');

      expect(res.body.error).not.toBeNull();
      expect(res.body.status).toEqual('fail');

      expect(res.body.message).toEqual('You have been suspended and cant login to this system');
    });

    it('should un-suspend user', async () => {
      const res = await server
        .patch(`/api/v1/users/${testData.supervisor._id}/suspend`)
        .set('Authorization', `Bearer ${testData.superAdmin.token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('status');
      const supervisorDetails = {
        ..._.omit(testData.supervisor, ['token', '__v', 'role', '$__', 'created_at', 'updated_at']),
        status: 'ACTIVE',
      };
      Object.keys(supervisorDetails).forEach((key) => {
        expect(supervisorDetails[key].toString()).toEqual(res.body.data[key].toString());
      });

      expect(res.body.message).toEqual('User is activated successfully');
      testData.supervisor.status = 'ACTIVE';
    });
  });

  describe('Password change', () => {
    it('should NOT change user password -> Incorrect password used', async () => {
      const res = await server
        .patch('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${testData.supervisor.token}`)
        .send({ old_password: 'nottherealpasword', new_password: 'admmmasa' });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('status');

      expect(res.body.error).not.toBeNull();
      expect(res.body.status).toEqual('fail');

      expect(res.body.message).toEqual('Incorrect old password. Unable to change password');
    });

    it('should NOT change user password -> Old and new password are same', async () => {
      const res = await server
        .patch('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${testData.supervisor.token}`)
        .send({
          old_password: testData.sampleSupervisor.password,
          new_password: testData.sampleSupervisor.password,
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('status');

      expect(res.body.error).not.toBeNull();
      expect(res.body.status).toEqual('fail');

      expect(res.body.message).toEqual('Cannot change password to old password');
    });

    it('should change user password', async () => {
      const res = await server
        .patch('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${testData.supervisor.token}`)
        .send({ old_password: testData.sampleSupervisor.password, new_password: 'admin1234' });
      expect(res.statusCode).toEqual(202);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('status');

      expect(res.body.error).not.toBeNull();
      expect(res.body.status).toEqual('success');

      expect(res.body.message).toEqual('Password changed successfully');
      testData.sampleSupervisor.password = 'admin1234';
    });
  });

  it('should NOT login -> Old password used', async () => {
    const res = await server
      .post('/api/v1/auth/login')
      .send({ email: testData.sampleSupervisor.email, password: 'admin123' });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('status');

    expect(res.body.error).not.toBeNull();
    expect(res.body.status).toEqual('fail');

    expect(res.body.message).toEqual('Account details supplied is incorrect, please check and try again');
  });

  it('should login with new password', async () => {
    const res = await server
      .post('/api/v1/auth/login')
      .send(_.pick(testData.sampleSupervisor, ['email', 'password']));

    // Save the credentials here!
    testData.supervisor.token = res.body.data.token;
    Object.assign(testData.supervisor, res.body.data.user_data);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('status');

    expect(res.body.data.token).not.toBeNull();
    expect(res.body.data.token.length).toBeGreaterThan(30);
    expect(res.body.data.user_data.email).toEqual(testData.supervisor.email);
    expect(res.body.data.user_data.first_name).toEqual(testData.supervisor.first_name);
    expect(res.body.data.user_data.last_name).toEqual(testData.supervisor.last_name);

    expect(res.body.message).toEqual('Login successful');
  });
});
