const settings = {
  studyMinutes: 25,
  testSeconds: 10,
  expGain: 20,
  expToLevelUpBase: 60,
};

const STORAGE_KEY = 'pomogotchi-save-v1';

const state = {
  petName: '',
  level: 1,
  exp: 0,
  gems: 0,
  ownedPets: ['dog','cat'],
  activePet: 'dog',
  studyCompletions: 0,
  testCompletions: 0,
  focusMinutes: 0,
  mode: 'study',
  remainingMs: settings.studyMinutes * 60 * 1000,
  isRunning: false,
  isPaused: false,
  timerId: null,
  deadline: null,
  isNamePromptOpen: true,
};

const elements = {
  roomFrame: document.getElementById('roomFrame'),
  petFigure: document.getElementById('petFigure'),
  timerDisplay: document.getElementById('timerDisplay'),
  statusMessage: document.getElementById('statusMessage'),
  petNameDisplay: document.getElementById('petNameDisplay'),
  levelDisplay: document.getElementById('levelDisplay'),
  expDisplay: document.getElementById('expDisplay'),
  expGoalDisplay: document.getElementById('expGoalDisplay'),
  expFill: document.getElementById('expFill'),
  growthMessage: document.getElementById('growthMessage'),
  studyCountDisplay: document.getElementById('studyCountDisplay'),
  testCountDisplay: document.getElementById('testCountDisplay'),
  focusTimeDisplay: document.getElementById('focusTimeDisplay'),
  modeHint: document.getElementById('modeHint'),
  startButton: document.getElementById('startButton'),
  pauseButton: document.getElementById('pauseButton'),
  resumeButton: document.getElementById('resumeButton'),
  resetButton: document.getElementById('resetButton'),
  changeNameButton: document.getElementById('changeNameButton'),
  clearProgressButton: document.getElementById('clearProgressButton'),
  clearAllButton: document.getElementById('clearAllButton'),
  nameOverlay: document.getElementById('nameOverlay'),
  petNameInput: document.getElementById('petNameInput'),
  startNameButton: document.getElementById('startNameButton'),
  cancelNameButton: document.getElementById('cancelNameButton'),
  nameError: document.getElementById('nameError'),
  petList: document.getElementById('petList'),
  petStage: document.getElementById('petStage'),
  gemsDisplay: document.getElementById('gemsDisplay'),
  expFillTop: document.getElementById('expFillTop'),
  levelDisplayTop: document.getElementById('levelDisplayTop'),
  toast: document.getElementById('toast'),
  tabButtons: Array.from(document.querySelectorAll('.tab-button')),
  tabPanels: Array.from(document.querySelectorAll('.tab-panel')),
  modeButtons: Array.from(document.querySelectorAll('.mode-button')),
};

// More detailed pixel maps for pets (12x12) using characters for color keys; '.' is transparent
const petDefinitions = {
  dog: { name: '강아지', cost: 0, map: [
    '....222222....',
    '...22222222...',
    '..2222333322..',
    '.222333333322.',
    '.223333333322.',
    '.2233F33F3322.',
    '.223333333322.',
    '..2333333332..',
    '..2333333322..',
    '...23333322...',
    '....222222....',
    '.....2222.....'
  ]},
  cat: { name: '고양이', cost: 0, map: [
    '....444444....',
    '...44444444...',
    '..4444AA4444..',
    '.4444AAAA4444.',
    '.444A4444A444.',
    '.44A444444A44.',
    '.44A44AA44A44.',
    '..4444444444..',
    '..4444555444..',
    '...444555444...',
    '....444444....',
    '.....4444.....'
  ]},
  monkey: { name: '원숭이', cost: 20, map: [
    '....666666....',
    '...66666666...',
    '..6666BB6666..',
    '.6666BBBB6666.',
    '.666BBBBB6666.',
    '.66B666666B66.',
    '.66B6BB6B6B66.',
    '..66B6666B66..',
    '..6666666666..',
    '...66666666...',
    '....666666....',
    '.....6666.....'
  ]},
  duck: { name: '오리', cost: 25, map: [
    '....888888....',
    '...88888888...',
    '..8888CC8888..',
    '.8888CCCC8888.',
    '.888CCCCC8888.',
    '.88C888888C88.',
    '.88C8CC8C8C88.',
    '..88C8888C88..',
    '..8888888888..',
    '...88888888...',
    '....888888....',
    '.....8888.....'
  ]},
  mouse: { name: '쥐', cost: 18, map: [
    '....AAAAAA....',
    '...AAAAAAAA...',
    '..AAAAEEAAAA..',
    '.AAAAEEEEEAAA.',
    '.AAAEAAAEEAAA.',
    '.AAAEAAAEEAAA.',
    '.AAAEEAAEEAAA.',
    '..AAAEEEEEAA..',
    '..AAAAEEAAAA..',
    '...AABBAAAA...',
    '....AAAAAA....',
    '.....AAAA.....'
  ]},
};

