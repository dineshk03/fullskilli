import PropTypes from "prop-types";
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { bulkUserUpload } from '../../../../services/operations/adminAPI';
import IconBtn from '../../../common/IconBtn';
import { FiUpload, FiDownload, FiUsers, FiAlertCircle, FiCheckCircle, FiX } from 'react-icons/fi';
// CSV parsing utility function
const parseCSV = text => {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) return {
    data: [],
    errors: []
  };
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }
  return {
    data,
    errors: []
  };
};
export default function BulkUserUpload({
  onSuccess = () => {}
}) {
  const {
    token
  } = useSelector(state => state.auth);
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // CSV Template data
  const csvTemplate = [{
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'TempPass123!',
    accountType: 'Student',
    contactNumber: '+1234567890',
    batchId: 'optional-batch-object-id'
  }, {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    password: 'SecurePass456!',
    accountType: 'Instructor',
    contactNumber: '+0987654321',
    batchId: ''
  }];
  const downloadTemplate = () => {
    // Convert template to CSV format
    const headers = Object.keys(csvTemplate[0]);
    const csvContent = [headers.join(','), ...csvTemplate.map(row => headers.map(header => `"${row[header]}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'bulk_user_upload_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleFileUpload = event => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      const results = parseCSV(text);
      console.log('Parsed CSV:', results);
      if (results.errors.length > 0) {
        console.error('CSV parsing errors:', results.errors);
        alert('Error parsing CSV file. Please check the format.');
        return;
      }
      const data = results.data.filter(row => row.firstName && row.lastName && row.email && row.password && row.accountType);
      setCsvData(data);
      validateCsvData(data);
    };
    reader.readAsText(file);
  };
  const validateCsvData = data => {
    const errors = [];
    const emailSet = new Set();
    const validAccountTypes = ['Admin', 'Instructor', 'Student'];
    data.forEach((row, index) => {
      const rowErrors = [];

      // Check required fields
      if (!row.firstName?.trim()) rowErrors.push('First name is required');
      if (!row.lastName?.trim()) rowErrors.push('Last name is required');
      if (!row.email?.trim()) rowErrors.push('Email is required');
      if (!row.password?.trim()) rowErrors.push('Password is required');
      if (!row.accountType?.trim()) rowErrors.push('Account type is required');

      // Validate password strength
      if (row.password && row.password.length < 6) {
        rowErrors.push('Password must be at least 6 characters long');
      }

      // Validate email format
      if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        rowErrors.push('Invalid email format');
      }

      // Check for duplicate emails in CSV
      if (row.email) {
        if (emailSet.has(row.email.toLowerCase())) {
          rowErrors.push('Duplicate email in CSV');
        } else {
          emailSet.add(row.email.toLowerCase());
        }
      }

      // Validate account type
      if (row.accountType && !validAccountTypes.includes(row.accountType)) {
        rowErrors.push('Invalid account type. Must be Admin, Instructor, or Student');
      }
      if (rowErrors.length > 0) {
        errors.push({
          row: index + 1,
          email: row.email || 'N/A',
          errors: rowErrors
        });
      }
    });
    setValidationErrors(errors);
  };
  const handleBulkUpload = async () => {
    if (csvData.length === 0) {
      alert('Please upload a CSV file with user data');
      return;
    }
    if (validationErrors.length > 0) {
      alert('Please fix validation errors before uploading');
      return;
    }
    setLoading(true);
    try {
      console.log('Sending CSV data for bulk upload:', csvData);
      const result = await bulkUserUpload(csvData, token);
      console.log('Bulk upload result:', result);
      setUploadResults(result);
      setShowResults(true);
      if (result?.summary?.successful > 0) {
        onSuccess();
      } else {
        // Even if no success, notify parent so it can refetch if needed (e.g., to reflect failures)
        onSuccess();
      }

      // Clear the form after upload (whether successful or not)
      setCsvFile(null);
      setCsvData([]);
      setValidationErrors([]);

      // Reset file input
      const fileInput = document.getElementById('csvFileInput');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Bulk upload error:', error);
      alert('Failed to process bulk upload. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };
  const closeResults = () => {
    setShowResults(false);
    setUploadResults(null);
  };
  return <div className="text-white">
      <div className="flex flex-col gap-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-3">
            <FiUsers className="text-2xl text-yellow-50" />
            <h2 className="text-2xl font-bold text-richblack-5">Bulk User Upload</h2>
          </div>
          <IconBtn text="Download Template" onClick={downloadTemplate} customClasses="bg-yellow-50 text-richblack-900 hover:bg-yellow-25">
            <FiDownload />
          </IconBtn>
        </div>

        {/* Instructions */}
        <div className="bg-richblack-800 p-6 rounded-md">
          <h3 className="text-lg font-semibold mb-4 text-yellow-50">Instructions</h3>
          <div className="space-y-2 text-richblack-100">
            <p>• Download the CSV template to see the required format</p>
            <p>• Fill in user details: firstName, lastName, email, password, accountType, contactNumber (optional)</p>
            <p>• Account types must be: Admin, Instructor, or Student</p>
            <p>• Password will be sent to users via email - ensure it&apos;s secure but memorable</p>
            <p>• Optionally include <code>batchId</code> for each user to auto-enroll them into a batch (Mongo ObjectId)</p>
            <p>• Each user will receive a welcome email with their login credentials</p>
            <p>• Users should change their password on first login for security</p>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-richblack-800 p-6 rounded-md">
          <h3 className="text-lg font-semibold mb-4">Upload CSV File</h3>
          <div className="flex flex-col gap-4">
            <input id="csvFileInput" type="file" accept=".csv" onChange={handleFileUpload} className="block w-full text-sm text-richblack-100
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-yellow-50 file:text-richblack-900
                hover:file:bg-yellow-25" />

            {csvFile && <div className="flex items-center gap-2 text-green-400">
                <FiCheckCircle />
                <span>File loaded: {csvFile.name} ({csvData.length} users)</span>
              </div>}
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && <div className="bg-red-900/20 border border-red-500 p-6 rounded-md">
            <div className="flex items-center gap-2 mb-4">
              <FiAlertCircle className="text-red-400" />
              <h3 className="text-lg font-semibold text-red-400">Validation Errors</h3>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {validationErrors.map((error, index) => <div key={index} className="bg-red-900/30 p-3 rounded">
                  <p className="font-semibold text-red-300">Row {error.row}: {error.email}</p>
                  <ul className="list-disc list-inside text-red-200 text-sm">
                    {error.errors.map((err, errIndex) => <li key={errIndex}>{err}</li>)}
                  </ul>
                </div>)}
            </div>
          </div>}

        {/* CSV Preview */}
        {csvData.length > 0 && validationErrors.length === 0 && <div className="bg-richblack-800 p-6 rounded-md">
            <h3 className="text-lg font-semibold mb-4">Preview ({csvData.length} users)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-richblack-700">
                    <th className="text-left p-2">First Name</th>
                    <th className="text-left p-2">Last Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Account Type</th>
                    <th className="text-left p-2">Contact Number</th>
                    <th className="text-left p-2">Batch Id</th>
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 5).map((user, index) => <tr key={index} className="border-b border-richblack-700">
                      <td className="p-2">{user.firstName}</td>
                      <td className="p-2">{user.lastName}</td>
                      <td className="p-2">{user.email}</td>
                      <td className="p-2">{user.accountType}</td>
                      <td className="p-2">{user.contactNumber || 'N/A'}</td>
                      <td className="p-2">{user.batchId || '—'}</td>
                    </tr>)}
                </tbody>
              </table>
              {csvData.length > 5 && <p className="text-richblack-300 text-sm mt-2">
                  ... and {csvData.length - 5} more users
                </p>}
            </div>
          </div>}

        {/* Upload Button */}
        {csvData.length > 0 && validationErrors.length === 0 && <div className="flex justify-center">
            <IconBtn text={loading ? "Processing..." : `Upload ${csvData.length} Users`} onClick={handleBulkUpload} disabled={loading} customClasses="bg-yellow-50 text-richblack-900 hover:bg-yellow-25 px-8 py-3">
              <FiUpload />
            </IconBtn>
          </div>}
      </div>

      {/* Results Modal */}
      {showResults && uploadResults && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-richblack-800 p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-yellow-50">Upload Results</h3>
              <button onClick={closeResults} className="text-richblack-300 hover:text-white">
                <FiX size={24} />
              </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-richblack-700 p-4 rounded">
                <p className="text-richblack-300">Total Processed</p>
                <p className="text-2xl font-bold text-white">{uploadResults.summary.total}</p>
              </div>
              <div className="bg-green-900/20 p-4 rounded">
                <p className="text-green-300">Successful</p>
                <p className="text-2xl font-bold text-green-400">{uploadResults.summary.successful}</p>
              </div>
              <div className="bg-red-900/20 p-4 rounded">
                <p className="text-red-300">Failed</p>
                <p className="text-2xl font-bold text-red-400">{uploadResults.summary.failed}</p>
              </div>
              <div className="bg-blue-900/20 p-4 rounded">
                <p className="text-blue-300">Emails Sent</p>
                <p className="text-2xl font-bold text-blue-400">{uploadResults.summary.emailsSent}</p>
              </div>
              <div className="bg-purple-900/20 p-4 rounded">
                <p className="text-purple-300">Assigned to Batches</p>
                <p className="text-2xl font-bold text-purple-200">{uploadResults.summary.batchesAssigned || 0}</p>
              </div>
            </div>

            {/* Successful Users */}
            {uploadResults.results.successful.length > 0 && <div className="mb-6">
                <h4 className="text-lg font-semibold text-green-400 mb-3">
                  Successfully Created Users ({uploadResults.results.successful.length})
                </h4>
                <div className="bg-green-900/10 p-4 rounded max-h-40 overflow-y-auto">
                  {uploadResults.results.successful.map((user, index) => <div key={index} className="flex justify-between items-center py-1 border-b border-green-800/20 last:border-b-0">
                      <div>
                        <span className="text-green-200 block">{user.email}</span>
                        {(user.batchName || user.batchId) && <span className="text-xs text-purple-200">Batch: {user.batchName || user.batchId}</span>}
                      </div>
                      <span className="text-xs text-green-300">
                        {user.emailSent ? '✓ Email sent' : '✗ Email failed'}
                      </span>
                    </div>)}
                </div>
              </div>}

            {/* Failed Users */}
            {uploadResults.results.failed.length > 0 && <div>
                <h4 className="text-lg font-semibold text-red-400 mb-3">
                  Failed Users ({uploadResults.results.failed.length})
                </h4>
                <div className="bg-red-900/10 p-4 rounded max-h-60 overflow-y-auto">
                  {uploadResults.results.failed.map((user, index) => <div key={index} className="py-3 border-b border-red-800/20 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className="text-red-200 font-medium">
                            {user.row ? `Row ${user.row}: ` : ''}{user.email || user.data?.email || 'Unknown email'}
                          </span>
                          {user.data && <div className="text-xs text-red-300 mt-1">
                              Name: {user.data.firstName} {user.data.lastName} | Type: {user.data.accountType}
                            </div>}
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-red-300 font-medium">Error:</p>
                        <p className="text-xs text-red-200 bg-red-900/20 p-2 rounded mt-1">
                          {user.error || user.reason || 'Unknown error occurred'}
                        </p>
                      </div>
                    </div>)}
                </div>
              </div>}
          </div>
        </div>}
    </div>;
}
BulkUserUpload.propTypes = {
  "onSuccess": PropTypes.func
};
