const GAME_DURATION_SECONDS = 60;
const TIME_TRIAL_DURATION_SECONDS = 90;
const TIME_TRIAL_ANIMAL_TARGET = 5;
const MAX_BLUR_PIXELS = 24;
const IMAGE_LOAD_DELAY_MS = 2000;
const HINT_PENALTY_RATE = 0.1;
const STORAGE_KEY_NORMAL_HIGH = "speciesGame_highScore_normal";
const STORAGE_KEY_TIME_TRIAL_HIGH = "speciesGame_highScore_timeTrials";

const animalLibrary = [
  {
    speciesName: "Giant Panda",
    acceptedGuesses: ["giant panda", "panda"],
    difficultyMultiplier: 2,
    imageUrl: "animal_images/giant-panda.jpg",
    funFact: "Giant pandas spend most of their day eating bamboo and can consume over 25 pounds daily.",
    hints: [
      "Habitat: Mountain forests of central China",
      "Distinctive feature: Black eye patches and a round body",
      "Diet: Mostly bamboo and eats for many hours each day"
    ]
  },
  {
    speciesName: "Asian Elephant",
    acceptedGuesses: ["asian elephant", "elephant"],
    difficultyMultiplier: 2,
    imageUrl: "animal_images/asian-elephant.jpg",
    funFact: "Asian elephants have smaller ears than African elephants and are highly social animals.",
    hints: [
      "Region: South and Southeast Asia",
      "Distinctive feature: Smaller ears compared with its African relative",
      "Behavior: Lives in social herds and uses a trunk for many tasks"
    ]
  },
  {
    speciesName: "African Lion",
    acceptedGuesses: ["african lion", "lion"],
    difficultyMultiplier: 1,
    imageUrl: "animal_images/african-lion.jpg",
    funFact: "A lion’s roar can be heard up to five miles away.",
    hints: [
      "Habitat: Grasslands and savannas",
      "Distinctive feature: Males often have a large mane",
      "Behavior: Lives in prides and hunts cooperatively"
    ]
  },
  {
    speciesName: "Manatee",
    acceptedGuesses: ["manatee", "florida manatee"],
    difficultyMultiplier: 2,
    imageUrl: "animal_images/Manatee.JPG",
    funFact: "Manatees are herbivores and can eat about 10% of their body weight in plants each day.",
    hints: [
      "Habitat: Warm coastal and river waters",
      "Distinctive feature: Rounded paddle-shaped tail",
      "Diet: Slow-moving herbivore often called a sea cow"
    ]
  },
  {
    speciesName: "Florida Panther",
    acceptedGuesses: ["florida panther", "panther"],
    difficultyMultiplier: 3,
    imageUrl: "animal_images/florida-panther.jpg",
    funFact: "The Florida panther is one of the most endangered mammals in North America.",
    hints: [
      "Region: South Florida forests and swamps",
      "Distinctive feature: A large tan wild cat with a long tail",
      "Behavior: Solitary and mostly active at dawn and dusk"
    ]
  },
  {
    speciesName: "Southern White Rhino",
    acceptedGuesses: ["southern white rhino", "white rhino", "rhino"],
    difficultyMultiplier: 2,
    imageUrl: "animal_images/Pilanesberg_Rhino.JPG",
    funFact: "Southern white rhinos are the larger of the two African rhino species.",
    hints: [
      "Habitat: Grasslands in southern Africa",
      "Distinctive feature: Two horns and a wide square-shaped mouth",
      "Behavior: Grazes on grasses in open plains"
    ]
  },
  {
    speciesName: "Brown Bear",
    acceptedGuesses: ["brown bear", "katmai brown bear", "bear"],
    difficultyMultiplier: 2,
    imageUrl: "animal_images/brown-bear.jpg",
    funFact: "Katmai brown bears are famous for fishing salmon during seasonal runs.",
    hints: [
      "Habitat: Forests and mountains in northern regions",
      "Distinctive feature: Large body with a shoulder hump",
      "Behavior: Often seen catching salmon in rivers"
    ]
  },
  {
    speciesName: "Bald Eagle",
    acceptedGuesses: ["bald eagle", "eagle"],
    difficultyMultiplier: 1,
    imageUrl: "animal_images/bald-eagle.jpg",
    funFact: "Bald eagles build some of the largest nests of any bird in North America.",
    hints: [
      "Region: North America near lakes and rivers",
      "Distinctive feature: White head and tail with a dark body",
      "Behavior: Powerful bird of prey and national symbol of the United States"
    ]
  },
  {
    speciesName: "Gray Wolf",
    acceptedGuesses: ["gray wolf", "grey wolf", "wolf"],
    difficultyMultiplier: 2,
    imageUrl: "animal_images/gray-wolf.jpeg",
    funFact: "Gray wolves communicate with body language, scent marking, and howling.",
    hints: [
      "Habitat: Forests, tundra, and grasslands",
      "Distinctive feature: Thick coat and long muzzle",
      "Behavior: Hunts in packs and communicates by howling"
    ]
  },
  {
    speciesName: "Koala",
    acceptedGuesses: ["koala"],
    difficultyMultiplier: 1,
    imageUrl: "animal_images/koala.jpg",
    funFact: "Koalas sleep up to 18-20 hours a day to conserve energy from their low-calorie eucalyptus diet.",
    hints: [
      "Region: Eucalyptus forests in Australia",
      "Distinctive feature: Fuzzy ears and large nose",
      "Diet: Mostly eucalyptus leaves and rests for much of the day"
    ]
  }
];

