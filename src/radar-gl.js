import * as THREE from "./vendor/three.module.js";

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

  const sweepGroup = new THREE.Group();
  const sweep = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 0.04),
    new THREE.MeshBasicMaterial({
      color: 0x79ffe1,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    })
  );
  sweepGroup.add(sweep);
  sweepGroup.position.z = 0.01;
  scene.add(sweepGroup);

  const linkGroup = new THREE.Group();
  const nodeGroup = new THREE.Group();
  scene.add(linkGroup, nodeGroup);

  const centerMat = new THREE.MeshStandardMaterial({
    color: 0x79ffe1,
    emissive: 0x79ffe1,
    emissiveIntensity: 1.1,
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
  let neighborNodes = [];
  let linkLines = null;
  let energy = 0;
  let peak = 0;
  let sweepAngle = 0;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let onSelect = () => {};

  function resize() {
    const parent = canvas.parentElement;
    if (!parent || parent.clientWidth < 1 || parent.clientHeight < 1) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function clearLinks() {
    if (!linkLines) return;
    linkGroup.remove(linkLines);
    linkLines.geometry.dispose();
    linkLines.material.dispose();
    linkLines = null;
  }

  function clearNeighbors() {
    neighborNodes.forEach((g) => {
      nodeGroup.remove(g);
      g.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
      });
    });
    neighborNodes = [];
    clearLinks();
  }

  function layoutNeighbors(ids) {
    clearNeighbors();
    const count = Math.min(ids.length, MAX_NEIGHBORS);
    if (count === 0) return;

    const positions = [];
    ids.slice(0, MAX_NEIGHBORS).forEach((id, i) => {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * NEIGHBOR_RADIUS;
      const y = Math.sin(angle) * NEIGHBOR_RADIUS;
      positions.push(x, y, 0);

      const group = new THREE.Group();
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 24), neighborMat.clone());
      mesh.position.set(x, y, 0);
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 12, 12),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hit.position.set(x, y, 0);
      hit.userData = { id };
      group.userData = { id, visual: mesh };
      group.add(mesh, hit);
      nodeGroup.add(group);
      neighborNodes.push(group);
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
    if (rect.width < 1 || rect.height < 1) return;
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(neighborNodes, true);
    for (const hit of hits) {
      let obj = hit.object;
      while (obj) {
        if (obj.userData?.id) {
          onSelect(obj.userData.id);
          return;
        }
        obj = obj.parent;
      }
    }
  }

  function tick() {
    sweepAngle += 0.012 + energy * 0.006;
    sweepGroup.rotation.z = sweepAngle;
    ringGroup.rotation.z = sweepAngle * 0.15;

    centerMesh.scale.setScalar(1 + energy * 0.08);
    centerMat.emissiveIntensity = 0.55 + energy * 0.75 + peak * 0.35;
    sweep.material.opacity = 0.4 + energy * 0.25 + peak * 0.2;

    neighborNodes.forEach((g, i) => {
      const mesh = g.userData.visual;
      if (!mesh) return;
      mesh.scale.setScalar(peak > 0.25 && i % 2 === 0 ? 1 + peak * 0.25 : 1);
      if (mesh.material?.emissiveIntensity !== undefined) {
        mesh.material.emissiveIntensity = 0.2 + energy * 0.4;
      }
    });

    if (linkLines) {
      linkLines.material.opacity = 0.2 + energy * 0.25;
    }

    renderer.render(scene, camera);
  }

  canvas.addEventListener("click", (e) => pick(e.clientX, e.clientY));

  const ro = new ResizeObserver(() => resize());
  if (canvas.parentElement) ro.observe(canvas.parentElement);

  return {
    resize,
    setNote,
    setEnergy,
    tick,
    onSelect: (fn) => {
      onSelect = fn;
    },
    getState: () => state,
    destroy: () => ro.disconnect(),
  };
}
