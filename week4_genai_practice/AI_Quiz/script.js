const questions = [
  {
    topic: "파이썬 기초",
    text: "다음 중 파이썬 리스트에서 마지막 요소를 가져오는 올바른 표현은 무엇인가요?",
    choices: ["data[-1]", "data[0]", "data[last]", "data(len(data))"],
    answer: 0,
    explanation: "파이썬에서 -1 인덱스는 리스트의 마지막 요소를 의미합니다."
  },
  {
    topic: "파이썬 기초",
    text: "다음 코드에서 출력되는 값은 무엇인가요?\n\nnum = 7\nresult = num % 3\nprint(result)",
    choices: ["1", "2", "0", "3"],
    answer: 1,
    explanation: "7을 3으로 나눈 나머지는 2입니다."
  },
  {
    topic: "데이터 분석(pandas)",
    text: "pandas DataFrame df에서 컬럼 'age'가 30 이상인 행만 선택하려면 어떤 표현이 맞을까요?",
    choices: ["df[df['age'] >= 30]", "df.loc[30 <= df['age']]", "df['age'] >= 30", "df.filter('age >= 30')"],
    answer: 0,
    explanation: "DataFrame에서 조건을 전달하려면 df[조건] 형태를 사용합니다."
  },
  {
    topic: "데이터 분석(pandas)",
    text: "다음 중 두 DataFrame을 공통 컬럼을 기준으로 합치는 함수는 무엇인가요?",
    choices: ["pd.concat", "pd.merge", "pd.join", "pd.stack"],
    answer: 1,
    explanation: "pd.merge는 두 DataFrame을 공통 열에 따라 병합할 때 사용합니다."
  },
  {
    topic: "머신러닝",
    text: "과적합(overfitting)이란 무엇을 의미하나요?",
    choices: ["학습 데이터에 너무 잘 맞아서 새로운 데이터에서 성능이 떨어지는 현상", "모델이 입력 데이터를 충분히 학습하지 못한 상태", "훈련 데이터와 테스트 데이터가 분리된 상태", "모델의 학습 속도가 매우 빠른 상태"],
    answer: 0,
    explanation: "과적합은 모델이 훈련데이터에 지나치게 맞춰져서 일반화 성능이 낮아질 때 발생합니다."
  },
  {
    topic: "머신러닝",
    text: "모델을 평가할 때 학습 데이터와 테스트 데이터를 분리하는 이유로 가장 적절한 것은 무엇인가요?",
    choices: ["테스트 데이터로 하이퍼파라미터를 조정하기 위해", "모델을 과적합으로부터 보호하고 일반화 성능을 측정하기 위해", "학습 시간을 단축하기 위해", "훈련 데이터 크기를 줄이기 위해"],
    answer: 1,
    explanation: "테스트 데이터는 새로운 데이터에 대한 모델의 일반화 성능을 확인하기 위해 사용합니다."
  },
  {
    topic: "딥러닝",
    text: "딥러닝에서 에폭(epoch)의 의미는 무엇인가요?",
    choices: ["전체 학습 데이터셋을 한 번 모델에 통과시키는 과정", "하이퍼파라미터의 이름", "학습률을 조절하는 함수", "입력 레이어의 노드 수"],
    answer: 0,
    explanation: "한 에폭은 전체 데이터셋이 모델을 한 번 통과한 상태를 의미합니다."
  },
  {
    topic: "딥러닝",
    text: "다음 중 활성화 함수(activation function)가 수행하는 역할로 가장 적절한 것은 무엇인가요?",
    choices: ["모델이 과적합을 방지하도록 하는 것", "비선형성을 도입하여 복잡한 패턴을 학습하게 하는 것", "입력 데이터를 정규화하는 것", "데이터 파일을 불러오는 것"],
    answer: 1,
    explanation: "활성화 함수는 뉴런에 비선형성을 더해 모델이 복잡한 패턴을 학습할 수 있게 합니다."
  },
  {
    topic: "생성형 AI",
    text: "LLM에서 '프롬프트(prompt)'란 무엇을 의미하나요?",
    choices: ["모델에게 전달하여 결과를 유도하는 입력 문장", "모델 내부의 가중치 값", "학습 데이터를 저장하는 파일", "추론 속도를 의미하는 지표"],
    answer: 0,
    explanation: "프롬프트는 LLM에게 원하는 출력을 유도하기 위해 입력으로 주는 문장입니다."
  },
  {
    topic: "생성형 AI",
    text: "RAG(Retrieval-Augmented Generation)의 핵심 아이디어는 무엇인가요?",
    choices: ["검색된 외부 지식을 활용해 응답을 생성하는 것", "모델을 작은 크기로 압축하는 것", "데이터셋을 랜덤하게 섞는 것", "훈련 중 과적합을 방지하는 기법"],
    answer: 0,
    explanation: "RAG는 검색된 지식을 결합해 더 정확하고 최신의 응답을 생성하는 방법입니다."
  }
];

