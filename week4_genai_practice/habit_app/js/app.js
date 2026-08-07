const STORAGE_KEY = 'habit-app-state-v1';
const defaultHabits = [
  { id: 1, text: '물 8잔 마시기', completed: false },
  { id: 2, text: '30분 운동하기', completed: false },
  { id: 3, text: '책 10페이지 읽기', completed: false }
];

const state = {
  date: getTodayKey(),
  habits: [],
  streak: 0,
  lastCompletedDate: null
};

let justCompletedId = null;

const form = document.getElementById('habit-form');
const input = document.getElementById('habit-input');
const list = document.getElementById('habit-list');
const progressRing = document.getElementById('progress-ring');
const progressPercent = document.getElementById('progress-percent');
const progressSummary = document.getElementById('progress-summary');
const habitCount = document.getElementById('habit-count');
const greeting = document.getElementById('greeting');
const todayDate = document.getElementById('today-date');
const streakBadge = document.getElementById('streak-badge');
const formMessage = document.getElementById('form-message');
const celebration = document.getElementById('celebration');
const confettiLayer = document.getElementById('confetti-layer');

init();

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = input.value.trim();

  if (!value) {
    showFormMessage('습관 이름을 입력해 주세요.', true);
    input.focus();
    return;
  }

  const exists = state.habits.some((habit) => habit.text.toLowerCase() === value.toLowerCase());
  if (exists) {
    showFormMessage('이미 같은 습관이 있어요.', true);
    input.value = '';
    input.focus();
    return;
  }

  state.habits.unshift({
    id: Date.now(),
    text: value,
    completed: false
  });

  showFormMessage('습관이 추가됐어요!');
  input.value = '';
  saveAndRender();
});

input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    form.requestSubmit();
  }
});

input.addEventListener('input', () => {
  if (formMessage.textContent) {
    formMessage.textContent = '';
    formMessage.classList.remove('error');
  }
});

list.addEventListener('click', (event) => {
  const toggleButton = event.target.closest('.check-toggle');
  const deleteButton = event.target.closest('.delete-btn');

  if (toggleButton) {
    const item = toggleButton.closest('.habit-item');
    const habitId = Number(item.dataset.id);
    toggleHabit(habitId);
    return;
  }

  if (deleteButton) {
    const item = deleteButton.closest('.habit-item');
    const habitId = Number(item.dataset.id);
    deleteHabit(habitId);
  }
});

function init() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state.date = parsed.date || getTodayKey();
      state.habits = parsed.habits || [];
      state.streak = parsed.streak || 0;
      state.lastCompletedDate = parsed.lastCompletedDate || null;

      if (state.date !== getTodayKey()) {
        state.date = getTodayKey();
        state.habits = resetHabitsForNewDay(state.habits);
      }
    } catch (error) {
      state.date = getTodayKey();
      state.habits = defaultHabits.map((habit) => ({ ...habit }));
      state.streak = 0;
      state.lastCompletedDate = null;
    }
  } else {
    state.date = getTodayKey();
    state.habits = defaultHabits.map((habit) => ({ ...habit }));
    state.streak = 0;
    state.lastCompletedDate = null;
  }

  saveAndRender();
}

function toggleHabit(habitId) {
  const target = state.habits.find((habit) => habit.id === habitId);
  if (!target) {
    return;
  }

  const wasCompleted = target.completed;
  state.habits = state.habits.map((habit) =>
    habit.id === habitId ? { ...habit, completed: !habit.completed } : habit
  );

  if (!wasCompleted) {
    justCompletedId = habitId;
  } else {
    justCompletedId = null;
  }

  const completed = state.habits.filter((habit) => habit.completed).length;
  const total = state.habits.length;
  if (total > 0 && completed === total && !wasCompleted && state.lastCompletedDate !== state.date) {
    state.streak += 1;
    state.lastCompletedDate = state.date;
  }

  saveAndRender();
}

function deleteHabit(habitId) {
  state.habits = state.habits.filter((habit) => habit.id !== habitId);
  saveAndRender();
}

function saveAndRender() {
  const payload = {
    date: state.date,
    habits: state.habits,
    streak: state.streak,
    lastCompletedDate: state.lastCompletedDate
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  render();
}

function render() {
  syncDateIfNeeded();

  const total = state.habits.length;
  const completed = state.habits.filter((habit) => habit.completed).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const isComplete = total > 0 && completed === total;

  greeting.textContent = getGreeting();
  todayDate.textContent = formatDate(new Date());
  streakBadge.textContent = `🔥 연속 ${state.streak}일째`;
  progressPercent.textContent = `${percent}%`;
  progressSummary.textContent = `${completed} / ${total} 완료`;
  habitCount.textContent = `${total}개`;

  progressRing.style.setProperty('--progress', `${percent}%`);
  celebration.classList.toggle('show', isComplete);

  if (isComplete) {
    launchConfetti();
  }

  list.innerHTML = '';
  state.habits.forEach((habit) => {
    const li = document.createElement('li');
    li.className = `habit-item ${habit.completed ? 'completed' : ''} ${habit.id === justCompletedId ? 'just-completed' : ''}`;
    li.dataset.id = habit.id;

    li.innerHTML = `
      <div class="habit-main">
        <button class="check-toggle" type="button" aria-label="완료 상태 변경"></button>
        <span class="habit-text">${escapeHtml(habit.text)}</span>
      </div>
      <button class="delete-btn" type="button">삭제</button>
    `;

    list.appendChild(li);
  });

  if (justCompletedId !== null) {
    setTimeout(() => {
      justCompletedId = null;
      render();
    }, 360);
  }
}

function showFormMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.classList.toggle('error', isError);
}

function launchConfetti() {
  confettiLayer.innerHTML = '';
  const pieceCount = 22;
  const colors = ['#74c8b6', '#f4c6d1', '#ffd8a8', '#8ecae6'];

  for (let index = 0; index < pieceCount; index += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.top = '-10px';
    piece.style.background = colors[index % colors.length];
    piece.style.setProperty('--x', `${(Math.random() - 0.5) * 180}px`);
    piece.style.animationDelay = `${Math.random() * 0.1}s`;
    confettiLayer.appendChild(piece);
  }

  setTimeout(() => {
    confettiLayer.innerHTML = '';
  }, 1400);
}

function syncDateIfNeeded() {
  const today = getTodayKey();
  if (state.date !== today) {
    state.date = today;
    state.habits = resetHabitsForNewDay(state.habits);
    saveAndRender();
  }
}

function resetHabitsForNewDay(existingHabits) {
  return existingHabits.map((habit) => ({
    ...habit,
    completed: false
  }));
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return '좋은 아침이에요';
  if (hour < 18) return '좋은 오후예요';
  return '좋은 저녁이에요';
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
  return `${year}년 ${month}월 ${day}일 (${weekday})`;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
