const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const generateBtn = document.getElementById('generate');
const recommendationsDiv = document.getElementById('recommendations');
const saveWinBtn = document.getElementById('save-win');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history');

// --- 1. 테마 설정 ---
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark') {
    body.classList.add('dark-mode');
    themeToggle.textContent = 'Light Mode';
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    let theme = 'light';
    if (body.classList.contains('dark-mode')) {
        theme = 'dark';
        themeToggle.textContent = 'Light Mode';
    } else {
        themeToggle.textContent = 'Dark Mode';
    }
    localStorage.setItem('theme', theme);
});

// --- 2. 데이터 관리 ---
let winningHistory = JSON.parse(localStorage.getItem('winningHistory')) || [];
let myHistory = JSON.parse(localStorage.getItem('myHistory')) || [];

function getFrequency() {
    const frequency = Array(46).fill(0);
    winningHistory.forEach(win => {
        win.numbers.forEach(num => frequency[num]++);
    });
    return frequency;
}

renderHistory();
renderWinningInputs();

// --- 3. 당첨 번호 저장 ---
saveWinBtn.addEventListener('click', () => {
    const round = parseInt(document.getElementById('win-round').value);
    if (!round) {
        alert('회차를 입력해주세요.');
        return;
    }

    const inputs = [];
    for (let i = 1; i <= 6; i++) {
        const val = parseInt(document.getElementById(`win-${i}`).value);
        if (!val || val < 1 || val > 45) {
            alert(`${i}번째 번호를 입력해주세요.`);
            return;
        }
        if (inputs.includes(val)) {
            alert('중복된 번호가 있습니다.');
            return;
        }
        inputs.push(val);
    }
    inputs.sort((a, b) => a - b);

    const existingIdx = winningHistory.findIndex(w => w.round === round);
    if (existingIdx !== -1) {
        if (!confirm(`${round}회차 데이터가 이미 있습니다. 덮어씌울까요?`)) return;
        winningHistory.splice(existingIdx, 1);
    }

    winningHistory.unshift({ round, date: new Date().toLocaleDateString(), numbers: inputs });
    winningHistory.sort((a, b) => b.round - a.round);
    localStorage.setItem('winningHistory', JSON.stringify(winningHistory));
    
    alert(`${round}회차 당첨 번호가 저장되었습니다.`);
    renderHistory();
    renderWinningInputs();
});

function renderWinningInputs() {
    if (winningHistory.length > 0) {
        const latest = winningHistory[0];
        document.getElementById('win-round').placeholder = latest.round + 1;
    }
}

// --- 4. 번호 생성 ---
generateBtn.addEventListener('click', () => {
    const useHot = document.getElementById('method-hot').checked;
    const useCold = document.getElementById('method-cold').checked;
    const useEvenOdd = document.getElementById('method-evenodd').checked;

    const recommendations = [];
    const frequency = getFrequency();
    const currentRound = winningHistory.length > 0 ? winningHistory[0].round + 1 : '미정';

    for (let i = 0; i < 5; i++) {
        let set = [];
        let strategyKey = 'random';
        let strategyName = '랜덤/혼합';
        
        // 전략 할당 (5개 조합)
        if (useHot && i < 2) {
            strategyKey = 'hot';
            strategyName = '자주 나온 번호';
        } else if (useCold && i >= 2 && i < 4) {
            strategyKey = 'cold';
            strategyName = '드물게 나온 번호';
        }
        
        while (set.length < 6) {
            let num;
            if (strategyKey === 'hot' && winningHistory.length > 0) {
                num = getWeightedRandom(frequency, true);
            } else if (strategyKey === 'cold' && winningHistory.length > 0) {
                num = getWeightedRandom(frequency, false);
            } else {
                num = Math.floor(Math.random() * 45) + 1;
            }

            if (!set.includes(num)) set.push(num);
            if (useEvenOdd && set.length === 6) {
                const oddCount = set.filter(n => n % 2 !== 0).length;
                if (oddCount < 2 || oddCount > 4) set = [];
            }
        }
        set.sort((a, b) => a - b);
        recommendations.push({ numbers: set, strategyKey, strategyName });
    }

    renderRecommendations(recommendations);
    
    myHistory.unshift({
        id: Date.now(),
        round: currentRound,
        date: new Date().toLocaleString(),
        sets: recommendations
    });
    localStorage.setItem('myHistory', JSON.stringify(myHistory));
    renderHistory();
});

