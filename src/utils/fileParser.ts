import * as XLSX from 'xlsx';
import { BoxPlotItem, CorrelationPair, DatasetState, NumericStats, CategoricalStats } from '../types/data';
import {
  computeBoxPlot,
  computeCategoricalStats,
  computeColumnMetadata,
  computeNumericStats,
  computePearsonCorrelation,
  computeSpearmanCorrelation,
} from './statistics';

export function calculateFullDatasetState(
  name: string,
  rows: Record<string, any>[],
  sheetNames?: string[],
  currentSheet?: string
): DatasetState {
  if (rows.length === 0) {
    return {
      name,
      sheetNames,
      currentSheet,
      rawRows: [],
      columns: [],
      stats: { numeric: {}, categorical: {} },
      correlations: [],
      boxPlots: {},
    };
  }

  // Extract column names while maintaining order
  const columnSet = new Set<string>();
  for (const row of rows) {
    Object.keys(row).forEach((k) => columnSet.add(k));
  }
  const columnNames = Array.from(columnSet);

  const columns = computeColumnMetadata(rows, columnNames);

  const numericStats: Record<string, NumericStats> = {};
  const categoricalStats: Record<string, CategoricalStats> = {};
  const boxPlots: Record<string, BoxPlotItem> = {};

  for (const col of columns) {
    if (col.type === 'numeric_continuous' || col.type === 'numeric_discrete') {
      const numStat = computeNumericStats(rows, col.name);
      if (numStat) {
        numericStats[col.name] = numStat;
        const bp = computeBoxPlot(rows, col.name);
        if (bp) boxPlots[col.name] = bp;
      }
    } else {
      categoricalStats[col.name] = computeCategoricalStats(rows, col.name);
    }
  }

  // Correlations between numeric columns
  const numericColNames = Object.keys(numericStats);
  const correlations: CorrelationPair[] = [];

  for (let i = 0; i < numericColNames.length; i++) {
    for (let j = i + 1; j < numericColNames.length; j++) {
      const colA = numericColNames[i];
      const colB = numericColNames[j];

      const pairs: [number, number][] = [];
      for (const row of rows) {
        const valA = row[colA];
        const valB = row[colB];
        if (
          valA !== null &&
          valA !== undefined &&
          valA !== '' &&
          valB !== null &&
          valB !== undefined &&
          valB !== ''
        ) {
          const numA = Number(valA);
          const numB = Number(valB);
          if (!isNaN(numA) && !isNaN(numB)) {
            pairs.push([numA, numB]);
          }
        }
      }

      if (pairs.length > 2) {
        const x = pairs.map((p) => p[0]);
        const y = pairs.map((p) => p[1]);
        const pearson = computePearsonCorrelation(x, y);
        const spearman = computeSpearmanCorrelation(x, y);
        correlations.push({ colA, colB, pearson, spearman });
      }
    }
  }

  return {
    name,
    sheetNames,
    currentSheet,
    rawRows: rows,
    columns,
    stats: {
      numeric: numericStats,
      categorical: categoricalStats,
    },
    correlations,
    boxPlots,
  };
}

export async function parseFile(file: File): Promise<{
  dataset: DatasetState;
  workbook?: XLSX.WorkBook;
}> {
  const fileName = file.name;
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (ext === 'json') {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    return { dataset: calculateFullDatasetState(fileName, rows) };
  }

  // Use SheetJS (xlsx) for excel, csv, txt, tsv
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array', cellDates: true });
  const sheetNames = workbook.SheetNames;
  const firstSheetName = sheetNames[0] || 'Hoja1';
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
    defval: null,
  });

  const dataset = calculateFullDatasetState(fileName, rows, sheetNames, firstSheetName);
  return { dataset, workbook };
}

export function switchSheet(
  workbook: XLSX.WorkBook,
  fileName: string,
  sheetName: string
): DatasetState {
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
    defval: null,
  });
  return calculateFullDatasetState(fileName, rows, workbook.SheetNames, sheetName);
}
