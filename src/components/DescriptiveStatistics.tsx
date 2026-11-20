import React, { useState } from 'react';
import {
  Calculator,
  Table,
  Grid,
  Info,
  TrendingUp,
  Percent,
  Search,
  Sparkles,
} from 'lucide-react';
import { DatasetState, NumericStats, CategoricalStats } from '../types/data';

interface DescriptiveStatisticsProps {
  dataset: DatasetState;
}

export const DescriptiveStatistics: React.FC<DescriptiveStatisticsProps> = ({ dataset }) => {
  const [activeSubTab, setActiveSubTab] = useState<'numeric' | 'categorical' | 'correlations'>('numeric');
  const [filterQuery, setFilterQuery] = useState('');

  const numericStatsList = Object.values(dataset.stats.numeric);
  const categoricalStatsList = Object.values(dataset.stats.categorical);
  const correlations = dataset.correlations;

  const filteredNumeric = numericStatsList.filter((s) =>
    s.column.toLowerCase().includes(filterQuery.toLowerCase())
  );
  const filteredCategorical = categoricalStatsList.filter((s) =>
    s.column.toLowerCase().includes(filterQuery.toLowerCase())
  );

  // Unique numeric columns for correlation matrix grid
  const numericCols = Object.keys(dataset.stats.numeric);

  const getCorrelationValue = (colA: string, colB: string): number => {
    if (colA === colB) return 1;
    const pair = correlations.find(
      (c) =>
        (c.colA === colA && c.colB === colB) || (c.colA === colB && c.colB === colA)
    );
    return pair ? pair.pearson : 0;
  };

  const getCorrBgColor = (val: number) => {
    if (val === 1) return 'bg-indigo-600 text-white font-bold';
    if (val > 0.7) return 'bg-blue-600 text-white';
    if (val > 0.4) return 'bg-blue-400 text-white';
    if (val > 0.15) return 'bg-blue-100 text-blue-900';
    if (val >= -0.15) return 'bg-slate-50 text-slate-600';
    if (val >= -0.4) return 'bg-rose-100 text-rose-900';
    if (val >= -0.7) return 'bg-rose-400 text-white';
    return 'bg-rose-600 text-white';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header and sub-navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <Calculator className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Análisis Estadístico Descriptivo Integral
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Medidas de tendencia central, dispersión, posición, forma y matrices de correlación bivariada.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('numeric')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'numeric'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Variables Cuantitativas ({numericStatsList.length})
          </button>
          <button
            onClick={() => setActiveSubTab('categorical')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'categorical'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Variables Cualitativas ({categoricalStatsList.length})
          </button>
          <button
            onClick={() => setActiveSubTab('correlations')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'correlations'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Matriz de Correlación
          </button>
        </div>
      </div>

      {/* Search box for variables */}
      {activeSubTab !== 'correlations' && (
        <div className="flex items-center justify-between">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar por nombre de variable..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Sub-Tab 1: Numeric Descriptive Table */}
      {activeSubTab === 'numeric' && (
        <div className="space-y-4">
          {numericStatsList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-xl">
              No se detectaron variables numéricas en el dataset.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3 whitespace-nowrap bg-slate-50 sticky left-0 z-10 border-r border-slate-200">
                        Variable
                      </th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">N Válido</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Media (x̄)</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Mediana</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Desv. Est. (s)</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Varianza</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Mínimo</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Máximo</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Rango</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Q1 (25%)</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Q3 (75%)</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">IQR</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Asimetría</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Curtosis</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Outliers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {filteredNumeric.map((stat) => {
                      const hasHighSkew = Math.abs(stat.skewness) > 1.0;
                      const hasOutliers = stat.outliersCount > 0;

                      return (
                        <tr key={stat.column} className="hover:bg-indigo-50/20 transition-colors">
                          <td className="py-2 px-3 font-bold text-slate-900 font-sans sticky left-0 bg-white border-r border-slate-200 whitespace-nowrap">
                            {stat.column}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            {stat.count.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right text-indigo-700 font-semibold">
                            {stat.mean.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-900 font-semibold">
                            {stat.median.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-700">
                            {stat.stdDev.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-500">
                            {stat.variance.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            {stat.min.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            {stat.max.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-500">
                            {stat.range.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            {stat.q1.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            {stat.q3.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-500">
                            {stat.iqr.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <span
                              className={
                                hasHighSkew
                                  ? 'text-amber-700 font-bold bg-amber-50 px-1 rounded'
                                  : 'text-slate-600'
                              }
                            >
                              {stat.skewness.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            {stat.kurtosis.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {hasOutliers ? (
                              <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                                {stat.outliersCount}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 2: Categorical Stats */}
      {activeSubTab === 'categorical' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCategorical.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs col-span-2 border border-dashed rounded-xl">
              No se encontraron variables cualitativas o categóricas en el dataset.
            </div>
          ) : (
            filteredCategorical.map((cat) => (
              <div key={cat.column} className="border border-slate-200 rounded-xl p-4 bg-slate-50/40">
                <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                  <h4 className="font-bold text-xs text-slate-900">{cat.column}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>{cat.uniqueCount} categorías únicas</span>
                    <span>•</span>
                    <span className="text-indigo-600 font-semibold">Moda: {cat.mode}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {cat.topCategories.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800 truncate max-w-[180px]">
                          {item.value || '(Vacío)'}
                        </span>
                        <span className="font-mono text-slate-600">
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Sub-Tab 3: Correlation Matrix Heatmap */}
      {activeSubTab === 'correlations' && (
        <div className="space-y-4">
          {numericCols.length < 2 ? (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-xl">
              Se requieren al menos 2 variables numéricas para generar la matriz de correlación.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Coeficiente de Correlación lineal de Pearson ($r$). Valores cercanos a +1 indican asociación positiva fuerte; cercanos a -1 indican asociación inversa fuerte.
                </p>
                {/* Legend */}
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-semibold">-1.0 Negativa</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">0.0 Neutra</span>
                  <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-semibold">+1.0 Positiva</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 text-left font-semibold text-slate-700 bg-slate-50 sticky left-0 z-10 border-r border-slate-200">
                          Variable
                        </th>
                        {numericCols.map((c) => (
                          <th key={c} className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {numericCols.map((rowCol) => (
                        <tr key={rowCol}>
                          <td className="py-2 px-3 text-left font-bold text-slate-900 sticky left-0 bg-white border-r border-slate-200 whitespace-nowrap font-sans">
                            {rowCol}
                          </td>
                          {numericCols.map((colCol) => {
                            const val = getCorrelationValue(rowCol, colCol);
                            return (
                              <td
                                key={colCol}
                                className={`py-2 px-3 transition-colors ${getCorrBgColor(val)}`}
                                title={`Correlación entre ${rowCol} y ${colCol}: ${val.toFixed(4)}`}
                              >
                                {val.toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
