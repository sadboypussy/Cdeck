/** CRT post-effect overlay for the scanner / video zone. */
export function startCrt(canvas, hostEl) {
  const ctx = canvas.getContext("2d", { alpha: true });
  let energy = 0;
  let targetEnergy = 0;
  let raf = 0;
  let t = 0;

  function resize() {
    const rect = hostEl.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    const w = hostEl.clientWidth;
    const h = hostEl.clientHeight;
    if (w < 1 || h < 1) {
      raf = requestAnimationFrame(draw);
      return;
    }

    ctx.clearRect(0, 0, w, h);
    energy += (targetEnergy - energy) * 0.42;
    t += 0.016;

    // Scanlines — subtle (felt, not seen)
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 1);
    }

    // Moving bright scan beam
    const beamY = ((t * 36 + Math.sin(t * 0.7) * 14) % (h + 60)) - 30;
    const grad = ctx.createLinearGradient(0, beamY - 16, 0, beamY + 16);
    grad.addColorStop(0, "rgba(121, 255, 225, 0)");
    grad.addColorStop(0.45, `rgba(121, 255, 225, ${0.02 + energy * 0.05})`);
    grad.addColorStop(0.55, `rgba(121, 255, 225, ${0.04 + energy * 0.08})`);
    grad.addColorStop(1, "rgba(121, 255, 225, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, beamY - 20, w, 40);

    // Vignette
    const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.85);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    // Chromatic fringe (subtle RGB split at edges)
    const fringe = 1 + energy * 2;
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(255, 61, 122, ${0.025 + energy * 0.03})`;
    ctx.fillRect(fringe, 0, w, h);
    ctx.fillStyle = `rgba(121, 255, 225, ${0.025 + energy * 0.03})`;
    ctx.fillRect(-fringe, 0, w, h);
    ctx.globalCompositeOperation = "source-over";

    // Film noise
    const noiseCount = Math.floor(4 + energy * 10);
    for (let i = 0; i < noiseCount; i++) {
      const nx = Math.random() * w;
      const ny = Math.random() * h;
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`;
      ctx.fillRect(nx, ny, 1, 1);
    }

    raf = requestAnimationFrame(draw);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(hostEl);
  resize();
  draw();

  return {
    setEnergy(e) {
      targetEnergy = e;
    },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
    },
  };
}
