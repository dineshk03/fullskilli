import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper function to draw a simple pie chart using rectangles

// Helper function to draw a horizontal bar chart

// Helper function to draw a simple trend chart using bars

/**
 * Generate a detailed course performance report PDF
 * @param {Object} courseData - Course data with quizzes and performance
 * @param {string} courseName - Name of the course
 * @param {string} studentName - Name of the student
 * @param {string} studentEmail - Email of the student
 */
export const generateCoursePerformancePDF = (courseData, courseName = "Course", studentName = "Student", studentEmail = "") => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = 10;

    // Modern Color Palette
    const primaryColor = [59, 130, 246]; // Modern Blue
    const accentColor = [34, 197, 94]; // Green

    // Red
    const darkText = [30, 30, 30];
    const lightText = [100, 100, 100];
    const lightBg = [248, 250, 252];
    const borderColor = [226, 232, 240];

    // ===== MODERN HEADER =====
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 50, 'F');

    // Header accent bar
    doc.setFillColor(...accentColor);
    doc.rect(0, 48, pageWidth, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont(undefined, 'bold');
    doc.text('COURSE PERFORMANCE REPORT', margin, 22, {
      align: 'left'
    });
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(220, 230, 255);
    doc.text(courseName, margin, 35, {
      align: 'left'
    });
    yPosition = 58;

    // ===== STUDENT INFORMATION CARD =====
    doc.setFillColor(...lightBg);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 32, 'F');

    // Card border
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 32);
    doc.setTextColor(...darkText);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Student Information', margin + 4, yPosition + 6);
    yPosition += 12;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...darkText);
    const infoData = [{
      label: 'Name',
      value: studentName
    }, {
      label: 'Email',
      value: studentEmail
    }, {
      label: 'Course',
      value: courseName
    }, {
      label: 'Report Date',
      value: new Date().toLocaleDateString('en-IN')
    }];
    let col = 0;
    infoData.forEach((info, idx) => {
      const xPos = margin + 4 + col * (pageWidth / 2 - margin - 2);
      doc.setTextColor(...lightText);
      doc.setFont(undefined, 'normal');
      doc.text(`${info.label}:`, xPos, yPosition);
      doc.setTextColor(...darkText);
      doc.setFont(undefined, 'bold');
      doc.text(info.value, xPos + 25, yPosition);
      if (idx % 2 === 1) {
        yPosition += 6;
        col = 0;
      } else {
        col = 1;
      }
    });
    yPosition += 10;

    // ===== COURSE STATISTICS =====
    courseData?.stats || {};
    const totalQuizzes = courseData?.quizzes?.length || 0;
    const completedQuizzes = courseData?.performance?.length || 0;
    const passedQuizzes = courseData?.performance?.filter(p => p.result?.passed)?.length || 0;
    const avgScore = courseData?.performance?.length > 0 ? (courseData.performance.reduce((sum, p) => sum + (p.result?.percentage || 0), 0) / courseData.performance.length).toFixed(1) : 0;
    doc.setTextColor(...darkText);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Course Statistics', margin, yPosition);
    yPosition += 8;
    const statsData = [['Total Quizzes', totalQuizzes.toString()], ['Completed', completedQuizzes.toString()], ['Passed', passedQuizzes.toString()], ['Failed', (completedQuizzes - passedQuizzes).toString()], ['Average Score', `${avgScore}%`], ['Completion Rate', `${totalQuizzes > 0 ? (completedQuizzes / totalQuizzes * 100).toFixed(1) : 0}%`]];
    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: statsData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'left',
        valign: 'middle',
        lineColor: primaryColor,
        lineWidth: 0.5
      },
      bodyStyles: {
        fontSize: 8,
        textColor: darkText
      },
      alternateRowStyles: {
        fillColor: lightBg
      },
      columnStyles: {
        0: {
          cellWidth: 80,
          halign: 'left'
        },
        1: {
          cellWidth: 40,
          halign: 'right'
        }
      },
      margin: {
        left: margin,
        right: margin
      }
    });
    yPosition = doc.lastAutoTable.finalY + 15;

    // ===== PERFORMANCE ANALYTICS SECTION =====
    if (courseData && courseData.performance && courseData.performance.length > 0) {
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 15;
      }
      doc.setTextColor(...darkText);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Performance Analytics', margin, yPosition);
      yPosition += 15;

      // Calculate analytics data
      const performance = courseData.performance || [];
      const totalAttempts = performance.length;
      const passedAttempts = performance.filter(p => p.result?.passed).length;
      const failedAttempts = totalAttempts - passedAttempts;
      const averageScore = totalAttempts > 0 ? performance.reduce((sum, p) => sum + (p.result?.percentage || 0), 0) / totalAttempts : 0;

      // Performance Summary Box
      doc.setFillColor(...lightBg);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 45, 'F');
      doc.setDrawColor(...borderColor);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 45, 'S');

      // Title
      doc.setTextColor(...darkText);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Performance Overview', margin + 5, yPosition + 8);

      // Visual Progress Bars
      yPosition += 15;

      // Pass Rate Bar
      const passRate = totalAttempts > 0 ? passedAttempts / totalAttempts * 100 : 0;
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...darkText);
      doc.text(`Pass Rate: ${passRate.toFixed(1)}%`, margin + 5, yPosition);

      // Progress bar background
      doc.setFillColor(240, 240, 240);
      doc.rect(margin + 60, yPosition - 4, 100, 6, 'F');

      // Progress bar fill
      const passBarWidth = passRate / 100 * 100;
      doc.setFillColor(34, 197, 94);
      doc.rect(margin + 60, yPosition - 4, passBarWidth, 6, 'F');
      yPosition += 12;

      // Average Score Bar
      doc.text(`Average Score: ${averageScore.toFixed(1)}%`, margin + 5, yPosition);

      // Progress bar background
      doc.setFillColor(240, 240, 240);
      doc.rect(margin + 60, yPosition - 4, 100, 6, 'F');

      // Progress bar fill
      const scoreBarWidth = averageScore / 100 * 100;
      const scoreColor = averageScore >= 80 ? [34, 197, 94] : averageScore >= 60 ? [245, 158, 11] : [239, 68, 68];
      doc.setFillColor(...scoreColor);
      doc.rect(margin + 60, yPosition - 4, scoreBarWidth, 6, 'F');
      yPosition += 12;

      // Completion Stats
      doc.text(`Total Attempts: ${totalAttempts} | Passed: ${passedAttempts} | Failed: ${failedAttempts}`, margin + 5, yPosition);
      yPosition += 20;
    }

    // ===== DETAILED QUIZ PERFORMANCE =====
    if (courseData?.performance && courseData.performance.length > 0) {
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 15;
      }
      doc.setTextColor(...darkText);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Detailed Quiz Performance', margin, yPosition);
      yPosition += 7;

      // Group quizzes by session name for better organization
      const quizGroups = {};
      courseData.performance.forEach(p => {
        const quizName = Array.isArray(p?.quiz) && p.quiz.length > 0 ? p.quiz[0]?.title : p?.quiz?.title || 'Unknown Quiz';
        if (!quizGroups[quizName]) {
          quizGroups[quizName] = [];
        }
        quizGroups[quizName].push(p);
      });

      // Display each quiz group with heading
      Object.entries(quizGroups).forEach(([quizName, quizzes]) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 15;
        }

        // Lecture/Session heading
        doc.setFillColor(...primaryColor);
        doc.rect(margin, yPosition - 2, pageWidth - 2 * margin, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(quizName, margin + 3, yPosition + 2);
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(220, 230, 255);
        doc.text(`${quizzes.length} attempt${quizzes.length > 1 ? 's' : ''}`, margin + 3, yPosition + 7);
        yPosition += 12;

        // Quiz data for this session
        const sessionData = quizzes.map((p, idx) => [idx + 1, quizzes.length > 1 ? `${quizName} (Attempt ${idx + 1})` : quizName, `${p?.result?.score || 0}/${p?.result?.totalMarks || 0}`, `${(p?.result?.percentage || 0).toFixed(1)}%`, p?.result?.passed ? 'Passed' : 'Failed', p?.result?.attempts || 1, p?.result?.completedAt ? new Date(p.result.completedAt).toLocaleDateString('en-IN') : '-']);
        autoTable(doc, {
          startY: yPosition,
          head: [['#', 'Quiz', 'Score', '%', 'Status', 'Attempts', 'Date']],
          body: sessionData,
          theme: 'grid',
          headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'center',
            valign: 'middle',
            lineColor: primaryColor,
            lineWidth: 0.5
          },
          bodyStyles: {
            fontSize: 8,
            textColor: darkText
          },
          alternateRowStyles: {
            fillColor: lightBg
          },
          columnStyles: {
            0: {
              cellWidth: 10,
              halign: 'center'
            },
            1: {
              cellWidth: 35,
              halign: 'left'
            },
            2: {
              cellWidth: 16,
              halign: 'center'
            },
            3: {
              cellWidth: 12,
              halign: 'center'
            },
            4: {
              cellWidth: 18,
              halign: 'center'
            },
            5: {
              cellWidth: 14,
              halign: 'center'
            },
            6: {
              cellWidth: 20,
              halign: 'center'
            }
          },
          margin: {
            left: margin,
            right: margin
          }
        });
        yPosition = doc.lastAutoTable.finalY + 8;
      });
    }

    // Performance Summary
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 15;
    }

    // ===== PERFORMANCE SUMMARY CARD =====
    doc.setFillColor(...lightBg);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 40, 'F');

    // Card border with accent
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(2);
    doc.line(margin, yPosition, margin, yPosition + 40);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 40);
    doc.setTextColor(...darkText);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Performance Summary', margin + 5, yPosition + 7);
    yPosition += 12;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    const summaryText = [{
      label: 'Total Quizzes Attempted:',
      value: `${completedQuizzes} out of ${totalQuizzes}`
    }, {
      label: 'Success Rate:',
      value: `${completedQuizzes > 0 ? (passedQuizzes / completedQuizzes * 100).toFixed(1) : 0}%`
    }, {
      label: 'Average Score:',
      value: `${avgScore}%`
    }, {
      label: 'Status:',
      value: completedQuizzes === totalQuizzes ? 'Course Completed' : 'In Progress'
    }];
    summaryText.forEach(item => {
      doc.setTextColor(...lightText);
      doc.setFont(undefined, 'normal');
      doc.text(item.label, margin + 5, yPosition);
      doc.setTextColor(...darkText);
      doc.setFont(undefined, 'bold');
      doc.text(item.value, margin + 70, yPosition);
      yPosition += 6;
    });

    // ===== FOOTER ON ALL PAGES =====
    const pageCount = doc.internal.pages.length;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const finalPageHeight = doc.internal.pageSize.getHeight();

      // Footer background
      doc.setFillColor(...lightBg);
      doc.rect(0, finalPageHeight - 18, pageWidth, 18, 'F');

      // Footer top border
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(1);
      doc.line(0, finalPageHeight - 18, pageWidth, finalPageHeight - 18);

      // Footer text
      doc.setFontSize(7);
      doc.setTextColor(...lightText);
      doc.text('© 2024 Beeja Learning Management System', margin, finalPageHeight - 13, {
        align: 'left'
      });
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, finalPageHeight - 13, {
        align: 'right'
      });
      doc.setFontSize(6);
      doc.setTextColor(180, 180, 180);
      doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`, pageWidth / 2, finalPageHeight - 8, {
        align: 'center'
      });
      doc.text('This is an automatically generated performance report', pageWidth / 2, finalPageHeight - 4, {
        align: 'center'
      });
    }

    // Save
    const filename = `course-report-${courseName.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
    return true;
  } catch (error) {
    console.error('Error generating course performance PDF:', error);
    throw error;
  }
};
