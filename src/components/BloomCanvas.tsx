import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type Point = { x: number; y: number };
type Curve = { start: Point; c1: Point; c2: Point; end: Point };

type PlantPhase = "SEED" | "ROOT" | "STEM" | "BRANCHES" | "LEAVES" | "BUD" | "BLOOM" | "ALIVE";

type Branch = {
  at: number;
  side: number;
  length: number;
  angle: number;
  curve: Curve;
  width: number;
  leaves: Leaf[];
  hasFlower: boolean;
  flower?: Flower;
};

type Leaf = {
  at: number;
  side: number;
  length: number;
  width: number;
  angle: number;
  hue: number;
  delay: number;
};

type Flower = {
  size: number;
  petals: number;
  tilt: number;
  colorIndex: number;
  delay: number;
};

type Plant = {
  id: number;
  seed: number;
  origin: Point;
  createdAt: number;
  phase: PlantPhase;
  dissolveStart?: number;
  scale: number;
  depth: number;
  height: number;
  stem: Curve;
  stemWidth: number;
  rootCurves: Curve[];
  branches: Branch[];
  leaves: Leaf[];
  flower: Flower;
  wind: number;
  velocity: number;
  swayOffset: number;
  growthDuration: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color?: string;
  kind: "pollen" | "firefly" | "bloom" | "dust";
};

type Palette = {
  background: string;
  backgroundDay: string;
  backgroundSunset: string;
  backgroundNight: string;
  backgroundDawn: string;
  haze: string;
  ground: string;
  stem: string;
  stemLight: string;
  leaf: string;
  leafLight: string;
  flower: string;
  flowerLight: string;
  flowerWarm: string;
  flowerAqua: string;
  flowerAquaLight: string;
  flowerMint: string;
  flowerMintLight: string;
  flowerLavender: string;
  flowerLavenderLight: string;
  flowerRose: string;
  flowerRoseLight: string;
  flowerAmber: string;
  flowerAmberLight: string;
  root: string;
  particle: string;
  firefly: string;
  ui: string;
};

type FlowerTone = {
  petal: string;
  light: string;
  center: string;
};

