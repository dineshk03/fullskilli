const axios = require('axios');

const canUsePlan = (plan, count = 1) =>
  String(plan?.status || '').toUpperCase() === 'ACTIVE' &&
  !!plan.activation_code &&
  (String(plan.courses?.remaining).toLowerCase() === 'unlimited' ||
    Number(plan.courses?.remaining || 0) >= count);

const planRequest = async (path, payload) => {
  const base = (process.env.PLAN_API_BASE_URL || '').replace(/\/$/, '');
  const username = process.env.PLAN_API_USERNAME;
  const password = process.env.PLAN_API_PASSWORD;
  if (!base || !username || !password) throw new Error('Plan service is not configured');
  return axios.post(`${base}/${path}`, payload, {
    timeout: 10000,
    auth: { username, password },
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
  });
};

const getPlans = async pid => {
  const response = await planRequest('plan-purchase', { pid: String(pid) });
  if (String(response.data?.PID) !== String(pid)) throw new Error('Plan account does not match');
  return response.data;
};

module.exports = { canUsePlan, planRequest, getPlans };
