import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Scene setup
const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(4, 5, 11);

// Controls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 5;
controls.maxDistance = 20;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = 1.5;
controls.autoRotate = false;
controls.target = new THREE.Vector3(0, 1, 0);
controls.update();

// Ground setup
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, side: THREE.DoubleSide });
const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(20, 20, 32, 32).rotateX(-Math.PI / 2), groundMaterial);
groundMesh.castShadow = false;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

// Lighting setup
scene.add(new THREE.AmbientLight(0xffffff, 1));
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 15, -10);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Model loading variables
let currentMesh = null;
let models = {
  'Falcon': { path: 'public/models/millennium_falcon/', file: 'scene1.gltf', scale: [1, 1, 1] },
  'Adam Head': { path: 'public/models/adamHead/', file: 'adamHead.gltf', scale: [1, 1, 1] },
  'BiWaze': { path: 'public/models/export/', file: 'biwaze.gltf', scale: [0.02, 0.02, 0.02] }
};

let selectedModel = models['Falcon'];
// Dropdown model selection handler
document.getElementById('model-dropdown').addEventListener('change', function () {
  selectedModel = models[this.value] || models['Falcon'];
  loadModel(selectedModel.path, selectedModel.file, selectedModel.scale);
});
loadModel(selectedModel.path, selectedModel.file, selectedModel.scale);

// Load and display model
function loadModel(loaderPath, file, scale) {
  document.getElementById('features').innerHTML = '';
  if (currentMesh) scene.remove(currentMesh);

  const loader = new GLTFLoader().setPath(loaderPath);
  loader.load(file, (gltf) => {
    const mesh = gltf.scene;

    mesh.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.userData = { feature: 'This is a feature of the product.' };
      }
    });

    mesh.position.set(0, 1.15, -1);
    mesh.scale.set(...scale);
    scene.add(mesh);
    currentMesh = mesh;

    document.getElementById('progress-container').style.display = 'none';
    setupClickHandler(mesh);
  });
}

// Click handler for feature display
function setupClickHandler(mesh) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      const featureContainer = document.getElementById('features');
      featureContainer.innerHTML = intersects[0].object.userData.feature || 'No feature data available.';
    }
  }

  window.addEventListener('click', onMouseClick, false);
}

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  updateAnnotations();
}

animate();

// Function to update annotation positions
function updateAnnotations() {
  const vector1 = new THREE.Vector3(1, 1.5, -1);
  const vector2 = new THREE.Vector3(2, 2.5, -2);
  projectToScreen(vector1, 'annotation-1');
  projectToScreen(vector2, 'annotation-2');
}

function projectToScreen(vector, annotationId) {
  const canvas = renderer.domElement;
  const widthHalf = 0.5 * canvas.width;
  const heightHalf = 0.5 * canvas.height;

  vector.project(camera);

  const x = (vector.x * widthHalf) + widthHalf;
  const y = -(vector.y * heightHalf) + heightHalf;

  const annotation = document.getElementById(annotationId);
  // annotation.style.transform = `translate(${x}px, ${y}px)`;
}