const PHASES: Array<{ phase: PlantPhase; at: number }> = [
  { phase: "SEED", at: 0 },
  { phase: "ROOT", at: 0.08 },
  { phase: "STEM", at: 0.24 },
  { phase: "BRANCHES", at: 0.42 },
  { phase: "LEAVES", at: 0.56 },
  { phase: "BUD", at: 0.72 },
  { phase: "BLOOM", at: 0.82 },
  { phase: "ALIVE", at: 1 },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeInOut = (t: number) => {
  const n = clamp(t, 0, 1);
  return n < 0.5 ? 4 * n * n * n : 1 - Math.pow(-2 * n + 2, 3) / 2;
};
const pulse = (t: number) => (Math.sin(t) + 1) / 2;

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pointOnCurve(curve: Curve, t: number): Point {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  return {
    x: uuu * curve.start.x + 3 * uu * t * curve.c1.x + 3 * u * tt * curve.c2.x + ttt * curve.end.x,
    y: uuu * curve.start.y + 3 * uu * t * curve.c1.y + 3 * u * tt * curve.c2.y + ttt * curve.end.y,
  };
}

function tangentOnCurve(curve: Curve, t: number): Point {
  const u = 1 - t;
  return {
    x:
      3 * u * u * (curve.c1.x - curve.start.x) +
      6 * u * t * (curve.c2.x - curve.c1.x) +
      3 * t * t * (curve.end.x - curve.c2.x),
    y:
      3 * u * u * (curve.c1.y - curve.start.y) +
      6 * u * t * (curve.c2.y - curve.c1.y) +
      3 * t * t * (curve.end.y - curve.c2.y),
  };
}

function drawBezierSegment(ctx: CanvasRenderingContext2D, curve: Curve, progress: number) {
  const steps = Math.max(2, Math.ceil(36 * clamp(progress, 0, 1)));
  ctx.beginPath();
  for (let index = 0; index <= steps; index += 1) {
    const point = pointOnCurve(curve, (index / steps) * clamp(progress, 0, 1));
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();
}

function curvePath(ctx: CanvasRenderingContext2D, curve: Curve) {
  ctx.moveTo(curve.start.x, curve.start.y);
  ctx.bezierCurveTo(curve.c1.x, curve.c1.y, curve.c2.x, curve.c2.y, curve.end.x, curve.end.y);
}

function resolvePalette(element: HTMLElement): Palette {
  const styles = getComputedStyle(element);
  const read = (name: string) => styles.getPropertyValue(name).trim();
  return {
    background: read("--bloom-bg"),
    backgroundDay: read("--bloom-bg-day"),
    backgroundSunset: read("--bloom-bg-sunset"),
    backgroundNight: read("--bloom-bg-night"),
    backgroundDawn: read("--bloom-bg-dawn"),
    haze: read("--bloom-haze"),
    ground: read("--bloom-ground"),
    stem: read("--bloom-stem"),
    stemLight: read("--bloom-stem-light"),
    leaf: read("--bloom-leaf"),
    leafLight: read("--bloom-leaf-light"),
    flower: read("--bloom-flower"),
    flowerLight: read("--bloom-flower-light"),
    flowerWarm: read("--bloom-flower-warm"),
    flowerAqua: read("--bloom-flower-aqua"),
    flowerAquaLight: read("--bloom-flower-aqua-light"),
    flowerMint: read("--bloom-flower-mint"),
    flowerMintLight: read("--bloom-flower-mint-light"),
    flowerLavender: read("--bloom-flower-lavender"),
    flowerLavenderLight: read("--bloom-flower-lavender-light"),
    flowerRose: read("--bloom-flower-rose"),
    flowerRoseLight: read("--bloom-flower-rose-light"),
    flowerAmber: read("--bloom-flower-amber"),
    flowerAmberLight: read("--bloom-flower-amber-light"),
    root: read("--bloom-root"),
    particle: read("--bloom-particle"),
    firefly: read("--bloom-firefly"),
    ui: read("--bloom-ui"),
  };
}

function flowerTone(palette: Palette, index: number): FlowerTone {
  const tones = [
    { petal: palette.flowerAqua, light: palette.flowerAquaLight, center: palette.flowerWarm },
    { petal: palette.flowerMint, light: palette.flowerMintLight, center: palette.firefly },
    { petal: palette.flowerLavender, light: palette.flowerLavenderLight, center: palette.flowerAquaLight },
    { petal: palette.flowerRose, light: palette.flowerRoseLight, center: palette.flowerAmberLight },
    { petal: palette.flowerAmber, light: palette.flowerAmberLight, center: palette.flowerRoseLight },
  ];
  return tones[((index % tones.length) + tones.length) % tones.length];
}

function makePlant(x: number, y: number, width: number, height: number, now: number, id: number): Plant {
  const seed = Math.floor(x * 97 + y * 131 + id * 1009 + now) >>> 0;
  const random = mulberry32(seed);
  const depth = clamp(y / height, 0.1, 1);
  const depthScale = lerp(0.42, 1.32, easeOutCubic(depth));
  const scale = depthScale * lerp(0.82, 1.2, random());
  const naturalHeight = height * lerp(0.16, 0.36, random()) * scale;
  const plantHeight = clamp(naturalHeight, 42, Math.min(height * 0.48, Math.max(42, y - 36)));
  const lean = lerp(-width * 0.045, width * 0.045, random());
  const origin = { x, y };
  const top = { x: x + lean, y: y - plantHeight };
  const stem: Curve = {
    start: origin,
    c1: { x: x + lerp(-28, 28, random()) * scale, y: y - plantHeight * 0.34 },
    c2: { x: top.x + lerp(-34, 34, random()) * scale, y: y - plantHeight * 0.72 },
    end: top,
  };

  const rootCount = Math.floor(4 + random() * 4);
  const rootCurves = Array.from({ length: rootCount }, (_, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const rootLength = lerp(22, 70, random()) * scale;
    const rootDepth = lerp(9, 28, random()) * scale;
    const end = {
      x: x + side * rootLength * lerp(0.55, 1.15, random()),
      y: y + rootDepth * lerp(0.5, 1.25, random()),
    };
    return {
      start: origin,
      c1: { x: x + side * rootLength * 0.18, y: y + rootDepth * 0.2 },
      c2: { x: x + side * rootLength * lerp(0.42, 0.86, random()), y: y + rootDepth * lerp(0.7, 1.35, random()) },
      end,
    };
  });

  const branchCount = Math.floor(3 + random() * 4);
  const branches: Branch[] = Array.from({ length: branchCount }, (_, index) => {
    const at = lerp(0.26, 0.82, (index + random() * 0.55) / branchCount);
    const base = pointOnCurve(stem, at);
    const tangent = tangentOnCurve(stem, at);
    const side = random() > 0.5 ? 1 : -1;
    const angle = Math.atan2(tangent.y, tangent.x) + side * lerp(0.76, 1.24, random());
    const length = plantHeight * lerp(0.18, 0.36, random()) * (1 - at * 0.36);
    const end = {
      x: base.x + Math.cos(angle) * length,
      y: base.y + Math.sin(angle) * length * 0.72 - length * 0.12,
    };
    const curve: Curve = {
      start: base,
      c1: { x: base.x + Math.cos(angle) * length * 0.25, y: base.y + Math.sin(angle) * length * 0.18 },
      c2: { x: end.x - side * length * 0.14, y: end.y + lerp(-12, 10, random()) * scale },
      end,
    };
    const branchLeaves: Leaf[] = Array.from({ length: Math.floor(2 + random() * 3) }, (_, leafIndex) => ({
      at: lerp(0.24, 0.88, (leafIndex + random() * 0.7) / 3),
      side: leafIndex % 2 === 0 ? 1 : -1,
      length: lerp(18, 36, random()) * scale,
      width: lerp(5, 11, random()) * scale,
      angle: lerp(0.5, 1.08, random()),
      hue: lerp(-8, 14, random()),
      delay: random() * 0.22,
    }));
    const hasFlower = random() > 0.62 && at > 0.46;
    const branch: Branch = {
      at,
      side,
      length,
      angle,
      curve,
      width: lerp(1.8, 3.2, random()) * scale,
      leaves: branchLeaves,
      hasFlower,
    };
    if (hasFlower) {
      branch.flower = {
        size: lerp(8, 16, random()) * scale,
        petals: Math.floor(5 + random() * 3),
        tilt: lerp(-0.55, 0.55, random()),
        colorIndex: Math.floor(random() * 5),
        delay: random() * 0.2,
      };
    }
    return branch;
  }).sort((a, b) => a.at - b.at);

  const leaves: Leaf[] = Array.from({ length: Math.floor(4 + random() * 6) }, (_, index) => ({
    at: lerp(0.18, 0.82, (index + random() * 0.85) / 8),
    side: index % 2 === 0 ? -1 : 1,
    length: lerp(22, 45, random()) * scale,
    width: lerp(6, 13, random()) * scale,
    angle: lerp(0.42, 1.05, random()),
    hue: lerp(-8, 16, random()),
    delay: random() * 0.32,
  }));

  return {
    id,
    seed,
    origin,
    createdAt: now,
    phase: "SEED",
    scale,
    depth,
    height: plantHeight,
    stem,
    stemWidth: lerp(2.4, 5.4, random()) * scale,
    rootCurves,
    branches,
    leaves,
    flower: {
      size: lerp(16, 30, random()) * scale,
      petals: Math.floor(6 + random() * 4),
      tilt: lerp(-0.3, 0.32, random()),
      colorIndex: Math.floor(random() * 5),
      delay: 0,
    },
    wind: 0,
    velocity: 0,
    swayOffset: random() * Math.PI * 2,
    growthDuration: lerp(3300, 5000, random()),
  };
}

function transformedPoint(point: Point, origin: Point, bend: number, progress = 1): Point {
  const vertical = clamp((origin.y - point.y) / 460, 0, 1.4);
  const falloff = vertical * vertical * progress;
  return {
    x: point.x + bend * falloff,
    y: point.y + Math.abs(bend) * 0.018 * falloff,
  };
}

function transformCurve(curve: Curve, origin: Point, bend: number, progress = 1): Curve {
  return {
    start: transformedPoint(curve.start, origin, bend, progress),
    c1: transformedPoint(curve.c1, origin, bend, progress),
    c2: transformedPoint(curve.c2, origin, bend, progress),
    end: transformedPoint(curve.end, origin, bend, progress),
  };
}

function drawLeaf(
  ctx: CanvasRenderingContext2D,
  point: Point,
  angle: number,
  length: number,
  width: number,
  progress: number,
  palette: Palette,
  alpha: number,
  wind: number,
) {
  const grow = easeOutCubic(progress);
  if (grow <= 0) return;
  const leafLength = length * grow;
  const leafWidth = width * Math.sin(grow * Math.PI * 0.5);
  const sway = wind * 0.011;
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate(angle + sway);
  ctx.scale(1, 0.96 + grow * 0.04);
  const gradient = ctx.createLinearGradient(0, -leafWidth, leafLength, leafWidth);
  gradient.addColorStop(0, `color-mix(in oklab, ${palette.leafLight} 70%, transparent)`);
  gradient.addColorStop(0.58, `color-mix(in oklab, ${palette.leaf} 88%, transparent)`);
  gradient.addColorStop(1, `color-mix(in oklab, ${palette.stem} 70%, transparent)`);
  ctx.globalAlpha = alpha * 0.82;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(leafLength * 0.24, -leafWidth * 1.35, leafLength * 0.72, -leafWidth * 1.08, leafLength, 0);
  ctx.bezierCurveTo(leafLength * 0.68, leafWidth * 1.22, leafLength * 0.22, leafWidth * 1.05, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = alpha * 0.52;
  ctx.strokeStyle = palette.leafLight;
  ctx.lineWidth = Math.max(0.5, width * 0.1);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(leafLength * 0.46, -leafWidth * 0.1, leafLength * 0.92, 0);
  ctx.stroke();
  ctx.globalAlpha = alpha * 0.16;
  ctx.strokeStyle = palette.flowerLight;
  ctx.beginPath();
  ctx.moveTo(leafLength * 0.18, -leafWidth * 0.55);
  ctx.quadraticCurveTo(leafLength * 0.45, -leafWidth * 0.82, leafLength * 0.78, -leafWidth * 0.2);
  ctx.stroke();
  ctx.restore();
}

function drawFlower(
  ctx: CanvasRenderingContext2D,
  point: Point,
  flower: Flower,
  progress: number,
  palette: Palette,
  alpha: number,
  wind: number,
  timeOpen: number,
) {
  const centerProgress = easeOutCubic((progress - 0.06) / 0.22);
  if (centerProgress <= 0) return;
  const tone = flowerTone(palette, flower.colorIndex);
  const openness = clamp(progress * 1.12, 0, 1) * lerp(0.55, 1.08, timeOpen);
  const petalProgress = easeOutCubic((progress - 0.18) / 0.82);
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate(flower.tilt + wind * 0.006);
  ctx.globalCompositeOperation = "lighter";
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, flower.size * 2.1 * openness);
  glow.addColorStop(0, `color-mix(in oklab, ${tone.light} 48%, transparent)`);
  glow.addColorStop(1, "transparent");
  ctx.globalAlpha = alpha * 0.38 * petalProgress;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, flower.size * 2.2 * openness, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  for (let index = 0; index < flower.petals; index += 1) {
    const local = easeOutCubic((petalProgress * flower.petals - index * 0.72) / 1.35);
    if (local <= 0) continue;
    const angle = (Math.PI * 2 * index) / flower.petals - Math.PI / 2 + flower.tilt * 0.25;
    const length = flower.size * lerp(1.35, 2.05, (index % 3) / 2) * openness * local;
    const width = flower.size * 0.42 * Math.sin(local * Math.PI * 0.5);
    ctx.save();
    ctx.rotate(angle);
    const gradient = ctx.createLinearGradient(0, -width, 0, -length);
    gradient.addColorStop(0, `color-mix(in oklab, ${tone.center} 38%, ${tone.petal} 62%)`);
    gradient.addColorStop(0.45, `color-mix(in oklab, ${tone.petal} 84%, transparent)`);
    gradient.addColorStop(1, `color-mix(in oklab, ${tone.light} 78%, transparent)`);
    ctx.globalAlpha = alpha * 0.68;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-width, -length * 0.28, -width * 0.8, -length * 0.82, 0, -length);
    ctx.bezierCurveTo(width * 0.82, -length * 0.82, width, -length * 0.28, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = alpha * 0.26;
    ctx.strokeStyle = tone.light;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -length * 0.1);
    ctx.quadraticCurveTo(width * 0.1, -length * 0.48, 0, -length * 0.9);
    ctx.stroke();
    ctx.restore();
  }

  const center = ctx.createRadialGradient(0, 0, 0, 0, 0, flower.size * 0.42 * centerProgress);
  center.addColorStop(0, tone.center);
  center.addColorStop(0.62, tone.light);
  center.addColorStop(1, `color-mix(in oklab, ${tone.center} 40%, transparent)`);
  ctx.globalAlpha = alpha * 0.95;
  ctx.fillStyle = center;
  ctx.beginPath();
  ctx.arc(0, 0, flower.size * 0.38 * centerProgress, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlant(
  ctx: CanvasRenderingContext2D,
  plant: Plant,
  now: number,
  palette: Palette,
  timeOpen: number,
) {
  const age = now - plant.createdAt;
  const growth = clamp(age / plant.growthDuration, 0, 1);
  for (const item of PHASES) {
    if (growth >= item.at) plant.phase = item.phase;
  }
  const dissolve = plant.dissolveStart ? clamp((now - plant.dissolveStart) / 1200, 0, 1) : 0;
  const alpha = (1 - dissolve) * lerp(0.56, 1, plant.depth);
  if (alpha <= 0) return;

  const aliveSway = Math.sin(now * 0.00072 + plant.swayOffset) * 5.5 * plant.scale;
  const bend = plant.wind + aliveSway;
  const rootProgress = easeOutCubic((growth - 0.07) / 0.18);
  const stemProgress = easeInOut((growth - 0.22) / 0.28);
  const branchProgress = easeOutCubic((growth - 0.4) / 0.22);
  const leafProgress = easeOutCubic((growth - 0.53) / 0.24);
  const budProgress = easeOutCubic((growth - 0.7) / 0.13);
  const bloomProgress = easeOutCubic((growth - 0.81) / 0.19);

  ctx.save();
  if (dissolve > 0) ctx.globalAlpha = alpha * (0.82 + 0.18 * pulse(now * 0.012 + plant.id));
  const seedPulse = 0.65 + pulse(now * 0.006 + plant.id) * 0.35;
  const seedGlow = ctx.createRadialGradient(plant.origin.x, plant.origin.y, 0, plant.origin.x, plant.origin.y, 11 * plant.scale * seedPulse);
  seedGlow.addColorStop(0, palette.flowerWarm);
  seedGlow.addColorStop(0.45, `color-mix(in oklab, ${palette.flowerLight} 64%, transparent)`);
  seedGlow.addColorStop(1, "transparent");
  ctx.globalAlpha = alpha * clamp(1 - growth * 1.3, 0.18, 0.9);
  ctx.fillStyle = seedGlow;
  ctx.beginPath();
  ctx.arc(plant.origin.x, plant.origin.y, 10 * plant.scale * seedPulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = alpha * 0.42;
  ctx.strokeStyle = palette.root;
  ctx.lineCap = "round";
  for (const root of plant.rootCurves) {
    ctx.lineWidth = Math.max(0.55, plant.scale * 1.25);
    drawBezierSegment(ctx, root, rootProgress);
  }

  if (stemProgress > 0) {
    const stemCurve = transformCurve(plant.stem, plant.origin, bend, stemProgress);
    const stemGradient = ctx.createLinearGradient(plant.origin.x, plant.origin.y, plant.stem.end.x, plant.stem.end.y);
    stemGradient.addColorStop(0, palette.stem);
    stemGradient.addColorStop(0.72, palette.leaf);
    stemGradient.addColorStop(1, palette.stemLight);
    ctx.globalAlpha = alpha * 0.9;
    ctx.strokeStyle = stemGradient;
    ctx.lineWidth = plant.stemWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    drawBezierSegment(ctx, stemCurve, stemProgress);
    ctx.globalAlpha = alpha * 0.24;
    ctx.strokeStyle = palette.stemLight;
    ctx.lineWidth = Math.max(0.6, plant.stemWidth * 0.18);
    drawBezierSegment(ctx, stemCurve, stemProgress * 0.96);
  }

  for (const branch of plant.branches) {
    const localBranchProgress = easeOutCubic((branchProgress - branch.at * 0.2) / 0.72);
    if (localBranchProgress <= 0) continue;
    const branchCurve = transformCurve(branch.curve, plant.origin, bend * 1.08, stemProgress);
    ctx.globalAlpha = alpha * 0.82;
    ctx.strokeStyle = palette.stem;
    ctx.lineWidth = branch.width;
    ctx.lineCap = "round";
    drawBezierSegment(ctx, branchCurve, localBranchProgress);
    for (const leaf of branch.leaves) {
      const localLeafProgress = easeOutCubic((leafProgress - leaf.delay) / 0.72);
      const point = pointOnCurve(branchCurve, leaf.at);
      const tangent = tangentOnCurve(branchCurve, leaf.at);
      const angle = Math.atan2(tangent.y, tangent.x) + leaf.side * leaf.angle;
      drawLeaf(ctx, point, angle, leaf.length, leaf.width, localLeafProgress, palette, alpha, bend);
    }
    if (branch.hasFlower && branch.flower) {
      const branchTip = pointOnCurve(branchCurve, clamp(localBranchProgress, 0, 1));
      const miniProgress = bloomProgress <= 0 ? budProgress * 0.58 : bloomProgress;
      const branchTone = flowerTone(palette, branch.flower.colorIndex);
      if (miniProgress < 0.64) {
        ctx.globalAlpha = alpha * 0.76;
        ctx.fillStyle = branchTone.petal;
        ctx.beginPath();
        ctx.ellipse(branchTip.x, branchTip.y, branch.flower.size * 0.34, branch.flower.size * 0.58 * budProgress, branch.flower.tilt, 0, Math.PI * 2);
        ctx.fill();
      }
      drawFlower(ctx, branchTip, branch.flower, miniProgress, palette, alpha * 0.82, bend, timeOpen);
    }
  }

  for (const leaf of plant.leaves) {
    const localLeafProgress = easeOutCubic((leafProgress - leaf.delay) / 0.72);
    if (localLeafProgress <= 0) continue;
    const curve = transformCurve(plant.stem, plant.origin, bend, stemProgress);
    const point = pointOnCurve(curve, leaf.at);
    const tangent = tangentOnCurve(curve, leaf.at);
    const angle = Math.atan2(tangent.y, tangent.x) + leaf.side * leaf.angle;
    drawLeaf(ctx, point, angle, leaf.length, leaf.width, localLeafProgress, palette, alpha, bend);
  }

  const topCurve = transformCurve(plant.stem, plant.origin, bend, stemProgress);
  const flowerPoint = pointOnCurve(topCurve, clamp(stemProgress, 0, 1));
  if (budProgress > 0 && bloomProgress < 0.3) {
    const tone = flowerTone(palette, plant.flower.colorIndex);
    const budSize = plant.flower.size * (0.2 + budProgress * 0.42);
    const budGlow = ctx.createRadialGradient(flowerPoint.x, flowerPoint.y, 0, flowerPoint.x, flowerPoint.y, budSize * 2.2);
    budGlow.addColorStop(0, tone.light);
    budGlow.addColorStop(1, "transparent");
    ctx.globalAlpha = alpha * 0.34;
    ctx.fillStyle = budGlow;
    ctx.beginPath();
    ctx.arc(flowerPoint.x, flowerPoint.y, budSize * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha * 0.84;
    ctx.fillStyle = tone.petal;
    ctx.beginPath();
    ctx.ellipse(flowerPoint.x, flowerPoint.y, budSize * 0.72, budSize, plant.flower.tilt + bend * 0.004, 0, Math.PI * 2);
    ctx.fill();
  }
  drawFlower(ctx, flowerPoint, plant.flower, bloomProgress, palette, alpha, bend, timeOpen);
  ctx.restore();
}

function drawGround(ctx: CanvasRenderingContext2D, width: number, height: number, palette: Palette, count: number, wind: number) {
  const base = height * 0.88;
  const groundGradient = ctx.createLinearGradient(0, base - height * 0.08, 0, height);
  groundGradient.addColorStop(0, "transparent");
  groundGradient.addColorStop(0.48, `color-mix(in oklab, ${palette.ground} 42%, transparent)`);
  groundGradient.addColorStop(1, palette.backgroundNight);
  ctx.fillStyle = groundGradient;
  ctx.fillRect(0, base - height * 0.08, width, height * 0.16);

  ctx.save();
  ctx.strokeStyle = palette.ground;
  ctx.lineCap = "round";
  const blades = Math.min(170, 58 + count * 9);
  for (let index = 0; index < blades; index += 1) {
    const r = mulberry32(index * 251 + 91)();
    const x = ((index * 47.3 + r * 88) % width) | 0;
    const y = height - ((index * 13.7) % (height * 0.09));
    const bladeHeight = 12 + ((index * 19) % 38);
    const sway = Math.sin(index + wind * 0.012) * 5;
    ctx.globalAlpha = 0.12 + (index % 7) * 0.018;
    ctx.lineWidth = 0.7 + (index % 3) * 0.28;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + sway, y - bladeHeight * 0.5, x + sway * 1.8, y - bladeHeight);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  palette: Palette,
  cycle: number,
  particles: Particle[],
) {
  const day = Math.max(0, Math.cos(cycle * Math.PI * 2));
  const night = Math.max(0, -Math.cos(cycle * Math.PI * 2));
  const sunset = Math.max(0, Math.sin(cycle * Math.PI * 2));
  const dawn = Math.max(0, -Math.sin(cycle * Math.PI * 2));
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, palette.backgroundNight);
  gradient.addColorStop(0.24, sunset > dawn ? palette.backgroundSunset : palette.backgroundDawn);
  gradient.addColorStop(0.62, day > 0.56 ? palette.backgroundDay : palette.background);
  gradient.addColorStop(1, palette.backgroundNight);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const haze = ctx.createRadialGradient(width * 0.52, height * 0.76, 0, width * 0.52, height * 0.76, Math.max(width, height) * 0.72);
  haze.addColorStop(0, `color-mix(in oklab, ${palette.haze} ${18 + day * 16}%, transparent)`);
  haze.addColorStop(0.52, `color-mix(in oklab, ${palette.leaf} ${5 + sunset * 8}%, transparent)`);
  haze.addColorStop(1, "transparent");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.18 + night * 0.28;
  ctx.fillStyle = palette.particle;
  for (let index = 0; index < 90; index += 1) {
    const random = mulberry32(index * 499 + 7);
    const x = random() * width;
    const y = random() * height * 0.72;
    const size = random() * 1.4 + night * 0.8;
    ctx.globalAlpha = (0.04 + random() * 0.18) * (0.4 + night);
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  for (const particle of particles) {
    const life = clamp(particle.life / particle.maxLife, 0, 1);
    const fade = Math.sin(life * Math.PI);
    ctx.globalAlpha = fade * (particle.kind === "firefly" ? 0.72 * night : 0.42);
    ctx.fillStyle = particle.kind === "firefly" ? palette.firefly : particle.kind === "bloom" ? (particle.color ?? palette.flowerLight) : palette.particle;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * (particle.kind === "firefly" ? 1.25 : 1), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function spawnBloomParticles(particles: Particle[], x: number, y: number, seed: number, color: string) {
  const random = mulberry32(seed);
  for (let index = 0; index < 8; index += 1) {
    const angle = random() * Math.PI * 2;
    const speed = 0.15 + random() * 0.45;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.28,
      life: 0,
      maxLife: 1700 + random() * 1000,
      size: 0.8 + random() * 1.6,
      color,
      kind: "bloom",
    });
  }
}

export function BloomCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const plantsRef = useRef<Plant[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const pointerRef = useRef({ x: -9999, y: -9999, px: -9999, py: -9999, speed: 0, active: false, holding: false });
  const plantIdRef = useRef(1);
  const lastFrameRef = useRef(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [hasPlants, setHasPlants] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    let frame = 0;
    let palette = resolvePalette(container);
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * ratio);
      canvas.height = Math.floor(window.innerHeight * ratio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      palette = resolvePalette(container);
    };
    resize();

    const addAmbientParticle = (width: number, height: number, now: number, night: number) => {
      if (particlesRef.current.length > 130) return;
      const random = mulberry32(Math.floor(now * 0.07) + particlesRef.current.length * 31);
      const firefly = night > 0.42 && random() > 0.58;
      particlesRef.current.push({
        x: random() * width,
        y: height * lerp(0.12, 0.86, random()),
        vx: lerp(-0.06, 0.08, random()),
        vy: firefly ? lerp(-0.04, 0.04, random()) : lerp(-0.08, -0.02, random()),
        life: 0,
        maxLife: firefly ? lerp(2600, 5200, random()) : lerp(3800, 7600, random()),
        size: firefly ? lerp(1.1, 2.3, random()) : lerp(0.45, 1.25, random()),
        kind: firefly ? "firefly" : "dust",
      });
    };

    const render = (now: number) => {
      const dt = Math.min(34, now - (lastFrameRef.current || now));
      lastFrameRef.current = now;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const cycle = (now * 0.000018) % 1;
      const night = Math.max(0, -Math.cos(cycle * Math.PI * 2));
      const timeOpen = clamp(1 - night * 0.42 + Math.max(0, Math.sin(cycle * Math.PI * 2)) * 0.08, 0.42, 1.08);
      if (Math.random() < 0.055) addAmbientParticle(width, height, now, night);

      const particles = particlesRef.current;
      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        if (!particle) continue;
        particle.life += dt;
        particle.x += particle.vx * dt * 0.06;
        particle.y += particle.vy * dt * 0.06;
        if (particle.kind === "firefly") {
          particle.x += Math.sin(now * 0.002 + index) * 0.08;
          particle.y += Math.cos(now * 0.0016 + index) * 0.05;
        }
        if (particle.life > particle.maxLife || particle.y < -10 || particle.x < -10 || particle.x > width + 10) {
          particles.splice(index, 1);
        }
      }

      const pointer = pointerRef.current;
      pointer.speed = Math.hypot(pointer.x - pointer.px, pointer.y - pointer.py) / Math.max(1, dt);
      pointer.px = pointer.x;
      pointer.py = pointer.y;

      drawBackground(ctx, width, height, palette, cycle, particles);
      drawGround(ctx, width, height, palette, plantsRef.current.length, pointer.speed * 30);

      const sortedPlants = [...plantsRef.current].sort((a, b) => a.depth - b.depth);
      for (const plant of sortedPlants) {
        const dx = plant.origin.x - pointer.x;
        const dy = plant.origin.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        const influence = pointer.active ? clamp(1 - distance / (260 * plant.scale), 0, 1) : 0;
        const direction = dx >= 0 ? 1 : -1;
        const targetWind = direction * influence * clamp(pointer.speed * 54 + (pointer.holding ? 16 : 0), 0, 72) * plant.scale;
        const spring = (targetWind - plant.wind) * 0.025;
        plant.velocity += spring * dt;
        plant.velocity *= Math.pow(0.91, dt / 16.67);
        plant.wind += plant.velocity * 0.016;
        if (!pointer.active) plant.wind *= Math.pow(0.986, dt / 16.67);

        const previousPhase = plant.phase;
        drawPlant(ctx, plant, now, palette, timeOpen);
        if (previousPhase !== "BLOOM" && previousPhase !== "ALIVE" && (plant.phase === "BLOOM" || plant.phase === "ALIVE")) {
          const top = pointOnCurve(transformCurve(plant.stem, plant.origin, plant.wind, 1), 1);
          spawnBloomParticles(particlesRef.current, top.x, top.y, plant.seed + 77, flowerTone(palette, plant.flower.colorIndex).light);
        }
      }

      const remaining = plantsRef.current.filter((plant) => !plant.dissolveStart || now - plant.dissolveStart < 1300);
      if (remaining.length !== plantsRef.current.length) {
        plantsRef.current = remaining;
        setHasPlants(remaining.length > 0);
        if (remaining.length === 0) setHasInteracted(false);
      }

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const growAt = (clientX: number, clientY: number) => {
    const now = performance.now();
    const margin = Math.max(20, window.innerHeight * 0.05);
    const x = clamp(clientX, 18, window.innerWidth - 18);
    const y = clamp(clientY, 18, window.innerHeight - margin);
    const plant = makePlant(x, y, window.innerWidth, window.innerHeight, now, plantIdRef.current);
    plantIdRef.current += 1;
    plantsRef.current.push(plant);
    pointerRef.current = { ...pointerRef.current, x, y, px: x, py: y, active: true };
    setHasInteracted(true);
    setHasPlants(true);
  };

  const clearGarden = () => {
    const now = performance.now();
    plantsRef.current = plantsRef.current.map((plant) => ({ ...plant, dissolveStart: plant.dissolveStart ?? now }));
  };

  return (
    <main ref={containerRef} className="bloom-canvas fixed inset-0 overflow-hidden bg-background text-foreground">
      <canvas
        ref={canvasRef}
        aria-label="Interactive botanical canvas"
        className="block h-dvh w-dvw touch-none cursor-crosshair"
        onClick={(event) => growAt(event.clientX, event.clientY)}
        onPointerDown={(event) => {
          pointerRef.current.active = true;
          pointerRef.current.holding = true;
          pointerRef.current.x = event.clientX;
          pointerRef.current.y = event.clientY;
          pointerRef.current.px = event.clientX;
          pointerRef.current.py = event.clientY;
        }}
        onPointerMove={(event) => {
          pointerRef.current.active = true;
          pointerRef.current.x = event.clientX;
          pointerRef.current.y = event.clientY;
        }}
        onPointerLeave={() => {
          pointerRef.current.active = false;
          pointerRef.current.holding = false;
        }}
        onPointerUp={() => {
          pointerRef.current.holding = false;
        }}
      />
      <div className={`pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-1000 ${hasInteracted ? "opacity-0" : "opacity-100"}`}>
        <div className="-translate-y-10 text-center tracking-[0.58em] text-bloom-ui drop-shadow-bloom">
          <h1 className="text-bloom-title font-light leading-none">BLOOM</h1>
          <p className="mt-5 text-bloom-caption lowercase tracking-[0.32em] text-bloom-muted">click anywhere</p>
        </div>
      </div>
      {hasPlants ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute bottom-5 right-5 h-auto rounded-none px-2 py-1 text-bloom-clear tracking-[0.24em] text-bloom-muted hover:bg-transparent hover:text-bloom-ui"
          onClick={(event) => {
            event.stopPropagation();
            clearGarden();
          }}
        >
          CLEAR
        </Button>
      ) : null}
    </main>
  );
}