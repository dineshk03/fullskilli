import PropTypes from "prop-types";
import { getPlanStatusColor, formatPlanValidity } from '../../services/planService';
import { FiPackage, FiBookOpen, FiTrendingUp, FiCalendar, FiCheckCircle, FiXCircle, FiClock, FiBarChart2 } from 'react-icons/fi';
const PlanStatusCard = ({
  plan,
  compact = false,
  showProgress = true,
  showValidity = true,
  className = ''
}) => {
  const progressPercentage = usage => {
    if (!usage || usage.total === 0) return 0;
    return usage.used / usage.total * 100;
  };
  const getProgressColor = percentage => {
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  if (compact) {
    return <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">{plan.plan_name}</h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPlanStatusColor(plan.status)}`}>
            {plan.status}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="text-center">
            <p className="text-gray-500">Tests</p>
            <p className="font-medium">{plan.skill_tests?.remaining || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Courses</p>
            <p className="font-medium">{plan.courses?.remaining || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Intern</p>
            <p className="font-medium">{plan.virtual_internship?.remaining || 0}</p>
          </div>
        </div>
      </div>;
  }
  return <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full mr-3">
              <FiPackage className="text-blue-600 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{plan.plan_name}</h3>
              <p className="text-sm text-gray-500">Activation Code: {plan.activation_code}</p>
            </div>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPlanStatusColor(plan.status)}`}>
            {plan.status}
          </span>
        </div>

        {/* Usage Stats */}
        {showProgress && <div className="space-y-4 mb-6">
            {/* Skill Tests */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <FiTrendingUp className="text-purple-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Skill Tests</span>
                </div>
                <span className="text-sm text-gray-600">
                  {plan.skill_tests?.used || 0}/{plan.skill_tests?.total || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progressPercentage(plan.skill_tests))}`} style={{
              width: `${progressPercentage(plan.skill_tests)}%`
            }}></div>
              </div>
            </div>

            {/* Courses */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <FiBookOpen className="text-green-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Courses</span>
                </div>
                <span className="text-sm text-gray-600">
                  {plan.courses?.used || 0}/{plan.courses?.total || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progressPercentage(plan.courses))}`} style={{
              width: `${progressPercentage(plan.courses)}%`
            }}></div>
              </div>
            </div>

            {/* Virtual Internships */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <FiCalendar className="text-orange-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Virtual Internships</span>
                </div>
                <span className="text-sm text-gray-600">
                  {plan.virtual_internship?.used || 0}/{plan.virtual_internship?.total || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progressPercentage(plan.virtual_internship))}`} style={{
              width: `${progressPercentage(plan.virtual_internship)}%`
            }}></div>
              </div>
            </div>
          </div>}

        {/* Validity */}
        {showValidity && plan.validity && <div className="border-t pt-4">
            <div className="flex items-center text-sm text-gray-600">
              <FiClock className="mr-2" />
              <span>{formatPlanValidity(plan.validity)}</span>
            </div>
          </div>}

        {/* Status Indicators */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              {plan.status === 'ACTIVE' ? <>
                  <FiCheckCircle className="text-green-600 mr-1" />
                  <span className="text-green-600">Active</span>
                </> : <>
                  <FiXCircle className="text-red-600 mr-1" />
                  <span className="text-red-600">Inactive</span>
                </>}
            </div>
            <div className="flex items-center text-gray-500">
              <FiBarChart2 className="mr-1" />
              <span>
                {(plan.skill_tests?.used || 0) + (plan.courses?.used || 0) + (plan.virtual_internship?.used || 0)}               {' '}uses total
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default PlanStatusCard;
PlanStatusCard.propTypes = {
  "plan": PropTypes.shape({
    "plan_name": PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    "status": PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.number]),
    "skill_tests": PropTypes.shape({
      "remaining": PropTypes.number,
      "used": PropTypes.number,
      "total": PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    }),
    "courses": PropTypes.shape({
      "remaining": PropTypes.number,
      "used": PropTypes.number,
      "total": PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    }),
    "virtual_internship": PropTypes.shape({
      "remaining": PropTypes.number,
      "used": PropTypes.number,
      "total": PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    }),
    "activation_code": PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    "validity": PropTypes.string
  }),
  "compact": PropTypes.bool,
  "showProgress": PropTypes.bool,
  "showValidity": PropTypes.bool,
  "className": PropTypes.string
};
