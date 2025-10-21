// Decimal Dash — ENHANCED AND COMPLETE VERSION
(() => {
    // === ELEMENT REFERENCES ===
    const originalEl = document.getElementById('originalNumber');
    const taskEl = document.getElementById('taskText');
    const answerInput = document.getElementById('answer');
    const submitBtn = document.getElementById('submitBtn');
    const hintBtn = document.getElementById('hintBtn');
    const skipBtn = document.getElementById('skipBtn');
    const startBtn = document.getElementById('startBtn');
    const restartBtn = document.getElementById('restartBtn');
    const feedbackEl = document.getElementById('feedback');
    const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('lives');
    const timerEl = document.getElementById('timer');
    const levelBadge = document.getElementById('levelBadge');
    const modal = document.getElementById('modal'); // Game Over container
    const modalStart = document.getElementById('modalStart'); // Start screen container
    const gameArea = document.getElementById('gameArea'); // Main game UI container
    const levelPopup = document.getElementById('levelPopup');
    const popupScore = document.getElementById('popupScore');
    const popupNext = document.getElementById('popupNext');
    const popupNextLevel = document.getElementById('popupNextLevel');

    // === GAME STATE ===
    let mode = 'decimals';
    document.querySelectorAll('input[name="mode"]').forEach(r =>
        r.addEventListener('change', e => {
            mode = e.target.value;
            if (playing) startGame(); // Reset the game if mode changes mid-play
            else updateTaskDisplay();
        })
    );

    let score = 0;
    let lives = 3;
    let level = 1;
    let round = 0;
    let timeLeft = 30;
    let timerInterval = null;
    let current = null;
    let playing = false;

    // === SOUND UTILITY (Mocked) ===
    function playSound(type) {
        console.log(`Playing sound: ${type}`);
    }

    // === RANDOM NUMBER GENERATOR ===
    function randomNumberForLevel(lvl) {
        const base = (Math.random() * 900 + 100) / Math.pow(10, Math.floor(Math.random() * 4));
        const sign = Math.random() < 0.1 ? -1 : 1;
        return Number((sign * base).toPrecision(10));
    }

    // === PICK A TASK ===
    function pickTaskForLevel(lvl) {
        const value = randomNumberForLevel(lvl);
        if (mode === 'decimals') {
            const places = Math.min(6, 1 + Math.floor(lvl / 2) + Math.floor(Math.random() * 3));
            return { value, type: 'decimals', places };
        } else {
            const sig = Math.min(6, 1 + Math.floor(lvl / 2) + Math.floor(Math.random() * 3));
            return { value, type: 'sigfigs', sig };
        }
    }

    function formatOriginal(n) {
        if (Math.abs(n) >= 1e6 || (Math.abs(n) < 1e-6 && n !== 0)) return n.toExponential(4);
        return Number(n).toString();
    }

    // === UI UPDATERS ===
    function updateUI() {
        scoreEl.textContent = score;
        livesEl.textContent = lives;
        levelBadge.textContent = `Level ${level}`;
        livesEl.parentElement.classList.toggle('bg-red-300', lives === 1);
        livesEl.parentElement.classList.toggle('bg-red-100', lives > 1);
    }

    function updateTaskDisplay() {
        if (!current) return;
        originalEl.textContent = formatOriginal(current.value);
        if (current.type === 'decimals') {
            taskEl.textContent = `Express to ${current.places} decimal place${current.places > 1 ? 's' : ''}.`;
        } else {
            taskEl.textContent = `Express to ${current.sig} significant figure${current.sig > 1 ? 's' : ''}.`;
        }
    }

    // === ROUND FLOW ===
    function startRound() {
        if (!playing) return;
        round++;
        answerInput.value = '';
        feedbackEl.textContent = 'Type your answer and press Enter or Submit!';
        feedbackEl.className = 'feedback';
        
        current = pickTaskForLevel(level);
        updateTaskDisplay();
        
        startTimer();
        answerInput.focus();
        
        // Ensure buttons are active
        submitBtn.disabled = false;
        hintBtn.disabled = false;
        skipBtn.disabled = false;
    }

    function startTimer() {
        stopTimer();
        timeLeft = 30 - Math.min(12, Math.floor(level / 2));
        showTime();
        timerInterval = setInterval(() => {
            timeLeft--;
            showTime();
            if (timeLeft <= 0) {
                stopTimer();
                onTimeOut();
            }
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = null;
    }

    function showTime() {
        const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
        const ss = String(timeLeft % 60).padStart(2, '0');
        timerEl.textContent = `${mm}:${ss}`;
        timerEl.classList.toggle('text-red-600', timeLeft <= 10);
    }

    // === CHECKING ANSWERS ===
    function expectedAnswerString(task) {
        return task.type === 'decimals'
            ? Number(task.value).toFixed(task.places)
            : Number(task.value).toPrecision(task.sig);
    }

    function checkAnswer(userVal) {
        const num = Number(userVal);
        if (Number.isNaN(num)) return false; 
        
        const expected = expectedAnswerString(current);
        return userVal.trim() === expected.trim();
    }

    function onCorrect() {
        stopTimer();
        playSound('success');
        score += 10 * level;
        feedbackEl.textContent = '✅ Correct! Points earned: ' + (10 * level);
        feedbackEl.className = 'feedback success';
        updateUI();
        if (round % 5 === 0) levelUp();
        else nextTurnDelayed();
    }

    function onWrong() {
        stopTimer();
        playSound('fail');
        lives--;
        const ans = expectedAnswerString(current);
        feedbackEl.textContent = `❌ Wrong. Correct answer was: ${ans}`;
        feedbackEl.className = 'feedback error';
        updateUI();
        nextTurnDelayed();
    }

    function onTimeOut() {
        stopTimer();
        playSound('fail');
        lives--;
        feedbackEl.textContent = `⏰ Time's up! Correct answer was: ${expectedAnswerString(current)}`;
        feedbackEl.className = 'feedback error';
        updateUI();
        nextTurnDelayed();
    }

    function nextTurnDelayed() {
        submitBtn.disabled = true;
        hintBtn.disabled = true;
        skipBtn.disabled = true;

        if (lives <= 0) return setTimeout(endGame, 1500);

        setTimeout(() => {
            startRound();
        }, 1500);
    }

    function startGame() {
        playing = true;
        score = 0;
        lives = 3;
        level = 1;
        round = 0;
        
        // Hide menus and show the game area
        modalStart.classList.add('hidden');
        modal.classList.add('hidden');
        gameArea.classList.remove('hidden');
        
        updateUI();
        startRound();
    }

    function endGame() {
        stopTimer();
        playing = false;
        
        submitBtn.disabled = true;
        hintBtn.disabled = true;
        skipBtn.disabled = true;

        feedbackEl.textContent = `💀 Game Over! Final score: ${score}. Click Restart to try again.`;
        feedbackEl.className = 'feedback error';
        
        modal.classList.remove('hidden');
        gameArea.classList.add('hidden');
    }

    function levelUp() {
        stopTimer();
        level++;
        popupNextLevel.textContent = level;
        popupScore.textContent = score;
        levelPopup.classList.remove('hidden');
    }

    // === BUTTON ACTIONS AND EVENT LISTENERS ===
    
    // Game Start/Restart
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);

    // Level Up Popup
    popupNext.addEventListener('click', () => {
        levelPopup.classList.add('hidden');
        startRound();
    });

    // Submission Logic
    submitBtn.addEventListener('click', () => {
        if (!playing || submitBtn.disabled) return;
        const val = answerInput.value.trim();
        if (!val) {
            feedbackEl.textContent = 'Please type an answer.';
            feedbackEl.className = 'feedback error';
            return;
        }
        checkAnswer(val) ? onCorrect() : onWrong();
    });

    answerInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') submitBtn.click();
    });

    // --- ENHANCED HINT BUTTON ---
    hintBtn.addEventListener('click', () => {
        if (!playing || hintBtn.disabled) return;

        stopTimer(); // Stop the clock while the user reads the hint
        const expected = expectedAnswerString(current);
        
        // Find the index of the first incorrect character or the end of the input
        let hintIndex = 0;
        const currentInput = answerInput.value.trim();
        for (let i = 0; i < currentInput.length; i++) {
            if (currentInput.charAt(i) !== expected.charAt(i)) {
                hintIndex = i;
                break;
            }
        }

        const nextChar = expected.charAt(hintIndex);
        
        // Cost of the hint: a slight score reduction
        score = Math.max(0, score - 5); 
        updateUI();
        hintBtn.disabled = true; // One hint per round

        if (hintIndex < expected.length) {
            feedbackEl.textContent = `💡 Hint: The correct ${current.type === 'decimals' ? 'digit' : 'figure'} at position ${hintIndex + 1} is '${nextChar}'.`;
            feedbackEl.className = 'feedback error'; // Use error color to emphasize the score penalty
            
            // Give the user the remaining time back (or a minimum of 5 seconds)
            timeLeft = Math.max(5, timeLeft); 
            startTimer(); // Restart the timer
        } else {
            // If the user has typed a longer string than the answer
            feedbackEl.textContent = `💡 Hint: Your answer is too long! The answer is only ${expected.length} characters.`;
            feedbackEl.className = 'feedback error'; 
            timeLeft = Math.max(5, timeLeft);
            startTimer();
        }
    });
    
    // --- LESS PUNISHING SKIP BUTTON ---
    skipBtn.addEventListener('click', () => {
        if (!playing || skipBtn.disabled) return;
        
        stopTimer(); // Stop the timer first
        
        // Penalty: No loss of life, but a slight score penalty and time reset
        score = Math.max(0, score - 10);
        updateUI();

        const ans = expectedAnswerString(current);
        feedbackEl.textContent = `⏭️ Skipped. The correct answer was: ${ans}`;
        feedbackEl.className = 'feedback error';
        playSound('fail');
        
        // Immediately move to the next round after displaying the answer
        nextTurnDelayed();
    });


    // Initial Setup
    document.addEventListener('DOMContentLoaded', () => {
        updateUI();
        
        gameArea.classList.add('hidden');
        modal.classList.add('hidden');
        modalStart.classList.remove('hidden'); // Show the Start screen initially

        current = pickTaskForLevel(1);
        updateTaskDisplay();
        
        // Hide controls until game starts
        submitBtn.disabled = true;
        hintBtn.disabled = true;
        skipBtn.disabled = true;
    });

})(); // End of the IIFE