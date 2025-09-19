//========== PALETTE DEFINITION ============//
contrast = [
  "#001a66",
  "#0044cc",
  "#3399ff",
  "#efcdb4",
  "#228b22",
  "#6b8e23",
  "#8b7765",
  "#a9a9a9",
  "#ffffff",
]


standard = [
  "#28aaf5",
  "#6ec3fa",
  "#c3e6fa",
  "#5aa528",
  "#afc850",
  "#ffd787",
  "#f5aa5a",
  "#af7846",
  "#6e4619",
]
rainbow = [
  "#3B0F70",
  "#2C7BB6",
  "#00A6E6",
  "#00C292",
  "#7AD151",
  "#FDE725",
  "#FDAE61",
  "#F46D43",
  "#A50026",
]
//Black White
bw = [
  "#0a0a0a",
  "#1a1a1a",
  "#2b2b2b",
  "#3c3c3c",
  "#6a6a6a",
  "#9a9a9a",
  "#c6c6c6",
  "#e6e6e6",
  "#ffffff",
]


old = [
  "#7d8782",
  "#819096",
  "#afb4b8",
  "#a5aa8c",
  "#c8c3a0",
  "#e1d2a5",
  "#d2b496",
  "#cda087",
  "#af7873",
]
// ++++++ CONFIGURATION SETTINGS ++++++ //
const CONFIG = {
  width: window.innerWidth,
  height: window.innerHeight,
  scale: 150, // Larger = smoother continents
  octaves: 8, // Number of noise layers
  persistence: 0.6, // Contribution of each octave
  lacunarity: 2.0, // Frequency multiplier per octave
  seed: null, // Seed is initialized based on input
  displayType: "default", // "default" or "radial"
  panning: false,
  palette: standard
}


const canvas = document.getElementById("terrain")
canvas.width = CONFIG.width
canvas.height = CONFIG.height
const ctx = canvas.getContext("2d")
let simplex;


let offsetX = 0
let offsetY = 0

// --- panning handler functions (use named handlers so we can remove listeners) ---
let isDragging = false
let lastMouseX = 0
let lastMouseY = 0

function onPanMouseDown(e) {
  isDragging = true
  lastMouseX = e.clientX
  lastMouseY = e.clientY
}
function onPanMouseUp() {
  isDragging = false
}
function onPanMouseMove(e) {
  if (!isDragging) return
  const deltaX = e.clientX - lastMouseX
  const deltaY = e.clientY - lastMouseY
  offsetX -= deltaX
  offsetY -= deltaY
  lastMouseX = e.clientX
  lastMouseY = e.clientY
  generateTerrain()
}

function enablePanning() {
  canvas.addEventListener("mousedown", onPanMouseDown)
  canvas.addEventListener("mouseup", onPanMouseUp)
  canvas.addEventListener("mousemove", onPanMouseMove)
}
function disablePanning() {
  canvas.removeEventListener("mousedown", onPanMouseDown)
  canvas.removeEventListener("mouseup", onPanMouseUp)
  canvas.removeEventListener("mousemove", onPanMouseMove)
}

// start panning if CONFIG says so
if (CONFIG.panning === true) {
  enablePanning()
}

function getRadialGradient(x, y) {
  const center_x = CONFIG.width / 2
  const center_y = CONFIG.height / 2
  const max_dist = Math.sqrt(center_x ** 2 + center_y ** 2) // Max distance from center
  const dist = Math.sqrt((x - center_x) ** 2 + (y - center_y) ** 2) // Distance of current point


  const normalizedDist = dist / max_dist
  let falloff = normalizedDist
  falloff = Math.pow(falloff, 2)


  return 1.0 - falloff
}


