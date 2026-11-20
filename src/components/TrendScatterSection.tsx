import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  GitCommit,
  Palette,
  Maximize2,
  Sliders,
  Sparkles,
  Info,
} from 'lucide-react';
import { DatasetState } from '../types/data';
import { computeLinearRegression, isNullOrEmpty } from '../utils/statistics';

interface TrendScatterSectionProps {
  dataset: DatasetState;
}

const COLOR_PALETTE = [
  '#4f46e5', // Indigo
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#ef4444', // Red
  '#14b8a6', // Teal
];

export const TrendScatterSection: React.FC<TrendScatterSectionProps> = ({ dataset }) => {
  const numericColumns = Object.keys(dataset.stats.numeric);
  const categoricalColumns = dataset.columns
    .filter((c) => !c.type.startsWith('numeric'))
    .map((c) => c.name);

  const [xAxisCol, setXAxisCol] = useState<string>(numericColumns[0] || '');
  const [yAxisCol, setYAxisCol] = useState<string>(
    numericColumns.length > 1 ? numericColumns[1] : numericColumns[0] || ''
  );
  const [colorCol, setColorCol] = useState<string>('');
  const [showTrendLine, setShowTrendLine] = useState<boolean>(true);
  const [connectLine, setConnectLine] = useState<boolean>(false);
  const [hoveredPoint, setHoveredPoint] = useState<{
    xVal: number;
    yVal: number;
    label?: string;
    rowIdx: number;
    cx: number;
    cy: number;
  } | null>(null);

  // Extract points
  const pointsData = useMemo(() => {
    if (!xAxisCol || !yAxisCol) return [];

    const result: {
      x: number;
      y: number;
      colorVal?: string;
      rowIdx: number;
      rawRow: Record<string, any>;
    }[] = [];

    dataset.rawRows.forEach((row, idx) => {
      const vx = row[xAxisCol];
      const vy = row[yAxisCol];

      if (!isNullOrEmpty(vx) && !isNullOrEmpty(vy)) {
        const nx = typeof vx === 'number' ? vx : Number(vx);
        const ny = typeof vy === 'number' ? vy : Number(vy);

        if (!isNaN(nx) && !isNaN(ny)) {
          result.push({
            x: nx,
            y: ny,
            colorVal: colorCol ? String(row[colorCol] || '') : undefined,
            rowIdx: idx,
            rawRow: row,
          });
        }
      }
    });

    return result;
  }, [dataset, xAxisCol, yAxisCol, colorCol]);

  // Compute Linear Regression
  const regression = useMemo(() => {
    if (pointsData.length < 2) return null;
    const xs = pointsData.map((p) => p.x);
    const ys = pointsData.map((p) => p.y);
    return computeLinearRegression(xs, ys);
  }, [pointsData]);

  // Unique color categories
  const colorCategories = useMemo(() => {
    if (!colorCol) return [];
    const set = new Set<string>();
    pointsData.forEach((p) => {
      if (p.colorVal) set.add(p.colorVal);
    });
    return Array.from(set).slice(0, 8);
  }, [pointsData, colorCol]);

  const getColorForCategory = (val?: string) => {
    if (!val || colorCategories.length === 0) return '#4f46e5';
    const idx = colorCategories.indexOf(val);
    return idx >= 0 ? COLOR_PALETTE[idx % COLOR_PALETTE.length] : '#94a3b8';
  };

  if (numericColumns.length < 2) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 shadow-xs">
        Se requieren al menos 2 variables numéricas para generar gráficos de tendencia y dispersión bivariados.
      </div>
    );
  }

  // SVG Chart Scales
  const svgWidth = 720;
  const svgHeight = 380;
  const margin = { top: 30, right: 30, bottom: 50, left: 65 };
  const innerWidth = svgWidth - margin.left - margin.right;
  const innerHeight = svgHeight - margin.top - margin.bottom;

  const minX = Math.min(...pointsData.map((p) => p.x), 0);
  const maxX = Math.max(...pointsData.map((p) => p.x), 1);
  const minY = Math.min(...pointsData.map((p) => p.y), 0);
  const maxY = Math.max(...pointsData.map((p) => p.y), 1);

  // Buffer 5%
  const bufferX = (maxX - minX) * 0.05 || 1;
  const bufferY = (maxY - minY) * 0.05 || 1;
  const domainMinX = minX - bufferX;
  const domainMaxX = maxX + bufferX;
  const domainMinY = minY - bufferY;
  const domainMaxY = maxY + bufferY;

  const scaleX = (x: number) => {
    return margin.left + ((x - domainMinX) / (domainMaxX - domainMinX)) * innerWidth;
  };

  const scaleY = (y: number) => {
    return margin.top + innerHeight - ((y - domainMinY) / (domainMaxY - domainMinY)) * innerHeight;
  };

  // Connected Line points (sorted by X)
  const connectedPoints = connectLine
    ? [...pointsData].sort((a, b) => a.x - b.x)
    : [];

  const lineD =
    connectedPoints.length > 0
      ? `M ${scaleX(connectedPoints[0].x)} ${scaleY(connectedPoints[0].y)} ` +
        connectedPoints
          .slice(1)
          .map((p) => `L ${scaleX(p.x)} ${scaleY(p.y)}`)
          .join(' ')
      : '';

  // Trendline Coordinates
  let trendX1 = domainMinX;
  let trendY1 = regression ? regression.slope * trendX1 + regression.intercept : 0;
  let trendX2 = domainMaxX;
  let trendY2 = regression ? regression.slope * trendX2 + regression.intercept : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Gráficos de Tendencia y Dispersión (X vs Y)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configura libremente las variables de los ejes X e Y, añade regresión lineal y evalúa la fuerza de relación empírica.
          </p>
        </div>

        {/* Regression badges */}
        {regression && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 text-xs font-mono font-semibold border border-indigo-200">
              {regression.equation}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-mono font-semibold border border-emerald-200">
              R² = {regression.r2}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 text-xs font-mono font-semibold border border-blue-200">
              r = {regression.r}
            </span>
          </div>
        )}
      </div>

      {/* Axis Selection and Styling Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        {/* X Axis */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Variable Eje X (Horizontal):
          </label>
          <select
            value={xAxisCol}
            onChange={(e) => setXAxisCol(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {numericColumns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>

        {/* Y Axis */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Variable Eje Y (Vertical):
          </label>
          <select
            value={yAxisCol}
            onChange={(e) => setYAxisCol(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {numericColumns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>

        {/* Color Grouping */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Agrupar / Colorear por:
          </label>
          <select
            value={colorCol}
            onChange={(e) => setColorCol(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">(Sin agrupación por color)</option>
            {categoricalColumns.map((col) => (
              <option key={col} value={col}>
                {col} (Categórica)
              </option>
            ))}
          </select>
        </div>

        {/* Switches */}
        <div className="flex flex-col justify-center space-y-1.5 text-xs text-slate-700 pt-1">
          <label className="flex items-center space-x-2 cursor-pointer font-medium">
            <input
              type="checkbox"
              checked={showTrendLine}
              onChange={(e) => setShowTrendLine(e.target.checked)}
              className="rounded accent-indigo-600 cursor-pointer"
            />
            <span>Línea de Tendencia (Regresión)</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer font-medium">
            <input
              type="checkbox"
              checked={connectLine}
              onChange={(e) => setConnectLine(e.target.checked)}
              className="rounded accent-indigo-600 cursor-pointer"
            />
            <span>Conectar Puntos (Secuencia)</span>
          </label>
        </div>
      </div>

      {/* Main SVG Scatter Plot */}
      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/20 relative">
        {/* Category Legend if active */}
        {colorCategories.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-3 text-xs">
            <span className="font-semibold text-slate-600">Categoría ({colorCol}):</span>
            {colorCategories.map((cat, idx) => (
              <span key={cat} className="flex items-center gap-1 text-slate-700">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: COLOR_PALETTE[idx % COLOR_PALETTE.length] }}
                />
                {cat}
              </span>
            ))}
          </div>
        )}

        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto max-h-[420px]">
            {/* Grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = margin.top + innerHeight * (1 - pct);
              const yVal = domainMinY + (domainMaxY - domainMinY) * pct;
              return (
                <g key={`gy-${i}`}>
                  <line
                    x1={margin.left}
                    y1={y}
                    x2={margin.left + innerWidth}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={margin.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#94a3b8"
                    fontFamily="monospace"
                  >
                    {yVal.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const x = margin.left + innerWidth * pct;
              const xVal = domainMinX + (domainMaxX - domainMinX) * pct;
              return (
                <g key={`gx-${i}`}>
                  <line
                    x1={x}
                    y1={margin.top}
                    x2={x}
                    y2={margin.top + innerHeight}
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={x}
                    y={margin.top + innerHeight + 18}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#94a3b8"
                    fontFamily="monospace"
                  >
                    {xVal.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Connected Sequence Line if enabled */}
            {connectLine && lineD && (
              <path
                d={lineD}
                fill="none"
                stroke="#6366f1"
                strokeWidth="1.5"
                strokeOpacity="0.4"
              />
            )}

            {/* Regression Trend Line */}
            {showTrendLine && regression && (
              <line
                x1={scaleX(trendX1)}
                y1={scaleY(trendY1)}
                x2={scaleX(trendX2)}
                y2={scaleY(trendY2)}
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                className="drop-shadow-xs"
              />
            )}

            {/* Scatter Points */}
            {pointsData.map((p, idx) => {
              const cx = scaleX(p.x);
              const cy = scaleY(p.y);
              const color = getColorForCategory(p.colorVal);

              return (
                <circle
                  key={idx}
                  cx={cx}
                  cy={cy}
                  r="5"
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="hover:scale-150 transition-all cursor-pointer opacity-85 hover:opacity-100"
                  onMouseEnter={() => {
                    setHoveredPoint({
                      xVal: p.x,
                      yVal: p.y,
                      label: p.colorVal,
                      rowIdx: p.rowIdx,
                      cx,
                      cy,
                    });
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              );
            })}

            {/* Axes */}
            <line
              x1={margin.left}
              y1={margin.top + innerHeight}
              x2={margin.left + innerWidth}
              y2={margin.top + innerHeight}
              stroke="#64748b"
              strokeWidth="1.5"
            />
            <line
              x1={margin.left}
              y1={margin.top}
              x2={margin.left}
              y2={margin.top + innerHeight}
              stroke="#64748b"
              strokeWidth="1.5"
            />

            {/* Axis Labels */}
            <text
              x={margin.left + innerWidth / 2}
              y={svgHeight - 10}
              textAnchor="middle"
              fontSize="11"
              fill="#334155"
              fontWeight="bold"
            >
              Eje X: {xAxisCol}
            </text>

            <text
              x={-margin.top - innerHeight / 2}
              y={18}
              textAnchor="middle"
              fontSize="11"
              fill="#334155"
              fontWeight="bold"
              transform="rotate(-90)"
            >
              Eje Y: {yAxisCol}
            </text>
          </svg>
        </div>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-4 right-4 bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-xl space-y-0.5 pointer-events-none z-20 border border-slate-700">
            <div className="text-slate-300 font-semibold">Fila #{hoveredPoint.rowIdx + 1}</div>
            <div className="font-mono text-indigo-300">
              {xAxisCol}: {hoveredPoint.xVal.toLocaleString()}
            </div>
            <div className="font-mono text-emerald-300">
              {yAxisCol}: {hoveredPoint.yVal.toLocaleString()}
            </div>
            {hoveredPoint.label && (
              <div className="text-[11px] text-amber-300">
                {colorCol}: {hoveredPoint.label}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Relationship Interpretation Card */}
      {regression && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Interpretación Estadística de la Relación:
          </span>
          <p className="text-slate-600">
            {Math.abs(regression.r) > 0.7 ? (
              <span>
                Existe una <strong>correlación muy fuerte</strong> ({regression.r > 0 ? 'positiva' : 'negativa'}) entre <strong>{xAxisCol}</strong> y <strong>{yAxisCol}</strong>. El { (regression.r2 * 100).toFixed(1) }% de la variabilidad de {yAxisCol} queda explicada por el comportamiento de {xAxisCol}.
              </span>
            ) : Math.abs(regression.r) > 0.4 ? (
              <span>
                Existe una <strong>correlación moderada</strong> ({regression.r > 0 ? 'positiva' : 'negativa'}) entre ambas variables. Hay una clara tendencia, aunque intervienen otros factores que generan dispersión.
              </span>
            ) : (
              <span>
                La asociación lineal es <strong>débil o cercana a cero (r = {regression.r})</strong>. Las variables parecen comportarse de forma independiente, o bien la relación es de naturaleza no lineal.
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};
