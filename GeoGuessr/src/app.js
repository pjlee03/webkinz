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

    currentRound = locations[Math.floor(Math.random() * locations.length)];

    document.getElementById("animal-image").src = currentRound.imageUrl;
    document.getElementById("zoo-label").textContent = "Guess the location of this animal!";
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
}

// ------------------------------
// EVENT LISTENERS
// ------------------------------
document.getElementById("submit-guess").addEventListener("click", submitGuess);
document.getElementById("play-again").addEventListener("click", startRound);

// ------------------------------
// INITIALIZE
// ------------------------------
window.onload = function () {
    initMap(handleMapClick);
    startRound();
};