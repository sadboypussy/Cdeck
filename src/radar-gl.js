import * as THREE from "three";

const NEIGHBOR_RADIUS = 1.35;
const MAX_NEIGHBORS = 4;

export function createRadar(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
  camera.position.set(0, 0.2, 4.2);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0x112233, 0.6));
  const keyLight = new THREE.PointLight(0x79ffe1, 1.2, 12);
  keyLight.position.set(2, 2, 3);
  scene.add(keyLight);
  const rimLight = new THREE.PointLight(0xff0055, 0.5, 10);
  rimLight.position.set(-2, -1, 2);
  scene.add(rimLight);

  const ringGroup = new THREE.Group();
  [1.9, 1.35, 0.75].forEach((r, i) => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(r - 0.008, r, 64),
      new THREE.MeshBasicMaterial({
        color: 0x79ffe1,
        transparent: true,
        opacity: 0.08 + i * 0.04,
        side: THREE.DoubleSide,
      })
    );
    ringGroup.add(ring);
  });
  scene.add(ringGroup);

  const sweep = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 0.02),
    new THREE.MeshBasicMaterial({
      color: 0x79ffe1,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    })
  );
  sweep.position.z = 0.01;
  scene.add(sweep);

  const linkGroup = new THREE.Group();
  const nodeGroup = new THREE.Group();
  scene.add(linkGroup, nodeGroup);

  const centerMat = new THREE.MeshStandardMaterial({
    color: 0x79ffe1,
    emissive: 0x79ffe1,
    emissiveIntensity: 0.8,
    metalness: 0.3,
    roughness: 0.4,
  });
  const neighborMat = new THREE.MeshStandardMaterial({
    color: 0x0a1520,
    emissive: 0x79ffe1,
    emissiveIntensity: 0.35,
    metalness: 0.5,
    roughness: 0.3,
  });

  const centerMesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 32, 32), centerMat);
  nodeGroup.add(centerMesh);

  let state = { id: "", neighbors: [] };
  let neighborMeshes = [];
  let linkLines = null;
  let energy = 0;
  let peak = 0;
  let sweepAngle = 0;
  let raycaster = new THREE.Raycaster();
  let pointer = new THREE.Vector2();
  let onSelect = () => {};

  function resize() {
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    if (w < 1 || h < 1) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function clearLinks() {
    if (linkLines) {
      linkGroup.remove(linkLines);
      linkLines.geometry.dispose();
      linkLines.material.dispose();
      linkLines = null;
    }
  }

  function clearNeighbors() {
    neighborMeshes.forEach((m) => {
      nodeGroup.remove(m);
      m.geometry.dispose();
    });
    neighborMeshes = [];
    clearLinks();
  }

  function layoutNeighbors(ids) {
    clearNeighbors();
    const count = Math.min(ids.length, MAX_NEIGHBORS);
    if (count === 0) return;

    const positions = [];
    neighborMeshes = ids.slice(0, MAX_NEIGHBORS).map((id, i) => {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * NEIGHBOR_RADIUS;
      const y = Math.sin(angle) * NEIGHBOR_RADIUS;
      positions.push(x, y, 0);

      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 24), neighborMat.clone());
      mesh.position.set(x, y, 0);
      mesh.userData = { id };
      nodeGroup.add(mesh);
      return mesh;
    });

    const lineGeo = new THREE.BufferGeometry();
    const verts = [];
    for (let i = 0; i < count; i++) {
      verts.push(0, 0, 0, positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
    }
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    linkLines = new THREE.LineSegments(
      lineGeo,
      new THREE.LineBasicMaterial({
        color: 0x79ffe1,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      })
    );
    linkGroup.add(linkLines);
  }

  function setNote(note) {
    state = { id: note.id, neighbors: note.neighbors ?? [] };
    layoutNeighbors(state.neighbors);
    return state;
  }

  function setEnergy(e, p) {
    energy = e;
    peak = p;
  }

  function pick(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(neighborMeshes, false);
    if (hits.length > 0 && hits[0].object.userData.id) {
      onSelect(hits[0].object.userData.id);
    }
  }

  function tick() {
    sweepAngle += 0.012;
    sweep.rotation.z = sweepAngle;
    ringGroup.rotation.z = sweepAngle * 0.15;

    const breathe = 1 + energy * 0.08;
    centerMesh.scale.setScalar(breathe);
    centerMat.emissiveIntensity = 0.5 + energy * 0.6;

    neighborMeshes.forEach((m, i) => {
      const pulse = peak > 0.25 && i % 2 === 0 ? 1 + peak * 0.25 : 1;
      m.scale.setScalar(pulse);
      m.material.emissiveIntensity = 0.2 + energy * 0.4;
    });

    if (linkLines) {
      linkLines.material.opacity = 0.2 + energy * 0.25;
    }

    renderer.render(scene, camera);
  }

  canvas.addEventListener("click", (e) => pick(e.clientX, e.clientY));

  return {
    resize,
    setNote,
    setEnergy,
    tick,
    onSelect: (fn) => {
      onSelect = fn;
    },
    getState: () => state,
  };
}