function getNoise(x, y) {
  let amplitude = 4
  let frequency = 0.5
  let value = 2
  let max = 0


  for (let i = 0; i < CONFIG.octaves; i++) {
    value +=
      amplitude *
      simplex.noise2D(
        (x + offsetX) / (CONFIG.scale / frequency),
        (y + offsetY) / (CONFIG.scale / frequency),
      )
    max += amplitude
    amplitude *= CONFIG.persistence
    frequency *= CONFIG.lacunarity
  }


  let n = (value / max + 1) / 2
  if (CONFIG.displayType === "radial") {
    const gradient = getRadialGradient(x, y)
    n = n * gradient
    n = Math.max(0, n - 0.2)
  } else {
    n = Math.max(0, n - 0.2)
  }
  return n
}
function getColor(e, colors) {
  if (e < 0.22) return colors[0] // deep ocean
  if (e < 0.3) return colors[1] // shallow ocean
  if (e < 0.36) return colors[2] // coast
  if (e < 0.39) return colors[3] // beach
  if (e < 0.48) return colors[4] // plains
  if (e < 0.55) return colors[5] // hills
  if (e < 0.6) return colors[6] // mountains
  if (e < 0.65) return colors[7] // high mountains
  return colors[8] // snow
}


function generateTerrain() {
  const img = ctx.createImageData(CONFIG.width, CONFIG.height)
  const data = img.data


  for (let y = 0; y < CONFIG.height; y++) {
    for (let x = 0; x < CONFIG.width; x++) {
      const e = getNoise(x, y)
      const color = hexToRgb(getColor(e, CONFIG.palette))
      const idx = (y * CONFIG.width + x) * 4
      data[idx] = color.r
      data[idx + 1] = color.g
      data[idx + 2] = color.b
      data[idx + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
}


function regenerate() {
  // Get the new palette name from the dropdown
  const selectedPaletteName = document.getElementById("palette").value;
 
  // Assign the correct color array to CONFIG.palette
  switch (selectedPaletteName) {
    case "standard":
      CONFIG.palette = standard;
      break;
    case "contrast":
      CONFIG.palette = contrast;
      break;
    case "rainbow":
      CONFIG.palette = rainbow;
      break;
    case "bw":
      CONFIG.palette = bw;
      break;
    case "old":
      CONFIG.palette = old;
      break;
    default:
      CONFIG.palette = standard;
  }
  // Regenerate the terrain with the new settings
  generateTerrain();
}


function updateSeed() {
  const seedInput = document.getElementById("seed");
  const seedValue = seedInput.value.trim();

  if (seedValue === "") {
    // Do NOT auto-generate here — just choose a random seed but DO NOT auto-render.
    CONFIG.seed = Math.floor(Math.random() * 1000000000);
    // display the generated seed in the input so user sees it
    seedInput.value = CONFIG.seed;
  } else {
    CONFIG.seed = Number(seedValue);
  }

  // Re-initialize the simplex noise generator with the new seed but do NOT call generateTerrain().
  simplex = new SimplexNoise(CONFIG.seed);
}


function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16)
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  }
}


// apply advanced control values into CONFIG and redraw
function applyAdvancedSettingsFromControls() {
  const scaleInput = document.getElementById('scaleInput');
  const octavesInput = document.getElementById('octavesInput');
  const persistenceInput = document.getElementById('persistenceInput');
  const lacunarityInput = document.getElementById('lacunarityInput');

  if (!scaleInput || !octavesInput || !persistenceInput || !lacunarityInput) return;

  const newScale = Number(scaleInput.value) || CONFIG.scale;
  const newOctaves = Math.max(1, Math.floor(Number(octavesInput.value) || CONFIG.octaves));
  const newPersistence = Number(persistenceInput.value) || CONFIG.persistence;
  const newLacunarity = Number(lacunarityInput.value) || CONFIG.lacunarity;

  CONFIG.scale = newScale;
  CONFIG.octaves = newOctaves;
  CONFIG.persistence = Math.min(1, Math.max(0, newPersistence));
  CONFIG.lacunarity = Math.max(0.1, newLacunarity);

  // update readout spans if present
  const sv = document.getElementById('scaleValue');
  const pv = document.getElementById('persistenceValue');
  const lv = document.getElementById('lacunarityValue');
  if (sv) sv.textContent = String(CONFIG.scale);
  if (pv) pv.textContent = String(CONFIG.persistence);
  if (lv) lv.textContent = String(CONFIG.lacunarity);

  // regenerate map (keeps current seed & palette)
  generateTerrain();
}

