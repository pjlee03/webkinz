# Species Guessing Game (demo)

Simple browser game: guess the animal before the blurred image becomes clear.

## Features

- 60-second blur-to-clear round
- Input validation for guesses
- Score based on time left and difficulty
- Random animal each round
- Fun fact shown on correct guess
- Short loading state on **Play Again** (message + spinner)

## Run

1. Open `index.html` in a browser.
2. Enter a guess, then click **Submit Guess** (or press Enter).
3. Click **Play Again** for a new round.

## Score Formula

`score = remaining_seconds * difficulty_multiplier`

## Files

- `index.html` — page layout
- `src/app.js` — game logic
- `src/styles.css` — styles and spinner
- `Animal images/` — image assets

## Note

Animal data is currently hardcoded in `src/app.js`.
