import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate a comprehensive course marksheet PDF with grades for a student
 * @param {Object} data - Course performance data
 * @param {string} studentName - Name of the student
 * @param {string} studentEmail - Email of the student
 * @param {string} courseName - Name of the course
 */
export const generateCourseMarksheetPDF = (data, studentName = "Student", studentEmail = "", courseName = "Course") => {
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
    const primaryColor = [52, 152, 219]; // Blue
    const darkColor = [26, 26, 46]; // Dark blue
    const textColor = [0, 0, 0];
    const gradeColors = {
      'A+': [46, 204, 113],
      // Green
      'A': [52, 152, 219],
      // Blue
      'B+': [155, 89, 182],
      // Purple
      'B': [230, 126, 34],
      // Orange
      'C': [241, 196, 15],
      // Yellow
      'F': [231, 76, 60] // Red
    };

    // Header Section with Institution Info
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont(undefined, 'bold');
    doc.text('COURSE MARKSHEET', pageWidth / 2, 18, {
      align: 'center'
    });

    // Subtitle
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Academic Performance Report', pageWidth / 2, 28, {
      align: 'center'
    });

    // Institution info
    doc.setFontSize(10);
    doc.text('Beeja Academy - Learning Management System', pageWidth / 2, 35, {
      align: 'center'
    });
    yPosition = 50;

    // Student Information Section
    doc.setTextColor(...darkColor);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Student Information', 15, yPosition);
    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    const studentInfo = [{
      label: 'Student Name:',
      value: studentName || 'N/A'
    }, {
      label: 'Email Address:',
      value: studentEmail || 'N/A'
    }, {
      label: 'Course Name:',
      value: courseName || 'N/A'
    }, {
      label: 'Report Date:',
      value: new Date().toLocaleDateString('en-IN')
    }, {
      label: 'Academic Year:',
      value: new Date().getFullYear().toString()
    }];
    studentInfo.forEach(info => {
      doc.text(`${info.label}`, 15, yPosition);
      doc.setFont(undefined, 'bold');
      doc.text(String(info.value), 70, yPosition); // Ensure value is always a string
      doc.setFont(undefined, 'normal');
      yPosition += 6;
    });
    yPosition += 10;

    // Group by quiz to get unique quizzes for statistics
    const quizStatsMap = new Map();
    data?.performance?.forEach(p => {
      const quizId = p?.quiz?._id || p?.quiz?.id || p?.quiz?.title;
      if (quizId) {
        const attemptDate = new Date(p?.result?.completedAt || 0);
        const existing = quizStatsMap.get(quizId);

        // Keep the latest attempt for statistics
        if (!existing || attemptDate > new Date(existing?.result?.completedAt || 0)) {
          quizStatsMap.set(quizId, p);
        }
      }
    });
    const uniqueQuizzes = Array.from(quizStatsMap.values());

    // Calculate overall statistics and grade based on unique quizzes
    const totalQuizzes = uniqueQuizzes.length || 0;
    const passedQuizzes = uniqueQuizzes.filter(p => p?.result?.passed).length || 0;
    const totalMarks = uniqueQuizzes.reduce((sum, p) => sum + (p?.result?.totalMarks || 0), 0);
    const obtainedMarks = uniqueQuizzes.reduce((sum, p) => sum + (p?.result?.score || 0), 0);
    const overallPercentage = totalMarks > 0 ? obtainedMarks / totalMarks * 100 : 0;

    // Grade calculation function
    const calculateGrade = percentage => {
      if (percentage >= 90) return {
        grade: 'A+',
        gpa: '4.0',
        status: 'Outstanding'
      };
      if (percentage >= 80) return {
        grade: 'A',
        gpa: '3.7',
        status: 'Excellent'
      };
      if (percentage >= 70) return {
        grade: 'B+',
        gpa: '3.3',
        status: 'Very Good'
      };
      if (percentage >= 60) return {
        grade: 'B',
        gpa: '3.0',
        status: 'Good'
      };
      if (percentage >= 50) return {
        grade: 'C',
        gpa: '2.0',
        status: 'Satisfactory'
      };
      return {
        grade: 'F',
        gpa: '0.0',
        status: 'Fail'
      };
    };
    const gradeInfo = calculateGrade(overallPercentage);

    // Overall Performance Summary
    doc.setTextColor(...darkColor);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Overall Performance Summary', 15, yPosition);
    yPosition += 10;

    // Performance summary table
    const summaryData = [['Total Quizzes Attempted', totalQuizzes.toString()], ['Quizzes Passed', passedQuizzes.toString()], ['Total Marks', totalMarks.toString()], ['Marks Obtained', obtainedMarks.toString()], ['Overall Percentage', `${overallPercentage.toFixed(2)}%`], ['Grade Obtained', gradeInfo.grade], ['GPA', gradeInfo.gpa], ['Academic Status', gradeInfo.status]];
    autoTable(doc, {
      startY: yPosition,
      head: [['Performance Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11
      },
      bodyStyles: {
        textColor: textColor,
        fontSize: 10
      },
      columnStyles: {
        0: {
          cellWidth: 80,
          fontStyle: 'bold'
        },
        1: {
          cellWidth: 60,
          halign: 'center',
          fontStyle: 'bold'
        }
      },
      margin: {
        left: 15,
        right: 15
      },
      didParseCell: function (data) {
        // Color code the grade row
        if (data.row.index === 5 && data.column.index === 1) {
          // Grade row
          const grade = data.cell.text[0];
          if (gradeColors[grade]) {
            data.cell.styles.fillColor = gradeColors[grade];
            data.cell.styles.textColor = [255, 255, 255];
          }
        }
      }
    });
    yPosition = doc.lastAutoTable.finalY + 15;

    // Grade Scale Reference
    doc.setTextColor(...darkColor);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Grade Scale Reference', 15, yPosition);
    yPosition += 8;
    const gradeScale = [['A+', '90-100%', '4.0', 'Outstanding'], ['A', '80-89%', '3.7', 'Excellent'], ['B+', '70-79%', '3.3', 'Very Good'], ['B', '60-69%', '3.0', 'Good'], ['C', '50-59%', '2.0', 'Satisfactory'], ['F', 'Below 50%', '0.0', 'Fail']];
    autoTable(doc, {
      startY: yPosition,
      head: [['Grade', 'Percentage Range', 'GPA', 'Status']],
      body: gradeScale,
      theme: 'striped',
      headStyles: {
        fillColor: [52, 73, 94],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        textColor: textColor,
        fontSize: 9
      },
      columnStyles: {
        0: {
          cellWidth: 20,
          halign: 'center',
          fontStyle: 'bold'
        },
        1: {
          cellWidth: 35,
          halign: 'center'
        },
        2: {
          cellWidth: 20,
          halign: 'center'
        },
        3: {
          cellWidth: 35,
          halign: 'center'
        }
      },
      margin: {
        left: 15,
        right: 15
      },
      didParseCell: function (data) {
        // Color code each grade
        if (data.column.index === 0) {
          const grade = data.cell.text[0];
          if (gradeColors[grade]) {
            data.cell.styles.fillColor = gradeColors[grade];
            data.cell.styles.textColor = [255, 255, 255];
          }
        }
      }
    });
    yPosition = doc.lastAutoTable.finalY + 15;

    // Detailed Quiz Performance
    if (data?.performance && data.performance.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 15;
      }
      doc.setTextColor(...darkColor);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Detailed Quiz Performance (Latest Attempt Per Quiz)', 15, yPosition);
      yPosition += 8;

      // Group by quiz and get latest attempt per quiz
      const quizMap = new Map();
      data.performance.forEach(p => {
        const quizId = p?.quiz?._id || p?.quiz?.id || p?.quiz?.title;
        if (quizId) {
          const attemptDate = new Date(p?.result?.completedAt || 0);
          const existing = quizMap.get(quizId);

          // Keep the latest attempt (most recent date)
          if (!existing || attemptDate > new Date(existing?.result?.completedAt || 0)) {
            quizMap.set(quizId, p);
          }
        }
      });

      // Prepare detailed quiz data (latest attempt per quiz only)
      const quizData = Array.from(quizMap.values()).map((p, index) => {
        const percentage = p?.result?.percentage || 0;
        const quizGrade = calculateGrade(percentage);
        return [(index + 1).toString(), p?.quiz?.title || 'Quiz', p?.result?.completedAt ? new Date(p.result.completedAt).toLocaleDateString('en-IN') : '-', `${p?.result?.score || 0}/${p?.result?.totalMarks || 0}`, `${percentage.toFixed(1)}%`, quizGrade.grade, p?.result?.passed ? 'Pass' : 'Fail'];
      });
      autoTable(doc, {
        startY: yPosition,
        head: [['S.No', 'Quiz Name', 'Date', 'Marks', 'Percentage', 'Grade', 'Status']],
        body: quizData,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          textColor: textColor,
          fontSize: 8
        },
        columnStyles: {
          0: {
            cellWidth: 15,
            halign: 'center'
          },
          1: {
            cellWidth: 35
          },
          2: {
            cellWidth: 25,
            halign: 'center'
          },
          3: {
            cellWidth: 20,
            halign: 'center'
          },
          4: {
            cellWidth: 20,
            halign: 'center'
          },
          5: {
            cellWidth: 15,
            halign: 'center',
            fontStyle: 'bold'
          },
          6: {
            cellWidth: 20,
            halign: 'center'
          }
        },
        margin: {
          left: 10,
          right: 10
        },
        didParseCell: function (data) {
          // Color code grades and status
          if (data.column.index === 5) {
            // Grade column
            const grade = data.cell.text[0];
            if (gradeColors[grade]) {
              data.cell.styles.fillColor = gradeColors[grade];
              data.cell.styles.textColor = [255, 255, 255];
            }
          }
          if (data.column.index === 6) {
            // Status column
            const status = data.cell.text[0];
            if (status === 'Pass') {
              data.cell.styles.fillColor = [46, 204, 113];
              data.cell.styles.textColor = [255, 255, 255];
            } else if (status === 'Fail') {
              data.cell.styles.fillColor = [231, 76, 60];
              data.cell.styles.textColor = [255, 255, 255];
            }
          }
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
    }

    // Final Footer Section
    const finalPageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('This is an official academic transcript generated by Beeja Academy LMS.', pageWidth / 2, finalPageHeight - 20, {
      align: 'center'
    });
    doc.text('For verification, contact: admin@beejaacademy.com', pageWidth / 2, finalPageHeight - 15, {
      align: 'center'
    });

    // Save the PDF
    const filename = `course-marksheet-${courseName.replace(/\s+/g, '-')}-${studentName.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
    return true;
  } catch (error) {
    console.error('Error generating course marksheet PDF:', error);
    throw error;
  }
};
