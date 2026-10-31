/**
 * KINETIC AD STUDIO — Interactive 3D Engineering Workshop Simulator
 * Senior mechanical + electronics engineering simulation
 * All dimensions, pinouts and ratings are CONCEPTUAL until validated.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
const state = {
  pattern: 'wave',
  speed: 0.55,
  brightness: 0.45,
  palette: 'rainbow',
  text: 'SALE TODAY',
  playing: true,
  slowMo: false,
  exploded: false,
  mode: 'inspect',
  selected: null,
  env: 'dark',
  time: 0,
  panelsVisible: true,
};

const COMPONENT_DATA = {
  panel: {
    name: 'Display Panel',
    purpose: 'RGB LED advertising surface that translates linearly to create kinetic effects.',
    how: 'Mounted on a sliding carriage driven by a conceptual crank-slider mechanism.',
    connects: 'Linear guide + LED power/data lines.',
    moves: 'Guided linear travel (demonstration stroke).',
    consider: 'Mass, balance, cable management, LED density, structural rigidity.',
    status: 'CONCEPTUAL — final dimensions & travel distance require confirmation.'
  },
  frame: {
    name: 'Supporting Frame',
    purpose: 'Primary structural chassis for the 2×2 kinetic array.',
    how: 'Provides rigid mounting points for guides, servos and electronics.',
    connects: 'All mechanical and electronic sub-assemblies.',
    moves: 'Static.',
    consider: 'Material stiffness, vibration isolation, service access.',
    status: 'CONCEPTUAL geometry.'
  },
  servo: {
    name: 'Servo (Conceptual)',
    purpose: 'Rotary actuator that drives the crank of the slider mechanism.',
    how: 'Receives PWM from ESP32; converts rotation into linear panel motion via crank.',
    connects: 'Signal + power from control board; mechanical coupling to crank.',
    moves: 'Continuous or limited rotation (demonstration only).',
    consider: 'Torque, speed, duty cycle, mounting, power budget.',
    status: 'PROPOSED — servo model, torque rating and final selection NOT CONFIRMED.'
  },
  crank: {
    name: 'Crank Arm',
    purpose: 'Converts servo rotary motion into reciprocating linear motion.',
    how: 'Offset pin drives connecting rod.',
    connects: 'Servo output shaft ↔ connecting rod.',
    moves: 'Rotates with servo.',
    consider: 'Crank radius determines stroke; balance and bearing life.',
    status: 'CONCEPTUAL mechanism — dimensions not validated.'
  },
  rod: {
    name: 'Connecting Rod',
    purpose: 'Transmits force from crank to sliding carriage.',
    how: 'Pinned joints at both ends.',
    connects: 'Crank pin ↔ carriage.',
    moves: 'Oscillates.',
    consider: 'Buckling, joint clearance, lubrication.',
    status: 'CONCEPTUAL.'
  },
  carriage: {
    name: 'Sliding Carriage',
    purpose: 'Carries the display panel along the linear guide.',
    how: 'Constrained by linear rails; driven by connecting rod.',
    connects: 'Rod + panel + guide.',
    moves: 'Linear translation.',
    consider: 'Friction, play, cable drag, end-stops.',
    status: 'CONCEPTUAL.'
  },
  guide: {
    name: 'Linear Guide',
    purpose: 'Constrains panel motion to a single axis.',
    how: 'Rail + carriage bearing arrangement (simplified).',
    connects: 'Frame ↔ carriage.',
    moves: 'Relative sliding.',
    consider: 'Stiffness, parallelism, preload.',
    status: 'CONCEPTUAL.'
  },
  esp32: {
    name: 'ESP32 DevKit (Proposed)',
    purpose: 'Main microcontroller: Wi-Fi AP, LED driving, servo control, web UI host.',
    how: 'Runs firmware that accepts JSON configuration over local Wi-Fi and drives peripherals.',
    connects: 'USB programming, GPIO to LEDs & servos, power.',
    moves: 'Static.',
    consider: 'GPIO allocation, power domains, antenna clearance, EMI.',
    status: 'PROPOSED starter model. PIN ASSIGNMENTS REQUIRE CONFIRMATION — DO NOT CONNECT YET.'
  },
  led: {
    name: 'RGB LED System',
    purpose: 'Illuminates each panel with controllable colour and brightness.',
    how: 'Addressable or parallel RGB strips/modules (implementation TBD).',
    connects: 'Data + power from ESP32 / separate supply with common ground.',
    moves: 'Static on panel.',
    consider: 'Current budget, heat, data rate, voltage drop.',
    status: 'REQUIREMENT confirmed at high level; specific LED type & ratings NOT CONFIRMED.'
  },
  power: {
    name: 'Power Distribution',
    purpose: 'Supplies regulated power to ESP32, LEDs and servos.',
    how: 'Separate high-current paths recommended; common ground essential.',
    connects: 'PSU → distribution → loads.',
    moves: 'Static.',
    consider: 'Current capacity, fusing, decoupling, ground loops.',
    status: 'ARCHITECTURE conceptual. Ratings require confirmation.'
  }
};

// ─────────────────────────────────────────────
// THREE.JS SETUP
// ─────────────────────────────────────────────
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0e1a);
scene.fog = new THREE.FogExp2(0x0a0e1a, 0.018);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(4.5, 3.2, 5.5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
container.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
container.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 1.5;
controls.maxDistance = 18;
controls.target.set(0, 0.8, 0);
controls.update();

// Lights
const ambient = new THREE.AmbientLight(0x334466, 0.45);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
keyLight.position.set(5, 8, 4);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 25;
keyLight.shadow.camera.left = -6;
keyLight.shadow.camera.right = 6;
keyLight.shadow.camera.top = 6;
keyLight.shadow.camera.bottom = -6;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x4488ff, 0.35);
fillLight.position.set(-4, 3, -2);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0x00e5ff, 0.25);
rimLight.position.set(0, 2, -5);
scene.add(rimLight);

const hemi = new THREE.HemisphereLight(0x1a2a4a, 0x0a0e1a, 0.4);
scene.add(hemi);

// Floor / workshop
const floorGeo = new THREE.PlaneGeometry(30, 30);
const floorMat = new THREE.MeshStandardMaterial({
  color: 0x0d1220,
  roughness: 0.85,
  metalness: 0.1,
});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Grid
const grid = new THREE.GridHelper(20, 40, 0x1a3040, 0x121a28);
grid.position.y = 0.01;
scene.add(grid);

// Workbench surface under display
const benchGeo = new THREE.BoxGeometry(3.6, 0.08, 2.4);
const benchMat = new THREE.MeshStandardMaterial({ color: 0x1a2235, roughness: 0.6, metalness: 0.3 });
const bench = new THREE.Mesh(benchGeo, benchMat);
bench.position.set(0, 0.04, 0);
bench.receiveShadow = true;
bench.castShadow = true;
scene.add(bench);
