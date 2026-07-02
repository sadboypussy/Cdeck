/** Ambient particle field — zone audio (direction B) */

let canvas, ctx, w, h, particles, rafId;
let energy = 0;
let targetEnergy = 0;

function initParticles(count) {
  particles = Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 0.5 + Math.random() * 1.5,
    vx: (Math.random() - 0.5) * 0.0004,
    vy: (Math.random() - 0.5) * 0.0004,
    a: 0.15 + Math.random() * 0.35,
  }));
}

export function startAmbient(el) {
  canvas = el;
  ctx = canvas.getContext("2d");
  initParticles(48);
  resize();
  window.addEventListener("resize", resize);
  loop();
}

export function setAmbientEnergy(e) {
  targetEnergy = e;
}

function resize() {
  if (!canvas?.parentElement) return;
  w = canvas.parentElement.clientWidth;
  h = canvas.parentElement.clientHeight;
  canvas.width = w * devicePixelRatio;
  canvas.height = h * devicePixelRatio;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

function loop() {
  if (!ctx) return;
  energy += (targetEnergy - energy) * 0.38;
  ctx.clearRect(0, 0, w, h);

  const cx = w * 0.5;
  const cy = h * 0.45;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.55);
  grad.addColorStop(0, `rgba(121, 255, 225, ${0.06 + energy * 0.08})`);
  grad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (const p of particles) {
    p.x += p.vx * (1 + energy * 2);
    p.y += p.vy * (1 + energy * 2);
    if (p.x < 0 || p.x > 1) p.vx *= -1;
    if (p.y < 0 || p.y > 1) p.vy *= -1;

    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, p.r * (1 + energy), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(121, 255, 225, ${p.a * (0.4 + energy * 0.6)})`;
    ctx.fill();
  }

  rafId = requestAnimationFrame(loop);
}

export function stopAmbient() {
  if (rafId) cancelAnimationFrame(rafId);
}
