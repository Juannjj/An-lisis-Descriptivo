import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Header } from './components/Header';
import { DatasetUploader } from './components/DatasetUploader';
import { DataPreviewTable } from './components/DataPreviewTable';
import { VariableTypeManager } from './components/VariableTypeManager';
import { MissingValuesAnalysis } from './components/MissingValuesAnalysis';
import { DescriptiveStatistics } from './components/DescriptiveStatistics';
import { HistogramSection } from './components/HistogramSection';
import { TrendScatterSection } from './components/TrendScatterSection';
import { BoxPlotSection } from './components/BoxPlotSection';
import { ExpertAnalysisSection } from './components/ExpertAnalysisSection';
import { ContextUnderstandingSection } from './components/ContextUnderstandingSection';
import { ReportPrintView } from './components/ReportPrintView';
import { DatasetState, VariableType } from './types/data';
import { SAMPLE_DATASETS } from './utils/sampleDatasets';
import { calculateFullDatasetState } from './utils/fileParser';
import {
  BarChart3,
  FileSpreadsheet,
  Layers,
  Database,
  Eye,
  Tag,
  FileX2,
  Calculator,
  BarChart2,
  TrendingUp,
  BoxSelect,
  Sparkles,
  Printer,
  Compass,
} from 'lucide-react';

export default function App() {
  // Pre-load the first sample dataset so the user lands immediately in a rich working workspace
  const [dataset, setDataset] = useState<DatasetState | null>(() => {
    return SAMPLE_DATASETS[0].generate();
  });
  const [currentWorkbook, setCurrentWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [activeTab, setActiveTab] = useState<string>('preview');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  const handleDatasetLoaded = (newDataset: DatasetState, wb?: XLSX.WorkBook) => {
    setDataset(newDataset);
    if (wb) setCurrentWorkbook(wb);
  };

  const handleSelectSample = (sampleId: string) => {
    const found = SAMPLE_DATASETS.find((s) => s.id === sampleId);
    if (found) {
      setDataset(found.generate());
      setCurrentWorkbook(null);
    }
  };

  const handleUpdateColumnType = (columnName: string, newType: VariableType) => {
    if (!dataset) return;
    // Recalculate with updated column type
    const updatedColumns = dataset.columns.map((c) =>
      c.name === columnName ? { ...c, type: newType } : c
    );

    // Recompute stats with the new type assignment
    const recomputed = calculateFullDatasetState(
      dataset.name,
      dataset.rawRows,
      dataset.sheetNames,
      dataset.currentSheet
    );

    // Apply custom override
    recomputed.columns = recomputed.columns.map((c) =>
      c.name === columnName ? { ...c, type: newType } : c
    );

    setDataset(recomputed);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header
        dataset={dataset}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onSelectSample={handleSelectSample}
        onPrintReport={handlePrint}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {!dataset ? (
          /* Empty State if user hasn't loaded any data */
          <div className="no-print">
            <DatasetUploader
              onDatasetLoaded={handleDatasetLoaded}
              currentWorkbook={currentWorkbook}
              dataset={dataset}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quick Summary Highlights Banner */}
            <div className="no-print grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div
                onClick={() => setActiveTab('preview')}
                className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1">
                  <Database className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-semibold">Volumen de Datos</span>
                </div>
                <div className="text-base font-bold text-slate-900 font-mono">
                  {dataset.rawRows.length.toLocaleString()} filas
                </div>
                <div className="text-[11px] text-slate-500">
                  {dataset.columns.length} columnas analizadas
                </div>
              </div>

              <div
                onClick={() => setActiveTab('context')}
                className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-semibold">Variables Numéricas</span>
                </div>
                <div className="text-base font-bold text-slate-900 font-mono">
                  {Object.keys(dataset.stats.numeric).length}
                </div>
                <div className="text-[11px] text-slate-500">
                  {Object.keys(dataset.stats.categorical).length} cualitativas / categóricas
                </div>
              </div>

              <div
                onClick={() => setActiveTab('missing')}
                className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1">
                  <FileX2 className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-semibold">Integridad / Nulos</span>
                </div>
                <div className="text-base font-bold text-slate-900 font-mono">
                  {(
                    (1 -
                      dataset.columns.reduce((acc, c) => acc + c.missingCount, 0) /
                        (dataset.rawRows.length * dataset.columns.length || 1)) *
                    100
                  ).toFixed(1)}
                  %
                </div>
                <div className="text-[11px] text-slate-500">Completitud de celdas</div>
              </div>

              <div
                onClick={() => setActiveTab('expert')}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 p-3.5 rounded-xl border border-indigo-200 shadow-2xs hover:border-indigo-400 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2 text-indigo-700 text-xs mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span className="font-semibold">Consultor IA</span>
                </div>
                <div className="text-xs font-bold text-indigo-900">
                  Gemini 3.8 Flash
                </div>
                <div className="text-[11px] text-indigo-600">
                  Análisis experto disponible
                </div>
              </div>
            </div>

            {/* TAB CONTENTS */}
            <div className="no-print">
              {activeTab === 'preview' && (
                <div className="space-y-6">
                  <DataPreviewTable dataset={dataset} />
                  <VariableTypeManager
                    dataset={dataset}
                    onUpdateColumnType={handleUpdateColumnType}
                  />
                </div>
              )}

              {activeTab === 'context' && (
                <div className="space-y-6">
                  <ContextUnderstandingSection dataset={dataset} />
                  <VariableTypeManager
                    dataset={dataset}
                    onUpdateColumnType={handleUpdateColumnType}
                  />
                </div>
              )}

              {activeTab === 'missing' && (
                <MissingValuesAnalysis dataset={dataset} />
              )}

              {activeTab === 'descriptive' && (
                <DescriptiveStatistics dataset={dataset} />
              )}

              {activeTab === 'histogram' && (
                <HistogramSection dataset={dataset} />
              )}

              {activeTab === 'trends' && (
                <TrendScatterSection dataset={dataset} />
              )}

              {activeTab === 'boxplot' && (
                <BoxPlotSection dataset={dataset} />
              )}

              {activeTab === 'expert' && (
                <ExpertAnalysisSection dataset={dataset} />
              )}
            </div>

            {/* Full Report Printable Dossier (activated when user clicks Print/Export PDF) */}
            <ReportPrintView dataset={dataset} />
          </div>
        )}
      </main>

      {/* Upload Modal (accessible from header button at any time) */}
      {isUploadModalOpen && (
        <DatasetUploader
          isOpenModal={true}
          onCloseModal={() => setIsUploadModalOpen(false)}
          onDatasetLoaded={handleDatasetLoaded}
          currentWorkbook={currentWorkbook}
          dataset={dataset}
        />
      )}

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>DataSense AI • Analizador de Datos & EDA Profesional</span>
          <span className="text-[11px] text-slate-400">
            Soporta TXT, CSV, Excel (.xlsx, .xls) y JSON • Exportación PDF de alta calidad
          </span>
        </div>
      </footer>
    </div>
  );
}
