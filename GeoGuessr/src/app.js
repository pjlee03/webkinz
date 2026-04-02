import { locations } from "./data.js";
import {
    initMap,
    placeUserGuessMarker,
    showActualLocation,
    drawLineBetweenPoints,
    fitBound,
    resetMap
} from "./map.js";

// ------------------------------
// STATE
// ------------------------------
let selectedLocation = null;
let currentRound = null;
let totalScore = 0;
let activeRound = true;

let gameMode = "classic";       // "classic" | "challenge" | "timed"
const CHALLENGE_TOTAL_ROUNDS = 5;
let challengeRound = 0;
let challengeResults = [];
let countDownTime = 60;
let timerInterval = null;
let mapInitialized = false;

// ------------------------------
// MODE SELECTION 
// ------------------------------
function selectMode(mode) {
    gameMode = mode;
    totalScore = 0;
    challengeRound = 0;
    challengeResults = [];
    countDownTime = 60;

    document.getElementById("mode-select").style.display = "none";
    document.getElementById("game-layout").style.display = "block";
    const countDownElement = document.getElementById('countdown-display');

    if (!mapInitialized) {
        initMap(handleMapClick);
        mapInitialized = true;
    }

    const playAgainBtn = document.getElementById("play-again");
    playAgainBtn.style.display = mode === "classic" ? "inline-block" : "none";

    clearInterval(timerInterval);

    if (mode === "timed") {
        countDownElement.style.display = "inline-block";
        countDownElement.textContent = countDownTime + ' seconds remaining';
        
        timerInterval = setInterval(function() {
            countDownTime--;
            countDownElement.textContent = countDownTime + ' seconds remaining';
            
            if (countDownTime <= 0) {
                clearInterval(timerInterval);
                activeRound = false;
                showScorecard();
            }
        }, 1000);
    } else {
        if (countDownElement) countDownElement.style.display = "none";
    }
    
    startRound();
}

// ------------------------------
// MAP CLICK HANDLER
// ------------------------------
function handleMapClick(e) {
    if (!activeRound) return;

    const { lat, lng } = e.latlng;
    selectedLocation = { latitude: lat, longitude: lng };
    placeUserGuessMarker(lat, lng);
}

// ------------------------------
// GAME LOGIC
// ------------------------------
function startRound() {
    activeRound = true;
    selectedLocation = null;
    resetMap();

    if (gameMode === "challenge") {
        challengeRound += 1;
        document.getElementById("round-counter").textContent = `Round ${challengeRound} / ${CHALLENGE_TOTAL_ROUNDS}`;
        document.getElementById("next-round").style.display = "none";
    } else if (gameMode === "timed") {
        document.getElementById("next-round").style.display = "none";
    }
    else {
        document.getElementById("round-counter").textContent = "";
    }

    currentRound = locations[Math.floor(Math.random() * locations.length)];

    document.getElementById("animal-image").src = currentRound.imageUrl;
    document.getElementById("zoo-label").textContent = "Guess the Zoo location of this animal!";
    document.getElementById("result").textContent = "";
    document.getElementById("score").textContent = "";
    document.getElementById("fun-fact").textContent = "";
}

// ------------------------------
// DISTANCE + SCORING
// ------------------------------
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateScore(distance) {
    const maxScore = 5000;
    return Math.max(0, Math.round(maxScore * Math.exp(-distance / 20000)));
}

// ------------------------------
// SUBMIT GUESS
// ------------------------------
function submitGuess() {
    if (!selectedLocation) {
        alert("Please click on the map to make a guess!");
        return;
    }
    activeRound = false;

    const correctLat = currentRound.latitude;
    const correctLon = currentRound.longitude;

    const distance = calculateDistance(
        selectedLocation.latitude,
        selectedLocation.longitude,
        correctLat,
        correctLon
    );

    const roundScore = calculateScore(distance);
    totalScore += roundScore;

    // Show actual location, draw line, fit bounds
    showActualLocation(correctLat, correctLon, `Actual Location: ${currentRound.zooName}`);
    drawLineBetweenPoints(selectedLocation, { latitude: correctLat, longitude: correctLon });
    fitBound();

    // Update UI
    document.getElementById("result").textContent =
        `You were ${distance.toFixed(2)} km away from ${currentRound.zooName}!`;
    document.getElementById("score").textContent =
        `Round Score: ${roundScore} | Total Score: ${totalScore}`;
    document.getElementById("fun-fact").textContent =
        `Fun Fact: ${currentRound.funFact}`;
    document.getElementById("zoo-label").textContent =
        `Actual Location: ${currentRound.zooName}`;

    if (gameMode === "challenge") {
        challengeResults.push({
            round: challengeRound,
            animal: currentRound.animal,
            zooName: currentRound.zooName,
            distance: distance.toFixed(2),
            score: roundScore,
        });
        if (challengeRound >= CHALLENGE_TOTAL_ROUNDS) {
            // small delay to let user see last round results before showing scorecard
            setTimeout(showScorecard, 2000);
        } else {
            document.getElementById("next-round").style.display = "inline-block";
        }
    } else if (gameMode === "timed") {
        challengeResults.push({
            round: challengeResults.length + 1,
            animal: currentRound.animal,
            zooName: currentRound.zooName,
            distance: distance.toFixed(2),
            score: roundScore,
        });

        if (countDownTime > 0) {
            document.getElementById("next-round").style.display = "inline-block";
        }
    }
}

// ------------------------------
// CHALLENGE MODE SCORECARD
// ------------------------------
function showScorecard() {
    document.getElementById("game-layout").style.display = "none";

    const tbody = document.getElementById("scorecard-body");
    tbody.innerHTML = "";

    for (const r of challengeResults) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${r.round}</td>
            <td>${r.animal}</td>
            <td>${r.zooName}</td>
            <td>${r.distance}</td>
            <td>${r.score}</td>
        `;
        tbody.appendChild(tr);
    }
    document.getElementById("scorecard-total").textContent = totalScore;
    document.getElementById("scorecard").style.display = "flex";
}

// ------------------------------
// EVENT LISTENERS
// ------------------------------
document.getElementById("btn-classic").addEventListener("click", () => selectMode("classic"));
document.getElementById("btn-challenge").addEventListener("click", () => selectMode("challenge"));
document.getElementById("btn-timed").addEventListener("click", () => selectMode("timed"));
document.getElementById("submit-guess").addEventListener("click", submitGuess);
document.getElementById("play-again").addEventListener("click", startRound);
document.getElementById("next-round").addEventListener("click", startRound);
document.getElementById("play-again-scorecard").addEventListener("click", () => {
    document.getElementById("scorecard").style.display = "none";
    document.getElementById("mode-select").style.display = "flex";
});

// ------------------------------
// INITIALIZE
// ------------------------------
window.onload = function () {};