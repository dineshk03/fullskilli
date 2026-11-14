const test = require('node:test');
const assert = require('node:assert/strict');
const Coupon = require('../models/coupon');
const { checkoutPricing } = require('../utils/checkoutPricing');
const { allocatePrices } = require('../utils/checkoutPricing');
const { studentQuiz } = require('../utils/quizResponse');
const { sanitize } = require('../utils/safeLogger');
const { auth } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const TokenBlacklist = require('../models/tokenBlacklist');

test('checkout derives prices from courses and server coupon data', async () => {
    const original = Coupon.findOne;
    Coupon.findOne = async () => ({ isActive: true, startDate: new Date(0), expiryDate: new Date('2100-01-01'),
        usageLimit: 1, usedCount: 0, minimumOrderAmount: 100, perUserLimit: 1, userUsage: [],
        courses: [], categories: [], linkedTo: 'course', discountType: 'percentage', discountValue: 10, maxDiscountAmount: 0 });
    try {
        assert.deepEqual(await checkoutPricing([{ price: 500 }], null, 'student'), { total: 500, discount: 0, amount: 500 });
        const discounted = await checkoutPricing([{ price: 500 }], 'VALID', 'student');
        assert.equal(discounted.amount, 450);
        await assert.rejects(checkoutPricing([{ price: 50 }], 'VALID', 'student'), /invalid/);
        await assert.rejects(checkoutPricing([{ price: 500 }], 'BUNDLE_DISCOUNT_100PERCENT', 'student'), /bundle/);
        assert.equal((await checkoutPricing([{ price: 500, adminSetFree: true }], null, 'student')).amount, 0);
    } finally { Coupon.findOne = original; }
});

test('student quiz projection removes grading material without mutating the record', () => {
    const quiz = { questions: [{ questionText: 'Question', correctAnswer: 0, correctAnswers: [0], answers: ['secret'],
        keywords: ['secret'], solutionCode: 'secret', testCases: [{ input: 'public', expectedOutput: '1', isHidden: false },
            { input: 'private', expectedOutput: '2', isHidden: true }] }] };
    const projected = studentQuiz(quiz);
    assert.equal(projected.questions[0].correctAnswer, undefined);
    assert.equal(projected.questions[0].solutionCode, undefined);
    assert.equal(projected.questions[0].testCases.length, 1);
    assert.equal(quiz.questions[0].testCases.length, 2);
});

test('matching choices expose opaque identifiers rather than the correct index', () => {
    const { matchChoiceId } = require('../utils/quizResponse');
    const quiz = { _id: 'quiz', questions: [{ _id: 'question', questionType: 'matchTheFollowing', options: ['A', 'B'], answers: ['first', 'second'] }] };
    const projected = studentQuiz(quiz).questions[0];
    assert.equal(projected.answers, undefined);
    assert.equal(projected.answerOptions.find(choice => choice.text === 'first').id, matchChoiceId('quiz', 'question', 0));
    assert.notEqual(projected.answerOptions[0].id, '0');
    assert.notEqual(matchChoiceId('quiz', 'question', 0), matchChoiceId('quiz', 'another-question', 0));
});

test('authentication fails closed and uses the current database role', async () => {
    const oldBlacklist = TokenBlacklist.findOne, oldUser = User.findById;
    const token = jwt.sign({ id: '507f1f77bcf86cd799439011', accountType: 'Admin' }, process.env.JWT_SECRET);
    const req = { body: {}, cookies: {}, header: () => `Bearer ${token}` };
    const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
    try {
        User.findById = async () => ({ active: true, accountType: 'Student' });
        TokenBlacklist.findOne = async () => { throw new Error('Unavailable'); };
        let res = response();
        await auth(req, res, () => assert.fail('Unavailable checks must not grant access'));
        assert.equal(res.statusCode, 503);
        TokenBlacklist.findOne = async () => null;
        User.findById = async () => ({ active: true, accountType: 'Student' });
        await auth(req, response(), () => {});
        assert.equal(req.user.accountType, 'Student');
        User.findById = async () => { throw new Error('Unavailable'); };
        res = response();
        await auth(req, res, () => assert.fail('Unavailable user lookup must not grant access'));
        assert.equal(res.statusCode, 503);
    } finally { TokenBlacklist.findOne = oldBlacklist; User.findById = oldUser; }
});

