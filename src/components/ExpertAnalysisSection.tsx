import React, { useState } from 'react';
import {
  Sparkles,
  Brain,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  Copy,
  Check,
  TrendingUp,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { DatasetState } from '../types/data';
import { generateAutomatedExpertInsights } from '../utils/statistics';

interface ExpertAnalysisSectionProps {
  dataset: DatasetState;
}

export const ExpertAnalysisSection: React.FC<ExpertAnalysisSectionProps> = ({ dataset }) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Local automated mathematical expert summary (calculated instantly)
  const automatedInsights = generateAutomatedExpertInsights(
    dataset.columns,
    dataset.stats.numeric,
    dataset.correlations,
    dataset.rawRows.length
  );

  const handleGenerateAIReport = async () => {
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      // Prepare compact statistical digest for the API call
      const numericSummaries: Record<string, any> = {};
      Object.entries(dataset.stats.numeric).forEach(([col, s]) => {
        numericSummaries[col] = {
          mean: s.mean,
          median: s.median,
          stdDev: s.stdDev,
          min: s.min,
          max: s.max,
          skewness: s.skewness,
          outliersCount: s.outliersCount,
        };
      });

      const topCorrelations = dataset.correlations
        .sort((a, b) => Math.abs(b.pearson) - Math.abs(a.pearson))
        .slice(0, 10);

      const anomalies = Object.values(dataset.stats.numeric)
        .filter((s) => s.outliersCount > 0 || Math.abs(s.skewness) > 1.2)
        .map((s) => ({
          variable: s.column,
          outliers: s.outliersCount,
          skewness: s.skewness,
        }));

      const res = await fetch('/api/analyze-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetSummary: {
            rowCount: dataset.rawRows.length,
            colCount: dataset.columns.length,
            columns: dataset.columns.map((c) => ({ name: c.name, type: c.type })),
            missingPercentage: Number(
              (
                (dataset.columns.reduce((acc, c) => acc + c.missingCount, 0) /
                  (dataset.rawRows.length * dataset.columns.length || 1)) *
                100
              ).toFixed(2)
            ),
          },
          statsSummary: numericSummaries,
          correlations: topCorrelations,
          anomalies,
          customPrompt: customPrompt.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al comunicarse con el servicio de análisis de Gemini.');
      }

      setAiReport(data.analysis);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message ||
          'No se pudo conectar con el modelo Gemini. Revisa las variables de entorno o consulta el informe estadístico local generado automáticamente a continuación.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = aiReport || automatedInsights.headline + '\n\n' + automatedInsights.summary;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
              <Brain className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Análisis Experto de Tendencias & Data Science (Gemini AI)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Interpretación rigurosa de hallazgos estadísticos, correlaciones clave, anomalías y recomendaciones prescriptivas de negocio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Informe</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Trigger Box */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-white border border-indigo-200 shadow-2xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                Consultoría Analítica con Gemini 3.8 Flash
              </h4>
            </div>
            <p className="text-xs text-slate-600">
              Envía los resultados empíricos calculados al modelo para obtener un dictamen profesional estructurado con enfoque estratégico.
            </p>
          </div>
        </div>

        {/* Custom question input */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Pregunta o enfoque opcional (ej: ¿Cuáles son las variables con mayor impacto? o ¿Cómo optimizar el margen?)..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="flex-1 text-xs bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            disabled={isGenerating}
          />

          <button
            onClick={handleGenerateAIReport}
            disabled={isGenerating}
            className="inline-flex items-center justify-center space-x-2 text-xs font-bold px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-md shadow-indigo-200 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analizando con Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>{aiReport ? 'Regenerar Dictamen Experto' : 'Generar Dictamen con IA'}</span>
              </>
            )}
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* AI Generated Report (if available) */}
      {aiReport && (
        <div className="p-6 rounded-2xl bg-white border border-purple-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-purple-100">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h4 className="font-bold text-sm text-slate-900">
                Dictamen Oficial del Científico de Datos Senior
              </h4>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold">
              Gemini 3.8 Flash Engine
            </span>
          </div>

          {/* Formatted Markdown Content */}
          <div className="prose prose-xs max-w-none text-slate-700 text-xs leading-relaxed space-y-3 whitespace-pre-line font-sans">
            {aiReport}
          </div>
        </div>
      )}

      {/* Automated Local Mathematical Insights (Always available, instant, zero latency) */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-600" />
            Diagnóstico Estadístico Automatizado en Tiempo Real
          </h4>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
            Motor Analítico Local
          </span>
        </div>

        {/* 3 Columns Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Key Findings */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Hallazgos Principales</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              {automatedInsights.keyFindings.length > 0 ? (
                automatedInsights.keyFindings.map((f, i) => (
                  <li key={i} className="leading-snug">
                    {f}
                  </li>
                ))
              ) : (
                <li>No se detectaron anomalías severas en el conjunto de datos.</li>
              )}
            </ul>
          </div>

          {/* Card 2: Risks & Anomalies */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Riesgos, Sesgos y Outliers</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              {automatedInsights.risksAndAnomalies.length > 0 ? (
                automatedInsights.risksAndAnomalies.map((r, i) => (
                  <li key={i} className="leading-snug">
                    {r}
                  </li>
                ))
              ) : (
                <li>Distribuciones uniformes sin sesgos desmedidos.</li>
              )}
            </ul>
          </div>

          {/* Card 3: Strategic Recommendations */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-800">
              <Lightbulb className="w-4 h-4 text-indigo-600" />
              <span>Recomendaciones Accionables</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              {automatedInsights.strategicRecommendations.map((rec, i) => (
                <li key={i} className="leading-snug">
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
