const STORAGE_KEY_HIGH_SCORES = "speciesGame_highScores_v2";
const STORAGE_KEY_LEADERBOARD = "speciesGame_leaderboard_v2";
const STORAGE_KEY_BEST_STREAK = "speciesGame_bestStreak_v2";
const STORAGE_KEY_LAST_DIFFICULTY = "speciesGame_lastDifficulty_v2";
const STORAGE_KEY_LAST_MODE = "speciesGame_lastMode_v2";

const MAX_BLUR_PIXELS = 28;
const TIMER_REFRESH_MS = 250;
const POST_ROUND_DELAY_MS = 1400;
const SESSION_ROUNDS = {
  classic: 8,
  suddenDeath: 5,
  speedRun: 10
};

const MODE_CONFIG = {
  classic: {
    label: "Classic",
    roundSeconds: 60,
    allowRetries: true,
    failOnWrongGuess: false,
    allowHints: true,
    hintTimeCostSeconds: 4,
    wrongGuessTimeCostSeconds: 2,
    blurSpeedMultiplier: 1,
    completionBonusPerRound: 18,
    perfectSessionBonus: 120,
    paceBonusFactor: 0.8,
    noHintSessionBonus: 60,
    dailySeededDeck: false,
    scoreScale: 1,
    sessionRounds: SESSION_ROUNDS.classic
  },
  suddenDeath: {
    label: "Sudden Death",
    roundSeconds: 28,
    allowRetries: false,
    failOnWrongGuess: true,
    allowHints: false,
    hintTimeCostSeconds: 0,
    wrongGuessTimeCostSeconds: 0,
    blurSpeedMultiplier: 1.25,
    completionBonusPerRound: 42,
    perfectSessionBonus: 180,
    paceBonusFactor: 1.5,
    noHintSessionBonus: 0,
    dailySeededDeck: false,
    scoreScale: 1.55,
    sessionRounds: SESSION_ROUNDS.suddenDeath
  },
  speedRun: {
    label: "Speed Run",
    roundSeconds: 42,
    allowRetries: true,
    failOnWrongGuess: false,
    allowHints: true,
    hintTimeCostSeconds: 7,
    wrongGuessTimeCostSeconds: 1,
    blurSpeedMultiplier: 0.9,
    completionBonusPerRound: 28,
    perfectSessionBonus: 260,
    paceBonusFactor: 2.2,
    noHintSessionBonus: 80,
    dailySeededDeck: true,
    scoreScale: 1.45,
    sessionRounds: SESSION_ROUNDS.speedRun
  }
};

const DIFFICULTY_CONFIG = {
  easy: {
    label: "Easy",
    guessThreshold: 0.72,
    blurExponent: 0.78,
    blurScale: 0.9,
    hintPenaltyRate: 0.08,
    wrongGuessPenalty: 6,
    streakBonus: 6,
    scoreBonus: 6,
    poolWeights: { easy: 4, medium: 2, hard: 1 }
  },
  medium: {
    label: "Medium",
    guessThreshold: 0.82,
    blurExponent: 1,
    blurScale: 1,
    hintPenaltyRate: 0.11,
    wrongGuessPenalty: 8,
    streakBonus: 10,
    scoreBonus: 10,
    poolWeights: { easy: 2, medium: 3, hard: 2 }
  },
  hard: {
    label: "Hard",
    guessThreshold: 0.9,
    blurExponent: 1.28,
    blurScale: 1.12,
    hintPenaltyRate: 0.14,
    wrongGuessPenalty: 12,
    streakBonus: 14,
    scoreBonus: 14,
    poolWeights: { easy: 1, medium: 2, hard: 4 }
  }
};

function normalizeText(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function levenshteinDistance(leftText, rightText) {
  const left = normalizeText(leftText);
  const right = normalizeText(rightText);

  if (left === right) {
    return 0;
  }

  if (!left.length) {
    return right.length;
  }

  if (!right.length) {
    return left.length;
  }

  const previousRow = Array.from({ length: right.length + 1 }, (_, index) => index);
  let currentRow = new Array(right.length + 1);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    currentRow[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      currentRow[rightIndex] = Math.min(
        previousRow[rightIndex] + 1,
        currentRow[rightIndex - 1] + 1,
        previousRow[rightIndex - 1] + substitutionCost
      );
    }

    for (let column = 0; column < previousRow.length; column += 1) {
      previousRow[column] = currentRow[column];
    }
  }

  return previousRow[right.length];
}

function similarityScore(leftText, rightText) {
  const left = normalizeText(leftText);
  const right = normalizeText(rightText);
  const longestLength = Math.max(left.length, right.length, 1);
  return 1 - levenshteinDistance(left, right) / longestLength;
}