const questionNumberElement = document.getElementById("question-number");
const questionTextElement = document.getElementById("question-text");
const choicesContainer = document.getElementById("choices");
const feedbackElement = document.getElementById("feedback");
const statusElement = document.getElementById("status");
const nextButton = document.getElementById("next-button");
const resultBox = document.getElementById("result-box");
const quizBox = document.getElementById("quiz-box");
const resultSummary = document.getElementById("result-summary");
const restartButton = document.getElementById("restart-button");

let currentIndex = 0;
let score = 0;
let answered = false;

function startQuiz() {
  currentIndex = 0;
  score = 0;
  answered = false;
  resultBox.classList.add("hidden");
  quizBox.classList.remove("hidden");
  feedbackElement.textContent = "문제를 풀고 정답을 확인해보세요.";
  nextButton.textContent = "다음 문제";
  renderQuestion();
}

function renderQuestion() {
  const current = questions[currentIndex];
  questionNumberElement.textContent = `문제 ${currentIndex + 1} / ${questions.length} · 주제: ${current.topic}`;
  questionTextElement.textContent = current.text;
  choicesContainer.innerHTML = "";
  statusElement.textContent = `현재 점수: ${score}점`;
  feedbackElement.textContent = "문제를 풀고 정답을 확인해보세요.";
  answered = false;
  nextButton.disabled = true;
  nextButton.textContent = currentIndex === questions.length - 1 ? "결과 보기" : "다음 문제";

  current.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
    button.textContent = choice;
    button.addEventListener("click", () => handleChoice(index, button));
    choicesContainer.appendChild(button);
  });
}

function handleChoice(choiceIndex, button) {
  if (answered) return;
  answered = true;
  nextButton.disabled = false;
  const current = questions[currentIndex];
  const buttons = choicesContainer.querySelectorAll("button");

  buttons.forEach((btn, index) => {
    btn.disabled = true;
    if (index === current.answer) {
      btn.classList.add("correct");
    }
    if (index === choiceIndex && choiceIndex !== current.answer) {
      btn.classList.add("wrong");
    }
  });

  if (choiceIndex === current.answer) {
    score += 1;
    feedbackElement.innerHTML = `<strong>정답입니다!</strong>${current.explanation}`;
  } else {
    feedbackElement.innerHTML = `<strong>오답입니다.</strong>정답은 "${current.choices[current.answer]}" 입니다.<br>${current.explanation}`;
  }
}

function showResult() {
  quizBox.classList.add("hidden");
  resultBox.classList.remove("hidden");
  const rate = (score / questions.length) * 100;
  let grade = "AI 도전자";
  if (score >= 9) {
    grade = "AI 마스터";
  } else if (score >= 7) {
    grade = "AI 전문가";
  } else if (score >= 5) {
    grade = "AI 실력자";
  }
  resultSummary.innerHTML = `총 ${questions.length}문제 중 ${score}문제 정답!<br>점수: ${rate.toFixed(0)}%<br>등급: ${grade}`;
}

nextButton.addEventListener("click", () => {
  if (!answered) return;
  currentIndex += 1;
  if (currentIndex < questions.length) {
    renderQuestion();
  } else {
    showResult();
  }
});

restartButton.addEventListener("click", startQuiz);

startQuiz();
