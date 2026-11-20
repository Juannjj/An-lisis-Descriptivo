import {
  BoxPlotItem,
  CategoricalStats,
  ColumnMetadata,
  CorrelationPair,
  HistogramBin,
  LinearRegressionResult,
  NumericStats,
  VariableType,
} from '../types/data';

export function isNullOrEmpty(value: any): boolean {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    value === 'NA' ||
    value === 'N/A' ||
    value === 'null' ||
    value === 'NaN' ||
    (typeof value === 'number' && isNaN(value))
  );
}

export function inferVariableType(values: any[]): VariableType {
  const validValues = values.filter((v) => !isNullOrEmpty(v));
  if (validValues.length === 0) return 'categorical_nominal';

  let numberCount = 0;
  let integerCount = 0;
  let booleanCount = 0;
  let dateCount = 0;

  for (const v of validValues) {
    if (typeof v === 'boolean' || v === 'true' || v === 'false' || v === 'TRUE' || v === 'FALSE') {
      booleanCount++;
      continue;
    }

    if (typeof v === 'number' && !isNaN(v)) {
      numberCount++;
      if (Number.isInteger(v)) integerCount++;
      continue;
    }

    if (typeof v === 'string') {
      const trimmed = v.trim();
      const num = Number(trimmed);
      if (!isNaN(num) && trimmed !== '') {
        numberCount++;
        if (Number.isInteger(num)) integerCount++;
        continue;
      }

      // Check date
      if (trimmed.length >= 6 && !isNaN(Date.parse(trimmed)) && /[/-]/.test(trimmed)) {
        dateCount++;
        continue;
      }
    }
  }

  const total = validValues.length;

  if (booleanCount / total > 0.85) return 'boolean';
  if (dateCount / total > 0.85) return 'date';

  if (numberCount / total > 0.85) {
    const uniqueValues = new Set(validValues.map((v) => Number(v))).size;
    // If few unique integers or low cardinality, could be discrete
    if (integerCount === numberCount && uniqueValues <= 15 && total > 30) {
      return 'numeric_discrete';
    }
    if (integerCount === numberCount && uniqueValues < total * 0.2) {
      return 'numeric_discrete';
    }
    return 'numeric_continuous';
  }

  const uniqueStrings = new Set(validValues.map((v) => String(v).trim().toLowerCase())).size;
  // If almost every value is unique and length is large, it's likely an identifier or free text
  if (uniqueStrings > total * 0.95 && total > 20) {
    return 'identifier_text';
  }

  // Check ordinal keywords
  const ordinalKeywords = ['bajo', 'medio', 'alto', 'low', 'medium', 'high', 'pésimo', 'malo', 'regular', 'bueno', 'excelente', 'nivel'];
  const hasOrdinal = validValues.some((v) =>
    ordinalKeywords.some((k) => String(v).toLowerCase().includes(k))
  );
  if (hasOrdinal && uniqueStrings <= 10) return 'categorical_ordinal';

  return 'categorical_nominal';
}

export function computeColumnMetadata(
  rows: Record<string, any>[],
  columnNames: string[]
): ColumnMetadata[] {
  const totalCount = rows.length;

  return columnNames.map((name) => {
    const rawValues = rows.map((r) => r[name]);
    let missingCount = 0;
    const uniqueSet = new Set<string>();

    for (const val of rawValues) {
      if (isNullOrEmpty(val)) {
        missingCount++;
      } else {
        uniqueSet.add(String(val));
      }
    }

    const inferredType = inferVariableType(rawValues);
    const missingPercentage = totalCount > 0 ? (missingCount / totalCount) * 100 : 0;

    return {
      name,
      type: inferredType,
      inferredType,
      missingCount,
      missingPercentage: Number(missingPercentage.toFixed(2)),
      totalCount,
      uniqueCount: uniqueSet.size,
    };
  });
}

