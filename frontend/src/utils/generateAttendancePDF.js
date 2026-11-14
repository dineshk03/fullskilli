import jsPDF from 'jspdf';
import 'jspdf-autotable';
const generateAttendancePDFReport = (attendanceData, courseInfo, meetingInfo) => {
  const doc = new jsPDF();

  // Set up colors
  const primaryColor = [59, 130, 246]; // Blue
  const accentColor = [147, 51, 234]; // Purple
  const successColor = [34, 197, 94]; // Green
  // Orange

  // Red

  // Helper function to format date
  const formatDate = date => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to format duration
  const formatDuration = minutes => {
    if (!minutes) return '0 min';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Title Page
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 60, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Attendance Report', 105, 35, {
    align: 'center'
  });
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('Live Meeting Analytics', 105, 50, {
    align: 'center'
  });

  // Report Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  let yPos = 80;
  doc.text(`Generated: ${formatDate(new Date())}`, 20, yPos);
  yPos += 10;
  if (courseInfo) {
    doc.text(`Course: ${courseInfo.courseName}`, 20, yPos);
    yPos += 10;
  }
  if (meetingInfo) {
    doc.text(`Meeting: ${meetingInfo.topic || 'N/A'}`, 20, yPos);
    yPos += 10;
    doc.text(`Meeting ID: ${meetingInfo.meetingId || 'N/A'}`, 20, yPos);
    yPos += 10;
    doc.text(`Date: ${meetingInfo.startTime ? formatDate(meetingInfo.startTime) : 'N/A'}`, 20, yPos);
    yPos += 10;
    doc.text(`Duration: ${meetingInfo.duration ? formatDuration(meetingInfo.duration) : 'N/A'}`, 20, yPos);
    yPos += 20;
  }

  // Executive Summary
  doc.setFillColor(...accentColor);
  doc.rect(0, yPos - 10, 210, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', 105, yPos, {
    align: 'center'
  });
  yPos += 20;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const summaryData = [{
    label: 'Total Participants',
    value: attendanceData?.totalParticipants || 0,
    icon: '👥'
  }, {
    label: 'Enrolled Students',
    value: attendanceData?.enrolledStudents || 0,
    icon: '🎓'
  }, {
    label: 'Average Duration',
    value: attendanceData?.averageDuration ? formatDuration(Math.round(attendanceData.averageDuration)) : '0 min',
    icon: '⏱️'
  }, {
    label: 'Completion Rate',
    value: attendanceData?.attendanceRecords ? Math.round(attendanceData.attendanceRecords.filter(r => r.status === 'completed').length / attendanceData.totalParticipants * 100) + '%' : '0%',
    icon: '📊'
  }];

  // Create summary cards
  const cardWidth = 45;
  const cardHeight = 30;
  const cardSpacing = 10;
  const startX = 20;
  summaryData.forEach((item, index) => {
    const x = startX + index * (cardWidth + cardSpacing);
    const y = yPos;

    // Card background
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F');

    // Icon
    doc.setFontSize(16);
    doc.text(item.icon, x + 5, y + 15);

    // Value
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(item.value.toString(), x + 25, y + 15);

    // Label
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, x + cardWidth / 2, y + 25, {
      align: 'center'
    });
  });
  yPos += 50;

  // Attendance Distribution
  doc.addPage();
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Attendance Analysis', 105, 25, {
    align: 'center'
  });
  yPos = 60;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Attendance Distribution', 20, yPos);
  yPos += 15;

  // Calculate attendance distribution
  const attendanceRecords = attendanceData?.attendanceRecords || [];
  const completed = attendanceRecords.filter(r => r.status === 'completed').length;
  const joined = attendanceRecords.filter(r => r.status === 'joined').length;
  const distributionData = [{
    category: 'Completed',
    count: completed,
    percentage: attendanceRecords.length > 0 ? Math.round(completed / attendanceRecords.length * 100) : 0,
    color: successColor
  }, {
    category: 'Currently In Meeting',
    count: joined,
    percentage: attendanceRecords.length > 0 ? Math.round(joined / attendanceRecords.length * 100) : 0,
    color: primaryColor
  }];

  // Create distribution chart
  distributionData.forEach((item, index) => {
    const y = yPos + index * 25;

    // Category label
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(item.category, 20, y);

    // Bar background
    doc.setFillColor(240, 240, 240);
    doc.rect(80, y - 8, 100, 12, 'F');

    // Bar fill
    doc.setFillColor(...item.color);
    doc.rect(80, y - 8, item.percentage / 100 * 100, 12, 'F');

    // Percentage text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`${item.percentage}%`, 130, y);

    // Count text
    doc.setTextColor(0, 0, 0);
    doc.text(`(${item.count})`, 190, y);
  });
  yPos += 60;

  // Detailed Attendance Table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Attendance Records', 20, yPos);
  yPos += 15;
  if (attendanceRecords.length > 0) {
    // Table headers
    const headers = ['Participant Name', 'Email', 'Join Time', 'Duration', 'Status', 'Type'];
    const tableData = attendanceRecords.map(record => [record.participantName || 'Unknown', record.participantEmail || 'N/A', record.joinTime ? formatDate(record.joinTime) : 'N/A', formatDuration(record.duration || 0), record.status || 'Unknown', record.userId ? 'Student' : 'Guest']);
    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: yPos,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        font: 'helvetica',
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: 0,
        font: 'helvetica',
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: {
          cellWidth: 40
        },
        1: {
          cellWidth: 45
        },
        2: {
          cellWidth: 40
        },
        3: {
          cellWidth: 25
        },
        4: {
          cellWidth: 25
        },
        5: {
          cellWidth: 25
        }
      },
      margin: {
        left: 20,
        right: 20
      }
    });
    yPos = doc.lastAutoTable.finalY + 20;
  } else {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.text('No attendance records available', 20, yPos);
    yPos += 20;
  }

  // Performance Insights
  if (attendanceRecords.length > 0) {
    doc.addPage();
    doc.setFillColor(...accentColor);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Performance Insights', 105, 25, {
      align: 'center'
    });
    yPos = 60;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Metrics', 20, yPos);
    yPos += 20;

    // Calculate metrics
    const avgDuration = attendanceRecords.reduce((sum, r) => sum + (r.duration || 0), 0) / attendanceRecords.length;
    const longestDuration = Math.max(...attendanceRecords.map(r => r.duration || 0));
    const shortestDuration = Math.min(...attendanceRecords.map(r => r.duration || 0));
    const studentParticipation = attendanceRecords.filter(r => r.userId).length;
    const metrics = [{
      label: 'Average Attendance Duration',
      value: formatDuration(Math.round(avgDuration))
    }, {
      label: 'Longest Attendance Duration',
      value: formatDuration(longestDuration)
    }, {
      label: 'Shortest Attendance Duration',
      value: formatDuration(shortestDuration)
    }, {
      label: 'Student Participation Rate',
      value: `${Math.round(studentParticipation / attendanceRecords.length * 100)}%`
    }];
    metrics.forEach((metric, index) => {
      const y = yPos + index * 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(metric.label, 20, y);
      doc.setFont('helvetica', 'bold');
      doc.text(metric.value, 150, y);
    });
    yPos += 80;

    // Recommendations
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Recommendations', 20, yPos);
    yPos += 15;
    const recommendations = [];
    if (studentParticipation < attendanceRecords.length * 0.8) {
      recommendations.push('Consider encouraging more students to attend live sessions');
    }
    if (avgDuration < 30) {
      recommendations.push('Average attendance duration is low - consider making meetings more engaging');
    }
    if (completed < attendanceRecords.length * 0.7) {
      recommendations.push('Many participants left early - review meeting content and timing');
    }
    if (recommendations.length === 0) {
      recommendations.push('Great attendance! Keep up the good work.');
    }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    recommendations.forEach((rec, index) => {
      const y = yPos + index * 12;
      doc.text(`${index + 1}. ${rec}`, 25, y);
    });
  }

  // Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text(`Page ${i} of ${totalPages}`, 105, 285, {
      align: 'center'
    });
    doc.text('Generated by LMS Zoom Attendance System', 105, 290, {
      align: 'center'
    });
  }

  // Save the PDF
  const fileName = `attendance-report-${courseInfo?.courseName || 'meeting'}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  return fileName;
};
export default generateAttendancePDFReport;
