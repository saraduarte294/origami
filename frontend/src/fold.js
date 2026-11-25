// Motor de plegado: el papel es una lista de polígonos convexos apilados en capas (z).
// Cada pliegue corta los polígonos por la línea y refleja el lado que se mueve.
const EPS = 1e-9, TH = 0.025; // TH = grosor visual de cada capa
const unit = ([x, y]) => { const l = Math.hypot(x, y); return [x / l, y / l]; };
const area = (p) => { let a = 0; for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; a += x1 * y2 - x2 * y1; } return a / 2; };

function clip(pts, f) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], fa = f(a), fb = f(b);
    if (fa >= -EPS) out.push(a);
    if ((fa > EPS && fb < -EPS) || (fa < -EPS && fb > EPS)) {
      const t = fa / (fa - fb);
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  }
  return out.length >= 3 && Math.abs(area(out)) > 1e-6 ? out : null;
}

export function paperPolys(p) {
  const pts = p.pts || [[-p.w / 2, -p.h / 2], [p.w / 2, -p.h / 2], [p.w / 2, p.h / 2], [-p.w / 2, p.h / 2]];
  return normalize([{ pts, z: 0, back: false }]);
}

function normalize(polys) {
  const zs = [...new Set(polys.map((q) => q.z))].sort((a, b) => a - b);
  return polys.map((q) => ({ pts: area(q.pts) < 0 ? [...q.pts].reverse() : q.pts, z: zs.indexOf(q.z), back: q.back }));
}

// op: {type:'fold', p:[x,y], d:[dx,dy], m:[x,y], zmin?}  |  {type:'flip'}
// p,d = línea del doblez; m = un punto del lado que se mueve; zmin = solo capas >= zmin
function plan(polys, op) {
  const zmax = Math.max(...polys.map((q) => q.z));
  if (op.type === 'flip') return { kind: 'flip', items: polys.map((q) => ({ ...q, zNew: zmax - q.z })) };
  const [dx, dy] = unit(op.d), nx = -dy, ny = dx, [px, py] = op.p;
  const s = (q) => (q[0] - px) * nx + (q[1] - py) * ny;
  const sm = Math.sign(s(op.m)) || 1;
  const stay = [], move = [];
  for (const q of polys) {
    if (q.z < (op.zmin ?? -Infinity)) { stay.push(q); continue; }
    const a = clip(q.pts, (r) => sm * s(r)), b = clip(q.pts, (r) => -sm * s(r));
    if (a) move.push({ ...q, pts: a });
    if (b) stay.push({ ...q, pts: b });
  }
  const zm = move.length ? Math.max(...move.map((q) => q.z)) : 0;
  move.forEach((q) => (q.zNew = zmax + 1 + (zm - q.z)));
  stay.forEach((q) => (q.zNew = q.z));
  return { kind: 'fold', stay, move, p: [px, py], d: [dx, dy], u: [sm * nx, sm * ny], n: [nx, ny] };
}

export function applyOp(polys, op) {
  if (!op) return polys;
  const pl = plan(polys, op);
  if (pl.kind === 'flip')
    return normalize(pl.items.map((q) => ({ pts: q.pts.map(([x, y]) => [-x, y]), z: q.zNew, back: !q.back })));
  const [px, py] = pl.p, [nx, ny] = pl.n;
  const refl = ([x, y]) => { const s = (x - px) * nx + (y - py) * ny; return [x - 2 * s * nx, y - 2 * s * ny]; };
  return normalize([
    ...pl.stay.map((q) => ({ pts: q.pts, z: q.z, back: q.back })),
    ...pl.move.map((q) => ({ pts: q.pts.map(refl), z: q.zNew, back: !q.back })),
  ]);
}

export function buildStates(plegado) {
  const st = [paperPolys(plegado.papel)];
  plegado.ops.forEach((op) => st.push(applyOp(st[st.length - 1], op)));
  return st;
}

// Caras 3D del papel en el instante k (0..1) del pliegue "op"
export function frame(polys, op, k = 1) {
  if (!op) return polys.map((q) => ({ back: q.back, pts3: q.pts.map(([x, y]) => [x, y, q.z * TH]) }));
  const pl = plan(polys, op), th = k * Math.PI, c = Math.cos(th), sn = Math.sin(th);
  const lerp = (a, b) => (a + (b - a) * k) * TH;
  if (pl.kind === 'flip')
    return pl.items.map((q) => ({ back: q.back, pts3: q.pts.map(([x, y]) => [x * c, y, x * sn + lerp(q.z, q.zNew)]) }));
  const [px, py] = pl.p, [dx, dy] = pl.d, [ux, uy] = pl.u;
  const still = pl.stay.map((q) => ({ back: q.back, pts3: q.pts.map(([x, y]) => [x, y, q.z * TH]) }));
  const moving = pl.move.map((q) => ({
    back: q.back,
    pts3: q.pts.map(([x, y]) => {
      const rx = x - px, ry = y - py, a = rx * dx + ry * dy, h = rx * ux + ry * uy;
      return [px + a * dx + h * c * ux, py + a * dy + h * c * uy, h * sn + lerp(q.z, q.zNew)];
    }),
  }));
  return [...still, ...moving];
}