const colorPalette = {
  '2':'#f6d7c3','3':'#d99aa0','4':'#c3e6b0','5':'#a3c389','6':'#f3c17a','7':'#dd8a4a','8':'#ffd980','9':'#f5c6c6','A':'#cfd7ff','B':'#a86b3a','C':'#ffea7a','E':'#ffffff','F':'#2f2649','G':'#ffd1d1'
};

function expToLevelUp(level){
  const base = settings.expToLevelUpBase;
  return Math.max(20, Math.floor(base * Math.pow(1.25, level-1)));
}

function init() {
  loadState();
  bindEvents();
  render();
  updateTitle();
  if (!state.petName) {
    openNamePrompt();
  }
  renderPetList();
  renderStagePets();
}

function bindEvents() {
  elements.startButton.addEventListener('click', startTimer);
  elements.pauseButton.addEventListener('click', pauseTimer);
  elements.resumeButton.addEventListener('click', resumeTimer);
  elements.resetButton.addEventListener('click', resetTimer);
  elements.changeNameButton.addEventListener('click', () => openNamePrompt(true));
  elements.startNameButton.addEventListener('click', submitPetName);
  elements.cancelNameButton.addEventListener('click', cancelNamePrompt);
  elements.petNameInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitPetName();
    }
  });

  elements.modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const nextMode = button.dataset.mode;
      if (nextMode === state.mode) {
        return;
      }
      setMode(nextMode);
    });
  });

  elements.clearProgressButton.addEventListener('click', () => {
    if (window.confirm('성장 기록을 지우면 레벨, 경험치, 완료 기록이 초기화됩니다. 계속할까요?')) {
      state.level = 1;
      state.exp = 0;
      state.studyCompletions = 0;
      state.testCompletions = 0;
      state.focusMinutes = 0;
      state.remainingMs = getInitialTime();
      state.isRunning = false;
      clearTimerInterval();
      state.deadline = null;
      setStatus('성장 기록이 초기화되었어요.');
      saveState();
      render();
    }
  });

  elements.clearAllButton.addEventListener('click', () => {
    if (window.confirm('펫 이름과 모든 기록을 지우고 처음 화면으로 돌아갑니다. 계속할까요?')) {
      clearAllStorage();
    }
  });
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') {
      return;
    }

    state.petName = sanitizeName(saved.petName, '');
    state.level = clampNumber(saved.level, 1, 99);
    state.exp = clampNumber(saved.exp, 0, 9999);
    state.studyCompletions = clampNumber(saved.studyCompletions, 0, 9999);
    state.testCompletions = clampNumber(saved.testCompletions, 0, 9999);
    state.focusMinutes = clampNumber(saved.focusMinutes, 0, 99999);
    state.mode = saved.mode === 'test' ? 'test' : 'study';
    state.remainingMs = getInitialTime();
    if (Number.isFinite(saved.gems)) state.gems = clampNumber(saved.gems,0,9999);
    if (Array.isArray(saved.ownedPets)) state.ownedPets = saved.ownedPets.filter(Boolean);
    if (saved.activePet && state.ownedPets.includes(saved.activePet)) state.activePet = saved.activePet;
  } catch (error) {
    console.warn('저장된 데이터를 읽지 못했습니다.', error);
  }
}