export function computeNumericStats(
  rows: Record<string, any>[],
  column: string
): NumericStats | null {
  const rawValues = rows.map((r) => r[column]);
  const validNumbers: number[] = [];
  let missing = 0;
  let zerosCount = 0;
  let negativesCount = 0;

  for (const v of rawValues) {
    if (isNullOrEmpty(v)) {
      missing++;
      continue;
    }
    const num = typeof v === 'number' ? v : Number(String(v).trim());
    if (isNaN(num)) {
      missing++;
    } else {
      validNumbers.push(num);
      if (num === 0) zerosCount++;
      if (num < 0) negativesCount++;
    }
  }

  if (validNumbers.length === 0) return null;

  validNumbers.sort((a, b) => a - b);
  const n = validNumbers.length;

  // Mean
  const sum = validNumbers.reduce((acc, curr) => acc + curr, 0);
  const mean = sum / n;

  // Median
  const mid = Math.floor(n / 2);
  const median = n % 2 !== 0 ? validNumbers[mid] : (validNumbers[mid - 1] + validNumbers[mid]) / 2;

  // Min, Max, Range
  const min = validNumbers[0];
  const max = validNumbers[n - 1];
  const range = max - min;

  // Variance & Sample Standard Deviation
  const variance =
    n > 1
      ? validNumbers.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / (n - 1)
      : 0;
  const stdDev = Math.sqrt(variance);

  // Quartiles (Empirical method)
  const getPercentile = (p: number) => {
    const index = (n - 1) * p;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    if (upper === lower) return validNumbers[lower];
    return validNumbers[lower] * (1 - weight) + validNumbers[upper] * weight;
  };

  const q1 = getPercentile(0.25);
  const q3 = getPercentile(0.75);
  const iqr = q3 - q1;

  // Outliers by 1.5 * IQR Rule
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const outliers: number[] = [];
  for (const val of validNumbers) {
    if (val < lowerFence || val > upperFence) {
      outliers.push(val);
    }
  }

  // Skewness & Kurtosis
  let m3 = 0;
  let m4 = 0;
  if (stdDev > 0 && n > 2) {
    for (const x of validNumbers) {
      const diff = x - mean;
      m3 += Math.pow(diff, 3);
      m4 += Math.pow(diff, 4);
    }
    m3 /= n;
    m4 /= n;
  }
  const skewness = stdDev > 0 ? m3 / Math.pow(stdDev, 3) : 0;
  const kurtosis = stdDev > 0 ? m4 / Math.pow(stdDev, 4) - 3 : 0; // Excess kurtosis

  // Mode
  const frequencyMap = new Map<number, number>();
  let maxFreq = 0;
  for (const num of validNumbers) {
    const count = (frequencyMap.get(num) || 0) + 1;
    frequencyMap.set(num, count);
    if (count > maxFreq) maxFreq = count;
  }
  const modes: number[] = [];
  frequencyMap.forEach((count, key) => {
    if (count === maxFreq && maxFreq > 1) {
      modes.push(key);
    }
  });

  return {
    column,
    count: n,
    missing,
    mean: Number(mean.toFixed(4)),
    median: Number(median.toFixed(4)),
    mode: modes.length === 1 ? modes[0] : modes.slice(0, 3),
    stdDev: Number(stdDev.toFixed(4)),
    variance: Number(variance.toFixed(4)),
    min: Number(min.toFixed(4)),
    max: Number(max.toFixed(4)),
    range: Number(range.toFixed(4)),
    q1: Number(q1.toFixed(4)),
    q3: Number(q3.toFixed(4)),
    iqr: Number(iqr.toFixed(4)),
    skewness: Number(skewness.toFixed(4)),
    kurtosis: Number(kurtosis.toFixed(4)),
    outliersCount: outliers.length,
    outliers: outliers.slice(0, 50),
    zerosCount,
    negativesCount,
  };
}

export function computeCategoricalStats(
  rows: Record<string, any>[],
  column: string
): CategoricalStats {
  const rawValues = rows.map((r) => r[column]);
  const freqMap = new Map<string, number>();
  let missing = 0;
  let validCount = 0;

  for (const v of rawValues) {
    if (isNullOrEmpty(v)) {
      missing++;
      continue;
    }
    const str = String(v).trim();
    validCount++;
    freqMap.set(str, (freqMap.get(str) || 0) + 1);
  }

  const sortedCategories = Array.from(freqMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({
      value,
      count,
      percentage: validCount > 0 ? Number(((count / validCount) * 100).toFixed(2)) : 0,
    }));

  const mode = sortedCategories.length > 0 ? sortedCategories[0].value : 'N/A';

  return {
    column,
    count: validCount,
    missing,
    uniqueCount: freqMap.size,
    mode,
    topCategories: sortedCategories.slice(0, 10),
  };
}