test('logs redact credentials recursively and hide query tokens', () => {
    assert.deepEqual(sanitize({ headers: { authorization: 'Bearer secret' }, password: 'secret' }),
        { headers: { authorization: '[REDACTED]' }, password: '[REDACTED]' });
    assert.equal(sanitize('/video?token=secret'), '/video?token=[REDACTED]');
});

test('course allocations preserve exact cents and never charge an admin-free course', () => {
    const allocated = allocatePrices([{ price: 100 }, { price: 100 }, { price: 500, adminSetFree: true }], 33.33);
    assert.equal(Math.round(allocated.reduce((sum, item) => sum + item.amount, 0) * 100), 16667);
    assert.equal(allocated[2].amount, 0);
    assert.equal(Math.round(allocated.reduce((sum, item) => sum + item.discountAmount, 0) * 100), 3333);
});

test('media range parsing handles partial requests and rejects malformed or unsatisfiable input', () => {
    const { parseRange } = require('../utils/httpRange');
    assert.deepEqual(parseRange('bytes=5-9', 10), { start: 5, end: 9 });
    assert.deepEqual(parseRange('bytes=-3', 10), { start: 7, end: 9 });
    assert.deepEqual(parseRange('bytes=8-', 10), { start: 8, end: 9 });
    for (const range of ['bytes=10-', 'bytes=3-1', 'bytes=abc', 'bytes=-0', 'bytes=1-2,5-6']) assert.throws(() => parseRange(range, 10), RangeError);
});

