import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { FaDownload, FaFilter, FaChartLine, FaMoneyBillWave, FaPercentage, FaReceipt, FaTimes, FaUser, FaEnvelope, FaPhone, FaBook, FaCalendar, FaCreditCard, FaTag, FaFileInvoice, FaPrint, FaEye } from 'react-icons/fa';
import { MdRefresh } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { getPaymentReports, exportPaymentReports } from '../../../../services/operations/paymentAPI';
const PaymentReports = () => {
  const {
    token
  } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  useRef(null); // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paymentMethod: 'all',
    searchQuery: '',
    page: 1,
    limit: 20,
    sortBy: 'purchaseDate',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        paymentMethod: filters.paymentMethod,
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };
      const result = await getPaymentReports(token, params);
      if (result?.success) {
        setReports(result.data.orders);
        setSummary(result.data.summary);
        setPagination(result.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching payment reports:', error);
      toast.error('Failed to fetch payment reports');
    } finally {
      setLoading(false);
    }
  }, [filters.endDate, filters.limit, filters.page, filters.paymentMethod, filters.sortBy, filters.sortOrder, filters.startDate, token]);
  useEffect(() => {
    fetchReports();
  }, [fetchReports, filters.page, filters.sortBy, filters.sortOrder]);
  const handleApplyFilters = () => {
    setFilters(prev => ({
      ...prev,
      page: 1
    }));
    fetchReports();
  };
  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      paymentMethod: 'all',
      searchQuery: '',
      page: 1,
      limit: 20,
      sortBy: 'purchaseDate',
      sortOrder: 'desc'
    });
    setTimeout(() => fetchReports(), 100);
  };
  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        paymentMethod: filters.paymentMethod
      };
      await exportPaymentReports(token, params);
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting reports:', error);
      toast.error('Failed to export reports');
    } finally {
      setExporting(false);
    }
  };
  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };
  const formatDate = date => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const handleSort = field => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }));
  };
  const handleViewInvoice = order => {
    setSelectedOrder(order);
    setShowInvoice(true);
  };
  const handleDownloadInvoice = () => {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      const invoiceHTML = generateInvoiceHTML(selectedOrder);
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
      toast.success('Invoice opened for printing/download');
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
    }
  };
  const generateInvoiceHTML = order => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order.transactionId}</title>
        <style>
          @import url("https://fonts.googleapis.com/css2?family=Redressed&family=Ubuntu:wght@400;700&display=swap");

          :root {
            --bg-clr: #b3b3b3;
            --white: #fff;
            --invoice-bg: #e7e7e9;
            --primary-clr: #2f2929;
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: "Ubuntu", sans-serif;
          }

          body {
            background: var(--bg-clr);
            font-size: 12px;
            line-height: 20px;
            color: var(--primary-clr);
            padding: 0 20px;
          }

          .main_title{
            font-weight: 700;
            font-size: 16px;
            text-transform: uppercase;
            color: var(--primary-clr);
            margin-bottom: 10px;
          }

          .p_title {
            font-weight: 700;
            font-size: 14px;
          }

          .p_title > span{
            font-weight: 400;
            font-size: 12px;
          }

          .text_right {
            text-align: right;
          }

          .text_center {
            text-align: center;
          }

          .i_row{
            display: flex;
          }

          .invoice {
            width: 800px;
            max-width: 100%;
            height: auto;
            background: var(--white);
            margin: 20px auto;
          }

          .invoice > div{
            width: 100%;
            padding: 40px;
          }

          .invoice .invoice_info .i_row,
          .invoice .invoice_payment .i_row{
            justify-content: space-between;
          }

          .invoice .invoice_info,
          .invoice .invoice_terms,
          .invoice .invoice_payment{
            background: var(--invoice-bg);
          }

          .invoice .invoice_payment{
            border-bottom: 1px dashed var(--primary-clr);
          }

          .invoice .invoice_info > div:not(:last-child){
            margin-bottom: 40px;
          } 

          .invoice .invoice_info h1{
            font-size: 38px;
            line-height: 44px;
            color: var(--primary-clr);
          }

          .invoice .w_15 {
            width: 15%;
          }

          .invoice .w_50 {
            width: 50%;
          }

          .invoice .w_55 {
            width: 55%;
          }

          .invoice .i_table .i_row {
            padding: 12px 10px; 
            border: 1px dashed var(--primary-clr); 
            border-bottom: 0;
          }

          .invoice .i_table .i_table_foot .i_row:last-child{
            border-bottom: 1px dashed var(--primary-clr);  
          }

          .invoice .i_table .i_row p{
            margin: 0;
            font-weight: 700;
          }

          .invoice .i_table .i_table_head .i_row,
          .invoice .i_table .i_table_foot .grand_total_wrap{
            background: var(--invoice-bg);
          }

          .invoice .invoice_right .terms{
            margin: 0;
          }

          /* Print Styles */
          @media print {
            body { background: white; padding: 0; }
            .invoice { margin: 0; }
          }
        </style>
      </head>
      <body>
        <section>
          <div class="invoice">
            <div class="invoice_info">
              <div class="i_row">
                <div class="i_logo">
                  <h1>BEEJA ACADEMY</h1>
                </div>
                <div class="title">
                  <h1>INVOICE</h1>
                </div>
              </div>
              <div class="i_row">
                <div class="i_to">
                  <div class="main_title">
                    <p>Invoice To</p>
                  </div>
                  <div class="p_title">
                    <p>${order.user?.name || 'N/A'}</p>
                    <span>Student</span>
                  </div>
                  <div class="p_title">
                    <p>${order.user?.email || 'N/A'}</p>
                    <p>${order.user?.contactNumber || 'N/A'}</p>
                  </div>
                </div>
                <div class="i_details text_right">
                  <div class="main_title">
                    <p>Invoice details</p>
                  </div>
                  <div class="p_title">
                    <p>Invoice No:</p>
                    <span>INV-${order._id.slice(-8).toUpperCase()}</span>
                  </div>
                  <div class="p_title">
                    <p>Invoice Date:</p>
                    <span>${new Date(order.purchaseDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="invoice_table">
              <div class="i_table">
                <div class="i_table_head">
                  <div class="i_row">
                    <div class="i_col w_55">
                      <p class="p_title">DESCRIPTION</p>
                    </div>
                    <div class="i_col w_15 text_center">
                      <p class="p_title">QTY</p>
                    </div>
                    <div class="i_col w_15 text_center">
                      <p class="p_title">PRICE</p>
                    </div>
                    <div class="i_col w_15 text_right">
                      <p class="p_title">TOTAL</p>
                    </div>
                  </div>
                </div>
                <div class="i_table_body">
                  <div class="i_row">
                    <div class="i_col w_55">
                      <p>${order.course?.name || 'N/A'}</p>
                      <span>Lifetime Access • Digital Course • Instructor: ${order.course?.instructor || 'Beeja Academy'}</span>
                    </div>
                    <div class="i_col w_15 text_center">
                      <p>1</p>
                    </div>
                    <div class="i_col w_15 text_center">
                      <p>${order.originalPrice > 0 ? `Rs. ${order.originalPrice}` : order.amount === 0 ? 'Free' : `Rs. ${order.amount}`}</p>
                    </div>
                    <div class="i_col w_15 text_right">
                      <p>${order.originalPrice > 0 ? `Rs. ${order.originalPrice}` : order.amount === 0 ? 'Free' : `Rs. ${order.amount}`}</p>
                    </div>
                  </div>
                </div>
                <div class="i_table_foot">
                  <div class="i_row">
                    <div class="i_col w_50">
                      <p>Sub Total</p>
                      ${order.coupon?.code || order.discountAmount > 0 ? '<p>Discount</p>' : ''}
                    </div>
                    <div class="i_col w_50 text_right">
                      <p>${order.originalPrice > 0 ? `Rs. ${order.originalPrice}` : order.amount === 0 ? 'Free' : `Rs. ${order.amount}`}</p>
                      ${order.coupon?.discountAmount > 0 || order.discountAmount > 0 ? `<p style="color: #059669;">- Rs. ${((order.coupon?.discountAmount || 0) + (order.discountAmount || 0)).toFixed(2)}</p>` : ''}
                    </div>
                  </div>
                  ${order.coupon?.code ? `
                  <div class="i_row">
                    <div class="i_col w_50">
                      <p>Coupon Code</p>
                    </div>
                    <div class="i_col w_50 text_right">
                      <p style="color: #059669;">${order.coupon.code}</p>
                    </div>
                  </div>
                  ` : ''}
                  <div class="i_row grand_total_wrap">
                    <div class="i_col w_50">
                      <p>GRAND TOTAL:</p>
                    </div>
                    <div class="i_col w_50 text_right">
                      <p>${order.amount === 0 ? 'Free' : `Rs. ${order.amount}`}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="invoice_payment">
              <div class="i_row">
                <div class="i_payment">
                  <div class="main_title">
                    <p>Payment Method</p>
                  </div>
                  <div class="p_title">
                    <p>Payment Method:</p>
                    <span>${order.paymentMethod.toUpperCase()}</span>
                  </div>
                  <div class="p_title">
                    <p>Transaction ID:</p>
                    <span>${order.transactionId}</span>
                  </div>
                </div>
                <div class="i_duetotal text_right">
                  <div class="main_title">
                    <p>Payment Status</p>
                  </div>
                  <div class="p_title">
                    <p>Status:</p>
                    <span>✓ ${order.status}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="invoice_terms">
              <div class="main_title">
                <p>Company Information</p>
              </div>
              <p><strong>Beeja Academy</strong> - Excellence in Education<br>
              Contact: HR | Phone: +91 1234567890 | Email: hr@beejaacademy.com<br>
              Website: www.beejaacademy.com<br><br>
              Thank you for choosing Beeja Academy! This is a computer-generated invoice.</p>
            </div>
          </div>
        </section>
      </body>
      </html>
    `;
  };
  return <div className="text-white space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-richblack-5">Payment Reports</h1>
          <p className="text-richblack-300 mt-1">Track and analyze all payment transactions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 bg-richblack-700 hover:bg-richblack-600 rounded-lg transition-colors">
            <FaFilter size={14} />
            <span className="text-sm font-medium">Filters</span>
          </button>
          <button onClick={handleExport} disabled={exporting || reports.length === 0} className="flex items-center gap-2 px-4 py-2 bg-caribbeangreen-400 hover:bg-caribbeangreen-500 text-richblack-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <FaDownload size={14} />
            <span className="text-sm font-medium">{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
          <button onClick={fetchReports} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-richblack-700 hover:bg-richblack-600 rounded-lg transition-colors">
            <MdRefresh size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-richblack-800 p-6 rounded-lg border border-richblack-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-richblack-300 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-caribbeangreen-400 mt-1">
                  {formatCurrency(summary.totalRevenue)}
                </p>
              </div>
              <div className="p-3 bg-caribbeangreen-400/10 rounded-lg">
                <FaMoneyBillWave className="text-caribbeangreen-400" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-richblack-800 p-6 rounded-lg border border-richblack-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-richblack-300 text-sm">Total Discounts</p>
                <p className="text-2xl font-bold text-yellow-50 mt-1">
                  {formatCurrency(summary.totalDiscounts)}
                </p>
              </div>
              <div className="p-3 bg-yellow-50/10 rounded-lg">
                <FaPercentage className="text-yellow-50" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-richblack-800 p-6 rounded-lg border border-richblack-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-richblack-300 text-sm">Avg Order Value</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">
                  {formatCurrency(summary.averageOrderValue)}
                </p>
              </div>
              <div className="p-3 bg-blue-400/10 rounded-lg">
                <FaChartLine className="text-blue-400" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-richblack-800 p-6 rounded-lg border border-richblack-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-richblack-300 text-sm">Total Orders</p>
                <p className="text-2xl font-bold text-pink-400 mt-1">
                  {pagination?.totalOrders || 0}
                </p>
              </div>
              <div className="p-3 bg-pink-400/10 rounded-lg">
                <FaReceipt className="text-pink-400" size={24} />
              </div>
            </div>
          </div>
        </div>}

      {/* Filters Panel */}
      {showFilters && <div className="bg-richblack-800 p-6 rounded-lg border border-richblack-700">
          <h3 className="text-lg font-semibold mb-4">Filter Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-richblack-300 mb-2 block">Start Date</label>
              <input type="date" value={filters.startDate} onChange={e => setFilters(prev => ({
            ...prev,
            startDate: e.target.value
          }))} className="w-full px-3 py-2 bg-richblack-700 border border-richblack-600 rounded-lg text-richblack-5 focus:outline-none focus:border-caribbeangreen-400" />
            </div>
            <div>
              <label className="text-sm text-richblack-300 mb-2 block">End Date</label>
              <input type="date" value={filters.endDate} onChange={e => setFilters(prev => ({
            ...prev,
            endDate: e.target.value
          }))} className="w-full px-3 py-2 bg-richblack-700 border border-richblack-600 rounded-lg text-richblack-5 focus:outline-none focus:border-caribbeangreen-400" />
            </div>
            <div>
              <label className="text-sm text-richblack-300 mb-2 block">Payment Method</label>
              <select value={filters.paymentMethod} onChange={e => setFilters(prev => ({
            ...prev,
            paymentMethod: e.target.value
          }))} className="w-full px-3 py-2 bg-richblack-700 border border-richblack-600 rounded-lg text-richblack-5 focus:outline-none focus:border-caribbeangreen-400">
                <option value="all">All Methods</option>
                <option value="razorpay">Razorpay</option>
                <option value="free">Free</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button onClick={handleApplyFilters} className="flex-1 px-4 py-2 bg-caribbeangreen-400 hover:bg-caribbeangreen-500 text-richblack-900 rounded-lg font-medium transition-colors">
                Apply
              </button>
              <button onClick={handleResetFilters} className="flex-1 px-4 py-2 bg-richblack-700 hover:bg-richblack-600 text-richblack-5 rounded-lg font-medium transition-colors">
                Reset
              </button>
            </div>
          </div>
        </div>}

      {/* Payment Method Stats */}
      {summary?.paymentMethodStats && summary.paymentMethodStats.length > 0 && <div className="bg-richblack-800 p-6 rounded-lg border border-richblack-700">
          <h3 className="text-lg font-semibold mb-4">Payment Method Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summary.paymentMethodStats.map(stat => <div key={stat._id} className="bg-richblack-700 p-4 rounded-lg">
                <p className="text-richblack-300 text-sm capitalize">{stat._id}</p>
                <p className="text-xl font-bold text-richblack-5 mt-1">{formatCurrency(stat.revenue)}</p>
                <p className="text-sm text-richblack-400 mt-1">{stat.count} orders</p>
              </div>)}
          </div>
        </div>}

      {/* Top Coupons */}
      {summary?.topCoupons && summary.topCoupons.length > 0 && <div className="bg-richblack-800 p-6 rounded-lg border border-richblack-700">
          <h3 className="text-lg font-semibold mb-4">Top Performing Coupons</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-richblack-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-richblack-300">Coupon Code</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-richblack-300">Usage Count</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-richblack-300">Total Discount</th>
                </tr>
              </thead>
              <tbody>
                {summary.topCoupons.map((coupon, index) => <tr key={index} className="border-b border-richblack-700">
                    <td className="py-3 px-4 font-medium">{coupon._id}</td>
                    <td className="py-3 px-4 text-right">{coupon.count}</td>
                    <td className="py-3 px-4 text-right text-yellow-50">{formatCurrency(coupon.totalDiscount)}</td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>}

      {/* Reports Table */}
      <div className="bg-richblack-800 rounded-lg border border-richblack-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-richblack-700">
              <tr>
                <th onClick={() => handleSort('transactionId')} className="text-left py-4 px-4 text-sm font-medium text-richblack-300 cursor-pointer hover:text-richblack-5">
                  Transaction ID {filters.sortBy === 'transactionId' && (filters.sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th onClick={() => handleSort('purchaseDate')} className="text-left py-4 px-4 text-sm font-medium text-richblack-300 cursor-pointer hover:text-richblack-5">
                  Date {filters.sortBy === 'purchaseDate' && (filters.sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-richblack-300">Student</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-richblack-300">Course</th>
                <th onClick={() => handleSort('amount')} className="text-right py-4 px-4 text-sm font-medium text-richblack-300 cursor-pointer hover:text-richblack-5">
                  Amount {filters.sortBy === 'amount' && (filters.sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th className="text-center py-4 px-4 text-sm font-medium text-richblack-300">Payment Method</th>
                <th className="text-center py-4 px-4 text-sm font-medium text-richblack-300">Coupon</th>
                <th className="text-center py-4 px-4 text-sm font-medium text-richblack-300">Status</th>
                <th className="text-center py-4 px-4 text-sm font-medium text-richblack-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr>
                  <td colSpan="9" className="text-center py-12">
                    <div className="flex justify-center items-center">
                      <div className="w-8 h-8 border-2 border-richblack-700 border-t-yellow-50 rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr> : reports.length === 0 ? <tr>
                  <td colSpan="9" className="text-center py-12 text-richblack-400">
                    No payment records found
                  </td>
                </tr> : reports.map(report => <tr key={report._id} className="border-b border-richblack-700 hover:bg-richblack-700/50 transition-colors">
                    <td className="py-4 px-4">
                      <span className="text-sm font-mono text-richblack-300">
                        {report.transactionId.substring(0, 20)}...
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-richblack-300">{formatDate(report.purchaseDate)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-sm font-medium">{report.user.name}</p>
                        <p className="text-xs text-richblack-400">{report.user.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-sm font-medium">{report.course.name}</p>
                        {report.course.category && <p className="text-xs text-richblack-400">{report.course.category}</p>}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div>
                        <p className="text-sm font-bold text-caribbeangreen-400">{formatCurrency(report.amount)}</p>
                        {report.discountAmount > 0 && <p className="text-xs text-richblack-400 line-through">{formatCurrency(report.originalPrice)}</p>}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${report.paymentMethod === 'razorpay' ? 'bg-blue-400/10 text-blue-400' : 'bg-caribbeangreen-400/10 text-caribbeangreen-400'}`}>
                        {report.paymentMethod}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {report.coupon ? <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-yellow-50/10 text-yellow-50">
                          {report.coupon.code}
                        </span> : <span className="text-xs text-richblack-400">-</span>}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${report.status === 'Completed' ? 'bg-caribbeangreen-400/10 text-caribbeangreen-400' : 'bg-pink-400/10 text-pink-400'}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={e => {
                    e.stopPropagation();
                    handleViewInvoice(report);
                  }} className="p-2 bg-blue-400/10 hover:bg-blue-400/20 text-blue-400 rounded-lg transition-colors" title="View Invoice">
                          <FaFileInvoice size={16} />
                        </button>
                        <button onClick={e => {
                    e.stopPropagation();
                    setSelectedOrder(report);
                  }} className="p-2 bg-purple-400/10 hover:bg-purple-400/20 text-purple-400 rounded-lg transition-colors" title="View Details">
                          <FaEye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>)}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && <div className="flex justify-between items-center px-6 py-4 border-t border-richblack-700">
            <p className="text-sm text-richblack-300">
              Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalOrders)} of{' '}
              {pagination.totalOrders} orders
            </p>
            <div className="flex gap-2">
              <button onClick={() => setFilters(prev => ({
            ...prev,
            page: prev.page - 1
          }))} disabled={pagination.currentPage === 1} className="px-4 py-2 bg-richblack-700 hover:bg-richblack-600 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Previous
              </button>
              <div className="flex items-center gap-2">
                {[...Array(Math.min(5, pagination.totalPages))].map((_, idx) => {
              const pageNum = idx + 1;
              return <button key={pageNum} onClick={() => setFilters(prev => ({
                ...prev,
                page: pageNum
              }))} className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${pagination.currentPage === pageNum ? 'bg-caribbeangreen-400 text-richblack-900' : 'bg-richblack-700 hover:bg-richblack-600 text-richblack-5'}`}>
                      {pageNum}
                    </button>;
            })}
              </div>
              <button onClick={() => setFilters(prev => ({
            ...prev,
            page: prev.page + 1
          }))} disabled={pagination.currentPage === pagination.totalPages} className="px-4 py-2 bg-richblack-700 hover:bg-richblack-600 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Next
              </button>
            </div>
          </div>}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-richblack-800 rounded-xl border border-richblack-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-richblack-800 to-richblack-700 border-b border-richblack-600 p-6 flex justify-between items-center z-10">
              <div>
                <h2 className="text-2xl font-bold text-richblack-5 flex items-center gap-2">
                  <FaReceipt className="text-caribbeangreen-400" />
                  Order Details
                </h2>
                <p className="text-sm text-richblack-300 mt-1 font-mono">ID: {selectedOrder.transactionId}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-richblack-600 rounded-lg transition-colors">
                <FaTimes className="text-richblack-300 hover:text-richblack-5" size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Payment Summary - Enhanced */}
              <div className="bg-gradient-to-br from-richblack-700 to-richblack-800 rounded-xl p-6 border border-richblack-600">
                <h3 className="text-xl font-bold text-richblack-5 mb-5 flex items-center gap-2">
                  <FaMoneyBillWave className="text-caribbeangreen-400" size={20} />
                  Payment Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-richblack-800/50 rounded-lg p-4 border border-richblack-600">
                    <p className="text-xs text-richblack-400 uppercase tracking-wide mb-2">Original Price</p>
                    <p className="text-2xl font-bold text-richblack-5">{formatCurrency(selectedOrder.originalPrice)}</p>
                  </div>
                  {selectedOrder.discountAmount > 0 && <div className="bg-richblack-800/50 rounded-lg p-4 border border-yellow-50/20">
                      <p className="text-xs text-richblack-400 uppercase tracking-wide mb-2">Discount Applied</p>
                      <p className="text-2xl font-bold text-yellow-50">-{formatCurrency(selectedOrder.discountAmount)}</p>
                      <p className="text-xs text-richblack-400 mt-1">
                        {selectedOrder.discountAmount > 0 ? `${(selectedOrder.discountAmount / selectedOrder.originalPrice * 100).toFixed(1)}% off` : ''}
                      </p>
                    </div>}
                  <div className="bg-caribbeangreen-400/10 rounded-lg p-4 border border-caribbeangreen-400/30">
                    <p className="text-xs text-richblack-400 uppercase tracking-wide mb-2">Final Amount Paid</p>
                    <p className="text-3xl font-bold text-caribbeangreen-400">{formatCurrency(selectedOrder.amount)}</p>
                  </div>
                  <div className="bg-richblack-800/50 rounded-lg p-4 border border-richblack-600">
                    <p className="text-xs text-richblack-400 uppercase tracking-wide mb-2">Payment Status</p>
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mt-1 ${selectedOrder.status === 'Completed' ? 'bg-caribbeangreen-400/20 text-caribbeangreen-400 border border-caribbeangreen-400/30' : 'bg-pink-400/20 text-pink-400 border border-pink-400/30'}`}>
                      <span className={`w-2 h-2 rounded-full ${selectedOrder.status === 'Completed' ? 'bg-caribbeangreen-400' : 'bg-pink-400'}`}></span>
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Student Information - Enhanced */}
              <div className="bg-gradient-to-br from-richblack-700 to-richblack-800 rounded-xl p-6 border border-richblack-600">
                <h3 className="text-xl font-bold text-richblack-5 mb-5 flex items-center gap-2">
                  <FaUser className="text-blue-400" size={20} />
                  Student Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 bg-richblack-800/50 rounded-lg p-4 border border-richblack-600">
                    <div className="w-12 h-12 rounded-full bg-blue-400/20 flex items-center justify-center flex-shrink-0">
                      <FaUser className="text-blue-400" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-richblack-400 uppercase tracking-wide">Student Name</p>
                      <p className="text-base font-bold text-richblack-5 truncate">{selectedOrder.user.name || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-richblack-800/50 rounded-lg p-4 border border-richblack-600">
                    <div className="w-12 h-12 rounded-full bg-purple-400/20 flex items-center justify-center flex-shrink-0">
                      <FaEnvelope className="text-purple-400" size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-richblack-400 uppercase tracking-wide">Email Address</p>
                      <p className="text-sm font-medium text-richblack-5 truncate">{selectedOrder.user.email}</p>
                    </div>
                  </div>
                  {selectedOrder.user.contactNumber && <div className="flex items-center gap-4 bg-richblack-800/50 rounded-lg p-4 border border-richblack-600 md:col-span-2">
                      <div className="w-12 h-12 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0">
                        <FaPhone className="text-green-400" size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-richblack-400 uppercase tracking-wide">Contact Number</p>
                        <p className="text-base font-bold text-richblack-5">{selectedOrder.user.contactNumber}</p>
                      </div>
                    </div>}
                </div>
              </div>

              {/* Course Information - Enhanced */}
              <div className="bg-gradient-to-br from-richblack-700 to-richblack-800 rounded-xl p-6 border border-richblack-600">
                <h3 className="text-xl font-bold text-richblack-5 mb-5 flex items-center gap-2">
                  <FaBook className="text-pink-400" size={20} />
                  Course Information
                </h3>
                <div className="space-y-4">
                  {selectedOrder.course.thumbnail && <div className="relative overflow-hidden rounded-xl border-2 border-richblack-600">
                      <img src={selectedOrder.course.thumbnail} alt={selectedOrder.course.name} className="w-full h-48 object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-richblack-900/80 to-transparent"></div>
                    </div>}
                  <div className="bg-richblack-800/50 rounded-lg p-4 border border-richblack-600">
                    <p className="text-xs text-richblack-400 uppercase tracking-wide mb-2">Course Title</p>
                    <p className="text-xl font-bold text-richblack-5">{selectedOrder.course.name}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedOrder.course.category && <div className="bg-richblack-800/50 rounded-lg p-4 border border-richblack-600">
                        <p className="text-xs text-richblack-400 uppercase tracking-wide mb-2">Category</p>
                        <span className="inline-block px-3 py-1 bg-pink-400/20 text-pink-400 rounded-full text-sm font-medium border border-pink-400/30">
                          {selectedOrder.course.category}
                        </span>
                      </div>}
                    {selectedOrder.course.instructor && <div className="bg-richblack-800/50 rounded-lg p-4 border border-richblack-600">
                        <p className="text-xs text-richblack-400 uppercase tracking-wide mb-2">Instructor</p>
                        <p className="text-base font-bold text-richblack-5">{selectedOrder.course.instructor}</p>
                      </div>}
                  </div>
                </div>
              </div>

              {/* Payment & Transaction Details - Enhanced */}
              <div className="bg-gradient-to-br from-richblack-700 to-richblack-800 rounded-xl p-6 border border-richblack-600">
                <h3 className="text-xl font-bold text-richblack-5 mb-5 flex items-center gap-2">
                  <FaCreditCard className="text-purple-400" size={20} />
                  Payment & Transaction Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 bg-richblack-800/50 rounded-lg p-4 border border-richblack-600">
                    <div className="w-12 h-12 rounded-full bg-orange-400/20 flex items-center justify-center flex-shrink-0">
                      <FaCalendar className="text-orange-400" size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-richblack-400 uppercase tracking-wide">Purchase Date & Time</p>
                      <p className="text-sm font-bold text-richblack-5">{formatDate(selectedOrder.purchaseDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-richblack-800/50 rounded-lg p-4 border border-richblack-600">
                    <div className="w-12 h-12 rounded-full bg-blue-400/20 flex items-center justify-center flex-shrink-0">
                      <FaCreditCard className="text-blue-400" size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-richblack-400 uppercase tracking-wide">Payment Method</p>
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold capitalize mt-1 ${selectedOrder.paymentMethod === 'razorpay' ? 'bg-blue-400/20 text-blue-400 border border-blue-400/30' : 'bg-caribbeangreen-400/20 text-caribbeangreen-400 border border-caribbeangreen-400/30'}`}>
                        {selectedOrder.paymentMethod}
                      </span>
                    </div>
                  </div>
                  <div className="md:col-span-2 bg-richblack-800/50 rounded-lg p-4 border border-richblack-600">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-400/20 flex items-center justify-center flex-shrink-0">
                        <FaReceipt className="text-purple-400" size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-richblack-400 uppercase tracking-wide mb-2">Transaction ID</p>
                        <p className="text-sm font-mono text-richblack-5 break-all bg-richblack-900/50 p-3 rounded border border-richblack-700">
                          {selectedOrder.transactionId}
                        </p>
                      </div>
                    </div>
                  </div>
                  {selectedOrder.coupon ? <div className="md:col-span-2 bg-gradient-to-r from-yellow-50/10 to-yellow-50/5 rounded-lg p-4 border-2 border-yellow-50/30">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-yellow-50/20 flex items-center justify-center flex-shrink-0">
                          <FaTag className="text-yellow-50" size={18} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-richblack-400 uppercase tracking-wide mb-2">Coupon Applied</p>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-yellow-50/20 text-yellow-50 border border-yellow-50/40">
                              <FaTag size={14} />
                              {selectedOrder.coupon.code}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-richblack-400">Discount:</span>
                              <span className="text-lg font-bold text-yellow-50">{formatCurrency(selectedOrder.coupon.discountAmount)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div> : <div className="md:col-span-2 bg-richblack-800/30 rounded-lg p-4 border border-richblack-700 border-dashed">
                      <div className="flex items-center gap-3 justify-center text-richblack-400">
                        <FaTag size={16} />
                        <p className="text-sm">No coupon was applied to this order</p>
                      </div>
                    </div>}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gradient-to-r from-richblack-800 to-richblack-700 border-t border-richblack-600 p-6 flex justify-between items-center">
              <div className="text-sm text-richblack-400">
                Order ID: <span className="font-mono text-richblack-300">{selectedOrder._id}</span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="px-8 py-3 bg-caribbeangreen-400 hover:bg-caribbeangreen-500 text-richblack-900 rounded-lg font-bold transition-all hover:scale-105 shadow-lg">
                Close Details
              </button>
            </div>
          </div>
        </div>}

      {/* Invoice Modal */}
      {showInvoice && selectedOrder && <div className="fixed inset-0 z-[1000] grid place-items-center overflow-auto bg-white bg-opacity-10 backdrop-blur-sm">
          <div className="w-11/12 max-w-4xl rounded-lg border border-richblack-400 bg-richblack-800 p-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-richblack-700 pb-4">
              <h2 className="text-xl font-semibold text-richblack-5">Order Invoice</h2>
              <div className="flex items-center gap-3">
                <button onClick={handleDownloadInvoice} className="flex items-center gap-2 rounded-md bg-yellow-50 px-4 py-2 text-richblack-900 hover:bg-yellow-25">
                  <FaPrint />
                  Print
                </button>
                <button onClick={() => {
              setShowInvoice(false);
              setSelectedOrder(null);
            }} className="text-richblack-300 hover:text-richblack-100">
                  <FaTimes size={24} />
                </button>
              </div>
            </div>

            {/* Invoice Content */}
            <div id="invoice-content" className="mt-6">
              {/* Modern Header with Logo */}
              <div className="bg-gradient-to-r from-richblack-700 to-richblack-800 p-8 rounded-t-lg text-center relative overflow-hidden">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="text-3xl">🎓</div>
                  <div className="text-2xl font-bold text-yellow-50">Beeja Academy</div>
                </div>
                <h1 className="text-4xl font-bold text-yellow-50 mb-3 tracking-wider">INVOICE</h1>
                <p className="text-richblack-25 text-lg">
                  Date: {new Date(selectedOrder.purchaseDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
                </p>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-50 to-yellow-100"></div>
              </div>

              {/* From/To Section */}
              <div className="bg-richblack-800 p-6 rounded-lg mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-richblack-700 p-6 rounded-lg border-l-4 border-yellow-50">
                    <h3 className="text-lg font-semibold text-yellow-50 mb-4 flex items-center gap-2">
                      <span className="text-blue-400">🏢</span> Bill From:
                    </h3>
                    <div className="space-y-2">
                      <p className="font-bold text-richblack-5 text-lg">Beeja Academy</p>
                      <p className="text-richblack-300">Beeja Academy</p>
                      <p className="text-richblack-300">📞 +91 1234567890</p>
                      <p className="text-richblack-300">✉️ info@beejaacademy.com</p>
                      <p className="text-richblack-300">🌐 www.beejaacademy.com</p>
                    </div>
                  </div>
                  <div className="bg-richblack-700 p-6 rounded-lg border-l-4 border-green-400">
                    <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                      <span className="text-green-400">👤</span> Bill To:
                    </h3>
                    <div className="space-y-2">
                      <p className="font-bold text-richblack-5 text-lg">{selectedOrder.user.name}</p>
                      <p className="text-richblack-300">📞 {selectedOrder.user.contactNumber || 'N/A'}</p>
                      <p className="text-richblack-300">✉️ {selectedOrder.user.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="mb-8 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-richblack-5">Order ID: </span>
                    <span className="text-richblack-300">{selectedOrder._id}</span>
                  </div>
                  <div>
                    <span className="font-medium text-richblack-5">Transaction ID: </span>
                    <span className="text-richblack-300">{selectedOrder.transactionId}</span>
                  </div>
                  <div>
                    <span className="font-medium text-richblack-5">Payment Method: </span>
                    <span className="text-richblack-300">{selectedOrder.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="font-medium text-richblack-5">Currency: </span>
                    <span className="text-richblack-300">INR</span>
                  </div>
                  <div>
                    <span className="font-medium text-richblack-5">Payment Status: </span>
                    <span className="text-green-400">{selectedOrder.status}</span>
                  </div>
                  <div>
                    <span className="font-medium text-richblack-5">Enroll On: </span>
                    <span className="text-richblack-300">
                      {new Date(selectedOrder.purchaseDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Course Details */}
              <div className="bg-richblack-800 p-6 rounded-lg mb-8">
                <h3 className="text-xl font-bold text-yellow-50 mb-6 flex items-center gap-2">
                  <span className="text-yellow-100">📚</span> Course Details
                </h3>
                <div className="overflow-hidden rounded-lg border border-richblack-700">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-richblack-700 to-richblack-600">
                        <th className="p-4 text-left text-sm font-semibold text-yellow-50">Course Name</th>
                        <th className="p-4 text-left text-sm font-semibold text-yellow-50">Instructor</th>
                        <th className="p-4 text-right text-sm font-semibold text-yellow-50">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-richblack-700 bg-richblack-700 bg-opacity-50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-richblack-5">{selectedOrder.course.name}</p>
                            <p className="text-xs text-richblack-300">Lifetime Access</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="text-richblack-5">{selectedOrder.course.instructor || 'HR'}</p>
                            <p className="text-xs text-richblack-300">hr@beejaacademy.com</p>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <p className="font-medium text-yellow-50">{formatCurrency(selectedOrder.amount)}</p>
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-richblack-600 bg-richblack-700">
                        <td colSpan="2" className="p-4 text-right font-semibold text-richblack-5">Total Amount:</td>
                        <td className="p-4 text-right">
                          <p className="text-lg font-bold text-yellow-50">{formatCurrency(selectedOrder.amount)}</p>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-richblack-800 p-6 rounded-lg mt-8 text-center border-t-2 border-richblack-700">
                <div className="max-w-2xl mx-auto">
                  <div className="mb-6">
                    <p className="text-lg font-semibold text-yellow-50 mb-2">Thank you for choosing Beeja Academy!</p>
                    <p className="text-richblack-300">Your trust in our educational platform means a lot to us.</p>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-50">📧</span>
                      <a href="mailto:hr@beejaacademy.com" className="text-yellow-50 hover:text-yellow-100 transition-colors">
                        info@beejaacademy.com
                      </a>
                    </div>
                    <div className="hidden md:block text-richblack-500">|</div>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-50">📱</span>
                      <a href="tel:+911234567890" className="text-yellow-50 hover:text-yellow-100 transition-colors">
                        +91 1234567890
                      </a>
                    </div>
                  </div>

                  <p className="mt-6 text-xs text-richblack-400">
                    This is a computer-generated invoice. No signature is required.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>}
    </div>;
};
export default PaymentReports;