function seedFromString(seedText) {
  let hash = 2166136261;
  const normalizedSeed = normalizeText(seedText);

  for (let index = 0; index < normalizedSeed.length; index += 1) {
    hash ^= normalizedSeed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function mulberry32(seed) {
  let value = seed >>> 0;
  return function nextRandom() {
    value += 0x6d2b79f5;
    let randomValue = Math.imul(value ^ (value >>> 15), 1 | value);
    randomValue ^= randomValue + Math.imul(randomValue ^ (randomValue >>> 7), 61 | randomValue);
    return ((randomValue ^ (randomValue >>> 14)) >>> 0) / 4294967296;
  };
}

function createFallbackAnimalImage(speciesName, accentA, accentB, motif) {
  const motifMarkup = {
    paw: `
      <circle cx="245" cy="235" r="34" />
      <circle cx="355" cy="175" r="26" />
      <circle cx="445" cy="175" r="26" />
      <circle cx="555" cy="235" r="34" />
      <ellipse cx="400" cy="340" rx="130" ry="95" />
    `,
    wing: `
      <path d="M170 305C240 210 335 170 470 160C610 150 695 210 730 310C630 290 540 300 470 345C410 385 330 405 240 395Z" />
      <path d="M250 360C360 250 500 225 650 260" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="18" stroke-linecap="round" />
    `,
    fin: `
      <path d="M190 380C255 250 385 165 555 180C645 188 705 245 722 330C650 315 580 322 510 360C450 392 350 420 250 420Z" />
      <path d="M460 170C470 120 540 92 600 110C644 122 674 156 680 198C620 176 548 178 486 198Z" />
    `,
    horn: `
      <ellipse cx="400" cy="350" rx="170" ry="120" />
      <path d="M290 230C300 170 320 110 360 90C400 110 418 168 426 230Z" />
      <path d="M476 230C486 170 506 110 546 90C586 110 604 168 612 230Z" />
    `,
    leaf: `
      <path d="M175 360C210 210 340 125 470 138C625 154 718 270 680 380C618 470 486 515 350 488C255 470 160 438 175 360Z" />
      <path d="M282 370C388 330 488 300 620 235" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="16" stroke-linecap="round" />
    `,
    shell: `
      <ellipse cx="400" cy="345" rx="170" ry="145" />
      <path d="M250 345C300 260 356 220 400 220C444 220 500 260 550 345C500 430 444 470 400 470C356 470 300 430 250 345Z" fill="rgba(255,255,255,0.2)" />
    `
  }[motif] || `
    <ellipse cx="400" cy="340" rx="180" ry="128" />
    <circle cx="275" cy="210" r="42" />
    <circle cx="525" cy="210" r="42" />
  `;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" role="img" aria-label="${speciesName}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${accentA}" />
          <stop offset="100%" stop-color="${accentB}" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.3)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <rect width="800" height="600" rx="32" fill="url(#bg)" />
      <circle cx="250" cy="150" r="220" fill="url(#glow)" />
      <circle cx="610" cy="430" r="210" fill="rgba(255,255,255,0.12)" />
      <g fill="rgba(255,255,255,0.88)">
        ${motifMarkup}
      </g>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function makeAnimal(config) {
  const imageUrl = config.imageUrl || createFallbackAnimalImage(
    config.speciesName,
    config.accentA || "#0b69ff",
    config.accentB || "#2dd4bf",
    config.motif || "paw"
  );

  const aliases = Array.from(new Set([config.speciesName, ...(config.aliases || [])].map(normalizeText).filter(Boolean)));

  return {
    speciesName: config.speciesName,
    aliases,
    tier: config.tier,
    imageUrl,
    continent: config.continent,
    habitat: config.habitat,
    category: config.category,
    rarity: config.rarity,
    funFact: config.funFact,
    distinctiveFeature: config.distinctiveFeature,
    behavior: config.behavior,
    palette: config.palette || ["#0b69ff", "#2dd4bf"],
    motif: config.motif || "paw",
    clues: config.clues || [
      `Habitat: ${config.continent}, ${config.habitat}`,
      `Category: ${config.category}`,
      `Distinctive feature: ${config.distinctiveFeature}`
    ]
  };
}

const animalLibrary = [
  makeAnimal({
    speciesName: "Giant Panda",
    aliases: ["panda"],
    tier: "easy",
    imageUrl: "animal_images/giant-panda.jpg",
    continent: "Asia",
    habitat: "Mountain forests",
    category: "Mammal",
    rarity: "Common",
    funFact: "Giant pandas can spend 10 to 16 hours a day eating bamboo.",
    distinctiveFeature: "Black eye patches and a round black-and-white body",
    behavior: "Slow-moving and bamboo-focused",
    motif: "paw",
    accentA: "#0f766e",
    accentB: "#0b69ff"
  }),
  makeAnimal({
    speciesName: "Asian Elephant",
    aliases: ["elephant"],
    tier: "easy",
    imageUrl: "animal_images/asian-elephant.jpg",
    continent: "Asia",
    habitat: "Forests and grasslands",
    category: "Mammal",
    rarity: "Common",
    funFact: "Asian elephants use their trunks to smell, grab food, and communicate.",
    distinctiveFeature: "Smaller ears than African elephants",
    behavior: "Lives in social herds",
    motif: "horn",
    accentA: "#64748b",
    accentB: "#0b69ff"
  }),
  makeAnimal({
    speciesName: "African Lion",
    aliases: ["lion"],
    tier: "easy",
    imageUrl: "animal_images/african-lion.jpg",
    continent: "Africa",
    habitat: "Savannas and grasslands",
    category: "Mammal",
    rarity: "Common",
    funFact: "A lion's roar can travel several miles across open terrain.",
    distinctiveFeature: "Mane on adult males",
    behavior: "Lives in prides and hunts cooperatively",
    motif: "paw",
    accentA: "#d97706",
    accentB: "#b45309"
  }),
  makeAnimal({
    speciesName: "Bald Eagle",
    aliases: ["eagle"],
    tier: "easy",
    imageUrl: "animal_images/bald-eagle.jpg",
    continent: "North America",
    habitat: "Lakes, rivers, and coasts",
    category: "Bird",
    rarity: "Common",
    funFact: "Bald eagles build huge nests that can be reused for years.",
    distinctiveFeature: "White head and tail with a dark body",
    behavior: "Powerful bird of prey",
    motif: "wing",
    accentA: "#1d4ed8",
    accentB: "#0f172a"
  }),
  makeAnimal({
    speciesName: "Koala",
    aliases: [],
    tier: "easy",
    imageUrl: "animal_images/koala.jpg",
    continent: "Australia",
    habitat: "Eucalyptus forests",
    category: "Mammal",
    rarity: "Common",
    funFact: "Koalas sleep most of the day to conserve energy from their leaf diet.",
    distinctiveFeature: "Fuzzy ears and a big nose",
    behavior: "Mostly nocturnal and tree-dwelling",
    motif: "leaf",
    accentA: "#7c3aed",
    accentB: "#0ea5e9"
  }),
  makeAnimal({
    speciesName: "Brown Bear",
    aliases: ["bear", "grizzly bear"],
    tier: "medium",
    imageUrl: "animal_images/brown-bear.jpg",
    continent: "North America",
    habitat: "Forests and mountains",
    category: "Mammal",
    rarity: "Common",
    funFact: "Brown bears are strong swimmers and skilled fishers during salmon runs.",
    distinctiveFeature: "Shoulder hump and long claws",
    behavior: "Omnivorous and seasonal",
    motif: "paw",
    accentA: "#8b5e34",
    accentB: "#4b2e1e"
  }),
  makeAnimal({
    speciesName: "Gray Wolf",
    aliases: ["grey wolf", "wolf"],
    tier: "medium",
    imageUrl: "animal_images/gray-wolf.jpeg",
    continent: "Northern Hemisphere",
    habitat: "Forests, tundra, and grasslands",
    category: "Mammal",
    rarity: "Common",
    funFact: "Wolves rely on pack coordination and long-distance communication.",
    distinctiveFeature: "Long muzzle and thick coat",
    behavior: "Howls to communicate over long distances",
    motif: "paw",
    accentA: "#334155",
    accentB: "#64748b"
  }),
  makeAnimal({
    speciesName: "Manatee",
    aliases: ["florida manatee", "sea cow"],
    tier: "medium",
    imageUrl: "animal_images/Manatee.JPG",
    continent: "Americas",
    habitat: "Warm coastal waters and rivers",
    category: "Marine Mammal",
    rarity: "Uncommon",
    funFact: "Manatees are gentle herbivores that graze on aquatic plants.",
    distinctiveFeature: "Rounded body and paddle-shaped tail",
    behavior: "Slow-moving and surface-breathing",
    motif: "fin",
    accentA: "#0ea5e9",
    accentB: "#14b8a6"
  }),
  makeAnimal({
    speciesName: "Southern White Rhino",
    aliases: ["white rhino", "rhino"],
    tier: "medium",
    imageUrl: "animal_images/Pilanesberg_Rhino.JPG",
    continent: "Africa",
    habitat: "Grasslands and savannas",
    category: "Mammal",
    rarity: "Uncommon",
    funFact: "White rhinos have a wide mouth adapted for grazing grass.",
    distinctiveFeature: "Two horns and a square upper lip",
    behavior: "Often grazes in open plains",
    motif: "horn",
    accentA: "#6b7280",
    accentB: "#1f2937"
  }),
  makeAnimal({
    speciesName: "Florida Panther",
    aliases: ["panther"],
    tier: "hard",
    imageUrl: "animal_images/florida-panther.jpg",
    continent: "North America",
    habitat: "Swamps, forests, and wetlands",
    category: "Mammal",
    rarity: "Rare",
    funFact: "Florida panthers are among the most endangered mammals in North America.",
    distinctiveFeature: "Long tail and tan coat",
    behavior: "Solitary and stealthy",
    motif: "paw",
    accentA: "#7c2d12",
    accentB: "#0f172a"
  }),
  makeAnimal({
    speciesName: "Red Fox",
    aliases: ["fox"],
    tier: "easy",
    imageUrl: "animal_images/red-fox.jpg",
    continent: "Northern Hemisphere",
    habitat: "Woodlands and fields",
    category: "Mammal",
    rarity: "Common",
    funFact: "Red foxes are adaptable hunters that live in rural and urban areas.",
    distinctiveFeature: "Bushy tail and pointed ears",
    behavior: "Opportunistic and quick",
    motif: "paw",
    accentA: "#ea580c",
    accentB: "#c2410c"
  }),
  makeAnimal({
    speciesName: "Emperor Penguin",
    aliases: ["penguin"],
    tier: "easy",
    imageUrl: "animal_images/emperor-penguin.jpg",
    continent: "Antarctica",
    habitat: "Sea ice",
    category: "Bird",
    rarity: "Common",
    funFact: "Emperor penguins are the tallest and heaviest penguin species.",
    distinctiveFeature: "Black back, white belly, and yellow neck accents",
    behavior: "Excellent diver and colony breeder",
    motif: "wing",
    accentA: "#0f172a",
    accentB: "#1d4ed8"
  }),
  makeAnimal({
    speciesName: "Sea Otter",
    aliases: ["otter"],
    tier: "easy",
    imageUrl: "animal_images/sea-otter.jpg",
    continent: "North Pacific",
    habitat: "Kelp forests and coastal waters",
    category: "Marine Mammal",
    rarity: "Uncommon",
    funFact: "Sea otters use tools like rocks to crack shellfish.",
    distinctiveFeature: "Very dense fur and floating on its back",
    behavior: "Uses its chest as a table while eating",
    motif: "fin",
    accentA: "#0369a1",
    accentB: "#0891b2"
  }),
  makeAnimal({
    speciesName: "Giraffe",
    aliases: [],
    tier: "easy",
    imageUrl: "animal_images/giraffe.jpg",
    continent: "Africa",
    habitat: "Savannas and open woodlands",
    category: "Mammal",
    rarity: "Common",
    funFact: "Giraffes have the same number of neck vertebrae as most mammals: seven.",
    distinctiveFeature: "Very long neck and spotted coat",
    behavior: "Browses leaves from treetops",
    motif: "horn",
    accentA: "#d97706",
    accentB: "#854d0e"
  }),
  makeAnimal({
    speciesName: "Red Kangaroo",
    aliases: ["kangaroo"],
    tier: "easy",
    imageUrl: "animal_images/red-kangaroo.jpg",
    continent: "Australia",
    habitat: "Arid plains and scrublands",
    category: "Mammal",
    rarity: "Common",
    funFact: "Red kangaroos are the largest living marsupials.",
    distinctiveFeature: "Powerful hind legs and a balancing tail",
    behavior: "Moves by hopping and lives in groups",
    motif: "paw",
    accentA: "#ea580c",
    accentB: "#9a3412"
  }),
  makeAnimal({
    speciesName: "Sloth",
    aliases: [],
    tier: "easy",
    imageUrl: "animal_images/sloth.jpg",
    continent: "Central and South America",
    habitat: "Rainforests",
    category: "Mammal",
    rarity: "Common",
    funFact: "Sloths move slowly to conserve energy and avoid predators.",
    distinctiveFeature: "Very slow movement and long claws",
    behavior: "Spends most of its life hanging in trees",
    motif: "leaf",
    accentA: "#65a30d",
    accentB: "#166534"
  }),
  makeAnimal({
    speciesName: "Polar Bear",
    aliases: ["bear"],
    tier: "medium",
    imageUrl: "animal_images/Polar-bear.jpg",
    continent: "Arctic",
    habitat: "Sea ice and coastal tundra",
    category: "Mammal",
    rarity: "Vulnerable",
    funFact: "Polar bears are excellent swimmers and rely on sea ice to hunt seals.",
    distinctiveFeature: "Large white coat and massive paws",
    behavior: "Powerful Arctic predator",
    motif: "paw",
    accentA: "#e2e8f0",
    accentB: "#38bdf8"
  }),
  makeAnimal({
    speciesName: "Cheetah",
    aliases: [],
    tier: "medium",
    imageUrl: "animal_images/Cheetah.jpg",
    continent: "Africa",
    habitat: "Grasslands and open plains",
    category: "Mammal",
    rarity: "Vulnerable",
    funFact: "Cheetahs are the fastest land animals, but only for short bursts.",
    distinctiveFeature: "Tear marks from eyes to mouth and a slim frame",
    behavior: "Built for speed and daytime hunting",
    motif: "paw",
    accentA: "#f59e0b",
    accentB: "#92400e"
  }),
  makeAnimal({
    speciesName: "Humpback Whale",
    aliases: ["whale"],
    tier: "medium",
    imageUrl: "animal_images/humpback-whale.jpg",
    continent: "Oceans",
    habitat: "Open ocean and migration routes",
    category: "Marine Mammal",
    rarity: "Common",
    funFact: "Humpback whales are famous for long migrations and complex songs.",
    distinctiveFeature: "Long pectoral fins and a pronounced hump",
    behavior: "Feeds with bubble nets and travels in oceans",
    motif: "fin",
    accentA: "#0369a1",
    accentB: "#0f766e"
  }),
  makeAnimal({
    speciesName: "Macaw",
    aliases: ["parrot"],
    tier: "medium",
    imageUrl: "animal_images/macaw.jpg",
    continent: "South America",
    habitat: "Rainforests",
    category: "Bird",
    rarity: "Threatened",
    funFact: "Macaws are known for bright feathers and loud calls.",
    distinctiveFeature: "Curved beak and vivid plumage",
    behavior: "Strong flyer and social flock bird",
    motif: "wing",
    accentA: "#dc2626",
    accentB: "#2563eb"
  }),
  makeAnimal({
    speciesName: "Orangutan",
    aliases: [],
    tier: "hard",
    imageUrl: "animal_images/Orangutan.jpg",
    continent: "Southeast Asia",
    habitat: "Rainforests",
    category: "Mammal",
    rarity: "Critically Endangered",
    funFact: "Orangutans are highly intelligent and use tools in the wild.",
    distinctiveFeature: "Long arms and reddish-orange fur",
    behavior: "Moves through trees with careful strength",
    motif: "leaf",
    accentA: "#ea580c",
    accentB: "#7c2d12"
  }),
  makeAnimal({
    speciesName: "Snow Leopard",
    aliases: ["leopard"],
    tier: "hard",
    imageUrl: "animal_images/snow-leopard.jpg",
    continent: "Central Asia",
    habitat: "High mountains",
    category: "Mammal",
    rarity: "Vulnerable",
    funFact: "Snow leopards have thick tails for balance and warmth.",
    distinctiveFeature: "Thick fur and long tail",
    behavior: "Secretive and adapted to steep cliffs",
    motif: "paw",
    accentA: "#94a3b8",
    accentB: "#1e293b"
  }),
  makeAnimal({
    speciesName: "Komodo Dragon",
    aliases: ["dragon"],
    tier: "hard",
    imageUrl: "animal_images/komodo-dragon.jpg",
    continent: "Indonesia",
    habitat: "Dry forests and scrub",
    category: "Reptile",
    rarity: "Vulnerable",
    funFact: "Komodo dragons are the largest living lizards.",
    distinctiveFeature: "Long muscular body and forked tongue",
    behavior: "Ambush predator with a heavy tail",
    motif: "shell",
    accentA: "#15803d",
    accentB: "#166534"
  }),
  makeAnimal({
    speciesName: "Ocelot",
    aliases: [],
    tier: "hard",
    imageUrl: "animal_images/ocelot.jpg",
    continent: "The Americas",
    habitat: "Rainforests and scrublands",
    category: "Mammal",
    rarity: "Uncommon",
    funFact: "Ocelots are nocturnal cats with striking patterned coats.",
    distinctiveFeature: "Small wild cat with bold spots and stripes",
    behavior: "Mostly active at night",
    motif: "paw",
    accentA: "#f97316",
    accentB: "#7c2d12"
  }),
  makeAnimal({
    speciesName: "European Bison",
    aliases: ["bison", "buffalo"],
    tier: "medium",
    imageUrl: "animal_images/european-bison.jpg",
    continent: "Europe",
    habitat: "Forests and grasslands",
    category: "Mammal",
    rarity: "Near Threatened",
    funFact: "European bison are the heaviest wild land animals in Europe.",
    distinctiveFeature: "Dark shaggy coat and strong shoulder hump",
    behavior: "Grazer that moves in herds",
    motif: "horn",
    accentA: "#78350f",
    accentB: "#3f3f46"
  }),
  makeAnimal({
    speciesName: "Harbor Seal",
    aliases: ["seal"],
    tier: "easy",
    imageUrl: "animal_images/harbor-seal.jpg",
    continent: "Northern Coasts",
    habitat: "Rocky shores and estuaries",
    category: "Marine Mammal",
    rarity: "Common",
    funFact: "Harbor seals can rest on land but are agile swimmers.",
    distinctiveFeature: "Spotted coat and large flippers",
    behavior: "Hauls out on beaches to rest",
    motif: "fin",
    accentA: "#0ea5e9",
    accentB: "#1d4ed8"
  }),
  makeAnimal({
    speciesName: "Giant Anteater",
    aliases: ["anteater"],
    tier: "medium",
    imageUrl: "animal_images/giant-anteater.jpg",
    continent: "South America",
    habitat: "Grasslands and forests",
    category: "Mammal",
    rarity: "Vulnerable",
    funFact: "Giant anteaters can eat tens of thousands of ants and termites per day.",
    distinctiveFeature: "Long snout and bushy tail",
    behavior: "Uses a long tongue to feed on insects",
    motif: "leaf",
    accentA: "#854d0e",
    accentB: "#0f172a"
  }),
  makeAnimal({
    speciesName: "African Penguin",
    aliases: ["penguin"],
    tier: "hard",
    imageUrl: "animal_images/african-penguin.jpg",
    continent: "Africa",
    habitat: "Rocky coasts and islands",
    category: "Bird",
    rarity: "Endangered",
    funFact: "African penguins are nicknamed jackass penguins because of their braying call.",
    distinctiveFeature: "Black chest band and pink facial patches",
    behavior: "Nests in colonies near the ocean",
    motif: "wing",
    accentA: "#1e293b",
    accentB: "#0f172a"
  }),
  makeAnimal({
    speciesName: "Tasmanian Devil",
    aliases: ["devil"],
    tier: "hard",
    imageUrl: "animal_images/tasmanian-devil.jpg",
    continent: "Australia",
    habitat: "Forests and scrublands",
    category: "Mammal",
    rarity: "Endangered",
    funFact: "Tasmanian devils are famous for loud vocalizations and powerful jaws.",
    distinctiveFeature: "Stocky body and dark coat",
    behavior: "Nocturnal scavenger and hunter",
    motif: "paw",
    accentA: "#111827",
    accentB: "#4b5563"
  }),
  makeAnimal({
    speciesName: "Electric Eel",
    aliases: ["eel"],
    tier: "hard",
    imageUrl: "animal_images/electric-eel.jpg",
    continent: "South America",
    habitat: "Rivers and floodplains",
    category: "Fish",
    rarity: "Uncommon",
    funFact: "Electric eels can generate powerful electric shocks to stun prey.",
    distinctiveFeature: "Long snake-like body",
    behavior: "Lives in slow-moving freshwater",
    motif: "fin",
    accentA: "#7c3aed",
    accentB: "#0f172a"
  }),
  makeAnimal({
    speciesName: "Armadillo",
    aliases: [],
    tier: "easy",
    imageUrl: "animal_images/armadillo.jpg",
    continent: "The Americas",
    habitat: "Grasslands and dry forests",
    category: "Mammal",
    rarity: "Common",
    funFact: "Many armadillos can roll into a protective ball.",
    distinctiveFeature: "Armored shell plates",
    behavior: "Forages for insects and grubs",
    motif: "shell",
    accentA: "#a16207",
    accentB: "#713f12"
  }),
  makeAnimal({
    speciesName: "Poison Dart Frog",
    aliases: ["dart frog", "frog"],
    tier: "hard",
    imageUrl: "animal_images/poison-dart-frog.jpg",
    continent: "South America",
    habitat: "Rainforest floors",
    category: "Amphibian",
    rarity: "Uncommon",
    funFact: "Some poison dart frogs are among the most brightly colored frogs in the world.",
    distinctiveFeature: "Tiny body with vivid warning colors",
    behavior: "Lives in humid forests and eats tiny insects",
    motif: "leaf",
    accentA: "#16a34a",
    accentB: "#7c3aed"
  }),
  makeAnimal({
    speciesName: "Red Panda",
    aliases: ["panda"],
    tier: "easy",
    imageUrl: "animal_images/red-panda.jpg",
    continent: "Asia",
    habitat: "Temperate forests",
    category: "Mammal",
    rarity: "Uncommon",
    funFact: "Red pandas use their bushy tails for balance and warmth.",
    distinctiveFeature: "Rust-colored fur and a masked face",
    behavior: "Climbs trees and eats bamboo",
    motif: "leaf",
    accentA: "#c2410c",
    accentB: "#7c2d12"
  }),
  makeAnimal({
    speciesName: "Zebra",
    aliases: [],
    tier: "easy",
    imageUrl: "animal_images/zebra.jpg",
    continent: "Africa",
    habitat: "Grasslands and savannas",
    category: "Mammal",
    rarity: "Common",
    funFact: "Every zebra has a unique stripe pattern.",
    distinctiveFeature: "Black-and-white stripes",
    behavior: "Lives in herds and grazes on grass",
    motif: "paw",
    accentA: "#111827",
    accentB: "#d1d5db"
  }),
  makeAnimal({
    speciesName: "Lemur",
    aliases: [],
    tier: "easy",
    imageUrl: "animal_images/Lemur.jpg",
    continent: "Madagascar",
    habitat: "Forests",
    category: "Mammal",
    rarity: "Uncommon",
    funFact: "Many lemurs are only found on the island of Madagascar.",
    distinctiveFeature: "Long tail and large bright eyes",
    behavior: "Often active during the day in social groups",
    motif: "leaf",
    accentA: "#7c3aed",
    accentB: "#0ea5e9"
  }),
  makeAnimal({
    speciesName: "Chimpanzee",
    aliases: ["chimp"],
    tier: "medium",
    imageUrl: "animal_images/chimpanzee.jpg",
    continent: "Africa",
    habitat: "Tropical forests",
    category: "Mammal",
    rarity: "Common",
    funFact: "Chimpanzees are among the closest living relatives to humans.",
    distinctiveFeature: "Long arms and expressive face",
    behavior: "Uses tools and lives in groups",
    motif: "paw",
    accentA: "#92400e",
    accentB: "#1f2937"
  }),
  makeAnimal({
    speciesName: "Ostrich",
    aliases: [],
    tier: "medium",
    imageUrl: "animal_images/Ostrich.jpg",
    continent: "Africa",
    habitat: "Savannas and open plains",
    category: "Bird",
    rarity: "Common",
    funFact: "Ostriches are the largest living birds and cannot fly.",
    distinctiveFeature: "Long legs and a very long neck",
    behavior: "Runs very fast across open ground",
    motif: "wing",
    accentA: "#0f172a",
    accentB: "#64748b"
  }),
  makeAnimal({
    speciesName: "Crocodile",
    aliases: [],
    tier: "medium",
    imageUrl: "animal_images/Crocodile.jpg",
    continent: "Africa, Asia, Australia, the Americas",
    habitat: "Rivers, marshes, and wetlands",
    category: "Reptile",
    rarity: "Common",
    funFact: "Crocodiles can stay still for long periods while waiting to ambush prey.",
    distinctiveFeature: "Armored body and long powerful jaw",
    behavior: "Semi-aquatic predator",
    motif: "shell",
    accentA: "#166534",
    accentB: "#0f172a"
  }),
  makeAnimal({
    speciesName: "Gorilla",
    aliases: [],
    tier: "medium",
    imageUrl: "animal_images/Gorilla.jpg",
    continent: "Africa",
    habitat: "Forests",
    category: "Mammal",
    rarity: "Endangered",
    funFact: "Gorillas live in family groups led by a dominant silverback.",
    distinctiveFeature: "Large body and broad chest",
    behavior: "Mostly herbivorous and very strong",
    motif: "paw",
    accentA: "#374151",
    accentB: "#0f172a"
  }),
  makeAnimal({
    speciesName: "Meerkat",
    aliases: [],
    tier: "easy",
    imageUrl: "animal_images/Meerkat.jpg",
    continent: "Africa",
    habitat: "Deserts and dry scrub",
    category: "Mammal",
    rarity: "Common",
    funFact: "Meerkats take turns acting as lookouts for predators.",
    distinctiveFeature: "Small body that stands upright on its hind legs",
    behavior: "Lives in groups called mobs or clans",
    motif: "paw",
    accentA: "#a16207",
    accentB: "#d97706"
  }),
];

const elements = {
  animalImage: document.getElementById("animal-image"),
  imagePanel: document.querySelector(".image-panel"),
  timeLeft: document.getElementById("time-left"),
  modeLabel: document.getElementById("mode-label"),
  difficultyLabel: document.getElementById("difficulty-label"),
  animalProgress: document.getElementById("animal-progress"),
  blurProgressFill: document.getElementById("blur-progress-fill"),
  sessionProgressFill: document.getElementById("session-progress-fill"),
  guessInput: document.getElementById("guess-input"),
  submitGuess: document.getElementById("submit-guess"),
  playAgain: document.getElementById("play-again"),
  modeSelectButton: document.getElementById("mode-select-button"),
  homeButton: document.getElementById("home-button"),
  habitatHintButton: document.getElementById("hint-habitat"),
  categoryHintButton: document.getElementById("hint-category"),
  letterHintButton: document.getElementById("hint-letter"),
  statusMessage: document.getElementById("status-message"),
  hintPanel: document.getElementById("hint-panel"),
  factInline: document.getElementById("fact-inline"),
  summaryPanel: document.getElementById("summary-panel"),
  summaryMessage: document.getElementById("summary-message"),
  finalScore: document.getElementById("final-score"),
  finalRounds: document.getElementById("final-rounds"),
  finalCorrect: document.getElementById("final-correct"),
  finalStreak: document.getElementById("final-streak"),
  finalTime: document.getElementById("final-time"),
  finalMode: document.getElementById("final-mode"),
  finalDifficulty: document.getElementById("final-difficulty"),
  leaderboardList: document.getElementById("leaderboard-list"),
  leaderboardBest: document.getElementById("leaderboard-best"),
  roundScore: document.getElementById("round-score"),
  totalScore: document.getElementById("total-score"),
  streakScore: document.getElementById("streak-score"),
  bestStreak: document.getElementById("best-streak"),
  modeBestScore: document.getElementById("mode-best-score"),
  resetProgressButton: document.getElementById("reset-progress"),
  restartSessionButton: document.getElementById("restart-session"),
  factDialog: document.getElementById("fact-dialog"),
  factText: document.getElementById("fact-text"),
  closeFact: document.getElementById("close-fact")
};

const state = {
  mode: null,
  difficulty: null,
  sessionDeck: [],
  currentRoundIndex: -1,
  currentAnimal: null,
  sessionActive: false,
  roundFinished: true,
  roundDuration: 0,
  roundStartTime: 0,
  remainingSeconds: 0,
  totalScore: 0,
  roundScore: 0,
  correctAnswers: 0,
  wrongGuesses: 0,
  streak: 0,
  bestStreak: Number.parseInt(window.localStorage.getItem(STORAGE_KEY_BEST_STREAK) || "0", 10) || 0,
  hintsUsed: 0,
  usedHints: new Set(),
  tickIsArmed: false,
  timerId: null,
  nextRoundTimeoutId: null,
  audioContext: null,
  leaderboard: loadLeaderboard(),
  highScores: loadHighScores(),
  lastTickPulseAt: 0
};

function loadHighScores() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY_HIGH_SCORES) || "{}");
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch (error) {
    return {};
  }
}

