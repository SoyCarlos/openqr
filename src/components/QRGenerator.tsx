"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  QROptions,
  defaultOptions,
  renderQR,
  generateSVG,
  DotStyle,
  CornerStyle,
  EyeStyle,
  LineOrientation,
  GradientType,
  ErrorCorrectionLevel,
} from "@/lib/qr-renderer";
import { trackEvent } from "@/lib/analytics";

const DOT_STYLES: { value: DotStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "dots", label: "Dots" },
  { value: "diamond", label: "Diamond" },
  { value: "star", label: "Star" },
  { value: "lines", label: "Lines" },
];

const LINE_ORIENTATIONS: { value: LineOrientation; label: string }[] = [
  { value: "vertical", label: "Vertical" },
  { value: "horizontal", label: "Horizontal" },
  { value: "diagonal-left", label: "Diagonal ╲" },
  { value: "diagonal-right", label: "Diagonal ╱" },
];

const CORNER_STYLES: { value: CornerStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "dot", label: "Circle" },
  { value: "diamond", label: "Diamond" },
];

const EYE_STYLES: { value: EyeStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "circle", label: "Circle" },
  { value: "diamond", label: "Diamond" },
];

const GRADIENT_TYPES: { value: GradientType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "linear", label: "Linear" },
  { value: "radial", label: "Radial" },
];

const EC_LEVELS: { value: ErrorCorrectionLevel; label: string; desc: string }[] = [
  { value: "L", label: "Low", desc: "7% recovery" },
  { value: "M", label: "Medium", desc: "15% recovery" },
  { value: "Q", label: "Quartile", desc: "25% recovery" },
  { value: "H", label: "High", desc: "30% recovery" },
];

const PRESETS: { name: string; options: Partial<QROptions> }[] = [
  {
    name: "Classic",
    options: {
      dotStyle: "square",
      cornerStyle: "square",
      eyeStyle: "square",
      fgColor: "#000000",
      bgColor: "#ffffff",
      gradientType: "none",
    },
  },
  {
    name: "Modern",
    options: {
      dotStyle: "rounded",
      cornerStyle: "rounded",
      eyeStyle: "rounded",
      fgColor: "#1e1b4b",
      bgColor: "#ffffff",
      gradientType: "none",
    },
  },
  {
    name: "Neon",
    options: {
      dotStyle: "dots",
      cornerStyle: "dot",
      eyeStyle: "circle",
      fgColor: "#00ff88",
      bgColor: "#0a0a0a",
      gradientType: "none",
    },
  },
  {
    name: "Sunset",
    options: {
      dotStyle: "rounded",
      cornerStyle: "rounded",
      eyeStyle: "rounded",
      fgColor: "#f97316",
      bgColor: "#fffbeb",
      gradientType: "linear",
      gradientColor2: "#ec4899",
      gradientAngle: 135,
    },
  },
  {
    name: "Ocean",
    options: {
      dotStyle: "dots",
      cornerStyle: "rounded",
      eyeStyle: "circle",
      fgColor: "#0ea5e9",
      bgColor: "#f0f9ff",
      gradientType: "radial",
      gradientColor2: "#6366f1",
    },
  },
  {
    name: "Royal",
    options: {
      dotStyle: "diamond",
      cornerStyle: "diamond",
      eyeStyle: "diamond",
      fgColor: "#7c3aed",
      bgColor: "#faf5ff",
      gradientType: "linear",
      gradientColor2: "#c026d3",
      gradientAngle: 45,
    },
  },
  {
    name: "Lines",
    options: {
      dotStyle: "lines",
      cornerStyle: "rounded",
      eyeStyle: "rounded",
      fgColor: "#18181b",
      bgColor: "#ffffff",
      gradientType: "none",
    },
  },
];

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border pb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
      >
        {title}
        <svg
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="mt-2 space-y-3">{children}</div>}
    </div>
  );
}

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            value === opt.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-9 rounded-lg"
      />
      <div className="flex-1">
        <label className="text-xs text-muted-foreground">{label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full rounded-md border border-border bg-background px-2 py-1 text-xs font-mono text-foreground"
        />
      </div>
    </div>
  );
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomHexColor(): string {
  return "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
}

