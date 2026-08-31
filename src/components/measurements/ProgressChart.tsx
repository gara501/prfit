type ChartPoint = {
  date: string;
  value: number;
};

export function ProgressChart({
  title,
  unit,
  points,
  color,
}: {
  title: string;
  unit: string;
  points: ChartPoint[];
  color: "orange" | "emerald";
}) {
  if (points.length === 0) {
    return (
      <section className="grid min-h-72 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
        <div>
          <h2 className="text-xl font-black">{title}</h2>
          <p className="mt-2 text-sm text-slate-500">
            Aún no hay suficientes datos para mostrar esta evolución.
          </p>
        </div>
      </section>
    );
  }

  const width = 720;
  const height = 260;
  const padX = 42;
  const padTop = 24;
  const padBottom = 42;
  const values = points.map((point) => point.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const spread = Math.max(rawMax - rawMin, Math.max(rawMax * 0.05, 1));
  const min = rawMin - spread * 0.15;
  const max = rawMax + spread * 0.15;
  const plotWidth = width - padX * 2;
  const plotHeight = height - padTop - padBottom;
  const coordinates = points.map((point, index) => ({
    ...point,
    x:
      points.length === 1
        ? width / 2
        : padX + (index / (points.length - 1)) * plotWidth,
    y: padTop + ((max - point.value) / (max - min)) * plotHeight,
  }));
  const line = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const stroke = color === "orange" ? "var(--primary)" : "var(--success)";
  const latest = points.at(-1);
  const first = points[0];
  const delta = latest ? latest.value - first.value : 0;

  return (
    <section className="rounded-3xl border border-slate-300 bg-white p-5 shadow-[0_20px_55px_-45px_rgba(15,23,42,0.9)] sm:p-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            Evolución
          </p>
          <h2 className="mt-1 text-xl font-black">{title}</h2>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black tracking-tight">
            {latest?.value.toFixed(1)}
            <span className="ml-1 text-sm text-slate-400">{unit}</span>
          </p>
          <p
            className={`text-xs font-black ${
              delta === 0
                ? "text-slate-400"
                : color === "orange"
                  ? "text-orange-700"
                  : "text-emerald-700"
            }`}
          >
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)} {unit} desde el inicio
          </p>
        </div>
      </div>
      <svg
        aria-label={`Gráfico histórico de ${title}`}
        className="mt-5 h-auto w-full overflow-visible"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <title>{`Histórico de ${title}`}</title>
        {[0, 1, 2, 3].map((lineIndex) => {
          const y = padTop + (lineIndex / 3) * plotHeight;
          return (
            <line
              key={lineIndex}
              stroke="var(--border)"
              strokeDasharray="4 6"
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
            />
          );
        })}
        <polyline
          fill="none"
          points={line}
          stroke={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="5"
        />
        {coordinates.map((point, index) => (
          <g key={`${point.date}-${point.value}`}>
            <circle
              cx={point.x}
              cy={point.y}
              fill="var(--card)"
              r="7"
              stroke={stroke}
              strokeWidth="4"
            >
              <title>{`${point.date}: ${point.value} ${unit}`}</title>
            </circle>
            {index === 0 || index === coordinates.length - 1 ? (
              <text
                fill="var(--muted-foreground)"
                fontSize="12"
                fontWeight="700"
                textAnchor={index === 0 ? "start" : "end"}
                x={point.x}
                y={height - 10}
              >
                {formatShortDate(point.date)}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
    </section>
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));
}
