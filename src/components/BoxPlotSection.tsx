import React, { useState, useMemo } from 'react';
import {
  BoxSelect,
  Layers,
  LayoutGrid,
  Filter,
  Info,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { BoxPlotItem, DatasetState } from '../types/data';
import { computeBoxPlot, isNullOrEmpty } from '../utils/statistics';

interface BoxPlotSectionProps {
  dataset: DatasetState;
}

export const BoxPlotSection: React.FC<BoxPlotSectionProps> = ({ dataset }) => {
  const numericColumns = Object.keys(dataset.stats.numeric);
  const categoricalColumns = dataset.columns
    .filter((c) => !c.type.startsWith('numeric'))
    .map((c) => c.name);

  const [viewMode, setViewMode] = useState<'all' | 'grouped'>('all');
  const [selectedNumCol, setSelectedNumCol] = useState<string>(numericColumns[0] || '');
  const [selectedCatCol, setSelectedCatCol] = useState<string>(categoricalColumns[0] || '');
  const [hoveredBox, setHoveredBox] = useState<BoxPlotItem | null>(null);

  // Boxplots for "all" mode
  const allBoxPlots = useMemo(() => {
    return Object.values(dataset.boxPlots);
  }, [dataset.boxPlots]);

  // Boxplots for "grouped" mode: compute boxplot for each category
  const groupedBoxPlots = useMemo(() => {
    if (viewMode !== 'grouped' || !selectedNumCol || !selectedCatCol) return [];

    // Group rows by category
    const groups: Record<string, Record<string, any>[]> = {};
    dataset.rawRows.forEach((r) => {
      const catVal = r[selectedCatCol];
      const key = isNullOrEmpty(catVal) ? '(Sin Categoría)' : String(catVal).trim();
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });

    const results: BoxPlotItem[] = [];
    Object.entries(groups).forEach(([categoryName, rowsInGroup]) => {
      if (rowsInGroup.length >= 3) {
        const bp = computeBoxPlot(rowsInGroup, selectedNumCol, categoryName);
        if (bp) results.push(bp);
      }
    });

    return results;
  }, [dataset, viewMode, selectedNumCol, selectedCatCol]);

  if (numericColumns.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 shadow-xs">
        No se encontraron variables numéricas para generar gráficos BoxPlot.
      </div>
    );
  }

  // Render a Single SVG BoxPlot component
  const renderBoxPlotSvg = (item: BoxPlotItem, width = 300, height = 220) => {
    const margin = { top: 25, right: 35, bottom: 40, left: 55 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    // Bounds including outliers
    const allVals = [item.min, item.max, ...item.outliers];
    const valMin = Math.min(...allVals);
    const valMax = Math.max(...allVals);
    const buffer = (valMax - valMin) * 0.1 || 1;
    const domainMin = valMin - buffer;
    const domainMax = valMax + buffer;

    const scaleY = (val: number) => {
      return margin.top + innerH - ((val - domainMin) / (domainMax - domainMin)) * innerH;
    };

    const centerX = margin.left + innerW / 2;
    const boxWidth = Math.min(innerW * 0.45, 60);

    const yMin = scaleY(item.min);
    const yQ1 = scaleY(item.q1);
    const yMedian = scaleY(item.median);
    const yMean = scaleY(item.mean);
    const yQ3 = scaleY(item.q3);
    const yMax = scaleY(item.max);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Horizontal grid lines at Q1, Median, Q3 */}
        {[item.min, item.q1, item.median, item.q3, item.max].map((v, i) => (
          <line
            key={i}
            x1={margin.left}
            y1={scaleY(v)}
            x2={margin.left + innerW}
            y2={scaleY(v)}
            stroke="#f1f5f9"
            strokeDasharray="2 2"
          />
        ))}

        {/* Whisker line (min to max) */}
        <line
          x1={centerX}
          y1={yMin}
          x2={centerX}
          y2={yMax}
          stroke="#475569"
          strokeWidth="1.5"
        />

        {/* Whisker caps */}
        <line
          x1={centerX - boxWidth / 4}
          y1={yMin}
          x2={centerX + boxWidth / 4}
          y2={yMin}
          stroke="#475569"
          strokeWidth="1.5"
        />
        <line
          x1={centerX - boxWidth / 4}
          y1={yMax}
          x2={centerX + boxWidth / 4}
          y2={yMax}
          stroke="#475569"
          strokeWidth="1.5"
        />

        {/* Box (Q1 to Q3) */}
        <rect
          x={centerX - boxWidth / 2}
          y={yQ3}
          width={boxWidth}
          height={Math.max(yQ1 - yQ3, 2)}
          fill="#e0e7ff"
          stroke="#4f46e5"
          strokeWidth="2"
          rx="3"
          className="hover:fill-indigo-200 transition-colors cursor-pointer"
        />

        {/* Median Line (Bold) */}
        <line
          x1={centerX - boxWidth / 2}
          y1={yMedian}
          x2={centerX + boxWidth / 2}
          y2={yMedian}
          stroke="#312e81"
          strokeWidth="2.5"
        />

        {/* Mean Marker (Diamond) */}
        <polygon
          points={`${centerX},${yMean - 4} ${centerX + 4},${yMean} ${centerX},${yMean + 4} ${centerX - 4},${yMean}`}
          fill="#f43f5e"
          stroke="#ffffff"
          strokeWidth="1"
        />

        {/* Outlier Points */}
        {item.outliers.map((outlierVal, oIdx) => (
          <circle
            key={oIdx}
            cx={centerX}
            cy={scaleY(outlierVal)}
            r="3.5"
            fill="#f43f5e"
            stroke="#ffffff"
            strokeWidth="1"
            className="hover:scale-125 transition-all cursor-pointer"
          >
            <title>Outlier: {outlierVal}</title>
          </circle>
        ))}

        {/* Y Axis Ticks */}
        <text
          x={margin.left - 6}
          y={yMax + 4}
          textAnchor="end"
          fontSize="9"
          fill="#64748b"
          fontFamily="monospace"
        >
          {item.max.toLocaleString()}
        </text>
        <text
          x={margin.left - 6}
          y={yQ3 + 4}
          textAnchor="end"
          fontSize="9"
          fill="#64748b"
          fontFamily="monospace"
        >
          Q3: {item.q3.toLocaleString()}
        </text>
        <text
          x={margin.left - 6}
          y={yMedian + 4}
          textAnchor="end"
          fontSize="9"
          fill="#312e81"
          fontWeight="bold"
          fontFamily="monospace"
        >
          Med: {item.median.toLocaleString()}
        </text>
        <text
          x={margin.left - 6}
          y={yQ1 + 4}
          textAnchor="end"
          fontSize="9"
          fill="#64748b"
          fontFamily="monospace"
        >
          Q1: {item.q1.toLocaleString()}
        </text>
        <text
          x={margin.left - 6}
          y={yMin + 4}
          textAnchor="end"
          fontSize="9"
          fill="#64748b"
          fontFamily="monospace"
        >
          {item.min.toLocaleString()}
        </text>

        {/* Bottom Label */}
        <text
          x={centerX}
          y={height - 12}
          textAnchor="middle"
          fontSize="10"
          fill="#334155"
          fontWeight="bold"
        >
          {item.label}
        </text>
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Title & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <BoxSelect className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Diagramas de Caja y Bigotes (BoxPlots)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Detección visual de valores atípicos (outliers), asimetría y cuartiles estadísticos (Q1, Mediana, Q3).
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'all'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas las Variables ({allBoxPlots.length})
          </button>
          <button
            onClick={() => setViewMode('grouped')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'grouped'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            BoxPlot Agrupado por Categoría
          </button>
        </div>
      </div>

      {/* Mode 1: All variables grid */}
      {viewMode === 'all' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Mostrando <strong>{allBoxPlots.length}</strong> gráficos BoxPlot calculados con la regla de Tukey (1.5 × IQR).
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-indigo-900 inline-block" /> Mediana
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rotate-45 bg-rose-500 inline-block" /> Media
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Outliers
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allBoxPlots.map((item) => (
              <div
                key={item.column}
                className="p-4 border border-slate-200 rounded-xl bg-slate-50/40 hover:bg-white hover:border-indigo-300 transition-all shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1 pb-2 border-b border-slate-200">
                  <h4 className="font-bold text-xs text-slate-900 truncate" title={item.column}>
                    {item.column}
                  </h4>
                  {item.outliers.length > 0 ? (
                    <span className="text-[10px] bg-rose-100 text-rose-800 font-semibold px-2 py-0.5 rounded">
                      {item.outliers.length} Outlier{item.outliers.length > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                      Sin outliers
                    </span>
                  )}
                </div>

                {renderBoxPlotSvg(item, 280, 200)}

                <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-mono text-center">
                  <div>
                    <span className="block text-slate-400">Q1</span>
                    <span>{item.q1}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-bold text-indigo-700">Mediana</span>
                    <span className="font-bold text-slate-900">{item.median}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Q3</span>
                    <span>{item.q3}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode 2: Grouped by category */}
      {viewMode === 'grouped' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Variable Numérica para Comparar:
              </label>
              <select
                value={selectedNumCol}
                onChange={(e) => setSelectedNumCol(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {numericColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Variable Categórica para Agrupar:
              </label>
              <select
                value={selectedCatCol}
                onChange={(e) => setSelectedCatCol(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {categoricalColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {groupedBoxPlots.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-xl">
              No hay suficientes registros por grupo para calcular diagramas de caja agrupados.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {groupedBoxPlots.map((item) => (
                <div
                  key={item.label}
                  className="p-4 border border-slate-200 rounded-xl bg-slate-50/40 hover:bg-white transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-1 pb-2 border-b border-slate-200">
                    <h4 className="font-bold text-xs text-slate-900 truncate" title={item.label}>
                      {item.label}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono">
                      n = {item.count}
                    </span>
                  </div>

                  {renderBoxPlotSvg(item, 260, 190)}

                  <div className="mt-2 text-center text-[10px] text-slate-500 font-mono">
                    Mediana: <strong>{item.median}</strong> | IQR: {item.iqr}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