function saveState() {
  try {
    const payload = {
      petName: state.petName,
      level: state.level,
      exp: state.exp,
      studyCompletions: state.studyCompletions,
      testCompletions: state.testCompletions,
      focusMinutes: state.focusMinutes,
      mode: state.mode,
      gems: state.gems,
      ownedPets: state.ownedPets,
      activePet: state.activePet,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('저장을 실패했습니다.', error);
  }
}

function render() {
  elements.petNameDisplay.textContent = state.petName || '나의 펫';
  elements.levelDisplay.textContent = state.level;
  elements.expDisplay.textContent = state.exp;
  const goal = expToLevelUp(state.level);
  elements.expGoalDisplay.textContent = goal;
  elements.expFill.style.width = `${Math.min(100, (state.exp / goal) * 100)}%`;
  elements.expFillTop.style.width = `${Math.min(100, (state.exp / goal) * 100)}%`;
  elements.studyCountDisplay.textContent = `${state.studyCompletions}회`;
  elements.testCountDisplay.textContent = `${state.testCompletions}회`;
  elements.focusTimeDisplay.textContent = `${state.focusMinutes}분`;
  elements.growthMessage.textContent = state.petName ? `${state.petName}의 성장은 계속되고 있어요.` : '새로운 공부를 시작해요.';
  if(elements.petFigure) elements.petFigure.dataset.level = String(Math.min(4, state.level));
  elements.levelDisplayTop.textContent = state.level;
  elements.gemsDisplay.textContent = state.gems;
  updateTimerDisplay();
  updateButtons();
  updateModeUI();
  updateNameOverlay();
}

function updateButtons() {
  const canControlTimer = Boolean(state.petName);
  elements.startButton.classList.toggle('hidden', state.isRunning);
  elements.pauseButton.classList.toggle('hidden', !state.isRunning || !canControlTimer);
  elements.resumeButton.classList.toggle('hidden', !state.isPaused || !canControlTimer || state.remainingMs <= 0);
  elements.resetButton.disabled = false;
}

function updateModeUI() {
  elements.modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === state.mode;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  const modeLabel = state.mode === 'test' ? '10초 테스트 모드입니다. 실제 집중 시간은 더해지지 않아요.' : '25분 공부 모드입니다. 실제 공부로 기록돼요.';
  elements.modeHint.textContent = modeLabel;
}

function updateNameOverlay() {
  if (!state.petName) {
    elements.nameOverlay.classList.remove('hidden');
  } else {
    elements.nameOverlay.classList.add('hidden');
  }
}

function updateTimerDisplay() {
  elements.timerDisplay.textContent = formatTime(state.remainingMs);
}

function startTimer() {
  if (!state.petName) {
    openNamePrompt();
    return;
  }

  if (state.isRunning) {
    return;
  }

  if (state.remainingMs <= 0) {
    state.remainingMs = getInitialTime();
  }

  state.isRunning = true;
  state.deadline = Date.now() + state.remainingMs;
  state.timerId = window.setInterval(tickTimer, 250);
  setStatus(`${state.petName}와 함께 집중하는 중…`);
  render();
}

function pauseTimer() {
  if (!state.isRunning) {
    return;
  }
  clearTimerInterval();
  state.isRunning = false;
  state.isPaused = true;
  state.remainingMs = Math.max(0, state.deadline - Date.now());
  state.deadline = null;
  setStatus('잠깐 쉬어요. 이어가면 남은 시간부터 계속됩니다.');
  render();
}

function resumeTimer() {
  if (state.isRunning || !state.petName) {
    return;
  }

  if (state.remainingMs <= 0) {
    state.remainingMs = getInitialTime();
  }

  state.isRunning = true;
  state.isPaused = false;
  state.deadline = Date.now() + state.remainingMs;
  state.timerId = window.setInterval(tickTimer, 250);
  setStatus(`${state.petName}와 함께 다시 집중해요.`);
  render();
}

function resetTimer() {
  clearTimerInterval();
  state.isRunning = false;
  state.isPaused = false;
  state.remainingMs = getInitialTime();
  state.deadline = null;
  setStatus('타이머가 초기화되었어요. 다시 시작해볼까요?');
  render();
}

function tickTimer() {
  if (!state.isRunning || !state.deadline) {
    return;
  }

  const remaining = state.deadline - Date.now();
  if (remaining <= 0) {
    completeTimer();
    return;
  }
  state.remainingMs = remaining;
  updateTimerDisplay();
  updateTitle();
}

function completeTimer() {
  clearTimerInterval();
  state.isRunning = false;
  state.isPaused = false;
  state.remainingMs = 0;
  state.deadline = null;
  updateTimerDisplay();
  updateTitle();

  if (state.mode === 'test') {
    state.testCompletions += 1;
  } else {
    state.studyCompletions += 1;
    state.focusMinutes += settings.studyMinutes;
  }

  state.exp += settings.expGain;
  let leveled = 0;
  while (state.exp >= expToLevelUp(state.level)) {
    state.exp -= expToLevelUp(state.level);
    state.level += 1;
    leveled += 1;
    // reward gems on level up
    state.gems += 5;
  }

  triggerCelebration();
  saveState();
  render();

  if (leveled > 0) {
    showToast(`${state.petName || '나의 펫'}가 ${leveled}단계 성장하고 보석을 얻었어요!`);
  } else {
    showToast(`${state.petName || '나의 펫'}가 경험치 ${settings.expGain}을 얻었어요!`);
  }
}

function showToast(msg, ms=2000){
  elements.toast.textContent = msg;
  elements.toast.classList.remove('hidden');
  setTimeout(()=>{elements.toast.classList.add('hidden');}, ms);
}

function triggerCelebration() {
  elements.roomFrame.classList.remove('celebrating');
  void elements.roomFrame.offsetWidth;
  elements.roomFrame.classList.add('celebrating');
  window.setTimeout(() => {
    elements.roomFrame.classList.remove('celebrating');
  }, 1100);
}

function setMode(nextMode) {
  if (state.isRunning) {
    clearTimerInterval();
  }

  state.mode = nextMode;
  state.isRunning = false;
  state.isPaused = false;
  state.remainingMs = getInitialTime();
  state.deadline = null;
  setStatus(nextMode === 'test' ? '10초 테스트 모드로 바꿨어요.' : '25분 공부 모드로 바꿨어요.');
  saveState();
  render();
}

function getInitialTime() {
  return state.mode === 'test' ? settings.testSeconds * 1000 : settings.studyMinutes * 60 * 1000;
}

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function updateTitle() {
  const titleText = state.isRunning && state.remainingMs > 0
    ? `${formatTime(state.remainingMs)} | 뽀모고치`
    : state.remainingMs === 0 && !state.isRunning
      ? '공부 완료! | 뽀모고치'
      : '뽀모고치';
  document.title = titleText;
}

function submitPetName() {
  const trimmed = sanitizeName(elements.petNameInput.value, '');
  const cleaned = trimmed.trim();

  if (!cleaned) {
    elements.nameError.textContent = '이름을 입력해주세요.';
    return;
  }

  if (cleaned.length > 10) {
    elements.nameError.textContent = '이름은 10자 이하로 입력해주세요.';
    return;
  }

  state.petName = cleaned;
  elements.nameError.textContent = '';
  elements.petNameInput.value = '';
  state.isNamePromptOpen = false;
  setStatus(`${state.petName}와 함께 공부해요!`);
  saveState();
  render();
}

function cancelNamePrompt() {
  elements.petNameInput.value = '';
  elements.nameError.textContent = '';
  if (!state.petName) {
    elements.nameOverlay.classList.remove('hidden');
  } else {
    elements.nameOverlay.classList.add('hidden');
  }
}

function openNamePrompt(isChanging = false) {
  if (state.petName && !isChanging) {
    return;
  }
  elements.petNameInput.value = state.petName;
  elements.nameError.textContent = '';
  elements.nameOverlay.classList.remove('hidden');
  elements.petNameInput.focus();
}

// Render pet list in pets panel
function renderPetList(){
  if(!elements.petList) return;
  elements.petList.innerHTML='';
  Object.keys(petDefinitions).forEach(id=>{
    const def = petDefinitions[id];
    const tile = document.createElement('div'); tile.className='pet-tile';
    const sprite = document.createElement('div'); sprite.className='pet-sprite';
    renderSpriteInto(sprite, def.map, 88);
    const name = document.createElement('div'); name.className='pet-name'; name.textContent = def.name;
    const btn = document.createElement('button'); btn.className='pet-buy';
    if(state.ownedPets.includes(id)){
      btn.textContent='보유 중'; btn.disabled=true;
    } else {
      btn.textContent = def.cost>0?`구매 ${def.cost}💎`:'선택';
      btn.addEventListener('click', ()=>{
        if(def.cost>0){
          if(state.gems>=def.cost){ state.gems-=def.cost; state.ownedPets.push(id); saveState(); renderPetList(); renderStagePets(); showToast(`${def.name}을(를) 영입했어요!`);} else { showToast('보석이 부족해요'); }
        } else { state.ownedPets.push(id); saveState(); renderPetList(); renderStagePets(); showToast(`${def.name}을(를) 선택했어요!`); }
      });
    }
    tile.appendChild(sprite); tile.appendChild(name); tile.appendChild(btn);
    elements.petList.appendChild(tile);
  });
}

function renderSpriteInto(container, map, px=88){
  container.innerHTML = '';
  const cols = map[0].length;
  const rows = map.length;
  const canvas = document.createElement('canvas');
  canvas.width = cols; canvas.height = rows;
  const ctx = canvas.getContext('2d');
  for (let r = 0; r < rows; r++){
    const row = map[r];
    for (let c = 0; c < cols; c++){
      const ch = row[c];
      const color = colorPalette[ch];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(c, r, 1, 1);
      }
    }
  }
  canvas.style.width = px + 'px';
  canvas.style.height = Math.round(px * (rows/cols)) + 'px';
  canvas.className = 'pixel-canvas';
  container.appendChild(canvas);
}

