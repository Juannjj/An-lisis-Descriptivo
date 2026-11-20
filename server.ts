import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '20mb' }));

// Shared Gemini client setup
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Endpoint: Comprehensive Data Analyst Trend & Pattern Interpretation
app.post('/api/analyze-trends', async (req, res) => {
  try {
    const { datasetSummary, correlations, selectedVariables, statsSummary, anomalies, customPrompt } = req.body;

    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY no está configurada en las variables de entorno. Puedes revisar el análisis estadístico automatizado integrado.',
      });
    }

    const prompt = `
Actúa como un Científico de Datos y Consultor Senior de Analítica Avanzada (Lead Data Scientist & Business Intelligence Expert).
Analiza el siguiente dataset y los resultados estadísticos obtenidos para generar un informe exhaustivo, riguroso y de alto valor estratégico.

### METADATOS DEL DATASET:
- Total de Filas: ${datasetSummary.rowCount}
- Total de Columnas: ${datasetSummary.colCount}
- Columnas y Tipos: ${JSON.stringify(datasetSummary.columns)}
- Porcentaje Global de Valores Faltantes: ${datasetSummary.missingPercentage}%
${selectedVariables ? `- Variables clave seleccionadas para análisis en profundidad: ${JSON.stringify(selectedVariables)}` : ''}

### RESUMEN ESTADÍSTICO DESCRIPTIVO:
${JSON.stringify(statsSummary, null, 2)}

### CORRELACIONES DESTACADAS (Pearson / Spearman):
${JSON.stringify(correlations, null, 2)}

### ANOMALÍAS Y OUTLIERS DETECTADOS (Método Rango Intercuartílico IQR / Z-Score):
${JSON.stringify(anomalies, null, 2)}

${customPrompt ? `### PREGUNTA O ENFOQUE ESPECÍFICO DEL USUARIO:\n${customPrompt}\n` : ''}

### ESTRUCTURA DEL INFORME REQUERIDA (Responde en Español formal y técnico, con formato Markdown estructurado):
1. **Resumen Ejecutivo & Contexto del Negocio**: ¿De qué trata este dataset? ¿Cuál es su relevancia operativa o estratégica?
2. **Diagnóstico de Calidad de Datos & Integridad**: Evaluación de completitud, balance y confiabilidad muestral.
3. **Análisis Profundo de Tendencias y Relaciones**:
   - Hallazgos principales entre variables clave.
   - Correlaciones directas e inversas significativas y su posible causalidad vs coincidencia.
   - Comportamiento de distribuciones (sesgo, asimetría, dispersión).
4. **Análisis de Dispersión, Outliers y Riesgos Ocultos**: Identificación de valores extremos, qué significan en la práctica y cómo mitigarlos.
5. **Recomendaciones Estratégicas y Prescriptivas (Accionables)**:
   - 3 a 5 decisiones concretas basadas en la evidencia empírica.
   - Siguientes pasos recomendados para modelado predictivo o toma de decisiones.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Eres un analista de datos experto de nivel senior en consultoría estratégica y machine learning. Tu redacción es precisa, analítica, estructurada y orientada a la toma de decisiones accionables con datos reales.',
        temperature: 0.4,
      },
    });

    res.json({
      success: true,
      analysis: response.text,
      model: 'gemini-3.8-flash',
    });
  } catch (error: any) {
    console.error('Error in /api/analyze-trends:', error);
    res.status(500).json({
      error: error?.message || 'Error interno al procesar el análisis con Gemini.',
    });
  }
});

// Endpoint: Context & Semantic Dataset Understanding
app.post('/api/understand-context', async (req, res) => {
  try {
    const { sampleRows, columnNames, datasetName } = req.body;

    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY no disponible.',
      });
    }

    const prompt = `
Analiza la estructura y las primeras filas de este dataset para inferir su contexto de negocio, significado de cada variable y posibles casos de uso.

Nombre estimado del archivo: ${datasetName || 'Dataset'}
Columnas: ${JSON.stringify(columnNames)}
Muestra de primeras filas:
${JSON.stringify(sampleRows, null, 2)}

Responde en formato JSON válido con la siguiente estructura:
{
  "domain": "Área o industria (ej. E-commerce, Salud, Finanzas, Recursos Humanos, etc.)",
  "datasetObjective": "Explicación breve de qué registra y para qué sirve este dataset",
  "columnExplanations": [
    { "column": "nombre_columna", "meaning": "Qué representa y unidad probable", "role": "Identificador | Métrica Objetivo | Feature Categórica | Feature Numérica | Temporal" }
  ],
  "potentialUseCases": ["Caso de uso 1", "Caso de uso 2", "Caso de uso 3"],
  "qualityObservations": "Observaciones inmediatas de formato o datos observados"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, context: parsed });
  } catch (error: any) {
    console.error('Error in /api/understand-context:', error);
    res.status(500).json({
      error: error?.message || 'Error infiriendo el contexto del dataset.',
    });
  }
});

// Vite Middleware integration for development and static serve for production
const isProduction = process.env.NODE_ENV === 'production';

async function setupServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`DataSense AI Server running at http://0.0.0.0:${port}`);
  });
}

setupServer();