export function computeBoxPlot(
  rows: Record<string, any>[],
  column: string,
  label?: string
): BoxPlotItem | null {
  const stats = computeNumericStats(rows, column);
  if (!stats) return null;

  const validNumbers = rows
    .map((r) => r[column])
    .filter((v) => !isNullOrEmpty(v))
    .map((v) => (typeof v === 'number' ? v : Number(v)))
    .filter((v) => !isNaN(v))
    .sort((a, b) => a - b);

  if (validNumbers.length === 0) return null;

  const lowerFence = stats.q1 - 1.5 * stats.iqr;
  const upperFence = stats.q3 + 1.5 * stats.iqr;

  // Whiskers: min and max within fences
  let whiskerMin = stats.min;
  for (const val of validNumbers) {
    if (val >= lowerFence) {
      whiskerMin = val;
      break;
    }
  }

  let whiskerMax = stats.max;
  for (let i = validNumbers.length - 1; i >= 0; i--) {
    if (validNumbers[i] <= upperFence) {
      whiskerMax = validNumbers[i];
      break;
    }
  }

  return {
    column,
    label: label || column,
    min: whiskerMin,
    q1: stats.q1,
    median: stats.median,
    mean: stats.mean,
    q3: stats.q3,
    max: whiskerMax,
    iqr: stats.iqr,
    outliers: stats.outliers,
    count: stats.count,
  };
}

export function computeHistogram(
  values: number[],
  numBins: number = 10
): { bins: HistogramBin[]; min: number; max: number; binWidth: number } {
  if (values.length === 0) {
    return { bins: [], min: 0, max: 0, binWidth: 0 };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return {
      bins: [{ x0: min - 1, x1: max + 1, count: values.length, percentage: 100 }],
      min: min - 1,
      max: max + 1,
      binWidth: 2,
    };
  }

  const binWidth = (max - min) / numBins;
  const bins: HistogramBin[] = [];

  for (let i = 0; i < numBins; i++) {
    const x0 = min + i * binWidth;
    const x1 = i === numBins - 1 ? max : min + (i + 1) * binWidth;
    bins.push({ x0, x1, count: 0, percentage: 0 });
  }

  for (const v of values) {
    let index = Math.floor((v - min) / binWidth);
    if (index >= numBins) index = numBins - 1;
    if (index < 0) index = 0;
    bins[index].count++;
  }

  const total = values.length;
  for (const b of bins) {
    b.percentage = Number(((b.count / total) * 100).toFixed(2));
  }

  return { bins, min, max, binWidth };
}

export function computePearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2 || x.length !== y.length) return 0;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0) return 0;
  return Number((numerator / denominator).toFixed(4));
}

function getRanks(arr: number[]): number[] {
  const sorted = arr.map((val, idx) => ({ val, idx })).sort((a, b) => a.val - b.val);
  const ranks = new Array(arr.length);
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j < sorted.length - 1 && sorted[j].val === sorted[j + 1].val) {
      j++;
    }
    const rank = (i + j + 2) / 2; // 1-based average rank
    for (let k = i; k <= j; k++) {
      ranks[sorted[k].idx] = rank;
    }
    i = j + 1;
  }
  return ranks;
}

export function computeSpearmanCorrelation(x: number[], y: number[]): number {
  if (x.length < 2 || x.length !== y.length) return 0;
  const rankX = getRanks(x);
  const rankY = getRanks(y);
  return computePearsonCorrelation(rankX, rankY);
}

export function computeLinearRegression(x: number[], y: number[]): LinearRegressionResult {
  const n = x.length;
  if (n < 2) return { slope: 0, intercept: 0, r: 0, r2: 0, equation: 'y = 0' };

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;

  for (let i = 0; i < n; i++) {
    num += (x[i] - meanX) * (y[i] - meanY);
    den += Math.pow(x[i] - meanX, 2);
  }

  const slope = den !== 0 ? num / den : 0;
  const intercept = meanY - slope * meanX;
  const r = computePearsonCorrelation(x, y);
  const r2 = Number((r * r).toFixed(4));

  const sign = intercept >= 0 ? '+' : '-';
  const equation = `y = ${slope.toFixed(3)}x ${sign} ${Math.abs(intercept).toFixed(3)}`;

  return {
    slope: Number(slope.toFixed(4)),
    intercept: Number(intercept.toFixed(4)),
    r,
    r2,
    equation,
  };
}

