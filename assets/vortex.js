(() => {
  const field  = document.getElementById('field');
  const gBack  = document.getElementById('g-back');
  const gVort  = document.getElementById('g-vortex');
  const gFront = document.getElementById('g-front');
  const narrowQ = matchMedia('(max-width: 1039px)');
  const still   = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const TURNS = 9;          // nine turns, tightening to one point
  const TILT  = 0.26;       // how far the eye sits above the axis
  const f = n => n.toFixed(1);

  let W, H, cx, R0, depth, mouthY, spineY, narrow;

  function layout() {
    W = field.clientWidth; H = field.clientHeight;
    narrow = narrowQ.matches;
    if (narrow) {
      cx = W * 0.5;
      R0 = Math.min(W * 0.33, 170);
      spineY = H * 0.62;
      depth  = H * 0.34;
    } else {
      cx = W * 0.62;
      R0 = Math.min(W * 0.2, H * 0.38);
      spineY = H * 0.74;
      depth  = H * 0.56;
    }
    // keep the funnel's proportion on tall screens, and its dimension on short ones
    depth  = Math.min(depth, R0 * (narrow ? 2.2 : 1.9), spineY - (R0 * TILT + 64));
    mouthY = spineY - depth;

    field.style.setProperty('--head-bottom', f(H - spineY + 22) + 'px');
    field.style.setProperty('--head-max',    f(Math.max(260, cx - R0 - 150)) + 'px');
    field.style.setProperty('--sub-top',     f(spineY + 24) + 'px');
    field.style.setProperty('--head-top',    f(spineY + 36) + 'px');
  }

  /* a point on the vortex: u = 0 at the mouth, 1 at the point */
  function P(u, phi) {
    const r = R0 * Math.pow(1 - u, 1.6);
    const s = 1 - Math.pow(1 - u, 1.35);
    const a = u * TURNS * 2 * Math.PI + phi;
    const z = Math.sin(a);
    return [cx + r * Math.cos(a), mouthY + depth * s + r * z * TILT, z];
  }

  function hairArc(k, a0, a1, cy) {
    let d = '';
    for (let i = 0; i <= 48; i++) {
      const a = (a0 + (a1 - a0) * i / 48) * Math.PI / 180;
      d += (i ? 'L' : 'M') + f(cx + R0 * k * Math.cos(a)) + ' ' + f(cy + R0 * k * TILT * Math.sin(a));
    }
    return d;
  }

  const slash = (x, y) => `M${f(x - 5)} ${f(y + 5)}L${f(x + 5)} ${f(y - 5)}`;

  /* ── the vortex, the only thing that moves ─────────────── */
  function drawVortex(phi) {
    const n = TURNS * 150, B = 18;
    const runs = [];
    let prev = P(0, phi), key = null, d = '', bucket = 0, front = true;
    for (let i = 1; i <= n; i++) {
      const u = (i / n) * 0.996;
      const p = P(u, phi);
      const fr = (p[2] + prev[2]) > 0;
      const b  = Math.min(B - 1, Math.floor(u * B));
      const k  = (fr ? 'f' : 'b') + b;
      if (k !== key) {
        if (key) runs.push([d, bucket, front]);
        key = k; bucket = b; front = fr;
        d = `M${f(prev[0])} ${f(prev[1])}`;
      }
      d += `L${f(p[0])} ${f(p[1])}`;
      prev = p;
    }
    d += `L${f(cx)} ${f(spineY)}`;
    runs.push([d, bucket, front]);

    let out = '';
    for (const [path, b, fr] of runs) {
      const t = b / (B - 1);
      const w = 1.35 - 0.7 * t;                    // finer toward the point
      const o = (0.5 + 0.48 * t) * (fr ? 1 : 0.3); // denser toward the point
      const dash = (!fr && t < 0.4) ? ' stroke-dasharray="5 4"' : '';
      out += `<path d="${path}" fill="none" stroke="#1b2640" stroke-width="${w.toFixed(2)}" stroke-opacity="${o.toFixed(3)}" stroke-linecap="round"${dash}/>`;
    }
    gVort.innerHTML = out;
  }

  /* ── everything fixed ───────────────────────────────────── */
  function drawStatic() {
    const ink = '#1b2640', acc = 'var(--accent)';
    const mouthTop = mouthY - R0 * TILT;
    let back = '', front = '';

    // ground shade under the point — the form has somewhere to stand
    back += `<ellipse cx="${f(cx)}" cy="${f(spineY)}" rx="${f(R0 * 0.62)}" ry="${f(R0 * 0.62 * TILT * 0.55)}" fill="url(#shade)"/>`;

    // volume the vortex let go of: broken, dashed, never closed
    back += `<path d="${hairArc(1.17, 188, 322, mouthY)}" fill="none" stroke="${ink}" stroke-opacity=".2" stroke-width=".8" stroke-dasharray="2 5"/>`;
    back += `<path d="${hairArc(1.36, 212, 268, mouthY - 6)}" fill="none" stroke="${ink}" stroke-opacity=".12" stroke-width=".8" stroke-dasharray="2 6"/>`;
    back += `<path d="${hairArc(1.26, 18, 52, mouthY + 4)}" fill="none" stroke="${ink}" stroke-opacity=".13" stroke-width=".8" stroke-dasharray="2 6"/>`;

    // centre line (dash-dot)
    const dimY = mouthTop - (narrow ? 30 : 40);
    back += `<path d="M${f(cx)} ${f(dimY + 12)}V${f(spineY - 14)}" stroke="${ink}" stroke-opacity=".3" stroke-width=".7" stroke-dasharray="22 5 3 5"/>`;

    // SPINE — straightedge, edge to edge, crisp
    front += `<path d="M0 ${f(spineY)}H${f(W)}" stroke="${ink}" stroke-width="2" shape-rendering="crispEdges"/>`;
    if (!narrow) {
      const dx = W - 74;
      front += `<path d="M${f(dx - 6)} ${f(spineY - 10)}H${f(dx + 6)}L${f(dx)} ${f(spineY - 1)}Z" fill="${ink}" fill-opacity=".75"/>`;
      front += `<text class="t-mono t-soft" x="${f(dx + 12)}" y="${f(spineY - 7)}">±0.000</text>`;
    }

    // dimension — across the mouth
    const xL = cx - R0, xR = cx + R0, dimStroke = `stroke="${ink}" stroke-opacity=".62" stroke-width=".8"`;
    front += `<path d="M${f(xL)} ${f(mouthY - 8)}V${f(dimY - 6)}M${f(xR)} ${f(mouthY - 8)}V${f(dimY - 6)}" ${dimStroke}/>`;
    front += `<path d="M${f(xL - 8)} ${f(dimY)}H${f(xR + 8)}" ${dimStroke}/>`;
    front += `<path d="${slash(xL, dimY)}${slash(xR, dimY)}" stroke="${ink}" stroke-width="1.2"/>`;
    front += `<text class="t-mono" x="${f(cx)}" y="${f(dimY - 8)}" text-anchor="middle">Ø ${(2 * R0).toFixed(1)}</text>`;

    // dimension — depth, mouth plane to spine
    if (!narrow) {
      const xd = xL - 52;
      front += `<path d="M${f(xL - 8)} ${f(mouthY)}H${f(xd - 8)}" ${dimStroke}/>`;
      front += `<path d="M${f(xd)} ${f(mouthY - 8)}V${f(spineY + 8)}" ${dimStroke}/>`;
      front += `<path d="${slash(xd, mouthY)}${slash(xd, spineY)}" stroke="${ink}" stroke-width="1.2"/>`;
      front += `<text class="t-mono" text-anchor="middle" transform="translate(${f(xd - 9)} ${f((mouthY + spineY) / 2)}) rotate(-90)">${depth.toFixed(1)}</text>`;
    }

    // CIRCUIT — the one live point
    const px = cx, py = spineY;
    front += `<path d="M${f(px - 17)} ${f(py)}H${f(px - 8)}M${f(px + 8)} ${f(py)}H${f(px + 17)}M${f(px)} ${f(py - 17)}V${f(py - 8)}M${f(px)} ${f(py + 8)}V${f(py + 17)}" stroke="${ink}" stroke-width=".8" stroke-opacity=".7"/>`;
    front += `<circle cx="${f(px)}" cy="${f(py)}" r="8" fill="none" stroke="${acc}" stroke-width="1"/>`;
    front += `<circle cx="${f(px)}" cy="${f(py)}" r="3.6" fill="${acc}"/>`;
    if (!still) {
      front += `<circle cx="${f(px)}" cy="${f(py)}" r="8" fill="none" stroke="${acc}" stroke-width=".8">
        <animate attributeName="r" values="8;26" dur="3.6s" repeatCount="indefinite"/>
        <animate attributeName="stroke-opacity" values=".55;0" dur="3.6s" repeatCount="indefinite"/></circle>`;
    }
    if (narrow) {
      front += `<path d="M${f(px + 6)} ${f(py - 6)}L${f(px + 26)} ${f(py - 26)}H${f(px + 132)}" fill="none" stroke="${acc}" stroke-width=".8"/>`;
      front += `<text class="t-mono t-soft" x="${f(px + 32)}" y="${f(py - 48)}" id="theta">θ 000.00°</text>`;
      front += `<text class="t-mono t-acc"  x="${f(px + 32)}" y="${f(py - 32)}" id="clock">T 00:00:00</text>`;
    } else {
      front += `<path d="M${f(px + 7)} ${f(py + 7)}L${f(px + 30)} ${f(py + 30)}H${f(px + 190)}" fill="none" stroke="${acc}" stroke-width=".8"/>`;
      front += `<text class="t-mono t-acc"  x="${f(px + 36)}" y="${f(py + 50)}" id="clock">T 00:00:00</text>`;
      front += `<text class="t-mono t-soft" x="${f(px + 36)}" y="${f(py + 67)}" id="theta">θ 000.00°</text>`;
    }

    // THREAD — a note in another hand, on a line drawn by hand
    let nx, ny, tx, ty, sx, sy, c1, c2;
    if (narrow) {
      const u = 0.08, r = R0 * Math.pow(1 - u, 1.6);
      nx = 20; ny = 46;
      tx = cx - r - 5; ty = mouthY + depth * (1 - Math.pow(1 - u, 1.35));
      sx = nx + 18; sy = ny + 34;
      c1 = [sx - 6, sy + 60]; c2 = [tx - 40, ty - 30];
    } else {
      const u = 0.22, r = R0 * Math.pow(1 - u, 1.6);
      nx = Math.min(xR + 58, W - 230); ny = mouthY + depth * 0.14;
      tx = cx + r + 6; ty = mouthY + depth * (1 - Math.pow(1 - u, 1.35));
      sx = nx - 10; sy = ny + 32;
      c1 = [sx - 12, sy + 44]; c2 = [tx + 58, ty + 18];
    }
    front += `<text class="t-note" x="${f(nx)}" y="${f(ny)}"><tspan x="${f(nx)}">each pass tighter</tspan><tspan x="${f(nx)}" dy="22">than the last.</tspan></text>`;

    let hd = '', last = null, prevPt = null;
    const N = 26;
    for (let i = 0; i <= N; i++) {
      const t = i / N, m = 1 - t;
      let x = m*m*m*sx + 3*m*m*t*c1[0] + 3*m*t*t*c2[0] + t*t*t*tx;
      let y = m*m*m*sy + 3*m*m*t*c1[1] + 3*m*t*t*c2[1] + t*t*t*ty;
      const wob = Math.sin(i * 1.9) * 0.9 * Math.sin(Math.PI * t);
      x += wob; y -= wob * 0.6;
      hd += (i ? 'L' : 'M') + f(x) + ' ' + f(y);
      prevPt = last; last = [x, y];
    }
    const ang = Math.atan2(last[1] - prevPt[1], last[0] - prevPt[0]);
    const barb = (len, off) => `M${f(last[0])} ${f(last[1])}L${f(last[0] - len * Math.cos(ang + off))} ${f(last[1] - len * Math.sin(ang + off))}`;
    front += `<path d="${hd}${barb(10, 0.42)}${barb(7.5, -0.5)}" fill="none" stroke="${ink}" stroke-opacity=".62" stroke-width=".95" stroke-linecap="round" stroke-linejoin="round"/>`;

    // graphic scale
    if (!narrow) {
      const x0 = W - 40 - 160, y0 = H - 30;
      for (let i = 0; i < 4; i++) {
        front += `<rect x="${x0 + i * 40}" y="${f(y0)}" width="40" height="4" fill="${i % 2 ? 'none' : ink}" fill-opacity=".7" stroke="${ink}" stroke-opacity=".7" stroke-width=".7"/>`;
      }
    }

    gBack.innerHTML = back;
    gFront.innerHTML = front;
  }

  /* ── live ───────────────────────────────────────────────── */
  const pad = n => String(n).padStart(2, '0');
  function tickClock() {
    const d = new Date();
    const c = document.getElementById('clock');
    if (c) c.textContent = `T ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    const dt = document.getElementById('date');
    if (dt) dt.textContent = `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
  }

  const PERIOD = 200000; // one full turn every 200 s
  let phi = 0;
  function frame(now) {
    phi = -((now % PERIOD) / PERIOD) * 2 * Math.PI;
    drawVortex(phi);
    const th = document.getElementById('theta');
    if (th) th.textContent = `θ ${((-phi * 180 / Math.PI) % 360).toFixed(2).padStart(6, '0')}°`;
    requestAnimationFrame(frame);
  }

  function render() {
    layout();
    drawStatic();
    drawVortex(phi);
    tickClock();
  }

  new ResizeObserver(render).observe(field);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
  setInterval(tickClock, 1000);
  render();
  if (still) {
    const th = document.getElementById('theta');
    if (th) th.textContent = 'θ 000.00°';
  } else {
    requestAnimationFrame(frame);
  }
})();
