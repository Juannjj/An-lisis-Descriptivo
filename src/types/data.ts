export type VariableType =
  | 'numeric_continuous'
  | 'numeric_discrete'
  | 'categorical_nominal'
  | 'categorical_ordinal'
  | 'date'
  | 'boolean'
  | 'identifier_text';

export interface ColumnMetadata {
  name: string;
  type: VariableType;
  inferredType: VariableType;
  missingCount: number;
  missingPercentage: number;
  totalCount: number;
  uniqueCount: number;
}

export interface NumericStats {
  column: string;
  count: number;
  missing: number;
  mean: number;
  median: number;
  mode: number | number[];
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  q1: number;
  q3: number;
  iqr: number;
  skewness: number;
  kurtosis: number;
  outliersCount: number;
  outliers: number[];
  zerosCount: number;
  negativesCount: number;
}

export interface CategoricalStats {
  column: string;
  count: number;
  missing: number;
  uniqueCount: number;
  mode: string;
  topCategories: { value: string; count: number; percentage: number }[];
}

export interface CorrelationPair {
  colA: string;
  colB: string;
  pearson: number;
  spearman: number;
}

export interface BoxPlotItem {
  column: string;
  label: string;
  min: number;
  q1: number;
  median: number;
  mean: number;
  q3: number;
  max: number;
  iqr: number;
  outliers: number[];
  count: number;
}

export interface HistogramBin {
  x0: number;
  x1: number;
  count: number;
  percentage: number;
}

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  r: number;
  r2: number;
  equation: string;
}

export interface DatasetContext {
  domain?: string;
  datasetObjective?: string;
  columnExplanations?: {
    column: string;
    meaning: string;
    role: string;
  }[];
  potentialUseCases?: string[];
  qualityObservations?: string;
}

export interface DatasetState {
  name: string;
  sheetNames?: string[];
  currentSheet?: string;
  rawRows: Record<string, any>[];
  columns: ColumnMetadata[];
  stats: {
    numeric: Record<string, NumericStats>;
    categorical: Record<string, CategoricalStats>;
  };
  correlations: CorrelationPair[];
  boxPlots: Record<string, BoxPlotItem>;
  context?: DatasetContext;
}