const animalImageElement = document.getElementById("animal-image");
const timeLeftElement = document.getElementById("time-left");
const difficultyLabelElement = document.getElementById("difficulty-label");
const guessInputElement = document.getElementById("guess-input");
const submitGuessButton = document.getElementById("submit-guess");
const showHintButton = document.getElementById("show-hint");
const playAgainButton = document.getElementById("play-again");
const statusMessageElement = document.getElementById("status-message");
const hintPanelElement = document.getElementById("hint-panel");
const factInlineElement = document.getElementById("fact-inline");
const homeButton = document.getElementById("home-button");
const animalProgressElement = document.getElementById("animal-progress");
const summaryPanelElement = document.getElementById("summary-panel");
const summaryMessageElement = document.getElementById("summary-message");
const roundScoreElement = document.getElementById("round-score");
const totalScoreElement = document.getElementById("total-score");
const highScoreElement = document.getElementById("high-score");
const normalHighScoreElement = document.getElementById("normal-high-score");
const timeTrialsHighScoreElement = document.getElementById("time-trials-high-score");
const resetHighScoreButton = document.getElementById("reset-high-score");
const factDialogElement = document.getElementById("fact-dialog");
const factTextElement = document.getElementById("fact-text");
const closeFactButton = document.getElementById("close-fact");
const imagePanelElement = document.querySelector(".image-panel");

let currentMode = null;
let currentAnimalSpecies = null;
let remainingSeconds = GAME_DURATION_SECONDS;
let totalScore = 0;
let currentRoundScore = 0;
let gameTimerIdentifier = null;
let imageLoadDelayTimeoutId = null;
let roundIsOver = true;
let sessionIsActive = false;
let trialAnimalsQueue = [];
let trialAnimalIndex = 0;
let hintsUsedForCurrentAnimal = 0;

const storedHighScores = {
  normal: Number.parseInt(window.localStorage.getItem(STORAGE_KEY_NORMAL_HIGH) || "0", 10) || 0,
  timeTrials: Number.parseInt(window.localStorage.getItem(STORAGE_KEY_TIME_TRIAL_HIGH) || "0", 10) || 0
};

function getCurrentSessionDuration() {
  return currentMode === "timeTrials" ? TIME_TRIAL_DURATION_SECONDS : GAME_DURATION_SECONDS;
}

function getCurrentModeHighScore() {
  if (currentMode === "timeTrials") {
    return storedHighScores.timeTrials;
  }
  return storedHighScores.normal;
}

function saveCurrentModeHighScoreIfNeeded() {
  if (!currentMode) {
    return false;
  }

  const currentModeHighScore = getCurrentModeHighScore();
  if (totalScore <= currentModeHighScore) {
    return false;
  }

  if (currentMode === "timeTrials") {
    storedHighScores.timeTrials = totalScore;
    window.localStorage.setItem(STORAGE_KEY_TIME_TRIAL_HIGH, String(totalScore));
  } else {
    storedHighScores.normal = totalScore;
    window.localStorage.setItem(STORAGE_KEY_NORMAL_HIGH, String(totalScore));
  }

  refreshHighScoreDisplay();
  highScoreElement.classList.remove("new-record");
  void highScoreElement.offsetWidth;
  highScoreElement.classList.add("new-record");
  return true;
}

function refreshHighScoreDisplay() {
  normalHighScoreElement.textContent = String(storedHighScores.normal);
  timeTrialsHighScoreElement.textContent = String(storedHighScores.timeTrials);
  highScoreElement.textContent = String(getCurrentModeHighScore());
}

