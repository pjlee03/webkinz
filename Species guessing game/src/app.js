const GAME_DURATION_SECONDS = 60;
const MAX_BLUR_PIXELS = 24;
const IMAGE_LOAD_DELAY_MS = 2000;

const animalLibrary = [
  {
    speciesName: "Giant Panda",
    acceptedGuesses: ["giant panda", "panda"],
    difficultyMultiplier: 2,
    imageUrl: "animal_images/giant-panda.jpg",
    funFact: "Giant pandas spend most of their day eating bamboo and can consume over 25 pounds daily."
  },
  {
    speciesName: "Asian Elephant",
    acceptedGuesses: ["asian elephant", "elephant"],
    difficultyMultiplier: 2,
    imageUrl: "animal_images/asian-elephant.jpg",
    funFact: "Asian elephants have smaller ears than African elephants and are highly social animals."
  },
  {
    speciesName: "African Lion",
    acceptedGuesses: ["african lion", "lion"],
    difficultyMultiplier: 1,
    imageUrl: "animal_images/african-lion.jpg",
    funFact: "A lion’s roar can be heard up to five miles away."
  },
  {
    speciesName: "Manatee",
    acceptedGuesses: ["manatee", "florida manatee"],
    difficultyMultiplier: 2,
    imageUrl: "animal_images/Manatee.JPG",
    funFact: "Manatees are herbivores and can eat about 10% of their body weight in plants each day."
  },
  {
    speciesName: "Florida Panther",
    acceptedGuesses: ["florida panther", "panther"],
    difficultyMultiplier: 3,
    imageUrl: "animal_images/florida-panther.jpg",
    funFact: "The Florida panther is one of the most endangered mammals in North America."
  },
  {
    speciesName: "Southern White Rhino",
    acceptedGuesses: ["southern white rhino", "white rhino", "rhino"],
    difficultyMultiplier: 2,
    imageUrl: "animal_images/Pilanesberg_Rhino.JPG",
    funFact: "Southern white rhinos are the larger of the two African rhino species."
  },
  {
    speciesName: "Brown Bear",
    acceptedGuesses: ["brown bear", "katmai brown bear", "bear"],
    difficultyMultiplier: 2,
    imageUrl: "animal_images/brown-bear.jpg",
    funFact: "Katmai brown bears are famous for fishing salmon during seasonal runs."
  },
  {
    speciesName: "Bald Eagle",
    acceptedGuesses: ["bald eagle", "eagle"],
    difficultyMultiplier: 1,
    imageUrl: "animal_images/bald-eagle.jpg",
    funFact: "Bald eagles build some of the largest nests of any bird in North America."
  },
  {
    speciesName: "Gray Wolf",
    acceptedGuesses: ["gray wolf", "grey wolf", "wolf"],
    difficultyMultiplier: 2,
    imageUrl: "animal_images/gray-wolf.jpeg",
    funFact: "Gray wolves communicate with body language, scent marking, and howling."
  },
  {
    speciesName: "Koala",
    acceptedGuesses: ["koala"],
    difficultyMultiplier: 1,
    imageUrl: "animal_images/koala.jpg",
    funFact: "Koalas sleep up to 18-20 hours a day to conserve energy from their low-calorie eucalyptus diet."
  }
];

const animalImageElement = document.getElementById("animal-image");
const timeLeftElement = document.getElementById("time-left");
const difficultyLabelElement = document.getElementById("difficulty-label");
const guessInputElement = document.getElementById("guess-input");
const submitGuessButton = document.getElementById("submit-guess");
const playAgainButton = document.getElementById("play-again");
const statusMessageElement = document.getElementById("status-message");
const factInlineElement = document.getElementById("fact-inline");
const roundScoreElement = document.getElementById("round-score");
const totalScoreElement = document.getElementById("total-score");
const factDialogElement = document.getElementById("fact-dialog");
const factTextElement = document.getElementById("fact-text");
const closeFactButton = document.getElementById("close-fact");
const imagePanelElement = document.querySelector(".image-panel");

let currentAnimalSpecies = null;
let remainingSeconds = GAME_DURATION_SECONDS;
let totalScore = 0;
let currentRoundScore = 0;
let gameTimerIdentifier = null;
let imageLoadDelayTimeoutId = null;
let roundIsOver = false;

function loadRandomAnimalImage() {
  const randomAnimal = animalLibrary[Math.floor(Math.random() * animalLibrary.length)];
  currentAnimalSpecies = randomAnimal;

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
    animalImageElement.src = randomAnimal.imageUrl;
    imageLoadDelayTimeoutId = null;
  }, IMAGE_LOAD_DELAY_MS);
  difficultyLabelElement.textContent = `Difficulty: ${randomAnimal.difficultyMultiplier}x`;
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
}

function revealFullImage() {
  animalImageElement.style.filter = "blur(0px)";
}

function showFunFactForCurrentSpecies() {
  const speciesFactMessage = currentAnimalSpecies.funFact;

  if (factInlineElement) {
    factInlineElement.textContent = `Fun fact: ${speciesFactMessage}`;
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
  return secondsLeft * difficultyMultiplier;
}

function endRoundWithReveal(finalMessage) {
  roundIsOver = true;
  clearInterval(gameTimerIdentifier);
  revealFullImage();
  statusMessageElement.textContent = finalMessage;
}

function runUnblurCountdown() {
  clearInterval(gameTimerIdentifier);

  gameTimerIdentifier = setInterval(() => {
    if (roundIsOver) {
      clearInterval(gameTimerIdentifier);
      return;
    }

    remainingSeconds -= 1;

    const blurRatio = remainingSeconds / GAME_DURATION_SECONDS;
    const currentBlurPixels = Math.max(0, Math.round(MAX_BLUR_PIXELS * blurRatio));
    animalImageElement.style.filter = `blur(${currentBlurPixels}px)`;

    timeLeftElement.textContent = `${Math.max(0, remainingSeconds)}s`;

    if (remainingSeconds <= 0) {
      currentRoundScore = 0;
      updateScoreDisplay();
      endRoundWithReveal(`Time is up! The species was ${currentAnimalSpecies.speciesName}.`);
    }
  }, 1000);
}

function checkGuess() {
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
    endRoundWithReveal(`Correct! It is ${currentAnimalSpecies.speciesName}.`);
    showFunFactForCurrentSpecies();
    return;
  }

  statusMessageElement.textContent = "Not quite. Keep guessing while the image gets clearer.";
}

function resetForNextRound() {
  clearInterval(gameTimerIdentifier);
  if (imageLoadDelayTimeoutId) {
    clearTimeout(imageLoadDelayTimeoutId);
    imageLoadDelayTimeoutId = null;
  }
  remainingSeconds = GAME_DURATION_SECONDS;
  currentRoundScore = 0;
  roundIsOver = false;

  timeLeftElement.textContent = `${remainingSeconds}s`;
  statusMessageElement.textContent = "Start guessing before the image clears.";
  if (factInlineElement) {
    factInlineElement.textContent = "";
  }
  guessInputElement.value = "";

  loadRandomAnimalImage();
  updateScoreDisplay();
}

submitGuessButton.addEventListener("click", checkGuess);
playAgainButton.addEventListener("click", resetForNextRound);
closeFactButton.addEventListener("click", () => {
  if (factDialogElement && typeof factDialogElement.close === "function" && factDialogElement.open) {
    factDialogElement.close();
  }
});

guessInputElement.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    checkGuess();
  }
});

resetForNextRound();