export function generateAutomatedExpertInsights(
  columns: ColumnMetadata[],
  numericStats: Record<string, NumericStats>,
  correlations: CorrelationPair[],
  rowCount: number
): {
  headline: string;
  summary: string;
  keyFindings: string[];
  risksAndAnomalies: string[];
  strategicRecommendations: string[];
} {
  const numColCount = Object.keys(numericStats).length;
  const missingCols = columns.filter((c) => c.missingCount > 0);
  const totalMissingCells = columns.reduce((acc, c) => acc + c.missingCount, 0);

  const keyFindings: string[] = [];
  const risksAndAnomalies: string[] = [];
  const strategicRecommendations: string[] = [];

  // 1. Quality & Completeness
  if (totalMissingCells === 0) {
    keyFindings.push(`Integridad perfecta: La base de datos no contiene celdas nulas en ninguna de sus ${columns.length} variables (${rowCount} registros limpios).`);
  } else {
    risksAndAnomalies.push(
      `Presencia de datos incompletos en ${missingCols.length} variables. Destaca '${missingCols.sort((a, b) => b.missingPercentage - a.missingPercentage)[0]?.name}' con ${missingCols[0]?.missingPercentage}% de valores faltantes.`
    );
    strategicRecommendations.push(
      `Aplicar imputación multivariada (KNN o MICE) en columnas numéricas clave con < 5% de nulos, o evaluar exclusión/filtrado si superan el 30%.`
    );
  }

  // 2. Correlations
  const strongPos = correlations
    .filter((c) => c.pearson >= 0.65)
    .sort((a, b) => b.pearson - a.pearson);
  const strongNeg = correlations
    .filter((c) => c.pearson <= -0.65)
    .sort((a, b) => a.pearson - b.pearson);

  if (strongPos.length > 0) {
    const top = strongPos[0];
    keyFindings.push(
      `Fuerte asociación lineal positiva entre '${top.colA}' y '${top.colB}' (r = ${top.pearson.toFixed(2)}). Un incremento en '${top.colA}' se acompaña de un alza sistemática en '${top.colB}'.`
    );
  }

  if (strongNeg.length > 0) {
    const topNeg = strongNeg[0];
    keyFindings.push(
      `Correlación inversa significativa detectada entre '${topNeg.colA}' y '${topNeg.colB}' (r = ${topNeg.pearson.toFixed(2)}). Sugiere un trade-off operativo o una compensación directa.`
    );
  }

  // 3. Outliers & Skewness
  const highSkew = Object.values(numericStats).filter((s) => Math.abs(s.skewness) > 1.2);
  const highOutliers = Object.values(numericStats).filter((s) => s.outliersCount > 0);

  if (highSkew.length > 0) {
    const topSkew = highSkew.sort((a, b) => Math.abs(b.skewness) - Math.abs(a.skewness))[0];
    const dir = topSkew.skewness > 0 ? 'hacia la derecha (asimetría positiva)' : 'hacia la izquierda (asimetría negativa)';
    risksAndAnomalies.push(
      `Distribución marcadamente sesgada en '${topSkew.column}' (Skewness = ${topSkew.skewness.toFixed(2)} ${dir}). Se sugiere usar la Mediana (${topSkew.median}) como referencia principal en lugar de la Media (${topSkew.mean}).`
    );
    strategicRecommendations.push(
      `Considerar transformación logarítmica (Box-Cox o log1p) en '${topSkew.column}' antes de entrenar modelos de regresión lineal o algoritmos sensibles a la normalidad.`
    );
  }

  if (highOutliers.length > 0) {
    const totalOutliers = highOutliers.reduce((acc, s) => acc + s.outliersCount, 0);
    risksAndAnomalies.push(
      `Se identificaron ${totalOutliers} valores atípicos (outliers) distribuidos en ${highOutliers.length} variables numéricas según el criterio de Tukey (1.5 × IQR).`
    );
  }

  // 4. Recommendations
  if (numColCount >= 2) {
    strategicRecommendations.push(
      `Monitorear el gráfico de tendencia entre las variables de mayor impacto y evaluar modelos predictivos lineales o no lineales (Gradient Boosting / Random Forest).`
    );
  }
  strategicRecommendations.push(
    `Estandarizar variables con escalas dispares (Z-Score o MinMax Scaler) si se planean análisis de segmentación (K-Means) o clustering.`
  );

  return {
    headline: `Diagnóstico Ejecutivo de Analítica: ${rowCount} Registros y ${columns.length} Dimensiones`,
    summary: `El conjunto de datos presenta ${numColCount} variables cuantitativas y ${columns.length - numColCount} cualitativas/temporales. Muestra una estructura adecuada para análisis exploratorio y modelado inferencial.`,
    keyFindings,
    risksAndAnomalies,
    strategicRecommendations,
  };
}
