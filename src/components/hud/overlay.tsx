import { useEffect, useState } from "react";
import { Crosshair, Eye, EyeOff, Pause, Play, RotateCcw, Sparkles, Spline } from "lucide-react";
import { AU_KM, BODY_BY_ID, NAV_BODIES, type BodyDef } from "@/lib/solar/bodies";
import { dateFromSimDays, distanceAu } from "@/lib/solar/kepler";
import {
  formatDate,
  formatDays,
  formatNumber,
  formatSci,
  formatSpeed,
  yearDurationLabel,
} from "@/lib/solar/format";
import { resetToNow, runtime } from "@/lib/solar/runtime";
import { SPEED_MAX, SPEED_MIN, useSolar } from "@/lib/solar/store";
import { cn } from "@/lib/utils";

const SPEED_PRESETS = [
  { label: "1 d/s", value: 1 },
  { label: "1 sem/s", value: 7 },
  { label: "1 mes/s", value: 30 },
  { label: "1 a/s", value: 365 },
  { label: "10 a/s", value: 3652 },
];

function useSimDays(hz = 8): number {
  const [days, setDays] = useState(() => runtime.days);
  useEffect(() => {
    const id = window.setInterval(() => setDays(runtime.days), 1000 / hz);
    return () => window.clearInterval(id);
  }, [hz]);
  return days;
}

function speedToSlider(speed: number): number {
  const a = Math.log10(SPEED_MIN);
  const b = Math.log10(SPEED_MAX);
  return ((Math.log10(speed) - a) / (b - a)) * 100;
}

function sliderToSpeed(t: number): number {
  const a = Math.log10(SPEED_MIN);
  const b = Math.log10(SPEED_MAX);
  return 10 ** (a + (t / 100) * (b - a));
}

export function Overlay() {
  const paused = useSolar((s) => s.paused);
  const speed = useSolar((s) => s.speed);
  const selectedId = useSolar((s) => s.selectedId);
  const showLabels = useSolar((s) => s.showLabels);
  const showOrbits = useSolar((s) => s.showOrbits);
  const showTrails = useSolar((s) => s.showTrails);
  const days = useSimDays();
  const date = dateFromSimDays(days);
  const selected = selectedId ? BODY_BY_ID[selectedId] : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const state = useSolar.getState();
      if (e.code === "Space") {
        e.preventDefault();
        state.togglePaused();
      } else if (e.code === "Escape") {
        state.select(null);
      } else if (e.key === "0") {
        state.select("sun");
      } else if (e.key >= "1" && e.key <= "8") {
        const planet = NAV_BODIES[Number(e.key)];
        if (planet) state.select(planet.id);
      } else if (e.key === "+" || e.key === "=") {
        state.setSpeed(Math.min(SPEED_MAX, state.speed * 1.6));
      } else if (e.key === "-" || e.key === "_") {
        state.setSpeed(Math.max(SPEED_MIN, state.speed / 1.6));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 text-fg">
      <header className="hud-enter pointer-events-auto absolute top-4 left-4 right-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between md:top-5 md:left-5 md:right-5">
        <div className="flex flex-col gap-2">
          <div className="hud-panel max-w-[14rem] rounded-xl px-4 py-3 md:max-w-xs">
            <p className="font-display text-2xl leading-tight tracking-tight md:text-3xl">Eclíptica</p>
            <p className="mt-1 text-xs text-muted">Sistema solar · órbitas reales</p>
          </div>
          <div className="hidden md:block">
            <Toggles
              showOrbits={showOrbits}
              showTrails={showTrails}
              showLabels={showLabels}
              overview={selectedId === null}
              row
            />
          </div>
        </div>
        <Transport paused={paused} speed={speed} date={date} />
      </header>

      <InfoPanel body={selected} days={days} />

      <nav className="hud-enter hud-enter-3 pointer-events-auto absolute right-0 bottom-3 left-0 px-3 md:bottom-5 md:px-5">
        <div className="mb-2 flex justify-center gap-2 md:hidden">
          <Toggles
            showOrbits={showOrbits}
            showTrails={showTrails}
            showLabels={showLabels}
            overview={selectedId === null}
            row
          />
        </div>
        <div className="mx-auto flex max-w-5xl items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV_BODIES.map((b) => (
            <button
              key={b.id}
              type="button"
              data-active={selectedId === b.id ? "true" : "false"}
              onClick={() => useSolar.getState().select(selectedId === b.id ? null : b.id)}
              className="planet-chip flex h-11 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96]"
            >
              <span className="size-1.5 rounded-full" style={{ background: b.color }} aria-hidden />
              {b.name}
            </button>
          ))}
        </div>
        <p className="mx-auto mt-2 hidden max-w-5xl px-1 text-xs tracking-wide text-subtle md:block">
          Espacio pausa · Esc vista general · 0–8 cuerpos · clic para enfocar
        </p>
      </nav>
    </div>
  );
}

