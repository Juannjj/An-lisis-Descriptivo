import React from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  Upload,
  Printer,
  Sparkles,
  Layers,
  Database,
  Download,
} from 'lucide-react';
import { DatasetState } from '../types/data';
import { SAMPLE_DATASETS } from '../utils/sampleDatasets';
import * as XLSX from 'xlsx';

interface HeaderProps {
  dataset: DatasetState | null;
  onOpenUploadModal: () => void;
  onSelectSample: (id: string) => void;
  onPrintReport: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  dataset,
  onOpenUploadModal,
  onSelectSample,
  onPrintReport,
  activeTab,
  setActiveTab,
}) => {
  const handleExportExcel = () => {
    if (!dataset) return;
    const wb = XLSX.utils.book_new();

    // Sheet 1: Raw Rows
    const wsRaw = XLSX.utils.json_to_sheet(dataset.rawRows);
    XLSX.utils.book_append_sheet(wb, wsRaw, 'Datos');

    // Sheet 2: Numeric Stats
    const numRows = Object.values(dataset.stats.numeric).map((s) => ({
      Columna: s.column,
      Conteo: s.count,
      Nulos: s.missing,
      Media: s.mean,
      Mediana: s.median,
      Desv_Estandar: s.stdDev,
      Minimo: s.min,
      Maximo: s.max,
      Rango: s.range,
      Q1: s.q1,
      Q3: s.q3,
      IQR: s.iqr,
      Asimetria: s.skewness,
      Curtosis: s.kurtosis,
      Outliers: s.outliersCount,
    }));
    if (numRows.length > 0) {
      const wsNum = XLSX.utils.json_to_sheet(numRows);
      XLSX.utils.book_append_sheet(wb, wsNum, 'Estadisticas_Numericas');
    }

    // Sheet 3: Metadata
    const metaRows = dataset.columns.map((c) => ({
      Columna: c.name,
      Tipo: c.type,
      Nulos: c.missingCount,
      Pct_Faltante: `${c.missingPercentage}%`,
      Unicos: c.uniqueCount,
    }));
    const wsMeta = XLSX.utils.json_to_sheet(metaRows);
    XLSX.utils.book_append_sheet(wb, wsMeta, 'Metadatos_Columnas');

    XLSX.writeFile(wb, `Reporte_DataSense_${dataset.name.replace(/\.[^/.]+$/, '')}.xlsx`);
  };

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top brand & actions row */}
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">
                  DataSense AI
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  EDA & Analytics
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Explorador Descriptivo, Tendencias, BoxPlots & Reportes IA
              </p>
            </div>
          </div>

          {/* Center info or sample selector */}
          <div className="flex items-center space-x-3">
            {/* Quick Sample Selector */}
            <div className="relative hidden md:block">
              <select
                aria-label="Cargar dataset de ejemplo"
                onChange={(e) => {
                  if (e.target.value) {
                    onSelectSample(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors cursor-pointer"
              >
                <option value="" disabled>
                  Cargar Dataset de Ejemplo...
                </option>
                {SAMPLE_DATASETS.map((sample) => (
                  <option key={sample.id} value={sample.id}>
                    {sample.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Upload Button */}
            <button
              onClick={onOpenUploadModal}
              className="inline-flex items-center space-x-1.5 text-xs font-medium px-3.5 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Cargar Dataset</span>
            </button>

            {/* Export Excel Button */}
            {dataset && (
              <button
                onClick={handleExportExcel}
                title="Exportar resumen a Excel"
                className="hidden lg:inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Exportar Excel</span>
              </button>
            )}

            {/* Print / PDF Button */}
            {dataset && (
              <button
                onClick={onPrintReport}
                className="inline-flex items-center space-x-1.5 text-xs font-medium px-3.5 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-200" />
                <span>Generar PDF / Imprimir</span>
              </button>
            )}
          </div>
        </div>

        {/* Current Dataset Status bar & Navigation tabs */}
        {dataset && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 pt-1 border-t border-slate-100 gap-2">
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                {dataset.name}
              </span>
              <span className="text-slate-300">•</span>
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                {dataset.rawRows.length.toLocaleString()} filas
              </span>
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                {dataset.columns.length} columnas
              </span>
              {dataset.sheetNames && dataset.sheetNames.length > 1 && (
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px]">
                  Hoja: {dataset.currentSheet}
                </span>
              )}
            </div>

            {/* Nav Tabs */}
            <div className="flex items-center overflow-x-auto space-x-1 py-1 no-scrollbar text-xs font-medium">
              {[
                { id: 'preview', label: '1. Vista Previa' },
                { id: 'context', label: '2. Contexto & Variables' },
                { id: 'missing', label: '3. Datos Faltantes' },
                { id: 'descriptive', label: '4. Descriptivos' },
                { id: 'histogram', label: '5. Histogramas' },
                { id: 'trends', label: '6. Tendencias (X vs Y)' },
                { id: 'boxplot', label: '7. BoxPlots' },
                { id: 'expert', label: '8. Análisis Experto IA', highlight: true },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? tab.highlight
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs'
                        : 'bg-indigo-600 text-white shadow-xs'
                      : tab.highlight
                      ? 'text-purple-700 bg-purple-50 hover:bg-purple-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {tab.highlight && <Sparkles className="w-3 h-3" />}
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
