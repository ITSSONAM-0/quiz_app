// DOM Elements
const container = document.querySelector('.container');
const questionBox = document.querySelector('.question');
const choicesBox = document.querySelector('.choices');
const nextBtn = document.querySelector('.nextBtn');
const prevBtn = document.querySelector('.prevBtn');
const scoreCard = document.querySelector('.scoreCard');
const alertBox = document.querySelector('.alert');
const timer = document.querySelector('.timer');
const notesBox = document.getElementById('notesBox');
const loadNotesBtn = document.getElementById('loadNotes');
const toggleNotesBtn = document.getElementById('toggleNotes');
const downloadBtn = document.getElementById('downloadNotes');
const subjectSelect = document.getElementById('subjectSelect');
const progressBar = document.getElementById('progress');
const leaderboardList = document.getElementById('leaderboardList');



let quiz = [], currentQuestionIndex = 0, score = 0, quizOver = false, timeLeft = 15, timerID = null, userAnswers = [];

// ----------------- QUIZ DATA -----------------
const quizData = {
    CSE: [
        {question:"What does HTML stand for?", choices:["Hyper Text Markup Language","Home Tool Markup Language","Hyperlinks Text Mark Language","Hyperlinking Text Mark Language"], answer:"Hyper Text Markup Language"},
        {question:"Which data structure uses FIFO?", choices:["Stack","Queue","Array","Tree"], answer:"Queue"},
        {question:"Which is a programming language?", choices:["HTTP","CSS","Python","HTML"], answer:"Python"},
        {question:"Which is an OS?", choices:["Linux","Python","HTML","MySQL"], answer:"Linux"},
        {question:"Which of the following is not a JavaScript data type?", choices:["String","Boolean","Float","Object"], answer:"Float"}
    ],
    EE: [
        {question:"Ohm's Law is?", choices:["V=IR","P=IV","E=MC2","F=ma"], answer:"V=IR"},
        {question:"Unit of Power?", choices:["Watt","Volt","Ampere","Ohm"], answer:"Watt"},
        {question:"Which device converts AC to DC?", choices:["Transformer","Rectifier","Inductor","Capacitor"], answer:"Rectifier"},
        {question:"Unit of Resistance?", choices:["Ohm","Watt","Volt","Ampere"], answer:"Ohm"},
        {question:"Frequency of standard AC supply in India?", choices:["50Hz","60Hz","45Hz","55Hz"], answer:"50Hz"}
    ],
    ME: [
        {question:"Unit of Force?", choices:["Newton","Joule","Pascal","Watt"], answer:"Newton"},
        {question:"Which is a thermodynamic process?", choices:["Isothermal","Isobaric","Adiabatic","All of these"], answer:"All of these"},
        {question:"SI unit of Pressure?", choices:["Pascal","Newton","Joule","Watt"], answer:"Pascal"},
        {question:"Lever is an example of?", choices:["Simple Machine","Complex Machine","Motor","Engine"], answer:"Simple Machine"},
        {question:"Which metal is used in making bearings?", choices:["Bronze","Copper","Iron","Aluminium"], answer:"Bronze"}
    ]
};

// ----------------- FUNCTIONS -----------------

// Show temporary alert
const displayAlert = (msg) => {
    alertBox.style.display = "block";
    alertBox.textContent = msg;
    setTimeout(() => alertBox.style.display = "none", 2000);
}

// Toggle notes visibility
toggleNotesBtn.addEventListener('click', () => {
    notesBox.style.display = notesBox.style.display === "block" ? "none" : "block";
});

// Fetch clean notes from Wikipedia
const fetchNotes = async (subject) => {
    let pageTitle = '';
    if(subject === 'CSE') pageTitle = 'Computer_science';
    else if(subject === 'EE') pageTitle = 'Electrical_engineering';
    else if(subject === 'ME') pageTitle = 'Mechanical_engineering';

    const apiURL = `https://en.wikipedia.org/w/api.php?action=parse&page=${pageTitle}&format=json&origin=*`;

    try {
        const response = await fetch(apiURL);
        const data = await response.json();
        const htmlContent = data.parse.text['*'];

        // Parse HTML and extract only paragraphs
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        const paragraphs = tempDiv.querySelectorAll('p');
        let notesText = '';
        paragraphs.forEach(p => {
            if(p.textContent.trim() !== '') notesText += `<p>${p.textContent}</p>`;
        });

        notesBox.innerHTML = notesText;
    } catch(err) {
        notesBox.textContent = "Failed to load notes.";
        console.error(err);
    }
}

