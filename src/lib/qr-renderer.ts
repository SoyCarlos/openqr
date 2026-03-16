import QRCode from "qrcode";

/**
 * Sanitize a color string to prevent SVG injection.
 * Only allows hex colors (#rgb, #rrggbb) and named CSS colors.
 */
function sanitizeColor(color: string): string {
  // Allow standard hex colors
  if (/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(color)) return color;
  // Allow named CSS colors (alphabetic only, no special chars)
  if (/^[a-zA-Z]{1,30}$/.test(color)) return color;
  return "#000000";
}

function sanitizeOptions(options: QROptions): QROptions {
  return {
    ...options,
    fgColor: sanitizeColor(options.fgColor),
    bgColor: sanitizeColor(options.bgColor),
    gradientColor2: sanitizeColor(options.gradientColor2),
    gradientAngle: Math.max(0, Math.min(360, Math.round(options.gradientAngle))),
    margin: Math.max(0, Math.min(10, Math.round(options.margin))),
    logoSize: Math.max(5, Math.min(40, options.logoSize)),
    logoPadding: Math.max(0, Math.min(20, options.logoPadding)),
    logoRadius: Math.max(0, Math.min(50, options.logoRadius)),
    size: Math.max(64, Math.min(4096, Math.round(options.size))),
  };
}

export type DotStyle = "square" | "rounded" | "dots" | "diamond" | "star" | "lines";
export type CornerStyle = "square" | "rounded" | "dot" | "diamond";
export type EyeStyle = "square" | "rounded" | "circle" | "diamond";
export type LineOrientation = "vertical" | "horizontal" | "diagonal-left" | "diagonal-right";
export type GradientType = "none" | "linear" | "radial";
export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export interface QROptions {
  url: string;
  size: number;
  dotStyle: DotStyle;
  cornerStyle: CornerStyle;
  eyeStyle: EyeStyle;
  fgColor: string;
  bgColor: string;
  gradientType: GradientType;
  gradientColor2: string;
  gradientAngle: number;
  margin: number;
  errorCorrection: ErrorCorrectionLevel;
  lineOrientation: LineOrientation;
  logo?: string | null;
  logoSize: number;
  logoPadding: number;
  logoRadius: number;
}

export const defaultOptions: QROptions = {
  url: "https://example.com",
  size: 1024,
  dotStyle: "square",
  cornerStyle: "square",
  eyeStyle: "square",
  fgColor: "#000000",
  bgColor: "#ffffff",
  gradientType: "none",
  gradientColor2: "#6d28d9",
  gradientAngle: 0,
  margin: 2,
  errorCorrection: "H",
  lineOrientation: "vertical",
  logo: null,
  logoSize: 20,
  logoPadding: 5,
  logoRadius: 8,
};

interface QRMatrix {
  modules: boolean[][];
  size: number;
}

async function getQRMatrix(
  text: string,
  errorCorrection: ErrorCorrectionLevel
): Promise<QRMatrix> {
  const qr = QRCode.create(text, {
    errorCorrectionLevel: errorCorrection,
  });
  const size = qr.modules.size;
  const modules: boolean[][] = [];
  for (let row = 0; row < size; row++) {
    modules[row] = [];
    for (let col = 0; col < size; col++) {
      modules[row][col] = qr.modules.get(row, col) === 1;
    }
  }
  return { modules, size };
}

function isFinderPattern(row: number, col: number, matrixSize: number): boolean {
  // Top-left
  if (row < 7 && col < 7) return true;
  // Top-right
  if (row < 7 && col >= matrixSize - 7) return true;
  // Bottom-left
  if (row >= matrixSize - 7 && col < 7) return true;
  return false;
}

function isFinderPatternEye(
  row: number,
  col: number,
  matrixSize: number
): boolean {
  // The inner 3x3 of each finder pattern
  const positions = [
    { r: 2, c: 2 },
    { r: 2, c: matrixSize - 5 },
    { r: matrixSize - 5, c: 2 },
  ];
  for (const p of positions) {
    if (row >= p.r && row < p.r + 3 && col >= p.c && col < p.c + 3)
      return true;
  }
  return false;
}

