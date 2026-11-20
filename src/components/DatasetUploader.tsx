import React, { useRef, useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Layers,
  X,
} from 'lucide-react';
import { parseFile, switchSheet } from '../utils/fileParser';
import { DatasetState } from '../types/data';
import { SAMPLE_DATASETS } from '../utils/sampleDatasets';
import * as XLSX from 'xlsx';

interface DatasetUploaderProps {
  onDatasetLoaded: (dataset: DatasetState, workbook?: XLSX.WorkBook) => void;
  isOpenModal?: boolean;
  onCloseModal?: () => void;
  currentWorkbook?: XLSX.WorkBook | null;
  dataset?: DatasetState | null;
}

export const DatasetUploader: React.FC<DatasetUploaderProps> = ({
  onDatasetLoaded,
  isOpenModal = false,
  onCloseModal,
  currentWorkbook,
  dataset,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { dataset: parsedDataset, workbook } = await parseFile(file);
      onDatasetLoaded(parsedDataset, workbook);
      if (onCloseModal) onCloseModal();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err?.message ||
          'No se pudo procesar el archivo. Asegúrate de que sea un archivo válido en formato CSV, Excel (.xlsx, .xls), TXT o JSON.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  const content = (
    <div className="space-y-6">
      {/* Excel Sheet Switcher if multiple sheets are available */}
      {currentWorkbook && currentWorkbook.SheetNames.length > 1 && dataset && (
        <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-indigo-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              Este archivo Excel contiene múltiples hojas ({currentWorkbook.SheetNames.length}):
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentWorkbook.SheetNames.map((sheet) => (
              <button
                key={sheet}
                onClick={() => {
                  const updated = switchSheet(currentWorkbook, dataset.name, sheet);
                  onDatasetLoaded(updated, currentWorkbook);
                }}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
                  dataset.currentSheet === sheet
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {sheet}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/60 scale-[1.005]'
            : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-white'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv, .xlsx, .xls, .txt, .json, .tsv, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-xs">
          <Upload className="w-8 h-8" />
        </div>

        <h3 className="text-base font-semibold text-slate-900 mb-1">
          {isLoading
            ? 'Procesando dataset y calculando estadísticas...'
            : 'Arrastra y suelta tu archivo aquí o haz clic para explorar'}
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
          Formatos soportados: <strong className="text-slate-700">CSV, Excel (.xlsx, .xls), TXT delimitado, TSV y JSON</strong>. Detección automática de codificación, separadores y tipos de datos.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel (.xlsx/.xls)
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            <FileText className="w-3.5 h-3.5" /> CSV / TSV
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
            <FileText className="w-3.5 h-3.5" /> TXT Tabular
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
            <FileCode className="w-3.5 h-3.5" /> JSON Data
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Pre-packaged sample datasets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            O prueba de inmediato con datasets reales de demostración:
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SAMPLE_DATASETS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => {
                const datasetState = sample.generate();
                onDatasetLoaded(datasetState);
                if (onCloseModal) onCloseModal();
              }}
              className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-sm cursor-pointer transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {sample.category}
                  </span>
                  <span className="text-xs font-semibold text-indigo-600 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    Cargar <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </span>
                </div>
                <h5 className="font-semibold text-xs text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                  {sample.title}
                </h5>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  {sample.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (isOpenModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
        <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Cargar Base de Datos o Dataset</h2>
              <p className="text-xs text-slate-500">
                Selecciona tu archivo local o explora los conjuntos de datos precargados
              </p>
            </div>
            {onCloseModal && (
              <button
                onClick={onCloseModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs mb-6">
      {content}
    </div>
  );
};
