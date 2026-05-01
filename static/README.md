# Species Guessing Game

Browser-based species quiz with multi-round progression, fuzzy guess checking, hint tradeoffs, and persistent leaderboard scores.

## What Changed

- Sessions now run for 5, 8, or 10 animals depending on mode.
- The round loop now ends in a real Game Over summary instead of resetting forever.
- Difficulty tiers now change gameplay through blur speed, selection bias, and guess strictness.
- Guess validation now uses partial matching plus similarity checks instead of exact-string-only comparisons.
- Hints are controlled and cost score.
- Leaderboard scores and best streaks persist in `localStorage`.
- Speed Run uses a seeded daily deck so the same animal order can be compared across players.

## Modes

- Classic: 8 rounds, retries allowed, balanced scoring.
- Sudden Death: 5 rounds, one wrong guess can end the run.
- Speed Run: 10 rounds, daily seeded deck, fastest completion matters.

## Difficulty Tiers

- Easy: slower blur removal, more obvious species, lenient matching.
- Medium: baseline behavior.
- Hard: faster blur, more obscure species, stricter matching.

## Scoring

The round score now combines time remaining, streak bonuses, no-hint bonuses, and penalties for wrong guesses and hint usage.

## Game Flow

1. Select a difficulty and mode on `mode-select.html`.
2. Play through the full session on `index.html`.
3. Use hints sparingly to trade score for clarity.
4. Review the final score and leaderboard on the Game Over screen.
5. Restart the same session or return to mode select.

## Hints

- Reveal habitat
- Reveal category
- First letter

Each hint reveals useful information and reduces the final round score.

## Persistence

- Top scores are stored per mode + difficulty pair.
- The overall top 5 leaderboard is stored locally.
- Best streak is stored locally.

## Files

- `index.html` - gameplay layout
- `mode-select.html` - mode and difficulty selection
- `src/game.js` - main game controller and data
- `src/styles.css` - game UI styling

## Testing Strategy

Recommended checks for grading or future automation:

- Guess validation: exact match, partial match, and fuzzy similarity cases.
- Scoring: no-hint bonus, streak bonus, wrong guess penalty, hint penalty.
- Timer behavior: blur progression, timeouts, and round transitions.
- Session flow: end-of-session Game Over state, restart, and leaderboard updates.

## Data Notes

The current library contains 30 species entries. Ten use local photo assets and the rest use generated fallback art so the session system can still support a larger dataset without requiring new image files.