function updatePreviousBestText() {
  const previousBestElement = document.getElementById("previous-best");
  if (!previousBestElement) {
    return;
  }

  if (currentMode === "timeTrials") {
    previousBestElement.textContent = `Previous Best: ${storedHighScores.timeTrials}`;
    return;
  }

  if (currentMode === "normal") {
    previousBestElement.textContent = `Previous Best: ${storedHighScores.normal}`;
    return;
  }

  previousBestElement.textContent = `Previous Best - Normal: ${storedHighScores.normal} | Time Trials: ${storedHighScores.timeTrials}`;
}

function setGameplayControlsEnabled(isEnabled) {
  guessInputElement.disabled = !isEnabled;
  submitGuessButton.disabled = !isEnabled;
  showHintButton.disabled = !isEnabled;
}

function updateTimeLabel() {
  const clampedSeconds = Math.max(0, remainingSeconds);
  if (currentMode === "timeTrials") {
    timeLeftElement.textContent = `Global Time: ${clampedSeconds}s`;
    return;
  }
  timeLeftElement.textContent = `${clampedSeconds}s`;
}

function updateAnimalProgress() {
  if (currentMode === "timeTrials") {
    animalProgressElement.textContent = `Animal ${trialAnimalIndex + 1} of ${trialAnimalsQueue.length}`;
    return;
  }
  animalProgressElement.textContent = "Animal 1 of 1";
}

function updateImageBlurFromRemainingTime() {
  const blurRatio = remainingSeconds / getCurrentSessionDuration();
  const currentBlurPixels = Math.max(0, Math.round(MAX_BLUR_PIXELS * blurRatio));
  animalImageElement.style.filter = `blur(${currentBlurPixels}px)`;
}

function buildTimeTrialsQueue() {
  const shuffledAnimals = [...animalLibrary].sort(() => Math.random() - 0.5);
  return shuffledAnimals.slice(0, Math.min(TIME_TRIAL_ANIMAL_TARGET, animalLibrary.length));
}

function getAnimalForCurrentRound() {
  if (currentMode === "timeTrials") {
    return trialAnimalsQueue[trialAnimalIndex] || null;
  }
  return animalLibrary[Math.floor(Math.random() * animalLibrary.length)];
}

function resetHintsForCurrentAnimal() {
  hintsUsedForCurrentAnimal = 0;
  hintPanelElement.textContent = "Hints will appear here.";
  showHintButton.disabled = !sessionIsActive;
  showHintButton.textContent = "Hint";
}

function loadAnimalImageForCurrentRound() {
  const selectedAnimal = getAnimalForCurrentRound();
  if (!selectedAnimal) {
    return;
  }

  currentAnimalSpecies = selectedAnimal;
  updateAnimalProgress();
  resetHintsForCurrentAnimal();

  if (imageLoadDelayTimeoutId) {
    clearTimeout(imageLoadDelayTimeoutId);
    imageLoadDelayTimeoutId = null;
  }

  if (imagePanelElement) {
    imagePanelElement.classList.add("is-loading");
  }

  statusMessageElement.textContent = "Loading mystery animal...";
  animalImageElement.alt = "Loading mystery animal...";
  animalImageElement.style.transition = "none";
  animalImageElement.style.filter = `blur(${MAX_BLUR_PIXELS}px)`;
  animalImageElement.style.opacity = "0";

  animalImageElement.onload = () => {
    animalImageElement.alt = "Mystery animal";
    if (imagePanelElement) {
      imagePanelElement.classList.remove("is-loading");
    }
    if (!roundIsOver && statusMessageElement.textContent === "Loading mystery animal...") {
      statusMessageElement.textContent = "Start guessing before the image clears.";
    }
    animalImageElement.style.opacity = "1";
    animalImageElement.style.transition = "filter 0.5s linear";
    runUnblurCountdown();
  };

  animalImageElement.onerror = () => {
    animalImageElement.alt = "Mystery animal image failed to load";
    if (imagePanelElement) {
      imagePanelElement.classList.remove("is-loading");
    }
    statusMessageElement.textContent = "Could not load the image. Click Play Again to try another animal.";
  };

  imageLoadDelayTimeoutId = window.setTimeout(() => {
    animalImageElement.src = selectedAnimal.imageUrl;
    imageLoadDelayTimeoutId = null;
  }, IMAGE_LOAD_DELAY_MS);
  difficultyLabelElement.textContent = `Difficulty: ${selectedAnimal.difficultyMultiplier}x`;
}

