const crypto = require('node:crypto');
function matchChoiceId(quizId, questionId, index) {
    return crypto.createHmac('sha256', process.env.JWT_SECRET).update(`quiz-match:${quizId}:${questionId}:${index}`).digest('hex');
}

function studentQuiz(quiz) {
    const result = typeof quiz.toObject === 'function' ? quiz.toObject() : structuredClone(quiz);
    result.questions = (result.questions || []).map(question => {
        const { correctAnswer, correctAnswers, answers, keywords, solutionCode, testCases, ...publicQuestion } = question;
        const answerOptions = question.questionType === 'matchTheFollowing' ? (answers || []).map((text, index) => ({
            id: matchChoiceId(result._id, question._id, index), text
        })) : undefined;
        if (answerOptions) {
            for (let i = answerOptions.length - 1; i > 0; i--) {
                const j = crypto.randomInt(i + 1);
                [answerOptions[i], answerOptions[j]] = [answerOptions[j], answerOptions[i]];
            }
        }
        return { ...publicQuestion, ...(answerOptions ? { answerOptions } : {}),
            testCases: (testCases || []).filter(test => !test.isHidden).map(({ input, expectedOutput }) => ({ input, expectedOutput })) };
    });
    return result;
}

module.exports = { studentQuiz, matchChoiceId };