document.addEventListener('DOMContentLoaded', () => {
  // Initial setup: use a random seed if the input is empty
  const seedInput = document.getElementById("seed");
  const regenerateButton = document.getElementById("regenerateButton");


  // Initial setup: use a random seed if the input is empty (and render once on load)
  if (seedInput.value.trim() === "") {
    CONFIG.seed = Math.floor(Math.random() * 1000000000);
    seedInput.value = CONFIG.seed; // Display the initial random seed
  } else {
    CONFIG.seed = Number(seedInput.value);
  }
  simplex = new SimplexNoise(CONFIG.seed);
  generateTerrain();


  // Regenerate button: update seed (if empty generate one) and then regenerate visuals & palette
  if (regenerateButton) {
    regenerateButton.addEventListener("click", () => {
      updateSeed();   // sets CONFIG.seed and simplex, but does not draw
      regenerate();   // applies palette change and calls generateTerrain()
    });
  }

  // call regenerate() automatically when the palette select changes
  const paletteSelect = document.getElementById('palette');
  if (paletteSelect) paletteSelect.addEventListener('change', regenerate);

  // wire panning checkbox (update CONFIG and enable/disable handlers)
  const panningCheckbox = document.getElementById('panningCheckbox');
  if (panningCheckbox) {
    // initialize checkbox from CONFIG
    panningCheckbox.checked = Boolean(CONFIG.panning);
    panningCheckbox.addEventListener('change', (e) => {
      CONFIG.panning = e.target.checked;
      if (CONFIG.panning) enablePanning();
      else disablePanning();
    });
  }

  // wire display type select: keep same seed, just toggle radial rendering and regenerate
  const displaySelect = document.getElementById('displayType');
  if (displaySelect) {
    displaySelect.value = CONFIG.displayType || "default";
    displaySelect.addEventListener('change', (e) => {
      CONFIG.displayType = e.target.value;
      // do NOT change CONFIG.seed or recreate simplex — reuse current seed and redraw
      generateTerrain();
    });
  }

  // wire advanced controls
  const scaleInput = document.getElementById('scaleInput');
  const octavesInput = document.getElementById('octavesInput');
  const persistenceInput = document.getElementById('persistenceInput');
  const lacunarityInput = document.getElementById('lacunarityInput');

  // initialize control values from CONFIG (in case CONFIG changed)
  if (scaleInput) scaleInput.value = String(CONFIG.scale);
  if (octavesInput) octavesInput.value = String(CONFIG.octaves);
  if (persistenceInput) persistenceInput.value = String(CONFIG.persistence);
  if (lacunarityInput) lacunarityInput.value = String(CONFIG.lacunarity);

  // update readout spans
  const sv = document.getElementById('scaleValue');
  const pv = document.getElementById('persistenceValue');
  const lv = document.getElementById('lacunarityValue');
  if (sv) sv.textContent = String(CONFIG.scale);
  if (pv) pv.textContent = String(CONFIG.persistence);
  if (lv) lv.textContent = String(CONFIG.lacunarity);

  // use 'input' so changes are live as user moves sliders; octaves uses 'change' to avoid many regenerations
  if (scaleInput) scaleInput.addEventListener('input', applyAdvancedSettingsFromControls);
  if (persistenceInput) persistenceInput.addEventListener('input', applyAdvancedSettingsFromControls);
  if (lacunarityInput) lacunarityInput.addEventListener('input', applyAdvancedSettingsFromControls);
  if (octavesInput) octavesInput.addEventListener('change', applyAdvancedSettingsFromControls);
});