function normalizeGuess(userGuessText) {
  return userGuessText.toLowerCase().trim();
}

function isValidGuessInput(userGuessText) {
  return /^[a-z\s'-]{2,40}$/i.test(userGuessText.trim());
}

function updateScoreDisplay() {
  roundScoreElement.textContent = String(currentRoundScore);
  totalScoreElement.textContent = String(totalScore);

  if (sessionIsActive && saveCurrentModeHighScoreIfNeeded()) {
    statusMessageElement.textContent = "New Record! Keep going.";
  }
}

function revealFullImage() {
  animalImageElement.style.filter = "blur(0px)";
}

function showFunFactForCurrentSpecies() {
  if (!currentAnimalSpecies) {
    return;
  }

  const speciesFactMessage = currentAnimalSpecies.funFact;

  if (factInlineElement) {
    factInlineElement.textContent = `Fun fact: ${speciesFactMessage}`;
  }

  if (currentMode === "timeTrials") {
    return;
  }

  if (!factDialogElement || !factTextElement) {
    statusMessageElement.textContent = `Fun fact: ${speciesFactMessage}`;
    window.alert(`Fun fact: ${speciesFactMessage}`);
    return;
  }

  factTextElement.textContent = currentAnimalSpecies.funFact;

  if (typeof factDialogElement.showModal === "function") {
    try {
      if (factDialogElement.open) {
        factDialogElement.close();
      }
      factDialogElement.showModal();
      return;
    } catch (error) {
      statusMessageElement.textContent = `Fun fact: ${speciesFactMessage}`;
      window.alert(`Fun fact: ${speciesFactMessage}`);
      return;
    }
  }

  statusMessageElement.textContent = `Fun fact: ${speciesFactMessage}`;
  window.alert(`Fun fact: ${speciesFactMessage}`);
}

function calculateRoundScore(secondsLeft, difficultyMultiplier) {
  const baseScore = secondsLeft * difficultyMultiplier;
  const penaltyHintCount = Math.max(0, hintsUsedForCurrentAnimal - 1);
  const scoreMultiplier = Math.max(0, 1 - penaltyHintCount * HINT_PENALTY_RATE);
  return Math.round(baseScore * scoreMultiplier);
}

function endRoundWithReveal(finalMessage) {
  roundIsOver = true;
  revealFullImage();
  statusMessageElement.textContent = finalMessage;
}

function finishSession(summaryMessage) {
  sessionIsActive = false;
  roundIsOver = true;
  clearInterval(gameTimerIdentifier);
  gameTimerIdentifier = null;
  setGameplayControlsEnabled(false);

  const isNewRecord = saveCurrentModeHighScoreIfNeeded();
  const newRecordMessage = isNewRecord ? " New Record!" : "";
  summaryMessageElement.textContent = `${summaryMessage} Final score: ${totalScore}.${newRecordMessage}`;
  summaryPanelElement.hidden = false;
}

function endSessionFromTimeout() {
  const revealedSpeciesName = currentAnimalSpecies ? currentAnimalSpecies.speciesName : "Unknown";
  endRoundWithReveal(`Time is up! The species was ${revealedSpeciesName}.`);
  if (currentMode === "timeTrials") {
    finishSession("Time Trials over.");
    return;
  }
  finishSession("Normal mode over.");
}

function runUnblurCountdown() {
  clearInterval(gameTimerIdentifier);

  gameTimerIdentifier = setInterval(() => {
    if (roundIsOver || !sessionIsActive) {
      clearInterval(gameTimerIdentifier);
      return;
    }

    remainingSeconds -= 1;

    updateImageBlurFromRemainingTime();
    updateTimeLabel();

    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      currentRoundScore = 0;
      updateScoreDisplay();
      endSessionFromTimeout();
    }
  }, 1000);
}

