const { auth } = require('../middleware/auth');
function authenticateToken(token) {
    return new Promise((resolve, reject) => {
        const req = { body: {}, cookies: {}, method: 'SOCKET', path: '/socket', header: name => name === 'Authorization' ? `Bearer ${token}` : undefined };
        const res = { status() { return this; }, json(body) { reject(new Error(body.message || 'Authentication failed')); } };
        Promise.resolve(auth(req, res, () => resolve(req.user))).catch(reject);
    });
}
module.exports = { authenticateToken };
