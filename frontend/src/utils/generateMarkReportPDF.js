import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate a comprehensive mark report PDF for a student
 * @param {Object} data - Report data containing performance and stats
 * @param {string} studentName - Name of the student
 * @param {string} studentEmail - Email of the student
 */
export const generateMarkReportPDF = (data, studentName = "Student", studentEmail = "") => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 15;

    // Set colors
    const primaryColor = [255, 193, 7]; // Yellow
    const darkColor = [26, 26, 46]; // Dark blue
    const textColor = [0, 0, 0];

    // Header Section
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 35, 'F');

    // Title
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('MARK REPORT', pageWidth / 2, 15, {
      align: 'center'
    });

    // Subtitle
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Quiz Performance Summary', pageWidth / 2, 25, {
      align: 'center'
    });
    yPosition = 45;

    // Student Information Section
    doc.setTextColor(...darkColor);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Student Information', 15, yPosition);
    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    const studentInfo = [{
      label: 'Name:',
      value: studentName
    }, {
      label: 'Email:',
      value: studentEmail
    }, {
      label: 'Report Generated:',
      value: new Date().toLocaleDateString('en-IN')
    }];
    studentInfo.forEach(info => {
      doc.text(`${info.label}`, 15, yPosition);
      doc.text(info.value, 50, yPosition);
      yPosition += 6;
    });
    yPosition += 5;

    // Summary Statistics Section
    doc.setTextColor(...darkColor);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Summary Statistics', 15, yPosition);
    yPosition += 8;
    const stats = data?.stats || {};
    const summaryData = [['Total Quizzes', stats.totalQuizzes || 0], ['Passed', stats.passedQuizzes || 0], ['Failed', stats.failedQuizzes || 0], ['Average Score', `${(stats.averageScore || 0).toFixed(1)}%`], ['Pass Rate', `${stats.totalQuizzes ? Math.round(stats.passedQuizzes / stats.totalQuizzes * 100) : 0}%`]];
    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: darkColor,
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        textColor: textColor,
        fontSize: 9
      },
      columnStyles: {
        0: {
          cellWidth: 80
        },
        1: {
          cellWidth: 40,
          halign: 'right'
        }
      },
      margin: {
        left: 15,
        right: 15
      }
    });
    yPosition = doc.lastAutoTable.finalY + 10;

    // Performance Details Section
    if (data?.performance && data.performance.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 15;
      }
      doc.setTextColor(...darkColor);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Detailed Performance', 15, yPosition);
      yPosition += 8;

      // Prepare table data (data is now normalized)
      const tableData = data.performance.slice(0, 50).map(p => [p?.result?.completedAt ? new Date(p.result.completedAt).toLocaleDateString('en-IN') : '-', p?.course?.courseName || '-', p?.quiz?.title || '-', `${p?.result?.score || 0}/${p?.result?.totalMarks || 0}`, `${(p?.result?.percentage || 0).toFixed(1)}%`, p?.result?.passed ? 'Passed' : 'Failed', p?.result?.attempts || 0]);
      autoTable(doc, {
        startY: yPosition,
        head: [['Date', 'Course', 'Quiz', 'Score', 'Percentage', 'Status', 'Attempts']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: darkColor,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          textColor: textColor,
          fontSize: 8
        },
        columnStyles: {
          0: {
            cellWidth: 22
          },
          1: {
            cellWidth: 25
          },
          2: {
            cellWidth: 30
          },
          3: {
            cellWidth: 18
          },
          4: {
            cellWidth: 18
          },
          5: {
            cellWidth: 18
          },
          6: {
            cellWidth: 15
          }
        },
        margin: {
          left: 10,
          right: 10
        },
        didDrawPage: data => {
          // Footer
          const pageCount = doc.internal.pages.length;
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.getHeight();
          const pageWidth = pageSize.getWidth();
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageWidth / 2, pageHeight - 10, {
            align: 'center'
          });
        }
      });
      yPosition = doc.lastAutoTable.finalY + 10;
    }

    // Footer Section
    const finalPageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('This is an automatically generated report. For more details, visit your dashboard.', pageWidth / 2, finalPageHeight - 10, {
      align: 'center'
    });

    // Save the PDF
    const filename = `mark-report-${studentName.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
