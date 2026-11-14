import PropTypes from "prop-types";
import { useState, useEffect, useCallback } from 'react';
import { getPlanPurchase, getActivePlans, getLMSAccessHistory, getLMSEnrollmentStatus, getPlanStatusColor, formatPlanValidity } from '../../services/planService';
import { FiPackage, FiBookOpen, FiTrendingUp, FiCalendar, FiXCircle, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
const PlanDashboard = ({
  pid,
  token
}) => {
  const [loading, setLoading] = useState(true);
  const [, setPlanData] = useState(null);
  const [activePlans, setActivePlans] = useState([]);
  const [accessHistory, setAccessHistory] = useState([]);
  const [, setEnrollmentStatus] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const fetchPlanData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all plan data in parallel
      const [planPurchase, activePlansData, historyData, enrollmentData] = await Promise.all([getPlanPurchase(pid, token).catch(() => null), getActivePlans(pid, token).catch(() => null), getLMSAccessHistory(pid, token).catch(() => null), getLMSEnrollmentStatus(pid, token).catch(() => null)]);
      setPlanData(planPurchase);
      setActivePlans(activePlansData?.active_plans || []);
      setAccessHistory(historyData?.access_history || []);
      setEnrollmentStatus(enrollmentData);
    } catch (error) {
      console.error('Error fetching plan data:', error);
      toast.error('Failed to load plan data');
    } finally {
      setLoading(false);
    }
  }, [pid, token]);
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPlanData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };
  useEffect(() => {
    if (pid && token) {
      fetchPlanData();
    }
  }, [fetchPlanData, pid, token]);
  const getTotalUsage = () => {
    const totals = {
      skillTests: {
        used: 0,
        total: 0,
        remaining: 0
      },
      courses: {
        used: 0,
        total: 0,
        remaining: 0
      },
      internships: {
        used: 0,
        total: 0,
        remaining: 0
      }
    };
    activePlans.forEach(plan => {
      totals.skillTests.used += plan.skill_tests?.used || 0;
      totals.skillTests.total += plan.skill_tests?.total || 0;
      totals.skillTests.remaining += plan.skill_tests?.remaining || 0;
      totals.courses.used += plan.courses?.used || 0;
      totals.courses.total += plan.courses?.total || 0;
      totals.courses.remaining += plan.courses?.remaining || 0;
      totals.internships.used += plan.virtual_internship?.used || 0;
      totals.internships.total += plan.virtual_internship?.total || 0;
      totals.internships.remaining += plan.virtual_internship?.remaining || 0;
    });
    return totals;
  };
  const totalUsage = getTotalUsage();
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Plan Dashboard</h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Manage your subscription and track usage</p>
            </div>
            <button onClick={handleRefresh} disabled={refreshing} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 whitespace-nowrap flex-shrink-0">
              <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center min-w-0">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-full flex-shrink-0">
                <FiPackage className="text-blue-600 text-lg sm:text-xl" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Active Plans</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{activePlans.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center min-w-0">
              <div className="p-2 sm:p-3 bg-green-100 rounded-full flex-shrink-0">
                <FiBookOpen className="text-green-600 text-lg sm:text-xl" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Course Access</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  {totalUsage.courses.remaining}/{totalUsage.courses.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center min-w-0">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-full flex-shrink-0">
                <FiTrendingUp className="text-purple-600 text-lg sm:text-xl" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Skill Tests</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  {totalUsage.skillTests.remaining}/{totalUsage.skillTests.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center min-w-0">
              <div className="p-2 sm:p-3 bg-orange-100 rounded-full flex-shrink-0">
                <FiCalendar className="text-orange-600 text-lg sm:text-xl" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Internships</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  {totalUsage.internships.remaining}/{totalUsage.internships.total}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Plans */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Active Plans</h2>
            </div>
            <div className="p-6">
              {activePlans.length > 0 ? <div className="space-y-4">
                  {activePlans.map((plan, index) => <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{plan.plan_name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPlanStatusColor(plan.status)}`}>
                          {plan.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Skill Tests</p>
                          <p className="font-medium">
                            {plan.skill_tests?.remaining || 0}/{plan.skill_tests?.total || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Courses</p>
                          <p className="font-medium">
                            {plan.courses?.remaining || 0}/{plan.courses?.total || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Internships</p>
                          <p className="font-medium">
                            {plan.virtual_internship?.remaining || 0}/{plan.virtual_internship?.total || 0}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          {formatPlanValidity(plan.validity)}
                        </p>
                      </div>
                    </div>)}
                </div> : <div className="text-center py-8">
                  <FiXCircle className="mx-auto text-gray-400 text-4xl mb-3" />
                  <p className="text-gray-500">No active plans found</p>
                </div>}
            </div>
          </div>

          {/* Usage Progress */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Usage Progress</h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* Skill Tests Progress */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Skill Tests</span>
                    <span className="text-sm text-gray-500">
                      {totalUsage.skillTests.used}/{totalUsage.skillTests.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{
                    width: `${totalUsage.skillTests.total > 0 ? totalUsage.skillTests.used / totalUsage.skillTests.total * 100 : 0}%`
                  }}></div>
                  </div>
                </div>

                {/* Courses Progress */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Courses</span>
                    <span className="text-sm text-gray-500">
                      {totalUsage.courses.used}/{totalUsage.courses.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{
                    width: `${totalUsage.courses.total > 0 ? totalUsage.courses.used / totalUsage.courses.total * 100 : 0}%`
                  }}></div>
                  </div>
                </div>

                {/* Internships Progress */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Virtual Internships</span>
                    <span className="text-sm text-gray-500">
                      {totalUsage.internships.used}/{totalUsage.internships.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-600 h-2 rounded-full" style={{
                    width: `${totalUsage.internships.total > 0 ? totalUsage.internships.used / totalUsage.internships.total * 100 : 0}%`
                  }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LMS Access History */}
        {accessHistory.length > 0 && <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">LMS Access History</h2>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Courses Used
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usage %
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Validity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {accessHistory.map((history, index) => <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {history.plan_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {history.used_courses}/{history.total_courses}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div className="bg-blue-600 h-2 rounded-full" style={{
                          width: `${history.usage_percentage}%`
                        }}></div>
                            </div>
                            <span>{history.usage_percentage.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPlanStatusColor(history.status)}`}>
                            {history.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPlanValidity(history.validity)}
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>}
      </div>
    </div>;
};
export default PlanDashboard;
PlanDashboard.propTypes = {
  "pid": PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  "token": PropTypes.string
};
