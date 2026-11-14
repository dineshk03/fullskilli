import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate overall marksheet PDF for a student
 * @param {Array} courses - Array of course data with marks
 * @param {string} studentName - Name of the student
 * @param {string} studentEmail - Email of the student
 * @param {string} studentId - Student ID
 */
export const generateOverallMarksheetPDF = (courses, studentName = "Student", studentEmail = "", studentId = "") => {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 15;

    // Colors
    const primaryColor = [25, 118, 210]; // Dark Blue
    const darkColor = [26, 26, 46];
    const textColor = [0, 0, 0];
    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('STUDENT MARKSHEET', pageWidth / 2, 12, {
      align: 'center'
    });
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text('Overall Performance Summary', pageWidth / 2, 22, {
      align: 'center'
    });
    yPosition = 35;

    // Student Information
    doc.setTextColor(...darkColor);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Student Information', 15, yPosition);
    yPosition += 6;
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
      label: 'Student ID:',
      value: studentId || 'N/A'
    }, {
      label: 'Report Date:',
      value: new Date().toLocaleDateString('en-IN')
    }];
    infoData.forEach((info, idx) => {
      if (idx % 2 === 0) {
        doc.text(`${info.label}`, 15, yPosition);
        doc.text(info.value, 50, yPosition);
      } else {
        doc.text(`${info.label}`, pageWidth / 2 + 15, yPosition);
        doc.text(info.value, pageWidth / 2 + 50, yPosition);
        yPosition += 5;
      }
    });
    yPosition += 5;

    // Marksheet Table
    const marksheetData = courses.map(course => {
      const totalQuizzes = course.totalQuizzes || 0;
      const passedQuizzes = course.passedQuizzes || 0;
      const avgScore = course.averageScore || 0;
      const grade = getGrade(avgScore);
      return [course.courseName || 'N/A', totalQuizzes, passedQuizzes, totalQuizzes - passedQuizzes, `${avgScore.toFixed(1)}%`, grade, passedQuizzes === totalQuizzes ? '✓ Completed' : 'In Progress'];
    });

    // Add total row
    const totalQuizzes = courses.reduce((sum, c) => sum + (c.totalQuizzes || 0), 0);
    const totalPassed = courses.reduce((sum, c) => sum + (c.passedQuizzes || 0), 0);
    const overallAvg = courses.length > 0 ? courses.reduce((sum, c) => sum + (c.averageScore || 0), 0) / courses.length : 0;
    marksheetData.push(['TOTAL', totalQuizzes, totalPassed, totalQuizzes - totalPassed, `${overallAvg.toFixed(1)}%`, getGrade(overallAvg), '']);
    autoTable(doc, {
      startY: yPosition,
      head: [['Course Name', 'Total Quizzes', 'Passed', 'Failed', 'Average Score', 'Grade', 'Status']],
      body: marksheetData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center'
      },
      bodyStyles: {
        textColor: textColor,
        fontSize: 8
      },
      columnStyles: {
        0: {
          cellWidth: 45,
          halign: 'left'
        },
        1: {
          cellWidth: 25,
          halign: 'center'
        },
        2: {
          cellWidth: 20,
          halign: 'center'
        },
        3: {
          cellWidth: 20,
          halign: 'center'
        },
        4: {
          cellWidth: 25,
          halign: 'center'
        },
        5: {
          cellWidth: 20,
          halign: 'center'
        },
        6: {
          cellWidth: 35,
          halign: 'center'
        }
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
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageWidth / 2, pageHeight - 8, {
          align: 'center'
        });
      }
    });
    yPosition = doc.lastAutoTable.finalY + 10;

    // Summary Section
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 15;
    }
    doc.setTextColor(...darkColor);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Summary', 15, yPosition);
    yPosition += 6;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    const summaryText = [`Total Courses: ${courses.length}`, `Total Quizzes Attempted: ${totalQuizzes}`, `Total Quizzes Passed: ${totalPassed}`, `Overall Pass Rate: ${totalQuizzes > 0 ? (totalPassed / totalQuizzes * 100).toFixed(1) : 0}%`, `Overall Average Score: ${overallAvg.toFixed(1)}%`, `Overall Grade: ${getGrade(overallAvg)}`];
    summaryText.forEach(text => {
      doc.text(`• ${text}`, 15, yPosition);
      yPosition += 5;
    });

    // Grade Scale
    yPosition += 5;
    doc.setFont(undefined, 'bold');
    doc.text('Grade Scale:', 15, yPosition);
    yPosition += 5;
    doc.setFont(undefined, 'normal');
    const gradeScale = ['A+ : 90-100%', 'A  : 80-89%', 'B+ : 70-79%', 'B  : 60-69%', 'C+ : 50-59%', 'C  : 40-49%', 'F  : Below 40%'];
    gradeScale.forEach(grade => {
      doc.text(`• ${grade}`, 15, yPosition);
      yPosition += 4;
    });

    // Footer
    const finalPageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('This is an officially generated marksheet from the Learning Management System.', pageWidth / 2, finalPageHeight - 8, {
      align: 'center'
    });

    // Save
    const filename = `marksheet-${studentName.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
    return true;
  } catch (error) {
    console.error('Error generating marksheet PDF:', error);
    throw error;
  }
};

/**
 * Generate course-wise marksheet PDF
 * @param {Object} courseData - Course data with quizzes
 * @param {string} courseName - Name of the course
 * @param {string} studentName - Name of the student
 * @param {string} studentEmail - Email of the student
 */
export const generateCourseMarksheetPDF = (courseData, courseName = "Course", studentName = "Student", studentEmail = "") => {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 15;

    // Colors
    const primaryColor = [76, 175, 80]; // Green
    const darkColor = [26, 26, 46];
    const textColor = [0, 0, 0];

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('COURSE MARKSHEET', pageWidth / 2, 12, {
      align: 'center'
    });
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(courseName, pageWidth / 2, 22, {
      align: 'center'
    });
    yPosition = 35;

    // Student & Course Info
    doc.setTextColor(...darkColor);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Student Information', 15, yPosition);
    yPosition += 6;
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
      label: 'Course:',
      value: courseName
    }, {
      label: 'Report Date:',
      value: new Date().toLocaleDateString('en-IN')
    }];
    infoData.forEach((info, idx) => {
      if (idx % 2 === 0) {
        doc.text(`${info.label}`, 15, yPosition);
        doc.text(info.value, 50, yPosition);
      } else {
        doc.text(`${info.label}`, pageWidth / 2 + 15, yPosition);
        doc.text(info.value, pageWidth / 2 + 50, yPosition);
        yPosition += 5;
      }
    });
    yPosition += 5;

    // Quiz Marksheet
    const performance = courseData?.performance || [];
    const quizData = performance.map((p, idx) => {
      const quizTitle = Array.isArray(p?.quiz) && p.quiz.length > 0 ? p.quiz[0]?.title : p?.quiz?.title || 'Quiz ' + (idx + 1);
      const score = p?.result?.score || 0;
      const totalMarks = p?.result?.totalMarks || 0;
      const percentage = p?.result?.percentage || 0;
      const grade = getGrade(percentage);
      return [idx + 1, quizTitle, `${score}/${totalMarks}`, `${percentage.toFixed(1)}%`, grade, p?.result?.passed ? 'Pass' : 'Fail', p?.result?.attempts || 1, p?.result?.completedAt ? new Date(p.result.completedAt).toLocaleDateString('en-IN') : '-'];
    });

    // Add total row
    const totalMarks = performance.reduce((sum, p) => sum + (p?.result?.totalMarks || 0), 0);
    const totalScore = performance.reduce((sum, p) => sum + (p?.result?.score || 0), 0);
    const avgPercentage = performance.length > 0 ? performance.reduce((sum, p) => sum + (p?.result?.percentage || 0), 0) / performance.length : 0;
    quizData.push(['', 'TOTAL', `${totalScore}/${totalMarks}`, `${avgPercentage.toFixed(1)}%`, getGrade(avgPercentage), '', '', '']);
    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Quiz Name', 'Score', 'Percentage', 'Grade', 'Status', 'Attempts', 'Date']],
      body: quizData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center'
      },
      bodyStyles: {
        textColor: textColor,
        fontSize: 8
      },
      columnStyles: {
        0: {
          cellWidth: 8,
          halign: 'center'
        },
        1: {
          cellWidth: 40,
          halign: 'left'
        },
        2: {
          cellWidth: 20,
          halign: 'center'
        },
        3: {
          cellWidth: 20,
          halign: 'center'
        },
        4: {
          cellWidth: 15,
          halign: 'center'
        },
        5: {
          cellWidth: 15,
          halign: 'center'
        },
        6: {
          cellWidth: 15,
          halign: 'center'
        },
        7: {
          cellWidth: 25,
          halign: 'center'
        }
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
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageWidth / 2, pageHeight - 8, {
          align: 'center'
        });
      }
    });
    yPosition = doc.lastAutoTable.finalY + 10;

    // Course Summary
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 15;
    }
    doc.setTextColor(...darkColor);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Course Summary', 15, yPosition);
    yPosition += 6;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    const passedQuizzes = performance.filter(p => p?.result?.passed).length;
    const summaryText = [`Total Quizzes: ${performance.length}`, `Passed: ${passedQuizzes}`, `Failed: ${performance.length - passedQuizzes}`, `Pass Rate: ${performance.length > 0 ? (passedQuizzes / performance.length * 100).toFixed(1) : 0}%`, `Average Score: ${avgPercentage.toFixed(1)}%`, `Overall Grade: ${getGrade(avgPercentage)}`, `Status: ${passedQuizzes === performance.length ? 'Course Completed' : 'In Progress'}`];
    summaryText.forEach(text => {
      doc.text(`• ${text}`, 15, yPosition);
      yPosition += 5;
    });

    // Footer
    const finalPageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('This is an officially generated course marksheet from the Learning Management System.', pageWidth / 2, finalPageHeight - 8, {
      align: 'center'
    });

    // Save
    const filename = `course-marksheet-${courseName.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
    return true;
  } catch (error) {
    console.error('Error generating course marksheet PDF:', error);
    throw error;
  }
};

/**
 * Calculate grade based on percentage
 */
function getGrade(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  return 'F';
}
