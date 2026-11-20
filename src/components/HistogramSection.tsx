import React, { useState, useMemo } from 'react';
import {
  BarChart2,
  Sliders,
  TrendingUp,
  Info,
  Maximize2,
  LayoutGrid,
} from 'lucide-react';
import { DatasetState } from '../types/data';
import { computeHistogram, isNullOrEmpty } from '../utils/statistics';

interface HistogramSectionProps {
  dataset: DatasetState;
}

export const HistogramSection: React.FC<HistogramSectionProps> = ({ dataset }) => {
  const numericColumns = Object.keys(dataset.stats.numeric);
  const [selectedColumn, setSelectedColumn] = useState<string>(
    numericColumns[0] || ''
  );
  const [numBins, setNumBins] = useState<number>(15);
  const [showDensityCurve, setShowDensityCurve] = useState<boolean>(true);
  const [showGallery, setShowGallery] = useState<boolean>(false);
  const [hoveredBin, setHoveredBin] = useState<{
    x0: number;
    x1: number;
    count: number;
    percentage: number;
    x: number;
    y: number;
  } | null>(null);

  // Extract numeric array for selected column
  const values = useMemo(() => {
    if (!selectedColumn) return [];
    return dataset.rawRows
      .map((r) => r[selectedColumn])
      .filter((v) => !isNullOrEmpty(v))
      .map((v) => (typeof v === 'number' ? v : Number(v)))
      .filter((v) => !isNaN(v));
  }, [dataset, selectedColumn]);

  const stats = dataset.stats.numeric[selectedColumn];

  const histogramData = useMemo(() => {
    return computeHistogram(values, numBins);
  }, [values, numBins]);

  if (numericColumns.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 shadow-xs">
        No hay variables numéricas disponibles para generar histogramas.
      </div>
    );
  }

  // SVG Chart Dimensions
  const svgWidth = 720;
  const svgHeight = 320;
  const margin = { top: 30, right: 30, bottom: 45, left: 55 };
  const innerWidth = svgWidth - margin.left - margin.right;
  const innerHeight = svgHeight - margin.top - margin.bottom;

  const maxCount = Math.max(...histogramData.bins.map((b) => b.count), 1);

  // Scale helpers
  const scaleX = (val: number) => {
    const range = histogramData.max - histogramData.min || 1;
    return margin.left + ((val - histogramData.min) / range) * innerWidth;
  };

  const scaleY = (count: number) => {
    return margin.top + innerHeight - (count / maxCount) * innerHeight;
  };

  // Generate smooth density path
  const densityPoints = histogramData.bins.map((b) => {
    const midX = (b.x0 + b.x1) / 2;
    return {
      x: scaleX(midX),
      y: scaleY(b.count),
    };
  });

  const densityPathD =
    densityPoints.length > 0
      ? `M ${densityPoints[0].x} ${densityPoints[0].y} ` +
        densityPoints.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')
      : '';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <BarChart2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Histogramas y Distribuciones de Frecuencia
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Analiza la forma de la distribución, simetría, concentración y dispersión de datos continuos.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGallery(!showGallery)}
            className={`inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              showGallery
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{showGallery ? 'Ocultar Galería Completa' : 'Ver Todas las Variables'}</span>
          </button>
        </div>
      </div>

      {/* Main Single Variable Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Column */}
        <div className="space-y-4 lg:col-span-1">
          {/* Variable Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Variable Numérica:
            </label>
            <select
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {numericColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          {/* Bins count selector */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                Intervalos (Bins):
              </span>
              <span className="font-mono font-bold text-indigo-600">{numBins}</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={numBins}
              onChange={(e) => setNumBins(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between gap-1">
              {[5, 10, 15, 20, 30].map((b) => (
                <button
                  key={b}
                  onClick={() => setNumBins(b)}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    numBins === b
                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Overlay switches */}
          <div className="space-y-2 text-xs">
            <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showDensityCurve}
                onChange={(e) => setShowDensityCurve(e.target.checked)}
                className="rounded accent-indigo-600 cursor-pointer"
              />
              <span>Superponer Curva de Frecuencia</span>
            </label>
          </div>

          {/* Statistical diagnostics card */}
          {stats && (
            <div className="p-3.5 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-2 text-xs">
              <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
                Diagnóstico de Distribución
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Media (x̄):</span>
                  <span className="font-mono font-bold text-slate-800">{stats.mean}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Mediana:</span>
                  <span className="font-mono font-bold text-slate-800">{stats.median}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Desv. Est.:</span>
                  <span className="font-mono text-slate-800">{stats.stdDev}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Asimetría:</span>
                  <span
                    className={`font-mono font-bold ${
                      Math.abs(stats.skewness) > 1 ? 'text-amber-700' : 'text-slate-800'
                    }`}
                  >
                    {stats.skewness}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-indigo-200/50 text-[11px] text-slate-600">
                {stats.skewness > 0.5 ? (
                  <span>
                    👉 <strong>Sesgo positivo (a la derecha):</strong> cola de valores altos.
                  </span>
                ) : stats.skewness < -0.5 ? (
                  <span>
                    👉 <strong>Sesgo negativo (a la izquierda):</strong> cola de valores bajos.
                  </span>
                ) : (
                  <span>
                    👉 <strong>Distribución aproximadamente simétrica:</strong> media y mediana cercanas.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Interactive SVG Histogram Chart Column */}
        <div className="lg:col-span-3 border border-slate-200 rounded-xl p-4 bg-slate-50/30 flex flex-col justify-between relative">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold text-slate-800">
              Histograma de {selectedColumn} ({values.length} observaciones)
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-rose-500 inline-block border-b-2 border-dashed border-rose-500" />
                Media ({stats?.mean})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-indigo-600 inline-block border-b-2 border-indigo-600" />
                Mediana ({stats?.median})
              </span>
            </div>
          </div>

          {/* SVG Canvas */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto max-h-[360px]"
            >
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = margin.top + innerHeight * (1 - pct);
                const countVal = Math.round(maxCount * pct);
                return (
                  <g key={i}>
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
                      {countVal}
                    </text>
                  </g>
                );
              })}

              {/* Bars */}
              {histogramData.bins.map((bin, i) => {
                const x = scaleX(bin.x0);
                const width = Math.max(scaleX(bin.x1) - x - 1.5, 1);
                const y = scaleY(bin.count);
                const barHeight = margin.top + innerHeight - y;

                return (
                  <rect
                    key={i}
                    x={x}
                    y={y}
                    width={width}
                    height={barHeight}
                    fill="#4f46e5"
                    className="hover:fill-indigo-500 transition-all cursor-pointer opacity-85 hover:opacity-100"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredBin({
                        x0: bin.x0,
                        x1: bin.x1,
                        count: bin.count,
                        percentage: bin.percentage,
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      });
                    }}
                    onMouseLeave={() => setHoveredBin(null)}
                  />
                );
              })}

              {/* Smooth Frequency Line */}
              {showDensityCurve && densityPathD && (
                <path
                  d={densityPathD}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  className="pointer-events-none drop-shadow-xs"
                />
              )}

              {/* Mean Line (Red dashed) */}
              {stats && (
                <line
                  x1={scaleX(stats.mean)}
                  y1={margin.top}
                  x2={scaleX(stats.mean)}
                  y2={margin.top + innerHeight}
                  stroke="#f43f5e"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              )}

              {/* Median Line (Dark Indigo solid) */}
              {stats && (
                <line
                  x1={scaleX(stats.median)}
                  y1={margin.top}
                  x2={scaleX(stats.median)}
                  y2={margin.top + innerHeight}
                  stroke="#312e81"
                  strokeWidth="2"
                />
              )}

              {/* X Axis */}
              <line
                x1={margin.left}
                y1={margin.top + innerHeight}
                x2={margin.left + innerWidth}
                y2={margin.top + innerHeight}
                stroke="#64748b"
                strokeWidth="1.5"
              />

              {/* X Ticks */}
              {histogramData.bins.map((b, i) => {
                if (numBins > 15 && i % 2 !== 0 && i !== histogramData.bins.length - 1)
                  return null;
                const x = scaleX(b.x0);
                return (
                  <g key={i}>
                    <line
                      x1={x}
                      y1={margin.top + innerHeight}
                      x2={x}
                      y2={margin.top + innerHeight + 5}
                      stroke="#64748b"
                    />
                    <text
                      x={x}
                      y={margin.top + innerHeight + 16}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#64748b"
                      fontFamily="monospace"
                    >
                      {b.x0.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* Last tick */}
              <text
                x={margin.left + innerWidth}
                y={margin.top + innerHeight + 16}
                textAnchor="middle"
                fontSize="9"
                fill="#64748b"
                fontFamily="monospace"
              >
                {histogramData.max.toFixed(1)}
              </text>
            </svg>
          </div>

          {/* Interactive Tooltip Overlay */}
          {hoveredBin && (
            <div className="absolute top-4 right-4 bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-xl space-y-0.5 pointer-events-none z-20 border border-slate-700">
              <div className="font-mono text-indigo-300 font-semibold">
                Rango: [{hoveredBin.x0.toFixed(2)} - {hoveredBin.x1.toFixed(2)}]
              </div>
              <div className="font-bold">
                Frecuencia: {hoveredBin.count} ({hoveredBin.percentage}%)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mini Gallery of all numeric variables */}
      {showGallery && (
        <div className="pt-4 border-t border-slate-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
            <LayoutGrid className="w-4 h-4 text-indigo-600" />
            Galería General: Distribución de Todas las Variables Numéricas
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {numericColumns.map((colName) => {
              const colValues = dataset.rawRows
                .map((r) => r[colName])
                .filter((v) => !isNullOrEmpty(v))
                .map((v) => Number(v))
                .filter((v) => !isNaN(v));
              const miniHist = computeHistogram(colValues, 10);
              const miniMax = Math.max(...miniHist.bins.map((b) => b.count), 1);
              const colStats = dataset.stats.numeric[colName];

              return (
                <div
                  key={colName}
                  onClick={() => {
                    setSelectedColumn(colName);
                    setShowGallery(false);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedColumn === colName
                      ? 'border-indigo-500 bg-indigo-50/30 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 truncate" title={colName}>
                      {colName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      x̄: {colStats?.mean}
                    </span>
                  </div>

                  {/* Mini Sparkline / Bar SVG */}
                  <div className="h-16 w-full flex items-end gap-[2px] bg-slate-50 p-1 rounded-lg">
                    {miniHist.bins.map((b, idx) => {
                      const hPct = (b.count / miniMax) * 100;
                      return (
                        <div
                          key={idx}
                          className="bg-indigo-500 rounded-xs flex-1 transition-all hover:bg-indigo-700"
                          style={{ height: `${Math.max(hPct, 4)}%` }}
                          title={`[${b.x0.toFixed(1)} - ${b.x1.toFixed(1)}]: ${b.count}`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono">
                    <span>{miniHist.min.toFixed(0)}</span>
                    <span>{miniHist.max.toFixed(0)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
