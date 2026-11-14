import PropTypes from "prop-types";
import { useState } from 'react';
import { FaCheckSquare, FaSquare, FaTrash, FaPowerOff, FaCheck } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { bulkDeactivateUsers, bulkActivateUsers, bulkDeleteUsers } from '../../../../services/operations/bulkUserAPI';
const BulkUserActions = ({
  users,
  token,
  onRefresh
}) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if all users are selected
  const allSelected = users.length > 0 && selectedUsers.length === users.length;
  const someSelected = selectedUsers.length > 0 && selectedUsers.length < users.length;

  // Toggle select all
  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u._id));
    }
  };

  // Toggle individual user selection
  const handleSelectUser = userId => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedUsers([]);
  };

  // Bulk Deactivate
  const handleBulkDeactivate = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users to deactivate');
      return;
    }
    if (!confirm(`Are you sure you want to deactivate ${selectedUsers.length} user(s)?`)) {
      return;
    }
    setIsProcessing(true);
    try {
      const result = await bulkDeactivateUsers(selectedUsers, token);
      if (result.success) {
        toast.success(result.message);
        clearSelection();
        onRefresh();
      } else {
        toast.error(result.message || 'Failed to deactivate users');
      }
    } catch (error) {
      console.error('Bulk deactivate error:', error);
      toast.error(error.message || 'Error deactivating users');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk Activate
  const handleBulkActivate = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users to activate');
      return;
    }
    if (!confirm(`Are you sure you want to activate ${selectedUsers.length} user(s)?`)) {
      return;
    }
    setIsProcessing(true);
    try {
      const result = await bulkActivateUsers(selectedUsers, token);
      if (result.success) {
        toast.success(result.message);
        clearSelection();
        onRefresh();
      } else {
        toast.error(result.message || 'Failed to activate users');
      }
    } catch (error) {
      console.error('Bulk activate error:', error);
      toast.error(error.message || 'Error activating users');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async (permanent = false) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users to delete');
      return;
    }
    const confirmMessage = permanent ? `⚠️ WARNING: This will PERMANENTLY delete ${selectedUsers.length} user(s) and ALL their data. This CANNOT be undone! Are you absolutely sure?` : `Move ${selectedUsers.length} user(s) to recycle bin? They can be restored later.`;
    if (!confirm(confirmMessage)) {
      return;
    }
    setIsProcessing(true);
    try {
      const result = await bulkDeleteUsers(selectedUsers, permanent, token);
      if (result.success) {
        toast.success(result.message);
        clearSelection();
        onRefresh();
      } else {
        toast.error(result.message || 'Failed to delete users');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error(error.message || 'Error deleting users');
    } finally {
      setIsProcessing(false);
    }
  };
  const UserCheckbox = ({
    userId
  }) => <button onClick={() => handleSelectUser(userId)} className="text-richblack-5 hover:text-yellow-50 transition-colors" title={selectedUsers.includes(userId) ? "Deselect" : "Select"}>
                {selectedUsers.includes(userId) ? <FaCheckSquare className="text-yellow-50" size={18} /> : <FaSquare className="text-richblack-400" size={18} />}
            </button>;
  UserCheckbox.propTypes = {
    userId: PropTypes.string
  };
  return {
    selectedUsers,
    SelectAllCheckbox: () => <div className="flex items-center">
                <button onClick={handleSelectAll} className="text-richblack-5 hover:text-yellow-50 transition-colors" title={allSelected ? "Deselect all" : "Select all"}>
                    {allSelected ? <FaCheckSquare className="text-yellow-50" size={18} /> : someSelected ? <div className="w-[18px] h-[18px] border-2 border-yellow-50 rounded flex items-center justify-center">
                            <div className="w-2 h-2 bg-yellow-50 rounded-sm" />
                        </div> : <FaSquare className="text-richblack-400" size={18} />}
                </button>
            </div>,
    UserCheckbox,
    BulkActionBar: () => selectedUsers.length > 0 && <div className="bg-yellow-50 text-richblack-900 px-4 py-3 rounded-lg flex flex-wrap items-center justify-between shadow-lg mb-4">
                    <div className="flex items-center gap-4">
                        <span className="font-semibold">
                            {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                        </span>
                        <button onClick={clearSelection} className="text-sm underline hover:no-underline" disabled={isProcessing}>
                            Clear selection
                        </button>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={handleBulkActivate} disabled={isProcessing} className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm" title="Activate selected users">
                            <FaCheck size={14} />
                            <span>Activate</span>
                        </button>

                        <button onClick={handleBulkDeactivate} disabled={isProcessing} className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm" title="Deactivate selected users">
                            <FaPowerOff size={14} />
                            <span>Deactivate</span>
                        </button>

                        <button onClick={() => handleBulkDelete(false)} disabled={isProcessing} className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm" title="Move selected users to recycle bin">
                            <FaTrash size={14} />
                            <span>Delete</span>
                        </button>

                        <button onClick={() => handleBulkDelete(true)} disabled={isProcessing} className="flex items-center gap-2 px-3 py-2 bg-red-900 hover:bg-red-950 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-red-500 text-sm" title="PERMANENTLY delete selected users (cannot be undone!)">
                            <FaTrash size={14} />
                            <span>Delete Forever</span>
                        </button>
                    </div>
                </div>
  };
};
export default BulkUserActions;
BulkUserActions.propTypes = {
  "userId": PropTypes.string
};
BulkUserActions.propTypes = {
  "userId": PropTypes.string
};