function checkGuess() {
  if (!sessionIsActive) {
    statusMessageElement.textContent = "Choose a mode to start playing.";
    return;
  }

  if (roundIsOver) {
    statusMessageElement.textContent = "This round is over. Click Play Again.";
    return;
  }

  const userRawGuess = guessInputElement.value;

  if (!isValidGuessInput(userRawGuess)) {
    statusMessageElement.textContent = "Please enter a valid species name (letters, spaces, apostrophes, hyphens).";
    return;
  }

  const normalizedUserGuess = normalizeGuess(userRawGuess);
  const guessIsCorrect = currentAnimalSpecies.acceptedGuesses.includes(normalizedUserGuess);

  if (guessIsCorrect) {
    currentRoundScore = calculateRoundScore(remainingSeconds, currentAnimalSpecies.difficultyMultiplier);
    totalScore += currentRoundScore;
    updateScoreDisplay();

    if (currentMode === "timeTrials") {
      showFunFactForCurrentSpecies();
      trialAnimalIndex += 1;
      if (trialAnimalIndex >= trialAnimalsQueue.length) {
        endRoundWithReveal(`Correct! It is ${currentAnimalSpecies.speciesName}.`);
        finishSession("You identified all animals in Time Trials mode.");
        return;
      }

      statusMessageElement.textContent = `Correct! Next animal (${trialAnimalIndex + 1}/${trialAnimalsQueue.length}).`;
      guessInputElement.value = "";
      loadAnimalImageForCurrentRound();
      return;
    }

    endRoundWithReveal(`Correct! It is ${currentAnimalSpecies.speciesName}.`);
    showFunFactForCurrentSpecies();
    finishSession("Normal mode complete.");
    return;
  }

  statusMessageElement.textContent = "Not quite. Keep guessing while the image gets clearer.";
}

function showNextHint() {
  if (!sessionIsActive || roundIsOver || !currentAnimalSpecies) {
    return;
  }

  const availableHints = currentAnimalSpecies.hints || [];
  if (hintsUsedForCurrentAnimal >= availableHints.length) {
    showHintButton.disabled = true;
    showHintButton.textContent = "No more hints";
    return;
  }

  const nextHint = availableHints[hintsUsedForCurrentAnimal];
  hintsUsedForCurrentAnimal += 1;
  hintPanelElement.textContent = `Hint ${hintsUsedForCurrentAnimal}: ${nextHint}`;

  if (hintsUsedForCurrentAnimal === 1) {
    statusMessageElement.textContent = "First hint used (free).";
  } else {
    statusMessageElement.textContent = `Hint used. Score penalty: ${(hintsUsedForCurrentAnimal - 1) * 10}%.`;
  }

  if (hintsUsedForCurrentAnimal >= availableHints.length) {
    showHintButton.disabled = true;
    showHintButton.textContent = "No more hints";
  }
}

function goToModeSelectionPage() {
  window.location.href = "mode-select.html";
}

function startSession(modeName) {
  currentMode = modeName;
  sessionIsActive = true;
  roundIsOver = false;
  totalScore = 0;
  currentRoundScore = 0;
  remainingSeconds = modeName === "timeTrials" ? TIME_TRIAL_DURATION_SECONDS : GAME_DURATION_SECONDS;

  if (modeName === "timeTrials") {
    trialAnimalsQueue = buildTimeTrialsQueue();
    trialAnimalIndex = 0;
  } else {
    trialAnimalsQueue = [];
    trialAnimalIndex = 0;
  }

  summaryPanelElement.hidden = true;
  setGameplayControlsEnabled(true);
  showHintButton.textContent = "Hint";
  updateTimeLabel();
  updateAnimalProgress();
  refreshHighScoreDisplay();
  updatePreviousBestText();
  updateScoreDisplay();
  loadAnimalImageForCurrentRound();
}

function getModeFromUrl() {
  const searchParams = new URLSearchParams(window.location.search);
  const modeParam = searchParams.get("mode");
  if (modeParam === "normal" || modeParam === "timeTrials") {
    return modeParam;
  }
  return null;
}

submitGuessButton.addEventListener("click", checkGuess);
showHintButton.addEventListener("click", showNextHint);
playAgainButton.addEventListener("click", goToModeSelectionPage);
closeFactButton.addEventListener("click", () => {
  if (factDialogElement && typeof factDialogElement.close === "function" && factDialogElement.open) {
    factDialogElement.close();
  }
});

resetHighScoreButton.addEventListener("click", () => {
  window.localStorage.removeItem(STORAGE_KEY_NORMAL_HIGH);
  window.localStorage.removeItem(STORAGE_KEY_TIME_TRIAL_HIGH);
  storedHighScores.normal = 0;
  storedHighScores.timeTrials = 0;
  refreshHighScoreDisplay();
  updatePreviousBestText();
  statusMessageElement.textContent = "High scores reset.";
});

guessInputElement.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    checkGuess();
  }
});

const selectedMode = getModeFromUrl();
if (!selectedMode) {
  goToModeSelectionPage();
} else {
  startSession(selectedMode);
}

homeButton.addEventListener("click", () => {
  window.location.href = "../../index.html";
});
