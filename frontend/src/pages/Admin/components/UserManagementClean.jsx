import { useState } from "react";
import { useSelector } from "react-redux";
import { FaUser, FaUpload } from "react-icons/fa";
import BulkUserUpload from "../../../components/core/Dashboard/Admin/BulkUserUpload";
const UserManagementClean = () => {
  useSelector(state => state.auth);
  const [activeTab, setActiveTab] = useState("bulkUpload"); // Start with bulk upload

  return <div className="text-richblack-5 h-full flex flex-col overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex gap-x-4 border-b border-richblack-700 py-4 mb-6 flex-shrink-0">
        <button onClick={() => setActiveTab("manage")} className={`flex items-center gap-x-2 px-4 py-2 rounded-t-md transition-all duration-200 ${activeTab === "manage" ? 'bg-richblack-700 text-yellow-50' : 'text-richblack-300 hover:bg-richblack-700 hover:text-richblack-50'}`}>
          <FaUser />
          Manage Users
        </button>
        <button onClick={() => setActiveTab("bulkUpload")} className={`flex items-center gap-x-2 px-4 py-2 rounded-t-md transition-all duration-200 ${activeTab === "bulkUpload" ? 'bg-richblack-700 text-yellow-50' : 'text-richblack-300 hover:bg-richblack-700 hover:text-richblack-50'}`}>
          <FaUpload />
          Bulk Upload
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Bulk Upload Section */}
        {activeTab === "bulkUpload" && <BulkUserUpload />}

        {/* User Management Section */}
        {activeTab === "manage" && <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">User Management</h3>
              <p className="text-richblack-300">
                Individual user management features will be available here.
              </p>
              <p className="text-richblack-400 mt-2">
                For now, use the &quot;Bulk Upload&quot; tab to add multiple users at once.
              </p>
            </div>
          </div>}
      </div>
    </div>;
};
export default UserManagementClean;