function Toggles({
  showOrbits,
  showTrails,
  showLabels,
  overview,
  row,
}: {
  showOrbits: boolean;
  showTrails: boolean;
  showLabels: boolean;
  overview: boolean;
  row?: boolean;
}) {
  return (
    <div className={cn("flex gap-2", row ? "flex-row" : "flex-col")}>
      <Toggle
        pressed={showOrbits}
        label="Órbitas"
        onClick={() => useSolar.getState().setShowOrbits(!showOrbits)}
      >
        <Spline className="size-4" strokeWidth={1.75} />
      </Toggle>
      <Toggle
        pressed={showTrails}
        label="Estelas"
        onClick={() => useSolar.getState().setShowTrails(!showTrails)}
      >
        <Sparkles className="size-4" strokeWidth={1.75} />
      </Toggle>
      <Toggle
        pressed={showLabels}
        label="Etiquetas"
        onClick={() => useSolar.getState().setShowLabels(!showLabels)}
      >
        {showLabels ? (
          <Eye className="size-4" strokeWidth={1.75} />
        ) : (
          <EyeOff className="size-4" strokeWidth={1.75} />
        )}
      </Toggle>
      <Toggle pressed={overview} label="Vista general" onClick={() => useSolar.getState().select(null)}>
        <Crosshair className="size-4" strokeWidth={1.75} />
      </Toggle>
    </div>
  );
}

