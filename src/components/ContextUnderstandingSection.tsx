import React, { useState } from 'react';
import {
  Compass,
  Sparkles,
  BookOpen,
  Briefcase,
  Target,
  Layers,
  FileCheck,
  Loader2,
  Tag,
} from 'lucide-react';
import { DatasetState } from '../types/data';

interface ContextUnderstandingSectionProps {
  dataset: DatasetState;
}

export const ContextUnderstandingSection: React.FC<ContextUnderstandingSectionProps> = ({
  dataset,
}) => {
  const [isInferring, setIsInferring] = useState(false);
  const [aiContext, setAiContext] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Heuristic domain detection
  const inferLocalDomain = () => {
    const colNames = dataset.columns.map((c) => c.name.toLowerCase()).join(' ');
    if (colNames.includes('paciente') || colNames.includes('salud') || colNames.includes('colesterol') || colNames.includes('presion')) {
      return {
        domain: 'Sector Salud & Investigación Médica',
        description: 'Conjunto de datos clínicos diseñado para evaluación de factores de riesgo fisiológicos y epidemiológicos.',
        useCases: ['Diagnóstico preventivo', 'Clasificación de riesgo cardiovascular', 'Modelado de supervivencia'],
      };
    }
    if (colNames.includes('venta') || colNames.includes('ganancia') || colNames.includes('descuento') || colNames.includes('precio')) {
      return {
        domain: 'Comercio Electrónico & Retail Financiero',
        description: 'Transacciones comerciales que evalúan volumen de ingresos, márgenes operativos y comportamiento de compra.',
        useCases: ['Optimización de elasticidad de precios', 'Pronóstico de ventas (Forecasting)', 'Segmentación de clientes'],
      };
    }
    if (colNames.includes('inmueble') || colNames.includes('vivienda') || colNames.includes('superficie') || colNames.includes('habitacion')) {
      return {
        domain: 'Bienes Raíces & Tasación Inmobiliaria',
        description: 'Registro de características físicas y de ubicación de propiedades para determinación de valor de mercado.',
        useCases: ['Regresión de precios hedónicos', 'Valoración automatizada (AVM)', 'Análisis de zonificación urbana'],
      };
    }
    if (colNames.includes('cliente') || colNames.includes('churn') || colNames.includes('contrato') || colNames.includes('cargo')) {
      return {
        domain: 'Telecomunicaciones & Retención de Clientes',
        description: 'Métricas de consumo y satisfacción de clientes para prevención proactiva de cancelaciones (Customer Churn).',
        useCases: ['Predicción de deserción (Churn Risk)', 'Diseño de planes de fidelización', 'Valor de vida del cliente (CLV)'],
      };
    }

    return {
      domain: 'Análisis Multivariado General',
      description: 'Conjunto estructurado con variables cuantitativas y cualitativas apto para minería de datos y estadística inferencial.',
      useCases: ['Análisis de componentes principales (PCA)', 'Agrupamiento (Clustering)', 'Modelado predictivo'],
    };
  };

  const localContext = inferLocalDomain();

  const handleInferWithAI = async () => {
    setIsInferring(true);
    setErrorMsg(null);
    try {
      const sampleRows = dataset.rawRows.slice(0, 5);
      const columnNames = dataset.columns.map((c) => c.name);

      const res = await fetch('/api/understand-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleRows,
          columnNames,
          datasetName: dataset.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al deducir el contexto con Gemini.');
      }

      setAiContext(data.context);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al conectar con el asistente de IA.');
    } finally {
      setIsInferring(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Comprensión Semántica & Contexto del Dataset
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Deducción del dominio del negocio, propósito del conjunto de datos y roles funcionales de cada columna.
          </p>
        </div>

        <button
          onClick={handleInferWithAI}
          disabled={isInferring}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
        >
          {isInferring ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Deduciendo contexto...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Enriquecer Contexto con Gemini</span>
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Main Context Card */}
      <div className="p-5 rounded-xl bg-gradient-to-br from-teal-50/50 via-slate-50 to-white border border-teal-200/70 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-teal-600" />
            Dominio de Aplicación Identificado:
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">
            {aiContext?.domain || localContext.domain}
          </span>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed">
          {aiContext?.datasetObjective || localContext.description}
        </p>

        {/* Potential Use Cases */}
        <div className="pt-2 border-t border-teal-100">
          <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
            🎯 Casos de Uso y Aplicaciones Analíticas Clave:
          </span>
          <div className="flex flex-wrap gap-2">
            {(aiContext?.potentialUseCases || localContext.useCases).map((uc: string, i: number) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-lg bg-white border border-teal-200 text-teal-900 font-medium shadow-2xs"
              >
                {uc}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Column Roles & Semantic Dictionary Table */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          Diccionario Semántico y Rol Funcional de Columnas
        </h4>

        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
              <tr>
                <th className="py-2.5 px-4 w-1/4">Columna</th>
                <th className="py-2.5 px-4 w-1/6">Tipo de Variable</th>
                <th className="py-2.5 px-4 w-1/4">Rol Analítico Estimado</th>
                <th className="py-2.5 px-4">Significado Semántico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {dataset.columns.map((col) => {
                const aiCol = aiContext?.columnExplanations?.find(
                  (c: any) => c.column.toLowerCase() === col.name.toLowerCase()
                );

                let defaultRole = 'Feature Predictiva';
                if (col.type === 'identifier_text' || col.name.toLowerCase().includes('id')) {
                  defaultRole = 'Identificador Único (ID)';
                } else if (
                  col.name.toLowerCase().includes('precio') ||
                  col.name.toLowerCase().includes('venta') ||
                  col.name.toLowerCase().includes('churn') ||
                  col.name.toLowerCase().includes('riesgo')
                ) {
                  defaultRole = 'Variable Objetivo / Target';
                } else if (col.type === 'date') {
                  defaultRole = 'Dimensión Temporal';
                } else if (col.type.startsWith('categorical')) {
                  defaultRole = 'Segmento / Agrupación';
                }

                return (
                  <tr key={col.name} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-4 font-bold text-slate-900 font-sans">
                      {col.name}
                    </td>
                    <td className="py-2 px-4 text-slate-600 font-mono">
                      {col.type}
                    </td>
                    <td className="py-2 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          (aiCol?.role || defaultRole).includes('Target')
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : (aiCol?.role || defaultRole).includes('ID')
                            ? 'bg-slate-100 text-slate-700'
                            : (aiCol?.role || defaultRole).includes('Temporal')
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-indigo-50 text-indigo-700'
                        }`}
                      >
                        {aiCol?.role || defaultRole}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-slate-600">
                      {aiCol?.meaning ||
                        `Medición de '${col.name}' registrada en la base de datos (${col.uniqueCount} valores distintos).`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
