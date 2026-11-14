const Course = require('../models/course');
const Section = require('../models/section');
const User = require('../models/user');
const Order = require('../models/order');

async function canAccessCourse(user, course) {
    if (!course) return false;
    if (user.accountType === 'Admin') return true;
    if (user.accountType === 'Instructor') return String(course.instructor) === String(user.id);
    if (user.accountType !== 'Student') return false;
    const student = await User.findById(user.id).select('courses');
    if (!student?.courses.some(id => String(id) === String(course._id))) return false;
    const suspended = await Order.exists({ user: user.id, course: course._id, status: false });
    return !suspended;
}

async function courseForSubsection(subsectionId) {
    const section = await Section.findOne({ subSection: subsectionId });
    return section ? Course.findOne({ courseContent: section._id }) : null;
}

async function canAccessMeeting(user, meetingId) {
    if (user.accountType === 'Admin') return true;
    if (typeof meetingId !== 'string' && typeof meetingId !== 'number') return false;
    const SubSection = require('../models/subSection');
    const value = String(meetingId);
    const subsection = await SubSection.findOne({ $or: [
        { 'zoomMeeting.meetingId': value }, { 'zoomMeeting.meetingNumber': value }, { 'zoomMeeting.id': value }
    ] });
    return subsection ? canAccessCourse(user, await courseForSubsection(subsection._id)) : false;
}
module.exports = { canAccessCourse, courseForSubsection, canAccessMeeting };