function generateRandomOptions(): Partial<QROptions> {
  const dotStyle = pickRandom(DOT_STYLES).value;
  const gradientType = pickRandom(GRADIENT_TYPES).value;
  const fgColor = randomHexColor();
  // Ensure bg is light enough by mixing with white
  const bgLightness = 200 + Math.floor(Math.random() * 55);
  const bgColor = `#${bgLightness.toString(16)}${bgLightness.toString(16)}${bgLightness.toString(16)}`;
  return {
    dotStyle,
    cornerStyle: pickRandom(CORNER_STYLES).value,
    eyeStyle: pickRandom(EYE_STYLES).value,
    lineOrientation: pickRandom(LINE_ORIENTATIONS).value,
    fgColor,
    bgColor,
    gradientType,
    gradientColor2: gradientType !== "none" ? randomHexColor() : "#6d28d9",
    gradientAngle: Math.floor(Math.random() * 360),
  };
}

function FAQItem({
  question,
  children,
}: {
  question: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-foreground hover:text-primary transition-colors"
      >
        {question}
        <svg
          className={`ml-2 h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-border px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          {children}
        </div>
      )}
    </div>
  );
}

export default function QRGenerator() {
  const [options, setOptions] = useState<QROptions>(defaultOptions);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const trackedUrlRef = useRef<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [logoError, setLogoError] = useState("");

  const update = useCallback((partial: Partial<QROptions>) => {
    setOptions((prev) => ({ ...prev, ...partial }));
  }, []);

  const validateAndSetUrl = useCallback(
    (url: string) => {
      update({ url });
      if (url && !url.match(/^https?:\/\/.+/i) && !url.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/.+/)) {
        setUrlError("Include a protocol (e.g. https://)");
      } else {
        setUrlError("");
      }
    },
    [update]
  );

  // Render QR code when options change
  useEffect(() => {
    if (!canvasRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsGenerating(true);
      try {
        await renderQR(canvasRef.current!, { ...options, size: 1024 });
        if (options.url && options.url !== trackedUrlRef.current) {
          trackedUrlRef.current = options.url;
          trackEvent("qr_created", { url: options.url });
        }
      } catch {
        // Invalid URL or QR data — canvas will show last valid state
      }
      setIsGenerating(false);
    }, 150);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [options]);

  const downloadPNG = useCallback(async () => {
    const canvas = document.createElement("canvas");
    await renderQR(canvas, { ...options, size: 2048 });
    const link = document.createElement("a");
    link.download = "qrcode.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    trackEvent("qr_downloaded", { format: "png" });
  }, [options]);

  const downloadSVG = useCallback(async () => {
    const svg = await generateSVG({ ...options, size: 1024 });
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.download = "qrcode.svg";
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    trackEvent("qr_downloaded", { format: "svg" });
  }, [options]);

  const handleLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
      const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

      if (file.size > MAX_SIZE) {
        setLogoError("Logo must be under 5 MB");
        return;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        setLogoError("Only PNG, JPEG, GIF, and WebP are allowed");
        return;
      }

      setLogoError("");
      const reader = new FileReader();
      reader.onload = () => {
        update({ logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    },
    [update]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <svg className="h-5 w-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h4v4H4V6zm12 0h4v4h-4V6zM4 16h4v4H4v-4zm8-8h2v2h-2V8zm4 4h2v2h-2v-2zm-4 4h2v2h-2v-2zm4 0h4v4h-4v-4z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-foreground">
              Open<span className="text-primary">QR</span>
            </h1>
          </div>
          <p className="hidden text-sm text-muted-foreground sm:block">
            Free QR code generator — no account needed
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px]">
          {/* Left: Controls */}
          <div className="space-y-6 order-2 lg:order-1">
            {/* URL Input */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <label className="mb-2 block text-sm font-semibold text-foreground">
                Enter your URL
              </label>
              <input
                type="url"
                placeholder="https://example.com"
                value={options.url}
                onChange={(e) => validateAndSetUrl(e.target.value)}
                className={`w-full rounded-lg border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm ${
                  urlError ? "border-red-400" : "border-border"
                }`}
              />
              {urlError && (
                <p className="mt-1 text-xs text-red-500">{urlError}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                QR codes link directly to your URL — they work forever, even if this site goes offline.
              </p>
            </div>

            {/* Presets */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <label className="mb-3 block text-sm font-semibold text-foreground">
                Quick Presets
              </label>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => update(preset.options)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-all hover:border-primary hover:shadow-sm active:scale-95"
                  >
                    {preset.name}
                  </button>
                ))}
                <button
                  onClick={() => update(generateRandomOptions())}
                  className="rounded-lg border border-dashed border-primary bg-primary/5 px-3 py-2 text-xs font-medium text-primary transition-all hover:bg-primary/10 hover:shadow-sm active:scale-95"
                >
                  Random
                </button>
              </div>
            </div>

            {/* Customization Panel */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4">
              <Section title="Dot Style">
                <ToggleGroup
                  options={DOT_STYLES}
                  value={options.dotStyle}
                  onChange={(v) => update({ dotStyle: v })}
                />
                {options.dotStyle === "lines" && (
                  <div className="pt-2">
                    <label className="mb-1.5 block text-xs text-muted-foreground">
                      Line Orientation
                    </label>
                    <ToggleGroup
                      options={LINE_ORIENTATIONS}
                      value={options.lineOrientation}
                      onChange={(v) => update({ lineOrientation: v })}
                    />
                  </div>
                )}
              </Section>

              <Section title="Corner Style">
                <ToggleGroup
                  options={CORNER_STYLES}
                  value={options.cornerStyle}
                  onChange={(v) => update({ cornerStyle: v })}
                />
              </Section>

              <Section title="Eye Style">
                <ToggleGroup
                  options={EYE_STYLES}
                  value={options.eyeStyle}
                  onChange={(v) => update({ eyeStyle: v })}
                />
              </Section>

              <Section title="Colors">
                <div className="grid grid-cols-2 gap-4">
                  <ColorInput
                    label="Foreground"
                    value={options.fgColor}
                    onChange={(v) => update({ fgColor: v })}
                  />
                  <ColorInput
                    label="Background"
                    value={options.bgColor}
                    onChange={(v) => update({ bgColor: v })}
                  />
                </div>
                <button
                  onClick={() =>
                    update({ fgColor: options.bgColor, bgColor: options.fgColor })
                  }
                  className="text-xs text-primary hover:underline"
                >
                  Swap colors
                </button>
              </Section>

              <Section title="Gradient" defaultOpen={false}>
                <ToggleGroup
                  options={GRADIENT_TYPES}
                  value={options.gradientType}
                  onChange={(v) => update({ gradientType: v })}
                />
                {options.gradientType !== "none" && (
                  <div className="space-y-3 pt-2">
                    <ColorInput
                      label="Gradient End Color"
                      value={options.gradientColor2}
                      onChange={(v) => update({ gradientColor2: v })}
                    />
                    {options.gradientType === "linear" && (
                      <div>
                        <label className="text-xs text-muted-foreground">
                          Angle: {options.gradientAngle}°
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={360}
                          value={options.gradientAngle}
                          onChange={(e) =>
                            update({ gradientAngle: Number(e.target.value) })
                          }
                          className="mt-1 w-full"
                        />
                      </div>
                    )}
                  </div>
                )}
              </Section>

              <Section title="Logo" defaultOpen={false}>
                <div className="space-y-3">
                  <div>
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-background px-4 py-3 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {options.logo ? "Change logo" : "Upload logo image"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    {logoError && (
                      <p className="mt-1 text-xs text-red-500">{logoError}</p>
                    )}
                  </div>
                  {options.logo && (
                    <>
                      <button
                        onClick={() => update({ logo: null })}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove logo
                      </button>
                      <div>
                        <label className="text-xs text-muted-foreground">
                          Logo size: {options.logoSize}%
                        </label>
                        <input
                          type="range"
                          min={5}
                          max={40}
                          value={options.logoSize}
                          onChange={(e) =>
                            update({ logoSize: Number(e.target.value) })
                          }
                          className="mt-1 w-full"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">
                          Logo padding: {options.logoPadding}px
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={20}
                          value={options.logoPadding}
                          onChange={(e) =>
                            update({ logoPadding: Number(e.target.value) })
                          }
                          className="mt-1 w-full"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">
                          Logo corner radius: {options.logoRadius}px
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={50}
                          value={options.logoRadius}
                          onChange={(e) =>
                            update({ logoRadius: Number(e.target.value) })
                          }
                          className="mt-1 w-full"
                        />
                      </div>
                    </>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Tip: Use &quot;High&quot; error correction when adding a logo.
                  </p>
                </div>
              </Section>

              <Section title="Advanced" defaultOpen={false}>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      Error Correction
                    </label>
                    <ToggleGroup
                      options={EC_LEVELS.map((l) => ({
                        value: l.value,
                        label: `${l.label} (${l.desc})`,
                      }))}
                      value={options.errorCorrection}
                      onChange={(v) =>
                        update({ errorCorrection: v as ErrorCorrectionLevel })
                      }
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Higher = more resilient but denser. Use High with logos.
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-foreground">
                        Margin
                      </label>
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono font-semibold text-foreground">
                        {options.margin}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => update({ margin: Math.max(0, options.margin - 1) })}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-sm font-bold text-foreground transition-colors hover:bg-accent"
                      >
                        -
                      </button>
                      <div className="relative flex-1">
                        <div className="absolute inset-0 flex items-center">
                          <div className="h-2 w-full rounded-full bg-muted" />
                        </div>
                        <div className="absolute inset-0 flex items-center">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${(options.margin / 10) * 100}%` }}
                          />
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={10}
                          value={options.margin}
                          onChange={(e) =>
                            update({ margin: Number(e.target.value) })
                          }
                          className="relative z-10 mt-0 w-full opacity-0 cursor-pointer h-8"
                        />
                      </div>
                      <button
                        onClick={() => update({ margin: Math.min(10, options.margin + 1) })}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-sm font-bold text-foreground transition-colors hover:bg-accent"
                      >
                        +
                      </button>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Quiet zone around the QR code (in modules)
                    </p>
                  </div>
                </div>
              </Section>
            </div>
          </div>

          {/* Right: Preview & Download */}
          <div className="order-1 lg:order-2">
            <div className="sticky top-20">
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-white">
                  <canvas
                    ref={canvasRef}
                    className="h-full w-full"
                    style={{ imageRendering: "auto" }}
                  />
                  {isGenerating && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={downloadPNG}
                    className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    PNG
                  </button>
                  <button
                    onClick={downloadSVG}
                    className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-accent active:scale-[0.98]"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    SVG
                  </button>
                </div>

                <p className="mt-3 text-center text-xs text-muted-foreground">
                  PNG exports at 2048×2048 for print quality
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <h2 className="mb-6 text-center text-xl font-bold text-foreground">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <FAQItem question="How do I scan a QR code on iPhone (iOS)?">
            On iOS, simply open the default <strong>Camera</strong> app and
            point it at the QR code. A notification banner will appear at the
            top of the screen with the link — tap it to open. No extra app is
            needed. iOS has supported this natively since iOS 11. You can also
            use the Code Scanner control in Control Center for a more
            focused scanning experience.
          </FAQItem>
          <FAQItem question="How do I scan a QR code on Android?">
            Most modern Android phones (Android 9+) can scan QR codes directly
            from the <strong>Camera</strong> app — just point and tap the link
            that appears. On some devices (especially Samsung), you may need to
            enable &quot;Scan QR codes&quot; in Camera settings first. Google
            Pixel phones also offer a QR scanner tile in Quick Settings. If
            your camera app doesn&apos;t detect QR codes, try{" "}
            <strong>Google Lens</strong> which is built into most Android
            devices.
          </FAQItem>
          <FAQItem question="Why does scanning behave differently on iOS vs Android?">
            iOS uses a single system-level QR reader built into the Camera app
            that consistently shows a tappable banner. Android is more
            fragmented — the experience depends on the device manufacturer and
            Android version. Some cameras auto-detect QR codes, others require
            Google Lens, and older devices may need a third-party scanner app.
            The QR code itself is identical; only the scanning software differs.
          </FAQItem>
          <FAQItem question="Will my QR code still work if this website goes down?">
            Yes. The QR code encodes your URL directly — it doesn&apos;t go
            through our servers or any redirect. Once you download it, the
            image is completely self-contained and will work forever as long as
            the destination URL is live.
          </FAQItem>
          <FAQItem question="Which error correction level should I use?">
            <strong>Low (L)</strong> is fine for clean digital displays.{" "}
            <strong>Medium (M)</strong> works for most printed materials.{" "}
            <strong>Quartile (Q)</strong> or <strong>High (H)</strong> is
            recommended if your QR code will be printed small, placed on curved
            surfaces, or if you&apos;re adding a logo in the center (which
            obscures part of the code).
          </FAQItem>
          <FAQItem question="What file format should I download?">
            <strong>PNG</strong> is best for web, social media, and most print
            needs — we export at 2048×2048 for sharp results. <strong>SVG</strong>{" "}
            is ideal if you need infinite scaling (large banners, signage) or
            want to edit the QR code in a vector design tool like Figma or
            Illustrator.
          </FAQItem>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <p>
          OpenQR — QR codes encode your URL directly. They&apos;ll work forever,
          no tracking, no middleman.
        </p>
      </footer>
    </div>
  );
}
