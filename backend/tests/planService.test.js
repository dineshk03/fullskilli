const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const { canUsePlan, getPlans } = require('../services/planService');

test('plan eligibility requires active access and sufficient course credits', () => {
  const plan = { status: 'ACTIVE', activation_code: 'classic-code', courses: { remaining: 1 } };
  assert.equal(canUsePlan(plan), true);
  assert.equal(canUsePlan(plan, 2), false);
  assert.equal(canUsePlan({ ...plan, status: 'EXPIRED' }), false);
  assert.equal(canUsePlan({ ...plan, activation_code: '' }), false);
  assert.equal(canUsePlan({ ...plan, courses: { remaining: 'Unlimited' } }, 10), true);
});

test('plan lookup authenticates upstream and rejects another account response', async () => {
  const originalPost = axios.post;
  const keys = ['PLAN_API_BASE_URL', 'PLAN_API_USERNAME', 'PLAN_API_PASSWORD'];
  const original = keys.map(key => process.env[key]);
  try {
    process.env.PLAN_API_BASE_URL = 'https://portal.example/api/users';
    process.env.PLAN_API_USERNAME = 'service-user';
    process.env.PLAN_API_PASSWORD = 'service-secret';
    axios.post = async (url, body, options) => {
      assert.equal(url, 'https://portal.example/api/users/plan-purchase');
      assert.deepEqual(body, { pid: '123' });
      assert.deepEqual(options.auth, { username: 'service-user', password: 'service-secret' });
      return { data: { PID: '123', plans: [] } };
    };
    assert.deepEqual((await getPlans('123')).plans, []);
    axios.post = async () => ({ data: { PID: 'different', plans: [] } });
    await assert.rejects(getPlans('123'), /does not match/);
    delete process.env.PLAN_API_PASSWORD;
    await assert.rejects(getPlans('123'), /not configured/);
  } finally {
    axios.post = originalPost;
    keys.forEach((key, index) => {
      if (original[index] === undefined) delete process.env[key];
      else process.env[key] = original[index];
    });
  }
});
