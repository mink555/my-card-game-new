const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const movesEl = document.getElementById('moves');
const remainingEl = document.getElementById('remaining');
const resetBtn = document.getElementById('reset-btn');
const scoreListEl = document.getElementById('score-list');

// Supabase 설정
const SUPABASE_URL = 'https://srggtepabwrvlaeubfrx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyZ2d0ZXBhYndydmxhZXViZnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MjYzNDAsImV4cCI6MjA4MzEwMjM0MH0.-3YSQlnaC1Ju34PQloXu6hpHxIAekECR7fC4se6vUpE';
// 라이브러리 객체와 클라이언트 인스턴스 이름이 겹치지 않게 수정
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 게임 설정
const GRID_SIZE = 4;
const CARD_MARGIN = 10;
const CANVAS_SIZE = 500;
const CARD_SIZE = (CANVAS_SIZE - (CARD_MARGIN * (GRID_SIZE + 1))) / GRID_SIZE;

canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

let cards = [];
let flippedCards = [];
let moves = 0;
let isAnimating = false;

// 카드 테마 색상들
const CARD_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#82E0AA'
];

class Card {
    constructor(row, col, value, color) {
        this.row = row;
        this.col = col;
        this.x = CARD_MARGIN + col * (CARD_SIZE + CARD_MARGIN);
        this.y = CARD_MARGIN + row * (CARD_SIZE + CARD_MARGIN);
        this.value = value;
        this.color = color;
        this.isFlipped = false;
        this.isMatched = false;
        this.flipProgress = 0; // 0 (뒷면) ~ 1 (앞면)
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + CARD_SIZE / 2, this.y + CARD_SIZE / 2);
        
        // 뒤집기 애니메이션 효과 (X축 스케일 조절)
        const scaleX = Math.abs(Math.cos(this.flipProgress * Math.PI));
        ctx.scale(scaleX, 1);

        // 카드 배경
        ctx.beginPath();
        const radius = 10;
        ctx.roundRect(-CARD_SIZE / 2, -CARD_SIZE / 2, CARD_SIZE, CARD_SIZE, radius);
        
        // 현재 보여지는 면 결정
        const isShowingFront = this.flipProgress > 0.5;
        if (this.isMatched || isShowingFront) {
            ctx.fillStyle = this.color;
            ctx.fill();
            // 숫자/문자 표시
            ctx.fillStyle = 'white';
            ctx.font = 'bold 30px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.value, 0, 0);
        } else {
            ctx.fillStyle = '#2C3E50';
            ctx.fill();
            // 뒷면 무늬
            ctx.strokeStyle = '#34495E';
            ctx.lineWidth = 5;
            ctx.strokeRect(-CARD_SIZE / 4, -CARD_SIZE / 4, CARD_SIZE / 2, CARD_SIZE / 2);
        }

        ctx.restore();
    }

    update(targetProgress) {
        if (this.flipProgress < targetProgress) {
            this.flipProgress = Math.min(targetProgress, this.flipProgress + 0.1);
            return true;
        } else if (this.flipProgress > targetProgress) {
            this.flipProgress = Math.max(targetProgress, this.flipProgress - 0.1);
            return true;
        }
        return false;
    }
}

async function loadLeaderboard() {
    try {
        const { data, error } = await supabaseClient
            .from('game_scores')
            .select('player_name, moves')
            .order('moves', { ascending: true })
            .limit(5);

        if (error) throw error;

        scoreListEl.innerHTML = data && data.length > 0 
            ? data.map((s, i) => `<li><span><span class="rank">${i+1}</span>${s.player_name}</span> <span>${s.moves}회</span></li>`).join('')
            : '<li>아직 기록이 없습니다.</li>';
    } catch (err) {
        console.error('Leaderboard load error:', err);
        scoreListEl.innerHTML = '<li>데이터를 불러올 수 없습니다.</li>';
    }
}

async function saveScore(moves) {
    const playerName = prompt('🎉 축하합니다! 이름을 입력하세요:', '플레이어');
    if (!playerName) return;

    try {
        const { error } = await supabaseClient
            .from('game_scores')
            .insert([{ player_name: playerName, moves: moves }]);

        if (error) throw error;
        await loadLeaderboard();
    } catch (err) {
        console.error('Score save error:', err);
        alert('점수 저장 중 오류가 발생했습니다.');
    }
}

function initGame() {
    cards = [];
    flippedCards = [];
    moves = 0;
    movesEl.textContent = moves;
    
    // 카드 값 생성 (쌍으로)
    let values = [];
    for (let i = 0; i < (GRID_SIZE * GRID_SIZE) / 2; i++) {
        values.push({ val: i + 1, color: CARD_COLORS[i] });
        values.push({ val: i + 1, color: CARD_COLORS[i] });
    }

    // 셔플
    values.sort(() => Math.random() - 0.5);

    // 카드 객체 생성
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const data = values[i * GRID_SIZE + j];
            cards.push(new Card(i, j, data.val, data.color));
        }
    }
    
    remainingEl.textContent = cards.length;
    loadLeaderboard();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let animating = false;
    
    cards.forEach(card => {
        const target = (card.isFlipped || card.isMatched) ? 1 : 0;
        if (card.update(target)) animating = true;
        card.draw();
    });

    isAnimating = animating;
    requestAnimationFrame(draw);
}

canvas.addEventListener('click', (e) => {
    if (isAnimating || flippedCards.length >= 2) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const clickedCard = cards.find(card => 
        !card.isMatched && !card.isFlipped &&
        mouseX >= card.x && mouseX <= card.x + CARD_SIZE &&
        mouseY >= card.y && mouseY <= card.y + CARD_SIZE
    );

    if (clickedCard) {
        clickedCard.isFlipped = true;
        flippedCards.push(clickedCard);

        if (flippedCards.length === 2) {
            moves++;
            movesEl.textContent = moves;
            checkMatch();
        }
    }
});

function checkMatch() {
    const [card1, card2] = flippedCards;
    
    if (card1.value === card2.value) {
        // 매치 성공
        setTimeout(() => {
            card1.isMatched = true;
            card2.isMatched = true;
            flippedCards = [];
            const remaining = cards.filter(c => !c.isMatched).length;
            remainingEl.textContent = remaining;
            
            if (remaining === 0) {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 }
                });
                saveScore(moves);
            }
        }, 500);
    } else {
        // 매치 실패 - 다시 뒤집기
        setTimeout(() => {
            card1.isFlipped = false;
            card2.isFlipped = false;
            flippedCards = [];
        }, 1000);
    }
}

resetBtn.addEventListener('click', initGame);

initGame();
draw();