function createGradient(
  ctx: CanvasRenderingContext2D,
  options: QROptions,
  totalSize: number
): CanvasGradient | string {
  if (options.gradientType === "none") return options.fgColor;
  if (options.gradientType === "linear") {
    const angle = (options.gradientAngle * Math.PI) / 180;
    const x1 = totalSize / 2 - (Math.cos(angle) * totalSize) / 2;
    const y1 = totalSize / 2 - (Math.sin(angle) * totalSize) / 2;
    const x2 = totalSize / 2 + (Math.cos(angle) * totalSize) / 2;
    const y2 = totalSize / 2 + (Math.sin(angle) * totalSize) / 2;
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, options.fgColor);
    grad.addColorStop(1, options.gradientColor2);
    return grad;
  }
  // radial
  const grad = ctx.createRadialGradient(
    totalSize / 2,
    totalSize / 2,
    0,
    totalSize / 2,
    totalSize / 2,
    totalSize / 2
  );
  grad.addColorStop(0, options.fgColor);
  grad.addColorStop(1, options.gradientColor2);
  return grad;
}

function drawDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  style: DotStyle,
  lineOrientation: LineOrientation = "vertical"
) {
  const gap = cellSize * 0.05;
  switch (style) {
    case "square":
      ctx.fillRect(x, y, cellSize, cellSize);
      break;
    case "rounded": {
      const r = cellSize * 0.3;
      ctx.beginPath();
      ctx.roundRect(x + gap, y + gap, cellSize - gap * 2, cellSize - gap * 2, r);
      ctx.fill();
      break;
    }
    case "dots": {
      const radius = (cellSize - gap * 2) / 2;
      ctx.beginPath();
      ctx.arc(x + cellSize / 2, y + cellSize / 2, radius, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "diamond": {
      const cx = x + cellSize / 2;
      const cy = y + cellSize / 2;
      const half = (cellSize - gap * 2) / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - half);
      ctx.lineTo(cx + half, cy);
      ctx.lineTo(cx, cy + half);
      ctx.lineTo(cx - half, cy);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "star": {
      const cx = x + cellSize / 2;
      const cy = y + cellSize / 2;
      const outerR = (cellSize - gap * 2) / 2;
      const innerR = outerR * 0.4;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const outerAngle = (Math.PI / 2) * -1 + (i * 2 * Math.PI) / 5;
        const innerAngle = outerAngle + Math.PI / 5;
        if (i === 0) {
          ctx.moveTo(cx + outerR * Math.cos(outerAngle), cy + outerR * Math.sin(outerAngle));
        } else {
          ctx.lineTo(cx + outerR * Math.cos(outerAngle), cy + outerR * Math.sin(outerAngle));
        }
        ctx.lineTo(cx + innerR * Math.cos(innerAngle), cy + innerR * Math.sin(innerAngle));
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "lines": {
      const barThick = cellSize * 0.45;
      const r = barThick * 0.3;
      const cx = x + cellSize / 2;
      const cy = y + cellSize / 2;
      ctx.save();
      ctx.translate(cx, cy);
      if (lineOrientation === "horizontal") {
        ctx.rotate(Math.PI / 2);
      } else if (lineOrientation === "diagonal-left") {
        ctx.rotate(-Math.PI / 4);
      } else if (lineOrientation === "diagonal-right") {
        ctx.rotate(Math.PI / 4);
      }
      ctx.beginPath();
      ctx.roundRect(-barThick / 2, -cellSize / 2, barThick, cellSize, r);
      ctx.fill();
      ctx.restore();
      break;
    }
  }
}

function drawFinderOuter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  style: CornerStyle,
  fillStyle: string | CanvasGradient
) {
  const lineWidth = size / 7;
  ctx.strokeStyle = fillStyle;
  ctx.lineWidth = lineWidth;

  switch (style) {
    case "square":
      ctx.strokeRect(
        x + lineWidth / 2,
        y + lineWidth / 2,
        size - lineWidth,
        size - lineWidth
      );
      break;
    case "rounded": {
      const r = size * 0.2;
      ctx.beginPath();
      ctx.roundRect(
        x + lineWidth / 2,
        y + lineWidth / 2,
        size - lineWidth,
        size - lineWidth,
        r
      );
      ctx.stroke();
      break;
    }
    case "dot": {
      const cx = x + size / 2;
      const cy = y + size / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, (size - lineWidth) / 2, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "diamond": {
      const cx = x + size / 2;
      const cy = y + size / 2;
      const half = (size - lineWidth) / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - half);
      ctx.lineTo(cx + half, cy);
      ctx.lineTo(cx, cy + half);
      ctx.lineTo(cx - half, cy);
      ctx.closePath();
      ctx.stroke();
      break;
    }
  }
}

function drawFinderEye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  style: EyeStyle,
  fillStyle: string | CanvasGradient
) {
  ctx.fillStyle = fillStyle;
  switch (style) {
    case "square":
      ctx.fillRect(x, y, size, size);
      break;
    case "rounded": {
      const r = size * 0.25;
      ctx.beginPath();
      ctx.roundRect(x, y, size, size, r);
      ctx.fill();
      break;
    }
    case "circle": {
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "diamond": {
      const cx = x + size / 2;
      const cy = y + size / 2;
      const half = size / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - half);
      ctx.lineTo(cx + half, cy);
      ctx.lineTo(cx, cy + half);
      ctx.lineTo(cx - half, cy);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }
}

export async function renderQR(
  canvas: HTMLCanvasElement,
  rawOptions: QROptions
): Promise<void> {
  const options = sanitizeOptions(rawOptions);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const text = options.url || "https://example.com";
  const { modules, size: matrixSize } = await getQRMatrix(
    text,
    options.errorCorrection
  );

  const totalSize = options.size;
  canvas.width = totalSize;
  canvas.height = totalSize;

  const cellSize = totalSize / (matrixSize + options.margin * 2);
  const offset = options.margin * cellSize;

  // Background
  ctx.fillStyle = options.bgColor;
  ctx.fillRect(0, 0, totalSize, totalSize);

  const gradient = createGradient(ctx, options, totalSize);

  // Draw data modules (not finder patterns)
  ctx.fillStyle = gradient;
  for (let row = 0; row < matrixSize; row++) {
    for (let col = 0; col < matrixSize; col++) {
      if (!modules[row][col]) continue;
      if (isFinderPattern(row, col, matrixSize)) continue;

      const x = offset + col * cellSize;
      const y = offset + row * cellSize;
      drawDot(ctx, x, y, cellSize, options.dotStyle, options.lineOrientation);
    }
  }

  // Draw finder patterns
  const finderPositions = [
    { row: 0, col: 0 },
    { row: 0, col: matrixSize - 7 },
    { row: matrixSize - 7, col: 0 },
  ];

  for (const fp of finderPositions) {
    const fx = offset + fp.col * cellSize;
    const fy = offset + fp.row * cellSize;
    const finderSize = 7 * cellSize;

    // Clear finder area first
    ctx.fillStyle = options.bgColor;
    ctx.fillRect(fx, fy, finderSize, finderSize);

    // Draw outer border
    drawFinderOuter(ctx, fx, fy, finderSize, options.cornerStyle, gradient);

    // Draw inner eye
    const eyeOffset = 2 * cellSize;
    const eyeSize = 3 * cellSize;
    drawFinderEye(
      ctx,
      fx + eyeOffset,
      fy + eyeOffset,
      eyeSize,
      options.eyeStyle,
      gradient
    );
  }

  // Draw logo if provided
  if (options.logo) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load logo"));
      img.src = options.logo!;
    });

    const logoPixelSize = (totalSize * options.logoSize) / 100;
    const padding = options.logoPadding;
    const lx = (totalSize - logoPixelSize) / 2;
    const ly = (totalSize - logoPixelSize) / 2;

    // Draw background behind logo
    ctx.fillStyle = options.bgColor;
    const r = options.logoRadius;
    ctx.beginPath();
    ctx.roundRect(
      lx - padding,
      ly - padding,
      logoPixelSize + padding * 2,
      logoPixelSize + padding * 2,
      r
    );
    ctx.fill();

    // Clip and draw logo
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(lx, ly, logoPixelSize, logoPixelSize, Math.max(0, r - 2));
    ctx.clip();
    ctx.drawImage(img, lx, ly, logoPixelSize, logoPixelSize);
    ctx.restore();
  }
}

