import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileX2,
  HelpCircle,
  Database,
  BarChart,
  Grid3X3,
  Lightbulb,
} from 'lucide-react';
import { DatasetState } from '../types/data';
import { isNullOrEmpty } from '../utils/statistics';

interface MissingValuesAnalysisProps {
  dataset: DatasetState;
}

export const MissingValuesAnalysis: React.FC<MissingValuesAnalysisProps> = ({ dataset }) => {
  const rows = dataset.rawRows;
  const columns = dataset.columns;
  const totalCells = rows.length * columns.length;

  const totalMissingCells = columns.reduce((acc, col) => acc + col.missingCount, 0);
  const globalCompleteness = totalCells > 0 ? ((totalCells - totalMissingCells) / totalCells) * 100 : 100;

  // Rows with at least one missing value
  let rowsWithMissing = 0;
  for (const r of rows) {
    if (columns.some((c) => isNullOrEmpty(r[c.name]))) {
      rowsWithMissing++;
    }
  }
  const completeRows = rows.length - rowsWithMissing;
  const completeRowsPct = rows.length > 0 ? (completeRows / rows.length) * 100 : 100;

  // Sorted columns by missing percentage descending
  const sortedColumns = [...columns].sort((a, b) => b.missingPercentage - a.missingPercentage);
  const columnsWithMissing = sortedColumns.filter((c) => c.missingCount > 0);

  // Sample matrix for visual heatmap (first 40 rows max)
  const matrixSampleRows = rows.slice(0, 35);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <FileX2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Auditoría de Datos Faltantes (Missing Values)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Diagnóstico de valores nulos o no disponibles por columna y por fila para evaluar la integridad muestral.
          </p>
        </div>

        {/* Global completeness badge */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-700">Índice de Completitud</div>
            <div className="text-base font-black text-indigo-600 font-mono">
              {globalCompleteness.toFixed(2)}%
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700">
            {globalCompleteness >= 95 ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            )}
          </div>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Celdas Nulas
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-900">
              {totalMissingCells.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">
              de {totalCells.toLocaleString()} celdas
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {((totalMissingCells / totalCells) * 100).toFixed(2)}% del volumen total
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Filas Completas (Sin Nulos)
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-emerald-600">
              {completeRows.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">
              ({completeRowsPct.toFixed(1)}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {rowsWithMissing} filas tienen al menos un campo vacío
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Variables con Valores Faltantes
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-900">
              {columnsWithMissing.length}
            </span>
            <span className="text-xs text-slate-500">
              de {columns.length} variables
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {columns.length - columnsWithMissing.length} variables 100% completas
          </p>
        </div>
      </div>

      {/* Column Breakdown Table */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
          <BarChart className="w-4 h-4 text-indigo-600" />
          Desglose de Nulidad por Variable
        </h4>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
              <tr>
                <th className="py-2.5 px-4">Variable / Columna</th>
                <th className="py-2.5 px-4">Tipo</th>
                <th className="py-2.5 px-4 text-right">Valores Válidos</th>
                <th className="py-2.5 px-4 text-right">Valores Faltantes</th>
                <th className="py-2.5 px-4 text-right">% Faltante</th>
                <th className="py-2.5 px-4 w-48">Barra de Completitud</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {sortedColumns.map((col) => {
                const isZero = col.missingCount === 0;
                const isHigh = col.missingPercentage > 10;

                return (
                  <tr key={col.name} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-4 font-bold text-slate-900 font-sans">
                      {col.name}
                    </td>
                    <td className="py-2 px-4 text-slate-500 font-sans text-[11px]">
                      {col.type}
                    </td>
                    <td className="py-2 px-4 text-right text-slate-700">
                      {(col.totalCount - col.missingCount).toLocaleString()}
                    </td>
                    <td className="py-2 px-4 text-right">
                      {isZero ? (
                        <span className="text-slate-400">0</span>
                      ) : (
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          {col.missingCount.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-right font-bold">
                      {isZero ? (
                        <span className="text-emerald-600">0.0%</span>
                      ) : (
                        <span className={isHigh ? 'text-rose-600' : 'text-amber-600'}>
                          {col.missingPercentage.toFixed(2)}%
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4 font-sans">
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                        <div
                          className={`h-full ${
                            isZero
                              ? 'bg-emerald-500'
                              : isHigh
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${100 - col.missingPercentage}%` }}
                        />
                        <div
                          className="h-full bg-slate-300"
                          style={{ width: `${col.missingPercentage}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Null Matrix Pattern (Heatmap of first rows) */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Grid3X3 className="w-4 h-4 text-indigo-600" />
            Mapa de Ausencia de Datos (Matriz de Nulidad - Muestra de 35 filas)
          </h4>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-3 rounded-xs bg-indigo-500 inline-block" /> Dato Presente
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-3 rounded-xs bg-amber-400 inline-block" /> Dato Faltante
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div
            className="grid gap-[2px] p-2 bg-white rounded-lg border border-slate-200 inline-block min-w-full"
            style={{
              gridTemplateColumns: `repeat(${columns.length}, minmax(40px, 1fr))`,
            }}
          >
            {/* Headers */}
            {columns.map((c) => (
              <div
                key={c.name}
                className="text-[9px] font-semibold text-slate-600 truncate px-1 text-center"
                title={c.name}
              >
                {c.name}
              </div>
            ))}

            {/* Matrix rows */}
            {matrixSampleRows.map((r, rIdx) =>
              columns.map((c) => {
                const missing = isNullOrEmpty(r[c.name]);
                return (
                  <div
                    key={`${rIdx}-${c.name}`}
                    className={`h-4 rounded-[2px] transition-colors ${
                      missing ? 'bg-amber-400' : 'bg-indigo-100 hover:bg-indigo-300'
                    }`}
                    title={`Fila ${rIdx + 1}, ${c.name}: ${missing ? 'FALTANTE' : r[c.name]}`}
                  />
                );
              })
            )}
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 text-right">
          Visualiza si los nulos ocurren de manera aislada (MCAR) o en bloques sistemáticos (MAR).
        </p>
      </div>

      {/* Tactical recommendations box */}
      <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-950 space-y-1">
          <strong className="font-bold">Estrategias recomendadas para el tratamiento de nulos:</strong>
          <ul className="list-disc list-inside space-y-0.5 text-slate-600 pt-1">
            <li>
              <strong>Para variables numéricas con &lt; 5% nulos:</strong> Imputación por Mediana (robusta ante outliers) o Media.
            </li>
            <li>
              <strong>Para variables categóricas:</strong> Imputación por la Moda más frecuente o creación de la categoría explícita <em>"No especificado"</em>.
            </li>
            <li>
              <strong>Para variables con &gt; 40% nulos:</strong> Evaluar si la variable aporta valor predictivo o si debe descartarse para evitar ruido y sesgo.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