function renderStagePets(){
  elements.petStage.innerHTML='';
  // show owned pets as small tiles, allow toggle active
  state.ownedPets.forEach(id=>{
    const box = document.createElement('div'); box.className='pet-on-stage';
    const sprite = document.createElement('div'); sprite.className='pet-sprite';
    renderSpriteInto(sprite, petDefinitions[id].map, 110);
    box.appendChild(sprite);
    box.addEventListener('click', ()=>{ state.activePet = id; saveState(); showToast(`${petDefinitions[id].name}을(를) 주 펫으로 설정했어요.`); });
    elements.petStage.appendChild(box);
  });
  Array.from(elements.petStage.children).forEach((child, idx)=>{
    const id = state.ownedPets[idx];
    if (id === state.activePet) child.style.outline = '4px solid rgba(255,255,255,0.8)';
  });
}

// tabs handling
elements.tabButtons.forEach(btn=>btn.addEventListener('click', ()=>{
  elements.tabButtons.forEach(b=>b.classList.remove('active'));
  elements.tabButtons.forEach(b=>b.setAttribute('aria-selected','false'));
  btn.classList.add('active'); btn.setAttribute('aria-selected','true');
  const tab = btn.dataset.tab;
  elements.tabPanels.forEach(p=>p.classList.add('hidden'));
  const panel = document.getElementById('tab-'+tab);
  if(panel) panel.classList.remove('hidden');
}));

function setStatus(message) {
  if (elements.statusMessage) elements.statusMessage.textContent = message;
  else showToast(message);
}

function clearAllStorage() {
  state.petName = '';
  state.level = 1;
  state.exp = 0;
  state.studyCompletions = 0;
  state.testCompletions = 0;
  state.focusMinutes = 0;
  state.mode = 'study';
  state.remainingMs = getInitialTime();
  state.isRunning = false;
  state.isPaused = false;
  clearTimerInterval();
  state.deadline = null;
  localStorage.removeItem(STORAGE_KEY);
  render();
  openNamePrompt();
}

function clearTimerInterval() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function sanitizeName(value) {
  return String(value || '').replace(/[<>]/g, '').trim();
}

function clampNumber(value, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return min;
  }
  return Math.min(max, Math.max(min, parsed));
}

init();