export function generateSVG(rawOptions: QROptions): Promise<string> {
  const options = sanitizeOptions(rawOptions);
  return new Promise(async (resolve) => {
    const text = options.url || "https://example.com";
    const qr = QRCode.create(text, {
      errorCorrectionLevel: options.errorCorrection,
    });
    const matrixSize = qr.modules.size;
    const totalSize = options.size;
    const cellSize = totalSize / (matrixSize + options.margin * 2);
    const off = options.margin * cellSize;

    let gradientDef = "";
    let fillRef = options.fgColor;

    if (options.gradientType === "linear") {
      const angle = options.gradientAngle;
      const rad = (angle * Math.PI) / 180;
      const x1 = 50 - Math.cos(rad) * 50;
      const y1 = 50 - Math.sin(rad) * 50;
      const x2 = 50 + Math.cos(rad) * 50;
      const y2 = 50 + Math.sin(rad) * 50;
      gradientDef = `<defs><linearGradient id="qrGrad" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%"><stop offset="0%" stop-color="${options.fgColor}"/><stop offset="100%" stop-color="${options.gradientColor2}"/></linearGradient></defs>`;
      fillRef = "url(#qrGrad)";
    } else if (options.gradientType === "radial") {
      gradientDef = `<defs><radialGradient id="qrGrad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${options.fgColor}"/><stop offset="100%" stop-color="${options.gradientColor2}"/></radialGradient></defs>`;
      fillRef = "url(#qrGrad)";
    }

    let paths = "";

    // Data modules
    for (let row = 0; row < matrixSize; row++) {
      for (let col = 0; col < matrixSize; col++) {
        if (qr.modules.get(row, col) !== 1) continue;
        if (isFinderPattern(row, col, matrixSize)) continue;
        const x = off + col * cellSize;
        const y = off + row * cellSize;
        paths += svgDot(x, y, cellSize, options.dotStyle, options.lineOrientation);
      }
    }

    // Finder patterns
    const finderPositions = [
      { row: 0, col: 0 },
      { row: 0, col: matrixSize - 7 },
      { row: matrixSize - 7, col: 0 },
    ];

    for (const fp of finderPositions) {
      const fx = off + fp.col * cellSize;
      const fy = off + fp.row * cellSize;
      const finderSize = 7 * cellSize;
      paths += svgFinderOuter(fx, fy, finderSize, cellSize, options.cornerStyle);
      const eyeOff = 2 * cellSize;
      const eyeSize = 3 * cellSize;
      paths += svgFinderEye(fx + eyeOff, fy + eyeOff, eyeSize, options.eyeStyle);
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}">
${gradientDef}
<rect width="${totalSize}" height="${totalSize}" fill="${options.bgColor}"/>
<g fill="${fillRef}" stroke="${fillRef}">
${paths}
</g>
</svg>`;
    resolve(svg);
  });
}

function svgDot(x: number, y: number, s: number, style: DotStyle, lineOrientation: LineOrientation = "vertical"): string {
  const gap = s * 0.05;
  switch (style) {
    case "square":
      return `<rect x="${x}" y="${y}" width="${s}" height="${s}" stroke="none"/>`;
    case "rounded":
      return `<rect x="${x + gap}" y="${y + gap}" width="${s - gap * 2}" height="${s - gap * 2}" rx="${s * 0.3}" stroke="none"/>`;
    case "dots": {
      const r = (s - gap * 2) / 2;
      return `<circle cx="${x + s / 2}" cy="${y + s / 2}" r="${r}" stroke="none"/>`;
    }
    case "diamond": {
      const cx = x + s / 2;
      const cy = y + s / 2;
      const h = (s - gap * 2) / 2;
      return `<polygon points="${cx},${cy - h} ${cx + h},${cy} ${cx},${cy + h} ${cx - h},${cy}" stroke="none"/>`;
    }
    case "star": {
      const cx = x + s / 2;
      const cy = y + s / 2;
      const oR = (s - gap * 2) / 2;
      const iR = oR * 0.4;
      let pts = "";
      for (let i = 0; i < 5; i++) {
        const oa = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        const ia = oa + Math.PI / 5;
        pts += `${cx + oR * Math.cos(oa)},${cy + oR * Math.sin(oa)} `;
        pts += `${cx + iR * Math.cos(ia)},${cy + iR * Math.sin(ia)} `;
      }
      return `<polygon points="${pts.trim()}" stroke="none"/>`;
    }
    case "lines": {
      const barW = s * 0.45;
      const r = barW * 0.3;
      const cx = x + s / 2;
      const cy = y + s / 2;
      let rot = 0;
      if (lineOrientation === "horizontal") rot = 90;
      else if (lineOrientation === "diagonal-left") rot = -45;
      else if (lineOrientation === "diagonal-right") rot = 45;
      const transform = rot !== 0 ? ` transform="rotate(${rot} ${cx} ${cy})"` : "";
      return `<rect x="${cx - barW / 2}" y="${cy - s / 2}" width="${barW}" height="${s}" rx="${r}" stroke="none"${transform}/>`;
    }
  }
}

function svgFinderOuter(
  x: number,
  y: number,
  size: number,
  cellSize: number,
  style: CornerStyle
): string {
  const lw = size / 7;
  const half = lw / 2;
  // Clear bg first
  let svg = `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="var(--bg,#fff)" stroke="none"/>`;
  switch (style) {
    case "square":
      svg += `<rect x="${x + half}" y="${y + half}" width="${size - lw}" height="${size - lw}" fill="none" stroke-width="${lw}"/>`;
      break;
    case "rounded":
      svg += `<rect x="${x + half}" y="${y + half}" width="${size - lw}" height="${size - lw}" rx="${size * 0.2}" fill="none" stroke-width="${lw}"/>`;
      break;
    case "dot":
      svg += `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${(size - lw) / 2}" fill="none" stroke-width="${lw}"/>`;
      break;
    case "diamond": {
      const cx = x + size / 2;
      const cy = y + size / 2;
      const h = (size - lw) / 2;
      svg += `<polygon points="${cx},${cy - h} ${cx + h},${cy} ${cx},${cy + h} ${cx - h},${cy}" fill="none" stroke-width="${lw}"/>`;
      break;
    }
  }
  return svg;
}

function svgFinderEye(
  x: number,
  y: number,
  size: number,
  style: EyeStyle
): string {
  switch (style) {
    case "square":
      return `<rect x="${x}" y="${y}" width="${size}" height="${size}" stroke="none"/>`;
    case "rounded":
      return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${size * 0.25}" stroke="none"/>`;
    case "circle":
      return `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size / 2}" stroke="none"/>`;
    case "diamond": {
      const cx = x + size / 2;
      const cy = y + size / 2;
      const h = size / 2;
      return `<polygon points="${cx},${cy - h} ${cx + h},${cy} ${cx},${cy + h} ${cx - h},${cy}" stroke="none"/>`;
    }
  }
}