function Transport({
  paused,
  speed,
  date,
}: {
  paused: boolean;
  speed: number;
  date: Date;
}) {
  return (
    <div className="hud-panel flex max-w-full flex-col gap-2 rounded-xl px-3 py-2.5 sm:min-w-[17.5rem]">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={paused ? "Reanudar" : "Pausar"}
          onClick={() => useSolar.getState().togglePaused()}
          className="flex size-11 items-center justify-center rounded-md bg-fg text-accent-fg transition-transform duration-150 ease-out active:scale-[0.96]"
        >
          <span className="relative size-4">
            <Pause
              className={cn(
                "absolute inset-0 size-4 transition-[opacity,filter,transform] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
                paused ? "scale-[0.25] opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-none",
              )}
              strokeWidth={1.75}
            />
            <Play
              className={cn(
                "absolute inset-0 ml-0.5 size-4 transition-[opacity,filter,transform] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
                paused ? "scale-100 opacity-100 blur-none" : "scale-[0.25] opacity-0 blur-[4px]",
              )}
              strokeWidth={1.75}
            />
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">Época simulada</p>
          <p className="truncate font-medium tabular-nums">{formatDate(date)}</p>
        </div>
        <button
          type="button"
          aria-label="Volver a hoy"
          onClick={() => resetToNow()}
          className="flex size-11 items-center justify-center rounded-md text-muted transition-colors duration-150 hover:text-fg"
        >
          <RotateCcw className="size-4" strokeWidth={1.75} />
        </button>
      </div>
      <div className="flex h-11 items-center gap-3 px-1">
        <input
          aria-label="Velocidad de simulación"
          type="range"
          min={0}
          max={100}
          step={0.4}
          value={speedToSlider(speed)}
          onChange={(e) => useSolar.getState().setSpeed(sliderToSpeed(Number(e.target.value)))}
          className="w-full"
        />
      </div>
      <div className="flex items-baseline justify-between gap-2 px-1">
        <span className="text-xs tabular-nums text-muted">{formatSpeed(speed)}</span>
        <span className="text-xs tabular-nums text-subtle">{yearDurationLabel(speed)}</span>
      </div>
      <div className="flex flex-wrap gap-1 px-0.5">
        {SPEED_PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => useSolar.getState().setSpeed(p.value)}
            className={cn(
              "h-8 rounded-full px-2.5 text-xs tracking-wide text-muted transition-colors duration-150",
              Math.abs(speed - p.value) / p.value < 0.08 ? "bg-fg text-accent-fg" : "hover:text-fg",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({
  pressed,
  label,
  onClick,
  children,
}: {
  pressed: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "hud-panel flex size-11 items-center justify-center rounded-md transition-colors duration-150",
        pressed ? "text-fg" : "text-muted",
      )}
    >
      {children}
    </button>
  );
}

function bodyStats(body: BodyDef, days: number): { k: string; v: string }[] {
  const rows: { k: string; v: string }[] = [
    { k: "Clase", v: body.typeLabel },
    { k: "Radio", v: `${formatNumber(body.radiusKm, 0)} km` },
    { k: "Masa", v: formatSci(body.massCoeff, body.massExp, "kg") },
    { k: "Gravedad", v: `${formatNumber(body.gravity, 2)} m/s²` },
    { k: "Rotación", v: formatDays(Math.abs(body.rotationDays)) },
    { k: "Oblicuidad", v: `${formatNumber(body.obliquity, 2)}°` },
    { k: "Temperatura", v: body.temp },
  ];
  if (body.orbit) {
    const liveAu = distanceAu(body.orbit, days);
    rows.splice(
      1,
      0,
      {
        k: "Distancia actual",
        v: `${formatNumber(liveAu, 3)} UA · ${formatNumber((liveAu * AU_KM) / 1e6, 1)} mill. km`,
      },
      { k: "Semieje mayor", v: `${formatNumber(body.orbit.a, 3)} UA` },
      { k: "Periodo orbital", v: formatDays(body.orbit.periodDays) },
      { k: "Excentricidad", v: formatNumber(body.orbit.e, 4) },
      { k: "Inclinación", v: `${formatNumber(body.orbit.i, 3)}°` },
    );
  }
  if (body.kind === "planet") {
    rows.push({ k: "Satélites", v: String(body.moons) });
  }
  return rows;
}

function InfoPanel({ body, days }: { body: BodyDef | null; days: number }) {
  if (!body) return null;
  const stats = bodyStats(body, days);

  return (
    <aside className="pointer-events-auto absolute right-3 bottom-28 left-3 max-h-[38vh] overflow-auto md:top-36 md:right-5 md:bottom-auto md:left-auto md:max-h-[calc(100dvh-14rem)] md:w-[20.5rem]">
      <div className="hud-panel rounded-xl px-4 py-4">
        <p className="text-xs tracking-[0.14em] text-muted uppercase">{body.latin}</p>
        <div className="mt-1 flex items-center gap-2">
          <h2 className="font-display text-3xl leading-tight">{body.name}</h2>
          <span className="size-2 rounded-full" style={{ background: body.color }} />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">{body.blurb}</p>
        <dl className="mt-4 space-y-2">
          {stats.map((row) => (
            <div key={row.k} className="flex items-baseline justify-between gap-3 border-t border-border pt-2">
              <dt className="text-xs text-subtle">{row.k}</dt>
              <dd className="text-right text-sm tabular-nums">{row.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  );
}