// Download notes as PDF
downloadBtn.addEventListener('click', () => {
    const element = notesBox;
    const opt = {
        margin: 0.5,
        filename: `${subjectSelect.value}_Notes.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
});

// Load Notes & Quiz
loadNotesBtn.addEventListener('click', async () => {
    const subject = subjectSelect.value;
    await fetchNotes(subject);
    quiz = quizData[subject];
    userAnswers = [];
    container.style.display = "block";
    currentQuestionIndex = 0;
    showQuestions();
});

// Show current question
const showQuestions = () => {
    const q = quiz[currentQuestionIndex];
    questionBox.textContent = q.question;
    progressBar.style.width = `${((currentQuestionIndex+1)/quiz.length)*100}%`;
    choicesBox.textContent = "";

    q.choices.forEach(choice => {
        const div = document.createElement('div');
        div.textContent = choice;
        div.classList.add('choice');

        // Highlight previously selected
        if(userAnswers[currentQuestionIndex] === choice){
            div.classList.add('selected');
            div.classList.add(choice === q.answer ? 'correct':'wrong');
        }

        div.addEventListener('click', () => {
            document.querySelectorAll('.choice').forEach(c => c.classList.remove('selected','correct','wrong'));
            div.classList.add('selected');
            if(div.textContent === q.answer) div.classList.add('correct');
            else div.classList.add('wrong');
            userAnswers[currentQuestionIndex] = div.textContent;

            stopTimer();
            setTimeout(() => {
                if(currentQuestionIndex < quiz.length - 1){
                    currentQuestionIndex++;
                    showQuestions();
                } else {
                    showScore();
                }
            }, 1500);
        });

        choicesBox.appendChild(div);
    });

    timeLeft = 15;
    startTimer();
}

// Timer
const startTimer = () => {
    clearInterval(timerID);
    timer.style.display = "flex";
    timer.classList.remove('warning');
    timer.textContent = timeLeft;

    timerID = setInterval(() => {
        timeLeft--;
        timer.textContent = timeLeft;
        if(timeLeft <=5) timer.classList.add('warning');
        if(timeLeft ===0){
            displayAlert(`Time's up! Correct: ${quiz[currentQuestionIndex].answer}`);
            document.querySelectorAll('.choice').forEach(c => {
                if(c.textContent === quiz[currentQuestionIndex].answer) c.classList.add('correct');
            });
            stopTimer();
            setTimeout(() => {
                if(currentQuestionIndex < quiz.length -1){
                    currentQuestionIndex++;
                    showQuestions();
                } else {
                    showScore();
                }
            }, 1500);
        }
    }, 1000);
}

const stopTimer = () => clearInterval(timerID);

// Navigation buttons
nextBtn.addEventListener('click', () => {
    if(!userAnswers[currentQuestionIndex]){
        return displayAlert("Select an answer!");
    }
    if(currentQuestionIndex < quiz.length -1){
        currentQuestionIndex++;
        showQuestions();
    } else {
        showScore();
    }
});

prevBtn.addEventListener('click', () => {
    if(currentQuestionIndex >0){
        currentQuestionIndex--;
        showQuestions();
    }
});

// Show score and save leaderboard
const showScore = () => {
    container.style.display = "none";
    quizOver = true;
    score = userAnswers.filter((ans,i) => ans === quiz[i].answer).length;
    scoreCard.textContent = `You Scored ${score} / ${quiz.length}`;
    displayAlert("Quiz Completed!");
    saveHistory();
}

// Save history in localStorage
const saveHistory = () => {
    let history = JSON.parse(localStorage.getItem('quizHistory')) || [];
    history.push({subject: subjectSelect.value, score: score, date: new Date().toLocaleString()});
    localStorage.setItem('quizHistory', JSON.stringify(history));
    updateLeaderboard();
}

// Update leaderboard UI
const updateLeaderboard = () => {
    let history = JSON.parse(localStorage.getItem('quizHistory')) || [];
    history.sort((a,b) => b.score - a.score);
    leaderboardList.innerHTML = "";
    history.slice(0,5).forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.subject} - ${item.score} - ${item.date}`;
        leaderboardList.appendChild(li);
    });
}

// Initialize leaderboard
updateLeaderboard();
