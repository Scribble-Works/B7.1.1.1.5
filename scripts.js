// Helper: Count leading zeros after decimal (for s.f. logic)
function getSignificantStart(str) {
    str = str.replace(/^-/, ''); // Remove minus if any (not used here)
    if (str.includes('.')) {
        const [intPart, decPart] = str.split('.');
        if (parseInt(intPart) !== 0) {
            return intPart.length; // e.g., 123.45 → starts at '1'
        } else {
            // Count leading zeros in decimal: 0.00456 → starts at 3rd dec digit
            let i = 0;
            while (i < decPart.length && decPart[i] === '0') i++;
            return i + 1; // position after decimal where s.f. begin
        }
    } else {
        // Whole number: trailing zeros may be ambiguous, but we avoid them
        return str.length - (str.match(/0*$/) || [''])[0].length;
    }
}

// Round to significant figures
function toSignificantFigures(num, sigFigs) {
    if (num === 0) return 0;
    const d = Math.ceil(Math.log10(Math.abs(num)));
    const power = sigFigs - d;
    const magnitude = Math.pow(10, power);
    const shifted = Math.round(num * magnitude);
    return shifted / magnitude;
}

// Round to decimal places
function toDecimalPlaces(num, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
}

// Generate plausible distractors
function generateDistractors(correct, type, value) {
    const set = new Set();
    const tries = 0;
    let attempts = 0;
    while (set.size < 3 && attempts < 20) {
        let wrong;
        if (type === 'sf') {
            // Perturb by ±1 in the last significant digit
            const scale = Math.pow(10, Math.floor(Math.log10(Math.abs(correct))) - (value - 1));
            const offset = (Math.random() > 0.5 ? 1 : -1) * scale;
            wrong = parseFloat((correct + offset).toPrecision(value));
        } else {
            // Decimal places: ±0.5 * 10^(-decimals)
            const step = Math.pow(10, -value);
            const offset = (Math.random() > 0.5 ? 1 : -1) * step;
            wrong = parseFloat((correct + offset).toFixed(value));
        }
        if (wrong > 0 && Math.abs(wrong - correct) > 1e-10) {
            set.add(wrong);
        }
        attempts++;
    }
    return Array.from(set).slice(0, 3);
}

// Generate questions
const questions = [];

// Decimal places questions
for (let i = 0; i < 5; i++) {
    const num = parseFloat((Math.random() * 200).toFixed(6)); // 0 to 200
    const decimals = Math.floor(Math.random() * 4) + 1; // 1 to 4 d.p.
    const correct = toDecimalPlaces(num, decimals);
    const options = [correct, ...generateDistractors(correct, 'dp', decimals)];
    shuffleArray(options);
    questions.push({
        number: num,
        instruction: `Round to ${decimals} decimal place${decimals > 1 ? 's' : ''}.`,
        correctAnswer: correct,
        options: options.map(n => parseFloat(n.toFixed(decimals > 4 ? 5 : decimals)))
    });
}

// Significant figures questions
for (let i = 0; i < 5; i++) {
    // Mix: some small (0.00x), some larger (123.456)
    const num = Math.random() < 0.5 
        ? parseFloat((Math.random() * 0.1).toFixed(6)) // e.g., 0.045678
        : parseFloat((Math.random() * 500).toFixed(6)); // e.g., 234.567891
    const sigFigs = Math.floor(Math.random() * 3) + 2; // 2 to 4 s.f.
    const correct = toSignificantFigures(num, sigFigs);
    const options = [correct, ...generateDistractors(correct, 'sf', sigFigs)];
    shuffleArray(options);
    questions.push({
        number: num,
        instruction: `Give to ${sigFigs} significant figure${sigFigs > 1 ? 's' : ''}.`,
        correctAnswer: correct,
        options: options.map(n => {
            // Format using toPrecision but avoid scientific notation
            const str = n.toPrecision(sigFigs);
            if (str.includes('e')) {
                return parseFloat(n.toFixed(6));
            }
            return parseFloat(str);
        })
    });
}

// Shuffle all questions
shuffleArray(questions);

let currentQuestionIndex = 0;
let score = 0;
let correctSound, wrongSound;

function initAudio() {
    correctSound = new Audio('assets/brass-fanfare-reverberated-146263.mp3');
    wrongSound = new Audio('assets/cartoon-fail-trumpet-278822.mp3');
    correctSound.load();
    wrongSound.load();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function switchScreen(id) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(id).classList.add('active');
}

function startGame() {
    currentQuestionIndex = 0;
    score = 0;
    switchScreen('quiz-screen');
    loadQuestion();
}

function loadQuestion() {
    if (currentQuestionIndex >= questions.length) {
        gameOver();
        return;
    }

    const q = questions[currentQuestionIndex];
    document.getElementById('question-number').textContent = `Question ${currentQuestionIndex + 1}/${questions.length}`;
    document.getElementById('instruction-text').textContent = q.instruction;
    
    // Display original number clearly
    const displayNum = q.number % 1 === 0 ? q.number : q.number.toFixed(Math.max(5, (q.number.toString().split('.')[1] || '').length));
    document.getElementById('number-to-process').textContent = displayNum;

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    q.options.forEach(option => {
        const button = document.createElement('button');
        button.classList.add('option-button');
        
        // Format answer: avoid excessive trailing zeros
        let formatted;
        if (q.instruction.includes('decimal')) {
            const decimals = parseInt(q.instruction.match(/\d+/)[0]);
            formatted = option.toFixed(decimals);
        } else {
            const sigFigs = parseInt(q.instruction.match(/\d+/)[0]);
            formatted = option.toPrecision(sigFigs);
            // Convert scientific notation if needed
            if (formatted.includes('e')) {
                formatted = parseFloat(option.toFixed(6)).toString();
            }
        }
        // Remove unnecessary trailing zeros after decimal
        formatted = parseFloat(formatted).toString();
        
        button.textContent = formatted;
        button.onclick = () => selectOption(button, formatted, (() => {
            let correctFormatted;
            if (q.instruction.includes('decimal')) {
                const d = parseInt(q.instruction.match(/\d+/)[0]);
                correctFormatted = q.correctAnswer.toFixed(d);
            } else {
                const s = parseInt(q.instruction.match(/\d+/)[0]);
                correctFormatted = q.correctAnswer.toPrecision(s);
                if (correctFormatted.includes('e')) {
                    correctFormatted = parseFloat(q.correctAnswer.toFixed(6)).toString();
                }
            }
            return parseFloat(correctFormatted).toString();
        })());
        optionsContainer.appendChild(button);
    });
}

function selectOption(selectedButton, selectedAnswer, correctAnswer) {
    document.querySelectorAll('.option-button').forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === correctAnswer) {
            btn.classList.add('correct');
        } else if (btn === selectedButton) {
            btn.classList.add('incorrect');
        }
    });

    if (selectedAnswer === correctAnswer) {
        score++;
        correctSound.currentTime = 0;
        correctSound.play().catch(e => console.log("Correct sound:", e.message));
    } else {
        wrongSound.currentTime = 0;
        wrongSound.play().catch(e => console.log("Wrong sound:", e.message));
    }

    setTimeout(() => {
        currentQuestionIndex++;
        loadQuestion();
    }, 1400);
}

function gameOver() {
    document.getElementById('final-score').textContent = `You scored ${score} out of ${questions.length}!`;
    switchScreen('game-over-screen');
}

function restartGame() {
    switchScreen('start-screen');
}

document.addEventListener('DOMContentLoaded', () => {
    initAudio();
    switchScreen('start-screen');
});