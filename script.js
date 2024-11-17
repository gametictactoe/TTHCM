let isExamInProgress = false;
let userAnswers = [];
let correctAnswers = 0;
let timerInterval;

// Bắt đầu bài kiểm tra từ một file JSON cụ thể
function startExam(file) {
    if (isExamInProgress) {
        alert("Bạn phải nộp bài hiện tại trước khi bắt đầu bài mới.");
        return;
    }

    fetch(file)
        .then(response => response.json())
        .then(data => {
            const randomQuestions = getRandomQuestions(data, 10);
            displayQuestions(randomQuestions);
            startTimer(15 * 60); // 15 phút
            isExamInProgress = true;
        })
        .catch(error => console.error("Lỗi khi tải file JSON:", error));
}

// Bắt đầu bài kiểm tra tổng hợp từ nhiều file JSON
function startExamForAll() {
    if (isExamInProgress) {
        alert("Bạn phải nộp bài hiện tại trước khi bắt đầu bài mới.");
        return;
    }

    const files = ['data/bai1.json', 'data/bai2.json', 'data/bai3.json', 'data/bai4.json', 'data/bai5.json', 'data/bai6.json'];
    const minQuestionsPerFile = 6;
    const totalQuestions = 40;

    Promise.all(files.map(file => fetch(file).then(response => response.json())))
        .then(results => {
            const questions = [];
            const uniqueQuestions = new Set();

            results.forEach(fileQuestions => {
                let selectedQuestions = [];
                let attempts = 0;

                while (selectedQuestions.length < minQuestionsPerFile && attempts < fileQuestions.length * 2) {
                    const randomIndex = Math.floor(Math.random() * fileQuestions.length);
                    const question = fileQuestions[randomIndex];

                    if (!uniqueQuestions.has(question.id)) {
                        uniqueQuestions.add(question.id);
                        selectedQuestions.push(question);
                    }

                    attempts++;
                }

                if (selectedQuestions.length < minQuestionsPerFile) {
                    console.warn(`Không đủ câu hỏi từ file: ${fileQuestions}.`);
                }

                questions.push(...selectedQuestions);
            });

            while (questions.length < totalQuestions) {
                results.forEach(fileQuestions => {
                    if (questions.length >= totalQuestions) return;

                    const randomIndex = Math.floor(Math.random() * fileQuestions.length);
                    const question = fileQuestions[randomIndex];

                    if (!uniqueQuestions.has(question.id)) {
                        uniqueQuestions.add(question.id);
                        questions.push(question);
                    }
                });
            }

            const shuffledQuestions = questions.sort(() => 0.5 - Math.random());
            displayQuestions(shuffledQuestions.slice(0, totalQuestions));
            startTimer(45 * 60); // 45 phút
            isExamInProgress = true;
        })
        .catch(error => console.error("Lỗi khi tải file JSON:", error));
}

// Chọn ngẫu nhiên một số câu hỏi
function getRandomQuestions(questions, count) {
    return questions.sort(() => 0.5 - Math.random()).slice(0, count);
}

// Hiển thị câu hỏi
function displayQuestions(questions) {
    const questionsContainer = document.getElementById("questions");
    questionsContainer.innerHTML = "";

    questions.forEach((question, index) => {
        const questionDiv = document.createElement("div");
        questionDiv.classList.add("question");
        questionDiv.dataset.correctAnswer = question.correct_answer;

        const questionText = document.createElement("p");
        questionText.innerHTML = `<strong>Câu ${index + 1}:</strong> ${question.question_direction}`;
        questionDiv.appendChild(questionText);

        const optionsContainer = document.createElement("div");
        optionsContainer.classList.add("options");

        question.answer_option.forEach(option => {
            const label = document.createElement("label");
            label.classList.add("option-label");

            const input = document.createElement("input");
            input.type = "radio";
            input.name = `question${index}`;
            input.value = option.id;

            input.addEventListener("change", enableSubmitEarly);

            label.appendChild(input);
            label.appendChild(document.createTextNode(option.value));
            optionsContainer.appendChild(label);
        });

        questionDiv.appendChild(optionsContainer);
        questionsContainer.appendChild(questionDiv);
    });
}

// Bắt đầu bộ đếm thời gian
function startTimer(duration) {
    const timerElement = document.getElementById("timer");
    let remainingTime = duration;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        timerElement.textContent = `Thời gian còn lại: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            alert("Hết giờ! Hệ thống sẽ tự động nộp bài.");
            submitExam();
        }

        remainingTime--;
    }, 1000);
}

// Kích hoạt nút nộp bài sớm
function enableSubmitEarly() {
    const questions = document.querySelectorAll('.question');
    const allAnswered = Array.from(questions).every(questionDiv => 
        questionDiv.querySelector('input[type="radio"]:checked')
    );

    const earlySubmitInfo = document.getElementById("early-submit-info");
    const submitBtn = document.getElementById("submit-btn");

    if (allAnswered) {
        earlySubmitInfo.style.display = "block";
        submitBtn.style.display = "block";
    } else {
        earlySubmitInfo.style.display = "none";
        submitBtn.style.display = "none";
    }
}

// Nộp bài kiểm tra và hiển thị kết quả
function submitExam() {
    clearInterval(timerInterval);

    const questionsContainer = document.getElementById("questions");
    const resultContainer = document.getElementById("result");
    const scoreElement = document.getElementById("score");

    correctAnswers = 0;
    userAnswers = [];

    const questions = document.querySelectorAll('.question');
    questions.forEach((questionDiv, index) => {
        const question = questionDiv.querySelector('p').textContent;
        const selectedOption = questionDiv.querySelector('input[type="radio"]:checked');
        const correctAnswer = questionDiv.dataset.correctAnswer;

        const correctOption = questionDiv.querySelector(`input[value="${correctAnswer}"]`).nextSibling.textContent;
        let userAnswerText = "Chưa chọn";

        if (selectedOption) {
            userAnswerText = selectedOption.nextSibling.textContent;
            userAnswers.push({ question, userAnswer: userAnswerText, correctAnswer: correctOption });

            if (selectedOption.value === correctAnswer) {
                correctAnswers++;
            }
        } else {
            userAnswers.push({ question, userAnswer: "Chưa chọn", correctAnswer: correctOption });
        }
    });

    const totalQuestions = questions.length;
    const score = ((correctAnswers / totalQuestions) * 10).toFixed(2);

    questionsContainer.innerHTML = "<h2>Kết quả bài kiểm tra</h2>";
    userAnswers.forEach((answer, index) => {
        const answerDiv = document.createElement('div');
        answerDiv.classList.add(answer.userAnswer === answer.correctAnswer ? 'correct' : 'incorrect');
        answerDiv.innerHTML = `
            <p><strong>Câu ${index + 1}:</strong> ${answer.question}</p>
            <p><strong>Đáp án bạn chọn:</strong> ${answer.userAnswer}</p>
            <p><strong>Đáp án đúng:</strong> ${answer.correctAnswer}</p>
        `;
        questionsContainer.appendChild(answerDiv);
    });

    scoreElement.textContent = `Điểm của bạn: ${score} (Số câu trả lời đúng: ${correctAnswers}/${totalQuestions})`;
    resultContainer.style.display = "block";
    document.getElementById("submit-btn").style.display = "none";
    isExamInProgress = false;
}
