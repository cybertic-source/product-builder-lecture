const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const generateBtn = document.getElementById('generate');
const recommendationsDiv = document.getElementById('recommendations');
const saveWinBtn = document.getElementById('save-win');
const historyList = document.getElementById('history-list');

// --- 1. 테마 설정 (기존 유지) ---
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

// --- 2. 데이터 관리 (LocalStorage) ---
let winningHistory = JSON.parse(localStorage.getItem('winningHistory')) || [];
let myHistory = JSON.parse(localStorage.getItem('myHistory')) || [];

// 번호별 출현 빈도 계산
function getFrequency() {
    const frequency = Array(46).fill(0);
    winningHistory.forEach(win => {
        win.numbers.forEach(num => frequency[num]++);
    });
    return frequency;
}

// 화면 초기화
renderHistory();
renderWinningInputs();

// --- 3. 당첨 번호 입력 및 저장 ---
saveWinBtn.addEventListener('click', () => {
    const inputs = [];
    for (let i = 1; i <= 6; i++) {
        const val = parseInt(document.getElementById(`win-${i}`).value);
        if (!val || val < 1 || val > 45) {
            alert(`${i}번째 번호를 1~45 사이로 입력해주세요.`);
            return;
        }
        if (inputs.includes(val)) {
            alert('중복된 번호가 있습니다.');
            return;
        }
        inputs.push(val);
    }
    inputs.sort((a, b) => a - b);

    // 저장
    winningHistory.unshift({ date: new Date().toLocaleDateString(), numbers: inputs });
    localStorage.setItem('winningHistory', JSON.stringify(winningHistory));
    
    alert('당첨 번호가 저장되었습니다. 통계가 업데이트됩니다.');
    renderHistory(); // 히스토리의 당첨 결과도 갱신될 수 있음
    
    // 입력창 초기화
    for (let i = 1; i <= 6; i++) {
        document.getElementById(`win-${i}`).value = '';
    }
});

function renderWinningInputs() {
    if (winningHistory.length > 0) {
        const latest = winningHistory[0].numbers;
        // placeholder에 최신 당첨 번호 힌트
        for(let i=0; i<6; i++) {
            const input = document.getElementById(`win-${i+1}`);
            if(input) input.placeholder = latest[i];
        }
    }
}

// --- 4. 번호 생성 알고리즘 ---
generateBtn.addEventListener('click', () => {
    const useHot = document.getElementById('method-hot').checked;
    const useCold = document.getElementById('method-cold').checked;
    const useEvenOdd = document.getElementById('method-evenodd').checked;

    const recommendations = [];
    const frequency = getFrequency();

    for (let i = 0; i < 5; i++) {
        let set = [];
        let strategy = 'random';
        
        // 5개 세트에 대해 전략 분산 적용
        if (useHot && i < 2) strategy = 'hot';
        else if (useCold && i >= 2 && i < 4) strategy = 'cold';
        
        while (set.length < 6) {
            let num;
            if (strategy === 'hot' && winningHistory.length > 0) {
                // 자주 나온 번호 가중치 (상위 50%에서 랜덤)
                num = getWeightedRandom(frequency, true);
            } else if (strategy === 'cold' && winningHistory.length > 0) {
                // 안 나온 번호 가중치 (하위 50%에서 랜덤)
                num = getWeightedRandom(frequency, false);
            } else {
                // 완전 랜덤
                num = Math.floor(Math.random() * 45) + 1;
            }

            if (!set.includes(num)) {
                set.push(num);
            }

            // 홀짝 비율 체크 (마지막 번호 넣을 때 검사)
            if (useEvenOdd && set.length === 6) {
                const oddCount = set.filter(n => n % 2 !== 0).length;
                // 홀짝 3:3, 4:2, 2:4 허용. 그 외(6:0, 5:1 등)는 다시 뽑기
                if (oddCount < 2 || oddCount > 4) {
                    set = []; // 리셋하고 다시 뽑기
                }
            }
        }
        set.sort((a, b) => a - b);
        recommendations.push(set);
    }

    renderRecommendations(recommendations);
    
    // 내역 저장
    myHistory.unshift({
        date: new Date().toLocaleString(),
        sets: recommendations
    });
    localStorage.setItem('myHistory', JSON.stringify(myHistory));
    renderHistory();
});

function getWeightedRandom(freq, isHot) {
    // 빈도수와 인덱스(번호)를 매핑
    let mapped = freq.slice(1).map((count, idx) => ({ num: idx + 1, count }));
    
    // 정렬
    mapped.sort((a, b) => b.count - a.count); // 내림차순 (많이 나온 순)

    const half = Math.floor(mapped.length / 2);
    let candidates;

    if (isHot) {
        candidates = mapped.slice(0, half + 5); // 상위권 + 여유
    } else {
        candidates = mapped.slice(half - 5); // 하위권 + 여유
    }
    
    // 후보군 없으면 전체에서 랜덤
    if (candidates.length === 0) return Math.floor(Math.random() * 45) + 1;

    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    return picked.num;
}

// --- 5. 렌더링 ---
function renderRecommendations(sets) {
    recommendationsDiv.innerHTML = '';
    sets.forEach(set => {
        const row = document.createElement('div');
        row.className = 'lotto-row';
        set.forEach(num => {
            const ball = document.createElement('div');
            ball.className = 'ball';
            ball.textContent = num;
            ball.style.backgroundColor = getBallColor(num);
            ball.style.color = getBallTextColor(num);
            row.appendChild(ball);
        });
        recommendationsDiv.appendChild(row);
    });
}

function renderHistory() {
    historyList.innerHTML = '';
    myHistory.forEach(record => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const dateDiv = document.createElement('div');
        dateDiv.className = 'history-date';
        dateDiv.textContent = record.date;
        item.appendChild(dateDiv);

        record.sets.forEach(set => {
            const row = document.createElement('div');
            row.className = 'lotto-row';
            row.style.transform = 'scale(0.9)'; // 히스토리는 조금 작게
            
            // 당첨 비교
            let matchCount = 0;
            if (winningHistory.length > 0) {
                const latestWin = winningHistory[0].numbers;
                matchCount = set.filter(n => latestWin.includes(n)).length;
            }

            set.forEach(num => {
                const ball = document.createElement('div');
                ball.className = 'ball';
                ball.textContent = num;
                ball.style.backgroundColor = getBallColor(num);
                ball.style.color = getBallTextColor(num);
                
                // 당첨 번호 하이라이트 (테두리 등)
                if (winningHistory.length > 0 && winningHistory[0].numbers.includes(num)) {
                    ball.style.border = '2px solid red';
                    ball.style.transform = 'scale(1.1)';
                }
                
                row.appendChild(ball);
            });

            if (matchCount >= 3) {
                const resultBadge = document.createElement('span');
                resultBadge.className = 'match-count';
                resultBadge.textContent = `${matchCount}개 일치!`;
                row.appendChild(resultBadge);
            }

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
    // 밝은 배경엔 검은 글씨, 어두운 배경엔 흰 글씨 (간단화)
    if (num > 10 && num <= 20) return '#fff'; // 파랑
    if (num > 20 && num <= 30) return '#fff'; // 빨강
    return '#000';
}
