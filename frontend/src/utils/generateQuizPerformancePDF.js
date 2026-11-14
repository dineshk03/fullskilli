import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper function to draw a simple bar chart

// Helper function to draw a simple pie chart using rectangles

// Helper function to draw a simple line chart using bars

/**
 * Generate a detailed quiz performance report PDF
 * @param {Object} quizData - Quiz data with attempts and performance
 * @param {string} quizTitle - Title of the quiz
 * @param {string} courseName - Name of the course
 * @param {string} studentName - Name of the student
 * @param {string} studentEmail - Email of the student
 */
export const generateQuizPerformancePDF = (quizData, quizTitle = "Quiz", courseName = "Course", studentName = "Student", studentEmail = "") => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 15;

    // Colors
    const primaryColor = [155, 89, 182]; // Purple
    const darkColor = [26, 26, 46];
    const textColor = [0, 0, 0];
    const passColor = [46, 204, 113]; // Green
    const failColor = [231, 76, 60]; // Red

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('QUIZ PERFORMANCE REPORT', pageWidth / 2, 15, {
      align: 'center'
    });
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`${quizTitle} • ${courseName}`, pageWidth / 2, 25, {
      align: 'center'
    });
    yPosition = 45;

    // Student Info
    doc.setTextColor(...darkColor);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Student Information', 15, yPosition);
    yPosition += 7;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    const infoData = [{
      label: 'Name:',
      value: studentName
    }, {
      label: 'Email:',
      value: studentEmail
    }, {
      label: 'Quiz:',
      value: quizTitle
    }, {
      label: 'Course:',
      value: courseName
    }, {
      label: 'Report Date:',
      value: new Date().toLocaleDateString('en-IN')
    }];
    infoData.forEach(info => {
      doc.text(`${info.label}`, 15, yPosition);
      doc.text(info.value, 50, yPosition);
      yPosition += 5;
    });
    yPosition += 5;

    // Quiz Statistics
    const attempts = quizData?.attempts || [];
    const totalAttempts = attempts.length;
    const passedAttempts = attempts.filter(a => a.passed)?.length || 0;
    const failedAttempts = totalAttempts - passedAttempts;
    const bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.percentage || 0)) : 0;
    const latestAttempt = attempts.length > 0 ? attempts[0] : null;
    const avgScore = attempts.length > 0 ? (attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length).toFixed(1) : 0;
    doc.setTextColor(...darkColor);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Quiz Statistics', 15, yPosition);
    yPosition += 7;
    const statsData = [['Total Attempts', totalAttempts], ['Passed', passedAttempts], ['Failed', failedAttempts], ['Best Score', `${bestScore.toFixed(1)}%`], ['Average Score', `${avgScore}%`], ['Latest Score', latestAttempt ? `${latestAttempt.percentage?.toFixed(1) || 0}%` : 'N/A'], ['Latest Status', latestAttempt ? latestAttempt.passed ? 'Passed' : 'Failed' : 'N/A']];
    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: statsData,
      theme: 'grid',
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
    yPosition = doc.lastAutoTable.finalY + 15;

    // Performance Analytics Section
    if (attempts.length > 0) {
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 15;
      }
      doc.setTextColor(...darkColor);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Performance Analytics', 15, yPosition);
      yPosition += 15;

      // Performance Summary Box
      doc.setFillColor(248, 249, 250);
      doc.rect(15, yPosition, pageWidth - 30, 50, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(15, yPosition, pageWidth - 30, 50, 'S');

      // Title
      doc.setTextColor(...darkColor);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Performance Overview', 20, yPosition + 8);
      yPosition += 15;

      // Pass Rate Visualization
      const passRate = totalAttempts > 0 ? passedAttempts / totalAttempts * 100 : 0;
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...textColor);
      doc.text(`Success Rate: ${passRate.toFixed(1)}%`, 20, yPosition);

      // Progress bar background
      doc.setFillColor(240, 240, 240);
      doc.rect(80, yPosition - 4, 100, 6, 'F');

      // Progress bar fill
      const passBarWidth = passRate / 100 * 100;
      doc.setFillColor(...passColor);
      doc.rect(80, yPosition - 4, passBarWidth, 6, 'F');
      yPosition += 12;

      // Best Score Visualization
      doc.text(`Best Score: ${bestScore.toFixed(1)}%`, 20, yPosition);

      // Progress bar background
      doc.setFillColor(240, 240, 240);
      doc.rect(80, yPosition - 4, 100, 6, 'F');

      // Progress bar fill
      const bestBarWidth = bestScore / 100 * 100;
      const bestColor = bestScore >= 80 ? passColor : bestScore >= 60 ? [245, 158, 11] : failColor;
      doc.setFillColor(...bestColor);
      doc.rect(80, yPosition - 4, bestBarWidth, 6, 'F');
      yPosition += 12;

      // Average Score Visualization
      doc.text(`Average Score: ${avgScore}%`, 20, yPosition);

      // Progress bar background
      doc.setFillColor(240, 240, 240);
      doc.rect(80, yPosition - 4, 100, 6, 'F');

      // Progress bar fill
      const avgBarWidth = parseFloat(avgScore) / 100 * 100;
      const avgColor = parseFloat(avgScore) >= 80 ? passColor : parseFloat(avgScore) >= 60 ? [245, 158, 11] : failColor;
      doc.setFillColor(...avgColor);
      doc.rect(80, yPosition - 4, avgBarWidth, 6, 'F');
      yPosition += 15;

      // Summary Stats
      doc.setFontSize(8);
      doc.text(`Total: ${totalAttempts} attempts | Passed: ${passedAttempts} | Failed: ${failedAttempts}`, 20, yPosition);
      yPosition += 15;
    }

    // Attempt History
    if (attempts.length > 0) {
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 15;
      }
      doc.setTextColor(...darkColor);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Quiz Attempt History', 15, yPosition);
      yPosition += 7;
      const attemptData = attempts.map((attempt, idx) => [idx + 1, `${attempt.score || 0}/${attempt.totalMarks || 0}`, `${(attempt.percentage || 0).toFixed(1)}%`, attempt.passed ? '✓ Passed' : '✗ Failed', attempt.timeTaken ? `${Math.round(attempt.timeTaken / 60)}m` : '-', attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString('en-IN') : '-', attempt.completedAt ? new Date(attempt.completedAt).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      }) : '-']);
      autoTable(doc, {
        startY: yPosition,
        head: [['#', 'Score', 'Percentage', 'Status', 'Duration', 'Date', 'Time']],
        body: attemptData,
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8
        },
        bodyStyles: {
          textColor: textColor,
          fontSize: 7
        },
        columnStyles: {
          0: {
            cellWidth: 15,
            halign: 'center'
          },
          1: {
            cellWidth: 25,
            halign: 'center'
          },
          2: {
            cellWidth: 25,
            halign: 'center'
          },
          3: {
            cellWidth: 25,
            halign: 'center'
          },
          4: {
            cellWidth: 20,
            halign: 'center'
          },
          5: {
            cellWidth: 30,
            halign: 'center'
          },
          6: {
            cellWidth: 25,
            halign: 'center'
          }
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        margin: {
          left: 10,
          right: 10
        },
        didDrawPage: data => {
          const pageCount = doc.internal.pages.length;
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.getHeight();
          const pageWidth = pageSize.getWidth();
          doc.setFontSize(7);
          doc.setTextColor(150, 150, 150);
          doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageWidth / 2, pageHeight - 8, {
            align: 'center'
          });
        }
      });
      yPosition = doc.lastAutoTable.finalY + 10;
    }

    // Performance Analysis
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 15;
    }
    doc.setTextColor(...darkColor);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Performance Analysis', 15, yPosition);
    yPosition += 7;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    const analysisText = [`Total Attempts: ${totalAttempts}`, `Success Rate: ${totalAttempts > 0 ? (passedAttempts / totalAttempts * 100).toFixed(1) : 0}%`, `Best Performance: ${bestScore.toFixed(1)}%`, `Average Performance: ${avgScore}%`, `Latest Attempt: ${latestAttempt ? new Date(latestAttempt.completedAt).toLocaleDateString('en-IN') : 'Not attempted'}`, `Overall Status: ${passedAttempts > 0 ? 'Passed' : 'Not Yet Passed'}`];
    analysisText.forEach(text => {
      doc.text(`• ${text}`, 15, yPosition);
      yPosition += 5;
    });

    // Recommendation
    yPosition += 5;
    doc.setTextColor(...darkColor);
    doc.setFont(undefined, 'bold');
    doc.text('Recommendation:', 15, yPosition);
    yPosition += 5;
    doc.setFont(undefined, 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    let recommendation = '';
    if (passedAttempts > 0) {
      recommendation = 'Excellent! You have successfully passed this quiz. Keep up the good work!';
    } else if (totalAttempts >= 3) {
      recommendation = 'You have attempted this quiz multiple times. Consider reviewing the course material and trying again.';
    } else if (totalAttempts > 0) {
      recommendation = 'You have attempted this quiz. Review the material and try again to improve your score.';
    } else {
      recommendation = 'You have not attempted this quiz yet. Start now to test your knowledge!';
    }
    const wrappedText = doc.splitTextToSize(recommendation, pageWidth - 30);
    doc.text(wrappedText, 15, yPosition);

    // Footer
    const finalPageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('This is an automatically generated report from your learning management system.', pageWidth / 2, finalPageHeight - 8, {
      align: 'center'
    });

    // Save
    const filename = `quiz-report-${quizTitle.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
    return true;
  } catch (error) {
    console.error('Error generating quiz performance PDF:', error);
    throw error;
  }
};
