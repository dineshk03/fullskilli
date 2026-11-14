import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FiSearch, FiMail, FiRefreshCw, FiDownload, FiFilter, FiEye, FiX, FiUsers, FiShield, FiKey, FiCheck, FiBell } from 'react-icons/fi';
import { FaCheckCircle, FaTimesCircle, FaEnvelope, FaUser, FaGoogle } from 'react-icons/fa';
import { getEmailLogs } from '../../../services/operations/emailAPI';

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};
export default function EmailLogs() {
  const {
    token
  } = useSelector(state => state.auth);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summaryStats, setSummaryStats] = useState(null);
  const [, setPagination] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [viewMode, setViewMode] = useState('html'); // 'html' or 'text'

  // Debounce the email filter to avoid too many API calls
  const debouncedEmailFilter = useDebounce(emailFilter, 500);
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const response = await getEmailLogs(token, {
        status: statusFilter || undefined,
        email: debouncedEmailFilter || undefined,
        dateFrom: dateFromFilter || undefined,
        dateTo: dateToFilter || undefined
      });
      if (response) {
        setLogs(response.logs || []);
        setSummaryStats(response.stats || null);
        setPagination(response.pagination || null);
      }
      setLoading(false);
    };
    fetchLogs();
  }, [token, statusFilter, debouncedEmailFilter, dateFromFilter, dateToFilter]);
  useEffect(() => {
    if (!showEmailModal) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [showEmailModal]);
  const handleRefresh = () => {
    const fetchLogs = async () => {
      setLoading(true);
      const response = await getEmailLogs(token, {
        status: statusFilter || undefined,
        email: emailFilter || undefined,
        dateFrom: dateFromFilter || undefined,
        dateTo: dateToFilter || undefined
      });
      if (response) {
        setLogs(response.logs || []);
        setSummaryStats(response.stats || null);
        setPagination(response.pagination || null);
      }
      setLoading(false);
    };
    fetchLogs();
  };
  const handleExport = () => {
    if (logs.length === 0) {
      alert('No email logs to export');
      return;
    }

    // Prepare CSV data
    const csvHeaders = ['Email', 'Subject', 'Status', 'Trigger', 'Sent At', 'Response/Error', 'Message ID'];
    const csvData = logs.map(log => [log.email, log.subject, log.status, log.context ? log.context === 'bulk_user_upload' ? 'Bulk Upload' : log.context === 'user_signup_otp' ? 'Signup OTP' : log.context === 'otp_verification' ? 'OTP Verify' : log.context === 'google_login_otp' ? 'Google OTP' : log.context === 'password_reset_request' ? 'Reset Request' : log.context === 'password_reset_confirmation' ? 'Reset Confirm' : log.context === 'password_update_notification' ? 'Password Updated' : log.context.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown', log.createdAt ? new Date(log.createdAt).toLocaleString('en-IN') : 'Unknown', log.status === 'FAILED' ? log.error || 'Unknown error' : log.meta?.response || 'No response', log.meta?.messageId || 'N/A']);

    // Create CSV content
    const csvContent = [csvHeaders.join(','), ...csvData.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `email-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const getStatusStats = () => {
    if (summaryStats) {
      return {
        total: summaryStats.total ?? summaryStats.totalEmails ?? 0,
        sent: summaryStats.sent ?? summaryStats.SENT ?? summaryStats.statusBreakdown?.SENT ?? 0,
        failed: summaryStats.failed ?? summaryStats.FAILED ?? summaryStats.statusBreakdown?.FAILED ?? 0
      };
    }
    const total = logs.length;
    const sent = logs.filter(log => log.status === 'SENT').length;
    const failed = logs.filter(log => log.status === 'FAILED').length;
    return {
      total,
      sent,
      failed
    };
  };
  const stats = getStatusStats();
  const summaryCards = [{
    id: 'total',
    label: 'Total Emails',
    value: stats.total,
    icon: FiMail,
    accent: 'text-richblack-200',
    border: 'border-richblack-600/80',
    gradient: 'from-richblack-900/90 via-richblack-800/40 to-richblack-900/10',
    iconBg: 'bg-richblack-700/70 text-richblack-5'
  }, {
    id: 'sent',
    label: 'Successfully Sent',
    value: stats.sent,
    icon: FaCheckCircle,
    accent: 'text-caribbeangreen-200',
    border: 'border-caribbeangreen-700/70',
    gradient: 'from-caribbeangreen-900/90 via-caribbeangreen-800/50 to-caribbeangreen-900/10',
    iconBg: 'bg-caribbeangreen-800 text-caribbeangreen-100'
  }, {
    id: 'failed',
    label: 'Failed',
    value: stats.failed,
    icon: FaTimesCircle,
    accent: 'text-pink-200',
    border: 'border-pink-700/70',
    gradient: 'from-pink-900/90 via-pink-800/50 to-pink-900/10',
    iconBg: 'bg-pink-800 text-pink-100'
  }];

  // Helper function to get email type label and styling
  const getEmailTypeLabel = log => {
    const subject = log.subject?.toLowerCase() || '';

    // Check context first - use meaningful short labels
    if (log.context === 'bulk_user_upload') return {
      label: 'Bulk',
      icon: <FiUsers size={12} className="text-white" />,
      colors: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400 shadow-blue-500/25'
    };
    if (log.context === 'user_signup_otp') return {
      label: 'Signup',
      icon: <FiMail size={12} className="text-white" />,
      colors: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-400 shadow-purple-500/25'
    };
    if (log.context === 'otp_verification') return {
      label: 'OTP',
      icon: <FiShield size={12} className="text-white" />,
      colors: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-400 shadow-purple-500/25'
    };
    if (log.context === 'google_login_otp') return {
      label: 'Google',
      icon: <FaGoogle size={12} className="text-white" />,
      colors: 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-400 shadow-red-500/25'
    };
    if (log.context === 'password_reset_request') return {
      label: 'Reset',
      icon: <FiKey size={12} className="text-white" />,
      colors: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-400 shadow-orange-500/25'
    };
    if (log.context === 'password_reset_confirmation') return {
      label: 'Confirm',
      icon: <FiCheck size={12} className="text-white" />,
      colors: 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-400 shadow-green-500/25'
    };
    if (log.context === 'password_update_notification') return {
      label: 'Updated',
      icon: <FiBell size={12} className="text-white" />,
      colors: 'bg-gradient-to-r from-teal-500 to-teal-600 text-white border-teal-400 shadow-teal-500/25'
    };

    // If no context, detect from subject
    if (subject.includes('enrollment') || subject.includes('enrolled')) return {
      label: 'Enroll',
      icon: <FiMail size={12} className="text-white" />,
      colors: 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-indigo-400 shadow-indigo-500/25'
    };
    if (subject.includes('welcome')) return {
      label: 'Welcome',
      icon: <FiMail size={12} className="text-white" />,
      colors: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-400 shadow-emerald-500/25'
    };
    if (subject.includes('password') && subject.includes('reset')) return {
      label: 'Reset',
      icon: <FiKey size={12} className="text-white" />,
      colors: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-400 shadow-orange-500/25'
    };
    if (subject.includes('password')) return {
      label: 'Password',
      icon: <FiBell size={12} className="text-white" />,
      colors: 'bg-gradient-to-r from-teal-500 to-teal-600 text-white border-teal-400 shadow-teal-500/25'
    };
    if (subject.includes('otp') || subject.includes('verification')) return {
      label: 'OTP',
      icon: <FiShield size={12} className="text-white" />,
      colors: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-400 shadow-purple-500/25'
    };
    if (subject.includes('confirmation')) return {
      label: 'Confirm',
      icon: <FiCheck size={12} className="text-white" />,
      colors: 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-400 shadow-green-500/25'
    };
    if (subject.includes('notification')) return {
      label: 'Notify',
      icon: <FiBell size={12} className="text-white" />,
      colors: 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white border-cyan-400 shadow-cyan-500/25'
    };
    if (subject.includes('course') || subject.includes('assignment')) return {
      label: 'Course',
      icon: <FiMail size={12} className="text-white" />,
      colors: 'bg-gradient-to-r from-pink-500 to-pink-600 text-white border-pink-400 shadow-pink-500/25'
    };

    // Default
    return {
      label: subject ? subject.substring(0, 6) : 'Email',
      icon: <FiMail size={12} className="text-white" />,
      colors: 'bg-gradient-to-r from-slate-500 to-slate-600 text-white border-slate-400 shadow-slate-500/25'
    };
  };
  const getStatusStyles = status => {
    switch (status) {
      case 'SENT':
        return {
          badge: 'bg-emerald-500/25 text-emerald-50 border border-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.35)]',
          icon: 'text-emerald-200'
        };
      case 'FAILED':
        return {
          badge: 'bg-rose-500/25 text-rose-50 border border-rose-400 shadow-[0_0_18px_rgba(244,63,94,0.35)]',
          icon: 'text-rose-200'
        };
      case 'QUEUED':
        return {
          badge: 'bg-amber-500/25 text-amber-900 border border-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.35)]',
          icon: 'text-amber-200'
        };
      case 'DELIVERED':
        return {
          badge: 'bg-sky-500/25 text-sky-50 border border-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.35)]',
          icon: 'text-sky-200'
        };
      default:
        return {
          badge: 'bg-white/12 text-white/80 border border-white/20',
          icon: 'text-white/70'
        };
    }
  };
  if (loading) {
    return <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-gradient-to-br from-richblack-900 to-richblack-800">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-yellow-50/20 border-t-yellow-50 rounded-full animate-spin mx-auto mb-4"></div>
            <FaEnvelope className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-yellow-50" size={20} />
          </div>
          <h3 className="text-xl font-semibold text-richblack-5 mb-2">Loading Email Reports</h3>
          <p className="text-richblack-300">Fetching your email logs...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-[#0b0f1a] px-4 py-6 sm:px-8">
      {/* Header Section */}
      <div className="mb-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 backdrop-blur">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400/90 via-yellow-300 to-amber-400 text-richblack-900 shadow-[0_10px_40px_rgba(250,204,21,0.35)]">
                <FiMail size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">Operations</p>
                <h1 className="text-3xl font-bold text-white sm:text-4xl">Email Reports</h1>
              </div>
            </div>
            <p className="max-w-2xl text-sm text-white/60 sm:text-base">
              Monitor deliverability, track campaign performance, and drill down into individual messages across your platform communications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={handleRefresh} className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm font-medium text-white/70 transition-all hover:border-white/25 hover:bg-white/[0.04] hover:text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-white/70 transition group-hover:bg-yellow-300/20 group-hover:text-yellow-200">
                <FiRefreshCw size={16} />
              </span>
              Refresh
            </button>
            <button onClick={handleExport} className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 via-yellow-300 to-amber-400 px-5 py-2 text-sm font-semibold text-richblack-900 shadow-[0_14px_40px_rgba(250,204,21,0.35)] transition hover:shadow-[0_18px_48px_rgba(250,204,21,0.4)]" title="Export email logs to CSV">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-richblack-900/10 text-richblack-900">
                <FiDownload size={16} />
              </span>
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {summaryCards.map(({
          id,
          label,
          value,
          icon: Icon,
          accent,
          border,
          gradient,
          iconBg
        }) => <div key={id} className={`group relative overflow-hidden rounded-2xl border ${border} bg-gradient-to-br ${gradient} p-5 shadow-[0_10px_35px_rgba(0,0,0,0.35)] transition-all hover:border-white/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.55)]`}>
              <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
                <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent" />
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/5 blur-3xl" />
              </div>
              <div className="relative flex items-center justify-between gap-4">
                <div>
                  <p className={`text-xs font-medium uppercase tracking-[0.24em] ${accent}`}>{label}</p>
                  <p className="mt-2 text-3xl font-semibold text-white sm:text-4xl">{value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} shadow-[0_12px_30px_rgba(0,0,0,0.3)]`}>
                  <Icon size={20} />
                </div>
              </div>
            </div>)}
        </div>
      </div>

      {/* Filters Section */}
      <div className="mb-8 rounded-2xl border border-white/5 bg-white/[0.03] p-5 backdrop-blur animate-fadeInUp animation-delay-300">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-white/60">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04]">
              <FiFilter size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em]">Filters</p>
              <p className="text-xs text-white/40">Refine logs by status, time period, or recipient</p>
            </div>
          </div>

          <button onClick={() => {
          setStatusFilter('');
          setEmailFilter('');
          setDateFromFilter('');
          setDateToFilter('');
        }} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white/60 transition hover:border-white/25 hover:bg-white/[0.04] hover:text-white">
            <FiX size={12} />
            Clear All
          </button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.18em] text-white/50">Status</label>
            <div className="relative">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full appearance-none rounded-xl border border-white/10 bg-richblack-800 px-4 py-2 text-sm text-white focus:border-yellow-300/70 focus:outline-none focus:ring-2 focus:ring-yellow-300/30" style={{
              colorScheme: 'dark'
            }}>
                <option value="" style={{
                backgroundColor: '#111827',
                color: '#ffffff'
              }}>All Status</option>
                <option value="SENT" style={{
                backgroundColor: '#111827',
                color: '#ffffff'
              }}>Sent</option>
                <option value="FAILED" style={{
                backgroundColor: '#111827',
                color: '#ffffff'
              }}>Failed</option>
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/40">▾</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.18em] text-white/50">From</label>
            <input type="date" value={dateFromFilter} onChange={e => setDateFromFilter(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white focus:border-yellow-300/70 focus:outline-none focus:ring-2 focus:ring-yellow-300/30" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.18em] text-white/50">To</label>
            <input type="date" value={dateToFilter} onChange={e => setDateToFilter(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white focus:border-yellow-300/70 focus:outline-none focus:ring-2 focus:ring-yellow-300/30" />
          </div>

          <div className="space-y-2 lg:col-span-1">
            <label className="text-xs font-medium uppercase tracking-[0.18em] text-white/50">Search</label>
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
              <input type="text" placeholder="Search by email address..." value={emailFilter} onChange={e => setEmailFilter(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-4 py-2 text-sm text-white placeholder-white/30 focus:border-yellow-300/70 focus:outline-none focus:ring-2 focus:ring-yellow-300/30" />
            </div>
          </div>
        </div>
      </div>

      {/* Email Logs Table */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] shadow-[0_18px_60px_rgba(0,0,0,0.45)] animate-fadeInUp animation-delay-400">
        {/* Mobile Card View */}
        <div className="block lg:hidden">
          {logs.length === 0 ? <div className="px-4 py-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06]">
                  <FiMail className="text-white/40" size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">No Email Logs Found</h3>
                  <p className="text-sm text-white/60">
                    {statusFilter || emailFilter || dateFromFilter || dateToFilter ? 'No emails match your current filters. Try adjusting your search criteria.' : 'No emails have been sent yet. Email logs will appear here once emails are sent.'}
                  </p>
                </div>
              </div>
            </div> : <div className="divide-y divide-white/5">
              {logs.map((log, index) => <div key={log._id} className="p-4 bg-white/[0.02] hover:bg-white/[0.05] transition-colors duration-200 animate-slideInLeft" style={{
            animationDelay: `${index * 50}ms`
          }}>
                  {/* Email and Status Row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="p-1.5 rounded-lg bg-white/[0.08] flex-shrink-0">
                        <FiMail className="text-white/60" size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white tracking-tight truncate whitespace-nowrap max-w-[200px]">{log.email}</p>
                        <p className="text-xs text-white/50 truncate whitespace-nowrap mt-1 max-w-[200px]">{log.subject}</p>
                      </div>
                    </div>
                    {(() => {
                const statusStyles = getStatusStyles(log.status);
                return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${statusStyles.badge}`}>
                          {log.status === 'SENT' ? <FaCheckCircle size={8} className={statusStyles.icon} /> : log.status === 'FAILED' ? <FaTimesCircle size={8} className={statusStyles.icon} /> : <FiMail size={8} className={statusStyles.icon} />}
                          <span>{log.status}</span>
                        </span>;
              })()}
                  </div>

                  {/* Trigger and Actions Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {(() => {
                  const emailType = getEmailTypeLabel(log);
                  return <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap border ${emailType.colors}`}>
                            <div className="p-0.5 bg-white/30 rounded flex-shrink-0">
                              {emailType.icon}
                            </div>
                            <span className="font-bold leading-tight">{emailType.label}</span>
                          </div>;
                })()}
                    </div>
                    <button onClick={() => {
                setSelectedEmail(log);
                setShowEmailModal(true);
              }} className="group flex items-center gap-1.5 rounded-lg bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-yellow-300/20 hover:text-yellow-200" title="View Email Content">
                      <FiEye size={12} className="transition group-hover:text-yellow-100" />
                      <span>View</span>
                    </button>
                  </div>

                  {/* Sent At (if available) */}
                  {log.createdAt && <div className="mt-2 text-xs text-white/45 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
                    </div>}
                </div>)}
            </div>}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-white/[0.04]">
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                  <div className="flex items-center gap-2">
                    <FiMail size={14} />
                    Email Address
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Subject</th>
                <th className="px-6 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Status</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Sent At</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Response</th>
                <th className="px-6 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Trigger</th>
                <th className="px-6 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.length === 0 && <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.06]">
                        <FiMail className="text-white/40" size={30} />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white mb-1">No Email Logs Found</h3>
                        <p className="text-sm text-white/60">
                          {statusFilter || emailFilter || dateFromFilter || dateToFilter ? 'No emails match your current filters. Try adjusting your search criteria.' : 'No emails have been sent yet. Email logs will appear here once emails are sent.'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>}
              {logs.map((log, index) => <tr key={log._id} className="hover:bg-white/[0.035] transition-colors duration-200 animate-slideInLeft" style={{
              animationDelay: `${index * 50}ms`
            }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/[0.08] flex-shrink-0">
                        <FiMail className="text-white/60" size={14} />
                      </div>
                      <span className="text-sm font-semibold text-white tracking-tight truncate whitespace-nowrap max-w-[220px]">{log.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white/70 truncate whitespace-nowrap max-w-[260px]" title={log.subject}>
                        {log.subject}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {(() => {
                  const statusStyles = getStatusStyles(log.status);
                  return <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide ${statusStyles.badge}`}>
                          {log.status === 'SENT' ? <FaCheckCircle size={10} className={statusStyles.icon} /> : log.status === 'FAILED' ? <FaTimesCircle size={10} className={statusStyles.icon} /> : <FiMail size={10} className={statusStyles.icon} />}
                          <span className="hidden sm:inline">{log.status}</span>
                        </span>;
                })()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white/60 whitespace-nowrap">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white/45 font-mono truncate whitespace-nowrap max-w-[240px]" title={log.status === 'FAILED' ? log.error || 'Unknown error' : log.meta?.response || 'No response data'}>
                        {log.status === 'FAILED' ? log.error || 'Unknown error' : log.meta?.response || 'No response data'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      {(() => {
                    const emailType = getEmailTypeLabel(log);
                    return <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap border transition-all duration-200 hover:scale-105 ${emailType.colors}`}>
                            <div className="p-0.5 bg-white/30 rounded flex-shrink-0">
                              {emailType.icon}
                            </div>
                            <span className="font-bold leading-tight">{emailType.label}</span>
                          </div>;
                  })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => {
                  setSelectedEmail(log);
                  setShowEmailModal(true);
                }} className="group inline-flex items-center gap-1.5 rounded-lg bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-yellow-300/20 hover:text-yellow-200" title="View Email Content">
                      <FiEye size={12} className="transition group-hover:text-yellow-100" />
                      <span className="hidden sm:inline">View</span>
                    </button>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Content Modal */}
      {showEmailModal && selectedEmail && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070d]/90 backdrop-blur-lg p-2 sm:p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-[#0f1729] shadow-[0_30px_120px_rgba(0,0,0,0.65)] animate-fadeInUp">
            {/* Modal Header */}
            <div className="bg-white/[0.04] px-5 py-4 border-b border-white/10">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-400 text-richblack-900">
                    <FiMail size={16} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-white truncate">Email Details</h3>
                    <p className="text-xs sm:text-sm text-white/60 truncate">{selectedEmail?.subject}</p>
                  </div>
                </div>
                <button onClick={() => setShowEmailModal(false)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-white/60 transition hover:bg-white/[0.12] hover:text-white">
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Email Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 mb-2 text-white/60">
                    <FaUser size={14} />
                    <span className="text-sm font-medium uppercase tracking-[0.18em]">Recipient</span>
                  </div>
                  <p className="text-white font-semibold">{selectedEmail.email}</p>
                </div>
                
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 mb-2 text-white/60">
                    <FiMail size={14} />
                    <span className="text-sm font-medium uppercase tracking-[0.18em]">Subject</span>
                  </div>
                  <p className="text-white font-semibold">{selectedEmail.subject}</p>
                </div>

                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                  {(() => {
                const statusStyles = getStatusStyles(selectedEmail.status);
                return <>
                        <div className="flex items-center gap-2 mb-2 text-white/60">
                          {selectedEmail.status === 'SENT' ? <FaCheckCircle className={statusStyles.icon} size={14} /> : selectedEmail.status === 'FAILED' ? <FaTimesCircle className={statusStyles.icon} size={14} /> : <FiMail className={statusStyles.icon} size={14} />}
                          <span className="text-sm font-medium uppercase tracking-[0.18em]">Status</span>
                        </div>
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${statusStyles.badge}`}>
                          {selectedEmail.status}
                        </span>
                      </>;
              })()}
                </div>

                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 mb-2 text-white/60">
                    <FiMail size={14} />
                    <span className="text-sm font-medium uppercase tracking-[0.18em]">Sent At</span>
                  </div>
                  <p className="text-white font-semibold">
                    {selectedEmail.createdAt ? new Date(selectedEmail.createdAt).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : '-'}
                  </p>
                </div>
              </div>

              {/* Email Content */}
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FiMail className="text-yellow-200" size={16} />
                    <h4 className="text-lg font-medium text-white/70">Email Content</h4>
                  </div>
                  
                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-1">
                    <button onClick={() => setViewMode('html')} className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${viewMode === 'html' ? 'bg-yellow-300 text-richblack-900 shadow-[0_8px_18px_rgba(250,204,21,0.35)]' : 'text-white/60 hover:text-white'}`}>
                      HTML
                    </button>
                    <button onClick={() => setViewMode('text')} className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${viewMode === 'text' ? 'bg-yellow-300 text-richblack-900 shadow-[0_8px_18px_rgba(250,204,21,0.35)]' : 'text-white/60 hover:text-white'}`}>
                      Text
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-white/8 bg-[#0b1324] p-4 max-h-96 overflow-y-auto">
                  {viewMode === 'html' ? selectedEmail.htmlContent ? <div className="bg-white rounded-lg p-4 shadow-inner">
                        <iframe title="Email HTML Preview" className="w-full rounded-md" style={{
                  height: '420px',
                  border: 0,
                  background: 'white'
                }} sandbox="allow-popups allow-popups-to-escape-sandbox" srcDoc={selectedEmail.htmlContent} />
                      </div> : <div className="text-center py-8">
                        <FiMail className="text-white/40 mx-auto mb-2" size={32} />
                        <p className="text-white/60">No HTML content available</p>
                      </div> : selectedEmail.textContent ? <pre className="text-sm text-white/70 whitespace-pre-wrap font-mono">
                        {selectedEmail.textContent}
                      </pre> : <div className="text-center py-8">
                        <FiMail className="text-white/40 mx-auto mb-2" size={32} />
                        <p className="text-white/60">No text content available</p>
                      </div>}
                </div>
              </div>

              {/* Response/Error Information */}
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-2 text-white/60">
                  {selectedEmail.status === 'SENT' ? <FaCheckCircle className="text-emerald-300" size={14} /> : <FaTimesCircle className="text-rose-300" size={14} />}
                  <span className="text-sm font-medium uppercase tracking-[0.18em]">
                    {selectedEmail.status === 'SENT' ? 'Response' : 'Error'}
                  </span>
                </div>
                <p className="text-sm font-mono text-white/55 break-words">
                  {selectedEmail.status === 'FAILED' ? selectedEmail.error || 'Unknown error' : selectedEmail.meta?.response || 'No response data'}
                </p>
              </div>

              {/* Message ID */}
              {selectedEmail.meta?.messageId && <div className="flex items-start gap-3 p-3 rounded-xl border border-white/8 bg-white/[0.02]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/20 text-purple-200">
                    <FaEnvelope size={12} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/70">Message ID</p>
                    <p className="text-xs font-mono text-white/50 break-all">
                      {selectedEmail.meta.messageId}
                    </p>
                  </div>
                </div>}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-white/10 bg-white/[0.02] p-4">
              <button onClick={() => {
            setShowEmailModal(false);
            setSelectedEmail(null);
            setViewMode('html'); // Reset view mode
          }} className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/25 hover:bg-white/[0.06] hover:text-white">
                Close
              </button>
            </div>
          </div>
        </div>}
    </div>;
}