test('public registration cannot persist a privileged requested role', async t => {
    const Profile = require('../models/profile');
    const OTP = require('../models/OTP');
    const { signup } = require('../controllers/auth');
    t.mock.method(User, 'findOne', async () => null);
    t.mock.method(User, 'findById', () => ({ select: async () => null }));
    t.mock.method(User, 'find', () => ({ select: async () => [] }));
    t.mock.method(Profile, 'create', async () => ({ _id: 'profile' }));
    t.mock.method(OTP, 'findOne', () => ({ sort: () => ({ limit: async () => ({ _id: 'otp', otp: '123456', createdAt: new Date() }) }) }));
    t.mock.method(OTP, 'findOneAndDelete', async () => ({ _id: 'otp' }));
    let created;
    t.mock.method(User, 'create', async data => { created = data; return { _id: 'new-user' }; });
    const req = { body: { firstName: 'Test', lastName: 'Student', email: 'test@example.com', password: 'test-password', confirmPassword: 'test-password', otp: '123456', accountType: 'Admin' } };
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    await signup(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(created.accountType, 'Student');
});

test('student cannot mutate or delete a course even when calling controllers directly', async t => {
    const Course = require('../models/course');
    const { deleteCourse, editCourse } = require('../controllers/course');
    t.mock.method(Course, 'findById', async () => ({ instructor: 'instructor', studentsEnrolled: [] }));
    for (const handler of [deleteCourse, editCourse]) {
        const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
        await handler({ body: { courseId: 'course' }, user: { id: 'student', accountType: 'Student' } }, res);
        assert.equal(res.statusCode, 403);
    }
});

test('client discount cannot bypass payment verification for a paid course', async t => {
    const Course = require('../models/course');
    const { verifyPayment } = require('../controllers/payments');
    const id = '507f1f77bcf86cd799439012';
    t.mock.method(Course, 'find', async () => [{ _id: id, price: 500 }]);
    t.mock.method(User, 'findById', async () => ({ courses: [], pid: 'student-pid' }));
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    await verifyPayment({ user: { id: 'student' }, body: { coursesId: [id], discountAmount: 500 } }, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /verification details missing/i);
});

test('enrollment email worker retries failed delivery without marking it sent', async t => {
    t.mock.method(console, 'error', () => {});
    const { processEmailJob } = require('../services/enrollmentEmailWorker');
    const updates = [];
    await processEmailJob({ _id: 'job', leaseToken: 'lease', order: 'order', attempts: 1 }, {
        load: async () => ({}), send: async () => { throw new Error('Test SMTP failure'); },
        update: async (claim, values) => updates.push({ claim, values })
    });
    assert.equal(updates[0].values.status, 'pending');
    assert.ok(updates[0].values.nextAttemptAt > new Date());
    assert.equal(updates[0].claim.leaseToken, 'lease');
    const completed = [];
    await processEmailJob({ _id: 'job', leaseToken: 'lease', order: 'order', attempts: 2 }, {
        load: async () => ({}), send: async () => {}, update: async (claim, values) => completed.push(values)
    });
    assert.equal(completed[0].status, 'sent');
});

test('paid enrollment uses its captured quote and completes only once', async t => {
    const fs = require('node:fs');
    const Module = require('node:module');
    const crypto = require('node:crypto');
    const filename = require.resolve('../controllers/payments');
    const Course = require('../models/course');
    const Checkout = require('../models/checkout');
    const Order = require('../models/order');
    const Lock = require('../models/enrollmentLock');
    const Job = require('../models/enrollmentEmailJob');
    const courseId = '507f1f77bcf86cd799439012';
    const studentId = '507f1f77bcf86cd799439011';
    const checkout = { _id: 'checkout', gatewayOrderId: 'order_test', user: studentId, courses: [courseId],
        items: [{ course: courseId, price: 500 }], amount: 50000, discount: 0, couponCode: '', status: 'pending' };
    const gateway = { orders: { fetch: async () => ({ amount: 50000 }) },
        payments: { fetch: async () => ({ order_id: 'order_test', amount: 50000, status: 'captured', currency: 'INR' }) } };
    // Load the real controller with a test gateway, without any live credentials or network calls.
    const isolated = new Module(filename, module);
    isolated.filename = filename;
    isolated.paths = Module._nodeModulePaths(require('node:path').dirname(filename));
    const originalRequire = isolated.require.bind(isolated);
    isolated.require = name => name === '../config/razorpay' ? { instance: gateway } : originalRequire(name);
    isolated._compile(fs.readFileSync(filename, 'utf8'), filename);
    t.mock.method(User, 'findById', async () => ({ courses: [] }));
    t.mock.method(User, 'findByIdAndUpdate', async () => ({ _id: studentId }));
    t.mock.method(Course, 'find', async () => [{ _id: courseId, price: 1000, toObject: () => ({ _id: courseId, price: 1000 }) }]);
    t.mock.method(Course, 'updateMany', async () => ({}));
    t.mock.method(Checkout, 'findOne', async query => query.user === studentId ? checkout : null);
    t.mock.method(Checkout, 'findOneAndUpdate', async () => { checkout.status = 'processing'; return checkout; });
    t.mock.method(Checkout, 'updateOne', async (filter, update) => { Object.assign(checkout, update.$set); });
    t.mock.method(Lock, 'create', async () => ({ _id: 'lock' }));
    t.mock.method(Lock, 'deleteOne', async () => ({}));
    t.mock.method(Job, 'bulkWrite', async () => ({}));
    const orders = [];
    t.mock.method(Order, 'create', async data => { orders.push(data); return { _id: 'order-record' }; });
    const oldSecret = process.env.RAZORPAY_SECRET;
    process.env.RAZORPAY_SECRET = 'test-only-gateway-secret';
    try {
        const signature = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET).update('order_test|payment_test').digest('hex');
        const request = { user: { id: studentId }, body: { coursesId: [courseId], discountAmount: 100000,
            razorpay_order_id: 'order_test', razorpay_payment_id: 'payment_test', razorpay_signature: signature } };
        const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
        const first = response();
        await isolated.exports.verifyPayment(request, first);
        assert.equal(first.statusCode, 200);
        assert.equal(orders.length, 1);
        assert.equal(orders[0].amount, 500);
        assert.equal(checkout.status, 'completed');
        const replay = response();
        await isolated.exports.verifyPayment(request, replay);
        assert.equal(replay.statusCode, 200);
        assert.equal(orders.length, 1);
        const wrongUser = response();
        await isolated.exports.verifyPayment({ ...request, user: { id: 'another-user' } }, wrongUser);
        assert.equal(wrongUser.statusCode, 400);
    } finally {
        if (oldSecret === undefined) delete process.env.RAZORPAY_SECRET;
        else process.env.RAZORPAY_SECRET = oldSecret;
    }
});
