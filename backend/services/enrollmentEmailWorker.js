const crypto = require('node:crypto');
const Job = require('../models/enrollmentEmailJob');
const Order = require('../models/order');
const mailSender = require('../utils/mailSender');
const { courseEnrollmentWithInvoice } = require('../mail/templates/courseEnrollmentWithInvoice');
const { generateInvoicePDFBuffer } = require('../utils/generateInvoicePDFBuffer');

async function enqueueEnrollmentEmails(orders) {
    if (!orders.length) return;
    await Job.bulkWrite(orders.map(order => ({ updateOne: { filter: { order: order._id },
        update: { $setOnInsert: { order: order._id, status: 'pending', attempts: 0, nextAttemptAt: new Date() } }, upsert: true } })));
}

async function deliver(order) {
    if (!order?.user || !order?.course) throw new Error('Enrollment email references unavailable data');
    const invoice = order.invoiceNumber || String(order._id);
    const pdf = await generateInvoicePDFBuffer(order, order.user, order.course);
    await mailSender(order.user.email, `Enrollment Confirmed: ${order.course.courseName} - Invoice ${invoice}`,
        courseEnrollmentWithInvoice(order.course.courseName, order.user.firstName, order),
        [{ filename: `Invoice-${invoice}.pdf`, content: pdf, contentType: 'application/pdf' }]);
}

async function processEmailJob(job, dependencies = {}) {
    const load = dependencies.load || (id => Order.findById(id)
        .populate({ path: 'user', populate: { path: 'additionalDetails' } })
        .populate({ path: 'course', populate: { path: 'instructor', select: 'firstName lastName' } }));
    const send = dependencies.send || deliver;
    const update = dependencies.update || ((filter, values) => Job.updateOne(filter, { $set: values }));
    const claim = { _id: job._id, leaseToken: job.leaseToken };
    try {
        await send(await load(job.order));
        await update(claim, { status: 'sent', sentAt: new Date(), lockedUntil: null });
    } catch (error) {
        await update(claim, { status: job.attempts >= 5 ? 'failed' : 'pending', lockedUntil: null,
            nextAttemptAt: new Date(Date.now() + Math.min(60 * 60 * 1000, 30000 * 2 ** job.attempts)) });
        console.error('Enrollment email will retry or requires review:', { jobId: String(job._id), attempts: job.attempts, error });
    }
}

function startEnrollmentEmailWorker() {
    let busy = false;
    const tick = async () => {
        if (busy) return;
        busy = true;
        try {
            for (let i = 0; i < 5; i++) {
                const now = new Date();
                const job = await Job.findOneAndUpdate({ $or: [
                    { status: 'pending', nextAttemptAt: { $lte: now } },
                    { status: 'processing', lockedUntil: { $lte: now } }
                ] }, { $set: { status: 'processing', leaseToken: crypto.randomUUID(), lockedUntil: new Date(Date.now() + 10 * 60 * 1000) },
                    $inc: { attempts: 1 } }, { new: true, sort: { nextAttemptAt: 1 } });
                if (!job) break;
                await processEmailJob(job);
            }
        } catch (error) { console.error('Enrollment email worker unavailable:', error); }
        finally { busy = false; }
    };
    const timer = setInterval(tick, 15000);
    timer.unref();
    void tick();
    return () => clearInterval(timer);
}
module.exports = { enqueueEnrollmentEmails, processEmailJob, startEnrollmentEmailWorker };