function deleteHistoryItem(id) {
    if (!confirm('이 내역을 삭제하시겠습니까?')) return;
    myHistory = myHistory.filter(item => item.id !== id);
    localStorage.setItem('myHistory', JSON.stringify(myHistory));
    renderHistory();
}

clearHistoryBtn.addEventListener('click', () => {
    if (!confirm('모든 추천 내역을 삭제하시겠습니까?')) return;
    myHistory = [];
    localStorage.setItem('myHistory', JSON.stringify(myHistory));
    renderHistory();
});

function getWeightedRandom(freq, isHot) {
    let mapped = freq.slice(1).map((count, idx) => ({ num: idx + 1, count }));
    mapped.sort((a, b) => b.count - a.count);
    const half = Math.floor(mapped.length / 2);
    const candidates = isHot ? mapped.slice(0, half + 5) : mapped.slice(half - 5);
    return candidates[Math.floor(Math.random() * candidates.length)].num;
}

// --- 5. 렌더링 ---
function createLottoRow(numbers, strategyName, strategyKey, targetWin) {
    const row = document.createElement('div');
    row.className = 'lotto-row';
    
    if (strategyName) {
        const label = document.createElement('span');
        label.className = `strategy-label strategy-${strategyKey}`;
        label.textContent = strategyName;
        row.appendChild(label);
    }

    let matchCount = 0;
    numbers.forEach(num => {
        const ball = document.createElement('div');
        ball.className = 'ball';
        ball.textContent = num;
        ball.style.backgroundColor = getBallColor(num);
        ball.style.color = getBallTextColor(num);
        
        if (targetWin && targetWin.numbers.includes(num)) {
            ball.style.border = '2px solid red';
            matchCount++;
        }
        row.appendChild(ball);
    });

    if (matchCount >= 3) {
        const badge = document.createElement('span');
        badge.className = 'match-count';
        badge.textContent = `${matchCount}개 일치!`;
        row.appendChild(badge);
    }
    
    return row;
}

function renderRecommendations(sets) {
    recommendationsDiv.innerHTML = '';
    sets.forEach(set => {
        recommendationsDiv.appendChild(createLottoRow(set.numbers, set.strategyName, set.strategyKey));
    });
}

function renderHistory() {
    historyList.innerHTML = '';
    myHistory.forEach(record => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const header = document.createElement('div');
        header.className = 'history-item-header';
        header.innerHTML = `<div><span class="round-badge">${record.round}회차 추천</span> <span class="history-date">${record.date}</span></div>`;
        
        const delBtn = document.createElement('button');
        delBtn.className = 'btn-delete-item';
        delBtn.innerHTML = '&times;';
        delBtn.onclick = () => deleteHistoryItem(record.id);
        header.appendChild(delBtn);
        item.appendChild(header);

        const targetWin = winningHistory.find(w => w.round === record.round || (record.round === '미정' && winningHistory.length > 0));

        record.sets.forEach(set => {
            const row = createLottoRow(set.numbers, set.strategyName, set.strategyKey, targetWin);
            row.style.transform = 'scale(0.9)';
            row.style.margin = '0 auto 5px';
            item.appendChild(row);
        });
        historyList.appendChild(item);
    });
}

function getBallColor(num) {
    if (num <= 10) return '#fbc400';
    if (num <= 20) return '#69c8f2';
    if (num <= 30) return '#ff7272';
    if (num <= 40) return '#aaa';
    return '#b0d840';
}

function getBallTextColor(num) {
    if (num > 10 && num <= 30) return '#fff';
    return '#000';
}
