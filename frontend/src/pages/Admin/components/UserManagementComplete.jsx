import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { getAllUsers, createUser, updateUser, deleteUser, toggleUserStatus } from "../../../services/operations/adminAPI";
import { bulkDeactivateUsers, bulkActivateUsers, bulkDeleteUsers } from "../../../services/operations/bulkUserAPI";
import { getAllBatches } from "../../../services/operations/batchAPI";
import { FaEdit, FaTrash, FaEye, FaEyeSlash, FaUser, FaPlus, FaSearch, FaUpload, FaCheckSquare, FaSquare, FaCheck, FaPowerOff } from "react-icons/fa";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import BulkUserUpload from "../../../components/core/Dashboard/Admin/BulkUserUpload";
import { toast } from "react-hot-toast";

const UserManagementComplete = () => {
  const { token } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmationModal, setConfirmationModal] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [togglingUserId, setTogglingUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("manage");

  // Bulk selection state
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Batches state
  const [batches, setBatches] = useState([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    accountType: "Student",
    contactNumber: "",
    batchId: ""
  });

  useEffect(() => {
    if (token) {
      getAllBatches(token).then(res => {
        if (res) setBatches(res);
      });
    }
  }, [token]);

  // Bulk Operations Handlers
  const handleBulkActivate = async () => {
    if (selectedUserIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to activate ${selectedUserIds.length} user(s)?`)) return;

    setIsBulkProcessing(true);
    try {
      const result = await bulkActivateUsers(selectedUserIds, token);
      if (result.success) {
        toast.success(result.message);
        setSelectedUserIds([]);
        loadUsers(true);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Bulk Activate Error:", error);
      toast.error("Failed to activate users");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedUserIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to deactivate ${selectedUserIds.length} user(s)?`)) return;

    setIsBulkProcessing(true);
    try {
      const result = await bulkDeactivateUsers(selectedUserIds, token);
      if (result.success) {
        toast.success(result.message);
        setSelectedUserIds([]);
        loadUsers(true);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Bulk Deactivate Error:", error);
      toast.error("Failed to deactivate users");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async (permanent = false) => {
    if (selectedUserIds.length === 0) return;
    const msg = permanent
      ? `PERMANENTLY DELETE ${selectedUserIds.length} user(s)? This cannot be undone.`
      : `Move ${selectedUserIds.length} user(s) to recycle bin?`;

    if (!window.confirm(msg)) return;
    if (permanent && !window.confirm("Are you absolutely sure? This is irreversible.")) return;

    setIsBulkProcessing(true);
    try {
      const result = await bulkDeleteUsers(selectedUserIds, permanent, token);
      if (result.success) {
        toast.success(result.message);
        setSelectedUserIds([]);
        loadUsers(true);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Bulk Delete Error:", error);
      toast.error("Failed to delete users");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Helper functions
  const getProfilePicture = (user) => {
    if (user.image) {
      return user.image;
    }
    return null;
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getAccountTypeColor = (accountType) => {
    switch (accountType) {
      case 'Admin': return 'bg-red-500';
      case 'Instructor': return 'bg-blue-500';
      case 'Student': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Load users function
  const loadUsers = useCallback(async (mounted = true) => {
    try {
      if (!token) {
        throw new Error("No authentication token found");
      }

      setLoading(true);
      const response = await getAllUsers(token);

      if (mounted) {
        setUsers(response || []);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching users:', err);

      if (mounted) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch users';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  }, [token]);

  useEffect(() => {
    let mounted = true;
    if (token && activeTab === "manage") {
      loadUsers(mounted);
    }
    return () => {
      mounted = false;
    };
  }, [loadUsers, token, activeTab]);

  // Create user handler
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const result = await createUser(formData, token);
      if (result) {
        toast.success("User created successfully!");
        setShowCreateModal(false);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          accountType: "Student",
          contactNumber: "",
          batchId: ""
        });
        loadUsers();
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  // Update user handler
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const result = await updateUser(selectedUser._id, formData, token);
      if (result) {
        toast.success("User updated successfully!");
        setShowEditModal(false);
        setSelectedUser(null);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          accountType: "Student",
          contactNumber: "",
          batchId: ""
        });
        loadUsers();
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  // Delete user handler
  const handleDeleteUser = async (userId) => {
    try {
      setDeletingUserId(userId);
      const result = await deleteUser(userId, token);
      if (result) {
        toast.success("User deleted successfully!");
        loadUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setDeletingUserId(null);
      setConfirmationModal(null);
    }
  };

  // Toggle user status handler
  const handleToggleUserStatus = async (userId) => {
    try {
      setTogglingUserId(userId);
      const result = await toggleUserStatus(userId, token);
      if (result) {
        toast.success("User status updated successfully!");
        loadUsers();
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
    } finally {
      setTogglingUserId(null);
    }
  };

  // Edit user handler
  const handleEditClick = (user) => {
    setSelectedUser(user);
    // Handle batches (extract first one if exists)
    let primaryBatchId = "";
    if (user.batches && user.batches.length > 0) {
      // user.batches might be array of objects (if populated) or IDs
      const firstBatch = user.batches[0];
      primaryBatchId = typeof firstBatch === 'object' ? firstBatch._id : firstBatch;
    }

    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      accountType: user.accountType,
      contactNumber: user.additionalDetails?.contactNumber || "",
      batchId: primaryBatchId
    });
    setShowEditModal(true);
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || user.accountType === roleFilter;

    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && user.active) ||
      (statusFilter === "inactive" && !user.active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="text-richblack-5 h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 mb-6">
        <div className="bg-richblack-800/60 backdrop-blur-xl border border-richblack-700 rounded-2xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-50 to-yellow-200 bg-clip-text text-transparent">
                User Management
              </h2>
              <p className="text-sm text-richblack-300 mt-1">
                Manage users, roles, and access. Use bulk upload to add multiple users at once.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-richblack-700/60 border border-richblack-600 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab("manage")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "manage"
                    ? 'bg-richblack-800 text-yellow-50 shadow'
                    : 'text-richblack-300 hover:text-richblack-50'
                    }`}
                >
                  <FaUser />
                  Manage Users
                </button>
                <button
                  onClick={() => setActiveTab("bulkUpload")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "bulkUpload"
                    ? 'bg-richblack-800 text-yellow-50 shadow'
                    : 'text-richblack-300 hover:text-richblack-50'
                    }`}
                >
                  <FaUpload />
                  Bulk Upload
                </button>
              </div>

              {activeTab === "manage" && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 text-richblack-900 font-semibold flex items-center gap-2 transition-all duration-200"
                >
                  <FaPlus size={14} />
                  Add User
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Bulk Upload Section */}
        {activeTab === "bulkUpload" && <BulkUserUpload />}

        {/* User Management Section */}
        {activeTab === "manage" && (
          <div className="h-full flex flex-col">
            <div className="flex-shrink-0 mb-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-richblack-800 border border-richblack-700 rounded-2xl p-4">
                  <p className="text-sm text-richblack-300">Total Users</p>
                  <p className="text-2xl font-bold text-richblack-5 mt-1">{users.length}</p>
                </div>
                <div className="bg-richblack-800 border border-richblack-700 rounded-2xl p-4">
                  <p className="text-sm text-richblack-300">Active Users</p>
                  <p className="text-2xl font-bold text-caribbeangreen-200 mt-1">{users.filter(u => u.active).length}</p>
                </div>
                <div className="bg-richblack-800 border border-richblack-700 rounded-2xl p-4">
                  <p className="text-sm text-richblack-300">Students</p>
                  <p className="text-2xl font-bold text-blue-200 mt-1">{users.filter(u => u.accountType === 'Student').length}</p>
                </div>
                <div className="bg-richblack-800 border border-richblack-700 rounded-2xl p-4">
                  <p className="text-sm text-richblack-300">Instructors</p>
                  <p className="text-2xl font-bold text-purple-200 mt-1">{users.filter(u => u.accountType === 'Instructor').length}</p>
                </div>
              </div>

              <div className="bg-richblack-800 border border-richblack-700 rounded-2xl p-4">
                <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
                  <button
                    onClick={() => {
                      if (selectedUserIds.length === filteredUsers.length) {
                        setSelectedUserIds([]);
                      } else {
                        setSelectedUserIds(filteredUsers.map(u => u._id));
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-3 bg-richblack-700 border border-richblack-600 rounded-xl text-richblack-5 hover:bg-richblack-600 transition-colors"
                  >
                    {selectedUserIds.length > 0 && selectedUserIds.length === filteredUsers.length ? (
                      <FaCheckSquare className="text-yellow-50" size={20} />
                    ) : (
                      <FaSquare className="text-richblack-400" size={20} />
                    )}
                    <span className="font-medium">Select All</span>
                  </button>
                  <div className="flex-1 relative">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-richblack-400" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-richblack-700 border border-richblack-600 rounded-xl text-richblack-5 placeholder-richblack-400 focus:outline-none focus:ring-2 focus:ring-yellow-50/60"
                    />
                  </div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-3 bg-richblack-700 border border-richblack-600 rounded-xl text-richblack-5 focus:outline-none focus:ring-2 focus:ring-yellow-50/60"
                  >
                    <option value="all">All Roles</option>
                    <option value="Student">Students</option>
                    <option value="Instructor">Instructors</option>
                    <option value="Admin">Admins</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 bg-richblack-700 border border-richblack-600 rounded-xl text-richblack-5 focus:outline-none focus:ring-2 focus:ring-yellow-50/60"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
              </div>

              {/* Bulk Action Bar */}
              {selectedUserIds.length > 0 && (
                <div className="bg-yellow-50 text-richblack-900 px-4 py-3 rounded-lg flex flex-wrap items-center justify-between shadow-lg animate-slideDown">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">
                      {selectedUserIds.length} user{selectedUserIds.length > 1 ? 's' : ''} selected
                    </span>
                    <button
                      onClick={() => setSelectedUserIds([])}
                      className="text-sm underline hover:no-underline font-medium"
                      disabled={isBulkProcessing}
                    >
                      Clear selection
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleBulkActivate}
                      disabled={isBulkProcessing}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm"
                      title="Activate selected users"
                    >
                      <FaCheck size={14} />
                      <span>Activate</span>
                    </button>

                    <button
                      onClick={handleBulkDeactivate}
                      disabled={isBulkProcessing}
                      className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm"
                      title="Deactivate selected users"
                    >
                      <FaPowerOff size={14} />
                      <span>Deactivate</span>
                    </button>

                    <button
                      onClick={() => handleBulkDelete(false)}
                      disabled={isBulkProcessing}
                      className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm"
                      title="Move selected users to recycle bin"
                    >
                      <FaTrash size={14} />
                      <span>Delete</span>
                    </button>

                    <button
                      onClick={() => handleBulkDelete(true)}
                      disabled={isBulkProcessing}
                      className="flex items-center gap-2 px-3 py-2 bg-red-900 hover:bg-red-950 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-red-700 text-sm font-medium shadow-sm"
                      title="PERMANENTLY delete selected users (cannot be undone!)"
                    >
                      <FaTrash size={14} />
                      <span>Delete Forever</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-yellow-50 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <div className="text-center py-20">
                  <p className="text-red-400 mb-4">{error}</p>
                  <button
                    onClick={() => loadUsers()}
                    className="bg-yellow-50 text-richblack-900 px-4 py-2 rounded-lg hover:bg-yellow-100"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-16">
                  <div className="max-w-md mx-auto bg-richblack-800 border border-richblack-700 rounded-2xl p-8">
                    <p className="text-richblack-5 font-semibold">No users found</p>
                    <p className="text-richblack-300 text-sm mt-1">Try clearing the search or changing the filter.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {filteredUsers.map((user) => (
                    <div key={user._id} className="bg-richblack-800 border border-richblack-700 rounded-2xl p-4 flex flex-col hover:border-richblack-600 transition-colors relative group">
                      <div className="absolute top-3 right-3 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedUserIds.includes(user._id)) {
                              setSelectedUserIds(selectedUserIds.filter(id => id !== user._id));
                            } else {
                              setSelectedUserIds([...selectedUserIds, user._id]);
                            }
                          }}
                          className="p-1 rounded-md bg-richblack-800/80 backdrop-blur-sm hover:bg-richblack-700 transition-colors"
                        >
                          {selectedUserIds.includes(user._id) ? (
                            <FaCheckSquare className="text-yellow-50" size={24} />
                          ) : (
                            <FaSquare className="text-richblack-400 group-hover:text-richblack-200" size={24} />
                          )}
                        </button>
                      </div>
                      {/* User Profile Section */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative flex-shrink-0">
                          {getProfilePicture(user) ? (
                            <img
                              src={getProfilePicture(user)}
                              alt={`${user.firstName} ${user.lastName}`}
                              className="w-10 h-10 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                              {getInitials(user.firstName, user.lastName)}
                            </div>
                          )}
                          <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-richblack-800 ${user.active ? 'bg-caribbeangreen-400' : 'bg-richblack-500'}`}></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base text-richblack-5 truncate">{user.firstName} {user.lastName}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getAccountTypeColor(user.accountType)}`}>
                            {user.accountType}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-richblack-200 truncate mb-3">{user.email}</p>

                      {/* Contact and Status Information */}
                      <div className="space-y-2 mb-3">
                        <div className="text-xs">
                          <span className="font-medium text-richblack-300">Contact: </span>
                          <span className="text-richblack-200">{user.additionalDetails?.contactNumber || 'N/A'}</span>
                        </div>
                        {user.accountType === 'Student' && (
                          <div className="text-xs">
                            <span className="font-medium text-richblack-300">Batch: </span>
                            <span className="text-richblack-200 overflow-hidden text-ellipsis whitespace-nowrap inline-block max-w-[150px] align-bottom">
                              {(() => {
                                if (!user.batches || user.batches.length === 0) return 'None';
                                // Handle both ObjectId string and populated object
                                const bId = typeof user.batches[0] === 'object' ? user.batches[0]._id : user.batches[0];
                                const batch = batches.find(b => b._id === bId.toString());
                                return batch ? batch.name : 'Unknown';
                              })()}
                            </span>
                          </div>
                        )}
                        <div className="text-xs">
                          <span className="font-medium text-richblack-300">Status: </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${user.active ? 'bg-caribbeangreen-900 text-caribbeangreen-200 border border-caribbeangreen-700/50' : 'bg-richblack-700 text-richblack-200 border border-richblack-600'}`}>
                            {user.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-center gap-2 pt-3 border-t border-richblack-700">
                        <button
                          onClick={() => handleToggleUserStatus(user._id)}
                          className={`p-2 rounded-xl ${user.active ? 'text-caribbeangreen-200 bg-caribbeangreen-900/20' : 'text-richblack-200 bg-richblack-700/60'} hover:bg-richblack-700 transition-colors`}
                          disabled={togglingUserId === user._id}
                          title={user.active ? 'Deactivate User' : 'Activate User'}
                        >
                          {togglingUserId === user._id ? (
                            <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-caribbeangreen-200" />
                          ) : (
                            user.active ? <FaEye size={14} /> : <FaEyeSlash size={14} />
                          )}
                        </button>
                        <button
                          onClick={() => handleEditClick(user)}
                          className="p-2 rounded-xl text-yellow-100 bg-yellow-900/20 hover:bg-richblack-700 transition-colors"
                          title="Edit User"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmationModal({
                              text1: "Delete User?",
                              text2: `Are you sure you want to delete "${user.firstName} ${user.lastName}"? This action cannot be undone.`,
                              btn1Text: "Delete",
                              btn2Text: "Cancel",
                              btn1Handler: () => handleDeleteUser(user._id),
                              btn2Handler: () => setConfirmationModal(null),
                            })
                          }}
                          disabled={deletingUserId === user._id}
                          className={`p-2 rounded-xl text-pink-200 bg-pink-900/20 hover:bg-richblack-700 transition-colors ${deletingUserId === user._id ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          title="Delete User"
                        >
                          {deletingUserId === user._id ? (
                            <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-pink-200" />
                          ) : (
                            <FaTrash size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-richblack-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-richblack-800 p-6 rounded-lg w-full max-w-md">
                  <h3 className="text-xl font-semibold mb-4">Create New User</h3>
                  <form onSubmit={handleCreateUser}>
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-3 py-2 bg-richblack-700 border border-richblack-600 rounded text-richblack-5"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-3 py-2 bg-richblack-700 border border-richblack-600 rounded text-richblack-5"
                        required
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 bg-richblack-700 border border-richblack-600 rounded text-richblack-5"
                        required
                      />
                      <input
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 bg-richblack-700 border border-richblack-600 rounded text-richblack-5"
                        required
                      />
                      <select
                        value={formData.accountType}
                        onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                        className="w-full px-3 py-2 bg-richblack-700 border border-richblack-600 rounded text-richblack-5"
                      >
                        <option value="Student">Student</option>
                        <option value="Instructor">Instructor</option>
                        <option value="Admin">Admin</option>
                      </select>
                      <input
                        type="tel"
                        placeholder="Contact Number (Optional)"
                        value={formData.contactNumber}
                        onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                        className="w-full px-3 py-2 bg-richblack-700 border border-richblack-600 rounded text-richblack-5"
                      />
                      {formData.accountType === "Student" && (
                        <select
                          value={formData.batchId}
                          onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                          className="w-full px-3 py-2 bg-richblack-700 border border-richblack-600 rounded text-richblack-5"
                        >
                          <option value="">Select Batch (Optional)</option>
                          {batches.map((batch) => (
                            <option key={batch._id} value={batch._id}>
                              {batch.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        type="submit"
                        className="flex-1 bg-yellow-50 text-richblack-900 py-2 rounded hover:bg-yellow-100"
                      >
                        Create User
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1 bg-richblack-600 text-richblack-5 py-2 rounded hover:bg-richblack-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && (
              <div className="fixed inset-0 bg-richblack-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-richblack-800 p-6 rounded-lg w-full max-w-md">
                  <h3 className="text-xl font-semibold mb-4">Edit User</h3>
                  <form onSubmit={handleUpdateUser}>
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-3 py-2 bg-richblack-700 border border-richblack-600 rounded text-richblack-5"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-3 py-2 bg-richblack-700 border border-richblack-600 rounded text-richblack-5"
                        required
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 bg-richblack-700 border border-richblack-600 rounded text-richblack-5"
                        required
                      />
                      <select
                        value={formData.accountType}
                        onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                        className="w-full px-3 py-2 bg-richblack-700 border border-richblack-600 rounded text-richblack-5"
                      >
                        <option value="Student">Student</option>
                        <option value="Instructor">Instructor</option>
                        <option value="Admin">Admin</option>
                      </select>
                      <input
                        type="tel"
                        placeholder="Contact Number (Optional)"
                        value={formData.contactNumber}
                        onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                        className="w-full px-3 py-2 bg-richblack-700 border border-richblack-600 rounded text-richblack-5"
                      />
                      {formData.accountType === "Student" && (
                        <select
                          value={formData.batchId}
                          onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                          className="w-full px-3 py-2 bg-richblack-700 border border-richblack-600 rounded text-richblack-5"
                        >
                          <option value="">Select Batch (Optional)</option>
                          {batches.map((batch) => (
                            <option key={batch._id} value={batch._id}>
                              {batch.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        type="submit"
                        className="flex-1 bg-yellow-50 text-richblack-900 py-2 rounded hover:bg-yellow-100"
                      >
                        Update User
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowEditModal(false)}
                        className="flex-1 bg-richblack-600 text-richblack-5 py-2 rounded hover:bg-richblack-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Confirmation Modal */}
            {confirmationModal && (
              <ConfirmationModal
                modalData={confirmationModal}
                closeModal={() => setConfirmationModal(null)}
              />
            )}
          </div>
        )}
      </div>
    </div >
  );
};

export default UserManagementComplete;
