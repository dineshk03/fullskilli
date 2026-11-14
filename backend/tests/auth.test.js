const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-only-signing-secret';

const { auth, isAdmin, isStudent } = require('../middleware/auth');
const TokenBlacklist = require('../models/tokenBlacklist');
const User = require('../models/user');

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

function request(token) {
  return {
    body: {},
    cookies: {},
    method: 'GET',
    path: '/protected',
    header(name) { return name === 'Authorization' && token ? `Bearer ${token}` : undefined; }
  };
}

test('authentication rejects missing and malformed tokens', async () => {
  for (const token of [undefined, 'invalid']) {
    const res = response();
    let called = false;
    await auth(request(token), res, () => { called = true; });
    assert.equal(res.statusCode, 401);
    assert.equal(called, false);
  }
});

test('authentication accepts an active user and rejects a deactivated user', async () => {
  const originalBlacklist = TokenBlacklist.findOne;
  const originalFindUser = User.findById;
  TokenBlacklist.findOne = async () => null;
  const token = jwt.sign({ id: '507f1f77bcf86cd799439011', accountType: 'Student' }, process.env.JWT_SECRET);

  try {
    User.findById = async () => ({ active: true, accountType: 'Student' });
    const accepted = response();
    let nextCalled = false;
    const req = request(token);
    await auth(req, accepted, () => { nextCalled = true; });
    assert.equal(nextCalled, true);
    assert.equal(req.user.accountType, 'Student');

    User.findById = async () => ({ active: false });
    const rejected = response();
    await auth(request(token), rejected, () => assert.fail('inactive user passed authentication'));
    assert.equal(rejected.statusCode, 401);
    assert.equal(rejected.body.reason, 'USER_DEACTIVATED');
  } finally {
    TokenBlacklist.findOne = originalBlacklist;
    User.findById = originalFindUser;
  }
});

test('role checks restrict admin and student access', () => {
  const adminResponse = response();
  isAdmin({ user: { accountType: 'Student' } }, adminResponse, () => assert.fail('student passed admin check'));
  assert.equal(adminResponse.statusCode, 401);

  const studentResponse = response();
  let nextCalled = false;
  isStudent({ user: { accountType: 'Student' } }, studentResponse, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});
