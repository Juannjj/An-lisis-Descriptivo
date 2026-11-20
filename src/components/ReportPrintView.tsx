import React from 'react';
import { DatasetState } from '../types/data';
import { generateAutomatedExpertInsights } from '../utils/statistics';

interface ReportPrintViewProps {
  dataset: DatasetState;
}

export const ReportPrintView: React.FC<ReportPrintViewProps> = ({ dataset }) => {
  const numericList = Object.values(dataset.stats.numeric);
  const categoricalList = Object.values(dataset.stats.categorical);
  const totalCells = dataset.rawRows.length * dataset.columns.length;
  const missingCells = dataset.columns.reduce((a, c) => a + c.missingCount, 0);
  const completeness = totalCells > 0 ? ((totalCells - missingCells) / totalCells) * 100 : 100;

  const insights = generateAutomatedExpertInsights(
    dataset.columns,
    dataset.stats.numeric,
    dataset.correlations,
    dataset.rawRows.length
  );

  return (
    <div className="print-only hidden p-8 bg-white text-slate-900 font-sans space-y-6">
      {/* Formal Header */}
      <div className="border-b-2 border-indigo-700 pb-4 flex justify-between items-end">
        <div>
          <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest block">
            Informe Oficial de Analítica Exploratoria (EDA)
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Reporte Ejecutivo de Datos: {dataset.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generado automáticamente por DataSense AI • {new Date().toLocaleDateString('es-ES', { dateStyle: 'full' })}
          </p>
        </div>
        <div className="text-right text-xs">
          <div className="font-bold text-slate-800">
            {dataset.rawRows.length.toLocaleString()} Registros
          </div>
          <div className="text-slate-500">{dataset.columns.length} Dimensiones</div>
          <div className="text-emerald-700 font-bold">{completeness.toFixed(1)}% Completo</div>
        </div>
      </div>

      {/* 1. Executive Summary */}
      <section className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-800 border-b border-slate-200 pb-1">
          1. Resumen Ejecutivo & Calidad Muestral
        </h2>
        <p className="text-xs text-slate-700 leading-relaxed">
          {insights.summary}
        </p>
        <div className="grid grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Filas Totales</span>
            <span className="text-sm font-bold font-mono">{dataset.rawRows.length.toLocaleString()}</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Valores Faltantes</span>
            <span className="text-sm font-bold font-mono">{missingCells} celdas ({((missingCells / (totalCells || 1)) * 100).toFixed(2)}%)</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Variables Numéricas / Cat.</span>
            <span className="text-sm font-bold font-mono">{numericList.length} / {categoricalList.length}</span>
          </div>
        </div>
      </section>

      {/* 2. Descriptive Table */}
      <section className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-800 border-b border-slate-200 pb-1">
          2. Medidas Estadísticas Descriptivas (Variables Cuantitativas)
        </h2>
        <table className="w-full text-left border-collapse text-[10px]">
          <thead className="bg-slate-100 border-b border-slate-300 font-bold">
            <tr>
              <th className="py-1.5 px-2">Variable</th>
              <th className="py-1.5 px-2 text-right">Media (x̄)</th>
              <th className="py-1.5 px-2 text-right">Mediana</th>
              <th className="py-1.5 px-2 text-right">Desv. Est.</th>
              <th className="py-1.5 px-2 text-right">Mín</th>
              <th className="py-1.5 px-2 text-right">Máx</th>
              <th className="py-1.5 px-2 text-right">Q1 (25%)</th>
              <th className="py-1.5 px-2 text-right">Q3 (75%)</th>
              <th className="py-1.5 px-2 text-right">IQR</th>
              <th className="py-1.5 px-2 text-right">Asimetría</th>
              <th className="py-1.5 px-2 text-right">Outliers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono">
            {numericList.map((s) => (
              <tr key={s.column}>
                <td className="py-1.5 px-2 font-bold font-sans">{s.column}</td>
                <td className="py-1.5 px-2 text-right font-bold text-indigo-900">{s.mean}</td>
                <td className="py-1.5 px-2 text-right">{s.median}</td>
                <td className="py-1.5 px-2 text-right">{s.stdDev}</td>
                <td className="py-1.5 px-2 text-right">{s.min}</td>
                <td className="py-1.5 px-2 text-right">{s.max}</td>
                <td className="py-1.5 px-2 text-right">{s.q1}</td>
                <td className="py-1.5 px-2 text-right">{s.q3}</td>
                <td className="py-1.5 px-2 text-right">{s.iqr}</td>
                <td className="py-1.5 px-2 text-right">{s.skewness}</td>
                <td className="py-1.5 px-2 text-right">{s.outliersCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 3. Top Correlations */}
      <section className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-800 border-b border-slate-200 pb-1">
          3. Correlaciones Lineales Relevantes (Pearson r)
        </h2>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {dataset.correlations.slice(0, 8).map((c, i) => (
            <div key={i} className="flex justify-between p-2 bg-slate-50 border border-slate-200 rounded">
              <span className="font-semibold text-slate-800">{c.colA} ↔ {c.colB}</span>
              <span className="font-mono font-bold text-indigo-700">r = {c.pearson}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Strategic Recommendations */}
      <section className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-800 border-b border-slate-200 pb-1">
          4. Recomendaciones Prescriptivas del Analista
        </h2>
        <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
          {insights.strategicRecommendations.map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ul>
      </section>

      {/* Footer Sign-off */}
      <div className="pt-8 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
        <div>DataSense AI Analytics Suite • Documento Confidencial de Toma de Decisiones</div>
        <div>Página 1 de 1</div>
      </div>
    </div>
  );
};