function saveHighScores() {
  window.localStorage.setItem(STORAGE_KEY_HIGH_SCORES, JSON.stringify(state.highScores));
}

function loadLeaderboard() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY_LEADERBOARD) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveLeaderboard() {
  window.localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(state.leaderboard.slice(0, 5)));
}

function getModeConfig(mode) {
  return MODE_CONFIG[mode] || MODE_CONFIG.classic;
}

function getDifficultyConfig(difficulty) {
  return DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;
}

function getDailySeed() {
  const date = new Date();
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shuffleWithRandom(list, randomFn) {
  const items = [...list];
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(randomFn() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

function weightedTierOrder(difficulty) {
  const weights = getDifficultyConfig(difficulty).poolWeights;
  const order = [];
  for (const tier of ["easy", "medium", "hard"]) {
    for (let index = 0; index < weights[tier]; index += 1) {
      order.push(tier);
    }
  }
  return order;
}

function buildSessionDeck(mode, difficulty) {
  const modeConfig = getModeConfig(mode);
  const difficultyConfig = getDifficultyConfig(difficulty);
  const randomFn = modeConfig.dailySeededDeck ? mulberry32(seedFromString(getDailySeed() + difficulty)) : Math.random;
  const tierOrder = weightedTierOrder(difficulty);
  const usedSpecies = new Set();
  const deck = [];

  while (deck.length < modeConfig.sessionRounds) {
    const desiredTier = tierOrder[deck.length % tierOrder.length];
    const tierPool = animalLibrary.filter((animal) => animal.tier === desiredTier && !usedSpecies.has(animal.speciesName));
    const fallbackPool = animalLibrary.filter((animal) => !usedSpecies.has(animal.speciesName));
    const pool = tierPool.length ? tierPool : fallbackPool;

    if (!pool.length) {
      break;
    }

    const selected = pool[Math.floor(randomFn() * pool.length)];
    deck.push(selected);
    usedSpecies.add(selected.speciesName);
  }

  return shuffleWithRandom(deck, randomFn);
}

function setStatusMessage(message, tone = "neutral") {
  if (!elements.statusMessage) {
    return;
  }

  elements.statusMessage.textContent = message;
  elements.statusMessage.dataset.tone = tone;
  elements.statusMessage.classList.remove("pulse-message");
  void elements.statusMessage.offsetWidth;
  elements.statusMessage.classList.add("pulse-message");
}

function flashInputState(kind) {
  if (!elements.guessInput) {
    return;
  }

  elements.guessInput.classList.remove("is-correct", "is-wrong", "is-close");
  if (!kind) {
    return;
  }

  elements.guessInput.classList.add(`is-${kind}`);
  window.setTimeout(() => {
    elements.guessInput.classList.remove(`is-${kind}`);
  }, 900);
}

function playTone(frequency, durationMs, type = "sine", volume = 0.04) {
  try {
    if (!state.audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        return;
      }
      state.audioContext = new AudioContextClass();
    }

    const oscillator = state.audioContext.createOscillator();
    const gainNode = state.audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.value = volume;
    oscillator.connect(gainNode);
    gainNode.connect(state.audioContext.destination);
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.0001, state.audioContext.currentTime + durationMs / 1000);
    oscillator.stop(state.audioContext.currentTime + durationMs / 1000);
  } catch (error) {
    // Audio is optional.
  }
}

function playSuccessSound() {
  playTone(660, 140, "triangle", 0.05);
  window.setTimeout(() => playTone(880, 120, "triangle", 0.035), 90);
}

function playWrongSound() {
  playTone(220, 180, "sawtooth", 0.045);
}

function playCloseSound() {
  playTone(440, 120, "sine", 0.03);
}

function playTickSound() {
  const now = Date.now();
  if (now - state.lastTickPulseAt < 1000) {
    return;
  }
  state.lastTickPulseAt = now;
  playTone(520, 60, "square", 0.02);
}

function setGameplayControlsEnabled(isEnabled) {
  elements.guessInput.disabled = !isEnabled;
  elements.submitGuess.disabled = !isEnabled;
  elements.habitatHintButton.disabled = !isEnabled;
  elements.categoryHintButton.disabled = !isEnabled;
  elements.letterHintButton.disabled = !isEnabled;
}

function updateHeader() {
  const modeConfig = getModeConfig(state.mode);
  const difficultyConfig = getDifficultyConfig(state.difficulty);
  if (elements.modeLabel) {
    elements.modeLabel.textContent = `Mode: ${modeConfig.label}`;
  }
  if (elements.difficultyLabel) {
    elements.difficultyLabel.textContent = `Difficulty: ${difficultyConfig.label}`;
  }
}

function updateRoundProgress() {
  if (elements.animalProgress) {
    const visibleRoundNumber = Math.max(1, state.currentRoundIndex + 1);
    elements.animalProgress.textContent = `Round ${visibleRoundNumber} of ${state.sessionDeck.length}`;
  }

  if (elements.sessionProgressFill && state.sessionDeck.length) {
    const progress = clamp((state.currentRoundIndex + 1) / state.sessionDeck.length, 0, 1) * 100;
    elements.sessionProgressFill.style.width = `${progress}%`;
  }
}

function updateBlurMeter() {
  const modeConfig = getModeConfig(state.mode);
  const difficultyConfig = getDifficultyConfig(state.difficulty);
  const progress = clamp(state.remainingSeconds / Math.max(state.roundDuration, 1), 0, 1);
  const blurRatio = Math.pow(progress, difficultyConfig.blurExponent) * difficultyConfig.blurScale * (modeConfig.blurSpeedMultiplier || 1);
  const blurPixels = clamp(Math.round(MAX_BLUR_PIXELS * blurRatio * (1 - Math.min(state.hintsUsed * 0.12, 0.42))), 0, MAX_BLUR_PIXELS);

  if (elements.animalImage) {
    elements.animalImage.style.filter = `blur(${blurPixels}px)`;
  }

  if (elements.blurProgressFill) {
    const revealPercent = clamp((1 - blurPixels / MAX_BLUR_PIXELS) * 100, 0, 100);
    elements.blurProgressFill.style.width = `${revealPercent}%`;
  }
}

function updateTimerLabel() {
  if (elements.timeLeft) {
    elements.timeLeft.textContent = `Time: ${Math.max(0, Math.ceil(state.remainingSeconds))}s`;
  }
}

function updateScoreboard() {
  if (elements.roundScore) {
    elements.roundScore.textContent = String(state.roundScore);
  }
  if (elements.totalScore) {
    elements.totalScore.textContent = String(state.totalScore);
  }
  if (elements.streakScore) {
    elements.streakScore.textContent = String(state.streak);
  }
  if (elements.bestStreak) {
    elements.bestStreak.textContent = String(state.bestStreak);
  }

  const modeKey = getModeKey(state.mode, state.difficulty);
  if (elements.modeBestScore) {
    elements.modeBestScore.textContent = String(state.highScores[modeKey] || 0);
  }
}

function getModeKey(mode, difficulty) {
  return `${mode}:${difficulty}`;
}

function updateModeBestScore() {
  if (!elements.modeBestScore) {
    return;
  }

  elements.modeBestScore.textContent = String(state.highScores[getModeKey(state.mode, state.difficulty)] || 0);
}

function updateHintPanel() {
  if (!elements.hintPanel || !state.currentAnimal) {
    return;
  }

  const revealedClues = [];
  if (state.usedHints.has("habitat")) {
    revealedClues.push(state.currentAnimal.clues[0]);
  }
  if (state.usedHints.has("category")) {
    revealedClues.push(state.currentAnimal.clues[1]);
  }
  if (state.usedHints.has("letter")) {
    revealedClues.push(`First letter: ${state.currentAnimal.speciesName[0].toUpperCase()}`);
  }

  elements.hintPanel.textContent = revealedClues.length ? revealedClues.join(" | ") : "Hints will appear here.";
}

function resetHintButtons() {
  state.usedHints = new Set();
  state.hintsUsed = 0;
  if (elements.habitatHintButton) {
    elements.habitatHintButton.disabled = false;
    elements.habitatHintButton.textContent = "Reveal habitat";
  }
  if (elements.categoryHintButton) {
    elements.categoryHintButton.disabled = false;
    elements.categoryHintButton.textContent = "Reveal category";
  }
  if (elements.letterHintButton) {
    elements.letterHintButton.disabled = false;
    elements.letterHintButton.textContent = "First letter";
  }
  updateHintPanel();
}

function setHintUsed(type) {
  const modeConfig = getModeConfig(state.mode);
  if (state.usedHints.has(type) || !state.currentAnimal || state.roundFinished || !modeConfig.allowHints) {
    return;
  }

  const difficultyConfig = getDifficultyConfig(state.difficulty);
  state.usedHints.add(type);
  state.hintsUsed += 1;
  state.streak = Math.max(0, state.streak - 1);
  state.remainingSeconds = clamp(state.remainingSeconds - modeConfig.hintTimeCostSeconds, 0, state.roundDuration);
  updateTimerLabel();
  updateBlurMeter();
  state.roundScore = Math.max(0, Math.round(state.roundScore * (1 - difficultyConfig.hintPenaltyRate)));
  updateScoreboard();

  if (type === "habitat") {
    elements.habitatHintButton.disabled = true;
    elements.habitatHintButton.textContent = "Habitat revealed";
    setStatusMessage(`Hint: ${state.currentAnimal.clues[0]}`, "close");
  } else if (type === "category") {
    elements.categoryHintButton.disabled = true;
    elements.categoryHintButton.textContent = "Category revealed";
    setStatusMessage(`Hint: ${state.currentAnimal.clues[1]}`, "close");
  } else if (type === "letter") {
    elements.letterHintButton.disabled = true;
    elements.letterHintButton.textContent = "Letter revealed";
    setStatusMessage(`Hint: first letter is ${state.currentAnimal.speciesName[0].toUpperCase()}`, "close");
  }

  playCloseSound();
  updateHintPanel();
}

function validateGuessInput(guessText) {
  return /^[a-z\s'-]{2,40}$/i.test(String(guessText || "").trim());
}

function evaluateGuess(guessText, animal) {
  const normalizedGuess = normalizeText(guessText);
  const normalizedSpecies = normalizeText(animal.speciesName);
  const aliases = animal.aliases;
  const threshold = getDifficultyConfig(state.difficulty).guessThreshold;

  if (!normalizedGuess) {
    return { outcome: "wrong", similarity: 0 };
  }

  const aliasExactMatch = aliases.some((alias) => alias === normalizedGuess);
  if (aliasExactMatch) {
    return { outcome: "correct", similarity: 1 };
  }

  const speciesTokens = normalizedSpecies.split(" ");
  const guessTokens = normalizedGuess.split(" ");
  const coreToken = speciesTokens[speciesTokens.length - 1] || normalizedSpecies;

  if (
    normalizedSpecies.includes(normalizedGuess) ||
    normalizedGuess.includes(coreToken) ||
    aliases.some((alias) => alias.includes(normalizedGuess) || normalizedGuess.includes(alias)) ||
    guessTokens.some((token) => token.length > 2 && speciesTokens.includes(token))
  ) {
    return { outcome: "correct", similarity: 1 };
  }

  const similarity = Math.max(
    similarityScore(normalizedGuess, normalizedSpecies),
    ...aliases.map((alias) => similarityScore(normalizedGuess, alias))
  );

  if (similarity >= threshold) {
    return { outcome: "correct", similarity };
  }

  if (similarity >= Math.max(0.55, threshold - 0.12)) {
    return { outcome: "close", similarity };
  }

  return { outcome: "wrong", similarity };
}

function calculateRoundScore() {
  const modeConfig = getModeConfig(state.mode);
  const difficultyConfig = getDifficultyConfig(state.difficulty);
  const roundIndexBonus = (state.currentRoundIndex + 1) * 6;
  const timeComponent = Math.max(0, Math.round(state.remainingSeconds * (5 + difficultyConfig.scoreBonus / 2)));
  const streakComponent = state.streak * difficultyConfig.streakBonus;
  const difficultyBonus = difficultyConfig.scoreBonus;
  const speedBonus = state.mode === "speedRun" ? Math.max(0, Math.round(state.remainingSeconds * 1.5)) : 0;
  const perfectAccuracyBonus = state.wrongGuesses === 0 ? 12 : 0;
  const noHintBonus = state.hintsUsed === 0 ? 20 : 0;
  const wrongPenalty = state.wrongGuesses * (difficultyConfig.wrongGuessPenalty + (modeConfig.allowRetries ? 2 : 0));
  const hintPenalty = state.hintsUsed * (14 + difficultyConfig.scoreBonus);
  const rawScore = (timeComponent + roundIndexBonus + streakComponent + difficultyBonus + speedBonus + perfectAccuracyBonus + noHintBonus - wrongPenalty - hintPenalty) * modeConfig.scoreScale;

  return Math.max(0, Math.round(rawScore));
}

function markHighScoreIfNeeded() {
  const modeKey = getModeKey(state.mode, state.difficulty);
  const previousBest = state.highScores[modeKey] || 0;
  if (state.totalScore <= previousBest) {
    return false;
  }

  state.highScores[modeKey] = state.totalScore;
  saveHighScores();
  return true;
}

function recordLeaderboardEntry() {
  const entry = {
    score: state.totalScore,
    rounds: state.correctAnswers,
    streak: state.bestStreak,
    mode: getModeConfig(state.mode).label,
    difficulty: getDifficultyConfig(state.difficulty).label,
    elapsedSeconds: Math.round((Date.now() - state.sessionStartedAt) / 1000),
    timestamp: new Date().toISOString()
  };

  state.leaderboard = [...state.leaderboard, entry]
    .sort((left, right) => right.score - left.score || right.streak - left.streak || left.elapsedSeconds - right.elapsedSeconds)
    .slice(0, 5);
  saveLeaderboard();
}

function renderLeaderboard() {
  if (!elements.leaderboardList) {
    return;
  }

  const entries = state.leaderboard.slice(0, 5);
  elements.leaderboardList.innerHTML = entries.length
    ? entries
        .map(
          (entry, index) => `
            <li>
              <span class="leaderboard-rank">#${index + 1}</span>
              <span class="leaderboard-score">${entry.score}</span>
              <span class="leaderboard-meta">${entry.mode} / ${entry.difficulty} - streak ${entry.streak}</span>
            </li>
          `
        )
        .join("")
    : "<li>No scores yet. Finish a session to create the first entry.</li>";
}

function renderGameOver(summaryText) {
  if (elements.summaryPanel) {
    elements.summaryPanel.hidden = false;
    elements.summaryPanel.classList.add("visible");
  }

  if (elements.summaryMessage) {
    elements.summaryMessage.textContent = summaryText;
  }

  if (elements.finalScore) {
    elements.finalScore.textContent = String(state.totalScore);
  }
  if (elements.finalRounds) {
    elements.finalRounds.textContent = `${state.correctAnswers}/${state.sessionDeck.length}`;
  }
  if (elements.finalCorrect) {
    elements.finalCorrect.textContent = String(state.correctAnswers);
  }
  if (elements.finalStreak) {
    elements.finalStreak.textContent = String(state.bestStreak);
  }
  if (elements.finalTime) {
    elements.finalTime.textContent = `${Math.round((Date.now() - state.sessionStartedAt) / 1000)}s`;
  }
  if (elements.finalMode) {
    elements.finalMode.textContent = getModeConfig(state.mode).label;
  }
  if (elements.finalDifficulty) {
    elements.finalDifficulty.textContent = getDifficultyConfig(state.difficulty).label;
  }

  if (elements.leaderboardBest) {
    elements.leaderboardBest.textContent = String(state.leaderboard[0]?.score || 0);
  }

  renderLeaderboard();
}

function hideGameOver() {
  if (elements.summaryPanel) {
    elements.summaryPanel.hidden = true;
    elements.summaryPanel.classList.remove("visible");
  }
}

function updateFactInline() {
  if (!elements.factInline || !state.currentAnimal) {
    return;
  }

  elements.factInline.textContent = state.currentAnimal ? `Fun fact: ${state.currentAnimal.funFact}` : "";
}

function showFactDialogIfAvailable() {
  if (!state.currentAnimal || !elements.factDialog || !elements.factText) {
    updateFactInline();
    return;
  }

  elements.factText.textContent = state.currentAnimal.funFact;
  if (typeof elements.factDialog.showModal === "function") {
    try {
      if (elements.factDialog.open) {
        elements.factDialog.close();
      }
      elements.factDialog.showModal();
      return;
    } catch (error) {
      // Fall back to inline fact.
    }
  }

  updateFactInline();
}

function clearRoundTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function clearPostRoundTimer() {
  if (state.nextRoundTimeoutId) {
    window.clearTimeout(state.nextRoundTimeoutId);
    state.nextRoundTimeoutId = null;
  }
}

function updateRoundTimer() {
  const elapsedSeconds = (Date.now() - state.roundStartTime) / 1000;
  state.remainingSeconds = clamp(state.roundDuration - elapsedSeconds, 0, state.roundDuration);
  updateTimerLabel();
  updateBlurMeter();

  if (state.remainingSeconds <= 5 && state.remainingSeconds > 0) {
    playTickSound();
  }

  if (state.remainingSeconds <= 0) {
    handleRoundTimeout();
  }
}

function startRoundTimer() {
  clearRoundTimer();
  state.roundStartTime = Date.now();
  state.timerId = window.setInterval(updateRoundTimer, TIMER_REFRESH_MS);
  updateRoundTimer();
}

function loadRoundAnimal() {
  const modeConfig = getModeConfig(state.mode);
  const difficultyConfig = getDifficultyConfig(state.difficulty);
  state.currentAnimal = state.sessionDeck[state.currentRoundIndex];
  state.roundFinished = false;
  state.roundDuration = modeConfig.roundSeconds;
  state.remainingSeconds = modeConfig.roundSeconds;
  state.roundScore = 0;
  state.wrongGuesses = 0;
  state.hintsUsed = 0;
  state.usedHints = new Set();
  state.tickIsArmed = false;
  clearPostRoundTimer();
  hideGameOver();
  resetHintButtons();
  updateHeader();
  updateRoundProgress();
  updateScoreboard();
  updateTimerLabel();
  updateBlurMeter();
  updateModeBestScore();
  updateHintPanel();
  setGameplayControlsEnabled(true);
  elements.guessInput.value = "";
  elements.guessInput.focus();

  if (elements.imagePanel) {
    elements.imagePanel.classList.add("is-loading");
  }

  if (elements.animalImage) {
    elements.animalImage.style.opacity = "0";
    elements.animalImage.style.filter = `blur(${MAX_BLUR_PIXELS}px)`;
    elements.animalImage.alt = "Loading mystery animal";
    elements.animalImage.onload = () => {
      if (elements.imagePanel) {
        elements.imagePanel.classList.remove("is-loading");
      }
      elements.animalImage.style.opacity = "1";
      setStatusMessage(`Round ${state.currentRoundIndex + 1}: start guessing before the image clears.`, "neutral");
      updateBlurMeter();
      startRoundTimer();
    };
    elements.animalImage.onerror = () => {
      if (elements.imagePanel) {
        elements.imagePanel.classList.remove("is-loading");
      }
      elements.animalImage.style.opacity = "1";
      setStatusMessage("Image load failed. The round will continue with the fallback card.", "wrong");
      updateBlurMeter();
      startRoundTimer();
    };
    elements.animalImage.src = state.currentAnimal.imageUrl;
  }

  if (difficultyConfig) {
    updateBlurMeter();
  }
}

function advanceToNextRound() {
  clearPostRoundTimer();

  if (state.currentRoundIndex + 1 >= state.sessionDeck.length) {
    finishSession("Game Over");
    return;
  }

  state.currentRoundIndex += 1;
  loadRoundAnimal();
}

function finishCurrentRound(message, didGuessCorrectly) {
  clearRoundTimer();
  state.roundFinished = true;
  setGameplayControlsEnabled(false);

  if (didGuessCorrectly) {
    playSuccessSound();
  }

  if (elements.animalImage) {
    elements.animalImage.style.filter = "blur(0px)";
  }
  setStatusMessage(message, didGuessCorrectly ? "correct" : "wrong");
  showFactDialogIfAvailable();
  updateScoreboard();
  updateModeBestScore();
  clearPostRoundTimer();
  state.nextRoundTimeoutId = window.setTimeout(() => {
    if (!state.sessionActive) {
      return;
    }
    advanceToNextRound();
  }, POST_ROUND_DELAY_MS);
}

function finishSession(summaryTitle) {
  clearRoundTimer();
  clearPostRoundTimer();
  state.sessionActive = false;
  state.roundFinished = true;
  setGameplayControlsEnabled(false);

  const modeConfig = getModeConfig(state.mode);
  const elapsedSeconds = Math.round((Date.now() - state.sessionStartedAt) / 1000);
  const theoreticalMaxTime = state.sessionDeck.length * modeConfig.roundSeconds;
  const roundsCompletedBonus = state.correctAnswers * modeConfig.completionBonusPerRound;
  const paceBonus = Math.max(0, Math.round((theoreticalMaxTime - elapsedSeconds) * modeConfig.paceBonusFactor));
  const cleanRunBonus = state.hintsUsed === 0 ? modeConfig.noHintSessionBonus : 0;
  const perfectRunBonus = state.correctAnswers === state.sessionDeck.length ? modeConfig.perfectSessionBonus : 0;
  state.totalScore += roundsCompletedBonus + paceBonus + cleanRunBonus + perfectRunBonus;

  const isNewHighScore = markHighScoreIfNeeded();
  if (state.streak > state.bestStreak) {
    state.bestStreak = state.streak;
    window.localStorage.setItem(STORAGE_KEY_BEST_STREAK, String(state.bestStreak));
  }

  recordLeaderboardEntry();
  updateScoreboard();
  updateModeBestScore();
  renderGameOver(`${summaryTitle}${isNewHighScore ? ". New high score." : "."}`);
  setStatusMessage(`${summaryTitle} Final score: ${state.totalScore}.`, isNewHighScore ? "correct" : "neutral");
}

function handleRoundTimeout() {
  if (state.roundFinished) {
    return;
  }

  if (state.mode === "suddenDeath") {
    finishCurrentRound(`Time expired. The species was ${state.currentAnimal.speciesName}.`, false);
    finishSession("Sudden Death ended on timeout");
    return;
  }

  state.roundFinished = true;
  state.roundScore = 0;
  state.streak = 0;
  updateScoreboard();
  finishCurrentRound(`Time's up. The species was ${state.currentAnimal.speciesName}.`, false);
}

function registerCorrectGuess() {
  const difficultyConfig = getDifficultyConfig(state.difficulty);
  state.correctAnswers += 1;
  state.streak += 1;
  state.bestStreak = Math.max(state.bestStreak, state.streak);
  window.localStorage.setItem(STORAGE_KEY_BEST_STREAK, String(state.bestStreak));
  state.roundScore = calculateRoundScore();
  state.totalScore += state.roundScore;
  state.roundFinished = true;
  updateScoreboard();
  updateModeBestScore();
  flashInputState("correct");
  setStatusMessage(
    `Correct! ${state.currentAnimal.speciesName}. +${state.roundScore} points.`,
    "correct"
  );
  playSuccessSound();
  state.roundDuration = Math.max(state.roundDuration, 1);
  state.remainingSeconds = clamp(state.remainingSeconds, 0, state.roundDuration);
  updateBlurMeter();
  updateFactInline();
  showFactDialogIfAvailable();

  if (state.currentRoundIndex + 1 >= state.sessionDeck.length) {
    clearRoundTimer();
    clearPostRoundTimer();
    state.nextRoundTimeoutId = window.setTimeout(() => finishSession("Game Over"), POST_ROUND_DELAY_MS);
    return;
  }

  clearRoundTimer();
  clearPostRoundTimer();
  state.nextRoundTimeoutId = window.setTimeout(() => {
    if (!state.sessionActive) {
      return;
    }
    state.currentRoundIndex += 1;
    loadRoundAnimal();
  }, POST_ROUND_DELAY_MS);
}

function registerWrongGuess() {
  const modeConfig = getModeConfig(state.mode);
  state.wrongGuesses += 1;
  state.streak = 0;
  state.remainingSeconds = clamp(state.remainingSeconds - modeConfig.wrongGuessTimeCostSeconds, 0, state.roundDuration);
  flashInputState("wrong");
  playWrongSound();
  updateTimerLabel();
  updateBlurMeter();
  updateScoreboard();

  if (state.mode === "suddenDeath") {
    state.roundScore = 0;
    finishCurrentRound(`Wrong guess. The species was ${state.currentAnimal.speciesName}.`, false);
    finishSession("Sudden Death ended on a wrong guess");
    return;
  }

  setStatusMessage("Not quite. Close guesses get a hint of the right answer, but keep trying.", "wrong");
}

function checkGuess() {
  if (!state.sessionActive || state.roundFinished) {
    setStatusMessage("Start a new session to keep guessing.", "neutral");
    return;
  }

  const guessText = elements.guessInput.value;
  if (!validateGuessInput(guessText)) {
    setStatusMessage("Use letters, spaces, apostrophes, or hyphens only.", "wrong");
    flashInputState("wrong");
    playWrongSound();
    return;
  }

  const result = evaluateGuess(guessText, state.currentAnimal);
  if (result.outcome === "correct") {
    registerCorrectGuess();
    return;
  }

  if (result.outcome === "close") {
    flashInputState("close");
    playCloseSound();
    setStatusMessage("Close. Try a more specific species name.", "close");
    return;
  }

  registerWrongGuess();
}

function startSession(mode, difficulty) {
  const modeConfig = getModeConfig(mode);
  const difficultyConfig = getDifficultyConfig(difficulty);
  state.mode = mode;
  state.difficulty = difficulty;
  state.sessionDeck = buildSessionDeck(mode, difficulty);
  state.currentRoundIndex = -1;
  state.currentAnimal = null;
  state.sessionActive = true;
  state.roundFinished = true;
  state.roundDuration = modeConfig.roundSeconds;
  state.remainingSeconds = modeConfig.roundSeconds;
  state.totalScore = 0;
  state.roundScore = 0;
  state.correctAnswers = 0;
  state.wrongGuesses = 0;
  state.streak = 0;
  state.tickIsArmed = false;
  state.lastTickPulseAt = 0;
  state.sessionStartedAt = Date.now();
  elements.summaryPanel.hidden = true;
  hideGameOver();
  updateHeader();
  updateRoundProgress();
  updateTimerLabel();
  updateScoreboard();
  updateModeBestScore();
  setGameplayControlsEnabled(true);
  setStatusMessage(
    `Session started. ${modeConfig.label} on ${difficultyConfig.label}. ${modeConfig.sessionRounds} rounds total.`,
    "neutral"
  );
  advanceToNextRound();
}

function getParamsFromUrl() {
  const searchParams = new URLSearchParams(window.location.search);
  const mode = searchParams.get("mode");
  const difficulty = searchParams.get("difficulty");

  return {
    mode: mode && MODE_CONFIG[mode] ? mode : null,
    difficulty: difficulty && DIFFICULTY_CONFIG[difficulty] ? difficulty : null
  };
}

function restartCurrentSession() {
  if (state.mode && state.difficulty) {
    startSession(state.mode, state.difficulty);
    return;
  }

  goToModeSelectionPage();
}

function goToModeSelectionPage() {
  window.location.href = "mode-select.html";
}

function goHome() {
  window.location.href = "https://webkinz.tech/";
}

function resetProgress() {
  window.localStorage.removeItem(STORAGE_KEY_HIGH_SCORES);
  window.localStorage.removeItem(STORAGE_KEY_LEADERBOARD);
  window.localStorage.removeItem(STORAGE_KEY_BEST_STREAK);
  state.highScores = {};
  state.leaderboard = [];
  state.bestStreak = 0;
  saveHighScores();
  saveLeaderboard();
  updateScoreboard();
  updateModeBestScore();
  renderLeaderboard();
  setStatusMessage("Progress reset.", "neutral");
}

function bindEvents() {
  elements.submitGuess.addEventListener("click", checkGuess);
  elements.guessInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      checkGuess();
    }
  });

  elements.playAgain.addEventListener("click", restartCurrentSession);
  elements.modeSelectButton.addEventListener("click", goToModeSelectionPage);
  elements.homeButton.addEventListener("click", goHome);
  elements.resetProgressButton.addEventListener("click", resetProgress);
  elements.restartSessionButton.addEventListener("click", restartCurrentSession);
  elements.habitatHintButton.addEventListener("click", () => setHintUsed("habitat"));
  elements.categoryHintButton.addEventListener("click", () => setHintUsed("category"));
  elements.letterHintButton.addEventListener("click", () => setHintUsed("letter"));
  if (elements.closeFact) {
    elements.closeFact.addEventListener("click", () => {
      if (elements.factDialog && typeof elements.factDialog.close === "function") {
        elements.factDialog.close();
      }
    });
  }
}

function init() {
  bindEvents();
  renderLeaderboard();
  updateHeader();
  updateScoreboard();
  updateModeBestScore();

  const { mode, difficulty } = getParamsFromUrl();
  if (!mode || !difficulty) {
    goToModeSelectionPage();
    return;
  }

  window.localStorage.setItem(STORAGE_KEY_LAST_MODE, mode);
  window.localStorage.setItem(STORAGE_KEY_LAST_DIFFICULTY, difficulty);
  startSession(mode, difficulty);
}

init();
