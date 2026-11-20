import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  Check,
  Eye,
  Filter,
} from 'lucide-react';
import { DatasetState, VariableType } from '../types/data';
import { isNullOrEmpty } from '../utils/statistics';

interface DataPreviewTableProps {
  dataset: DatasetState;
}

export const DataPreviewTable: React.FC<DataPreviewTableProps> = ({ dataset }) => {
  const [viewMode, setViewMode] = useState<'first_5' | 'first_10' | 'first_25' | 'last_10'>('first_10');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const rows = dataset.rawRows;
  const columns = dataset.columns;

  const handleSort = (colName: string) => {
    if (sortColumn === colName) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(colName);
      setSortDirection('asc');
    }
  };

  const processedRows = useMemo(() => {
    let result = [...rows];

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) =>
          val !== null && val !== undefined && String(val).toLowerCase().includes(q)
        )
      );
    }

    // Sort
    if (sortColumn) {
      result.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];

        if (isNullOrEmpty(valA)) return 1;
        if (isNullOrEmpty(valB)) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortDirection === 'asc'
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      });
    }

    // Limit slice based on viewMode
    if (viewMode === 'first_5') {
      return result.slice(0, 5);
    } else if (viewMode === 'first_10') {
      return result.slice(0, 10);
    } else if (viewMode === 'first_25') {
      return result.slice(0, 25);
    } else if (viewMode === 'last_10') {
      return result.slice(-10);
    }

    return result.slice(0, 10);
  }, [rows, searchQuery, sortColumn, sortDirection, viewMode]);

  const getTypeIcon = (type: VariableType) => {
    switch (type) {
      case 'numeric_continuous':
      case 'numeric_discrete':
        return <Hash className="w-3 h-3 text-blue-600" />;
      case 'date':
        return <Calendar className="w-3 h-3 text-emerald-600" />;
      case 'boolean':
        return <ToggleLeft className="w-3 h-3 text-purple-600" />;
      default:
        return <Type className="w-3 h-3 text-amber-600" />;
    }
  };

  const getTypeLabel = (type: VariableType) => {
    switch (type) {
      case 'numeric_continuous':
        return 'Num. Contínua';
      case 'numeric_discrete':
        return 'Num. Discreta';
      case 'date':
        return 'Fecha / Temporal';
      case 'boolean':
        return 'Booleana';
      case 'categorical_ordinal':
        return 'Cat. Ordinal';
      case 'identifier_text':
        return 'ID / Texto';
      default:
        return 'Cat. Nominal';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <Eye className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Validación de Estructura de Datos
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspecciona las primeras filas para verificar encabezados, delimitación y tipos de columnas.
          </p>
        </div>

        {/* View mode toggle (5, 10, 25, ultimas 10) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
            <span className="px-2 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
              Mostrar:
            </span>
            <button
              onClick={() => setViewMode('first_5')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'first_5'
                  ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Primeras 5 filas
            </button>
            <button
              onClick={() => setViewMode('first_10')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'first_10'
                  ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Primeras 10 filas
            </button>
            <button
              onClick={() => setViewMode('first_25')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'first_25'
                  ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              25 filas
            </button>
            <button
              onClick={() => setViewMode('last_10')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'last_10'
                  ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Últimas 10 filas
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar en filas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44"
            />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3 font-semibold text-slate-400 w-12 text-center border-r border-slate-200 bg-slate-50">
                  #
                </th>
                {columns.map((col) => (
                  <th
                    key={col.name}
                    onClick={() => handleSort(col.name)}
                    className="py-2.5 px-3 font-semibold text-slate-700 hover:bg-slate-100/80 transition-colors cursor-pointer select-none border-r border-slate-200/60 last:border-r-0 whitespace-nowrap"
                  >
                    <div className="flex items-center justify-between space-x-2">
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-bold">{col.name}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-normal text-slate-500">
                          {getTypeIcon(col.type)}
                          {getTypeLabel(col.type)}
                        </span>
                      </div>
                      <div className="text-slate-400 shrink-0">
                        {sortColumn === col.name ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                        )}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {processedRows.map((row, rowIdx) => {
                const actualIndex =
                  viewMode === 'last_10'
                    ? rows.length - processedRows.length + rowIdx + 1
                    : rowIdx + 1;

                return (
                  <tr
                    key={rowIdx}
                    className="hover:bg-indigo-50/30 transition-colors odd:bg-white even:bg-slate-50/40"
                  >
                    <td className="py-2 px-3 text-center text-slate-400 border-r border-slate-200 bg-slate-50/60 font-sans">
                      {actualIndex}
                    </td>
                    {columns.map((col) => {
                      const val = row[col.name];
                      const isMissing = isNullOrEmpty(val);

                      return (
                        <td
                          key={col.name}
                          className="py-2 px-3 text-slate-700 border-r border-slate-100 last:border-r-0 whitespace-nowrap"
                        >
                          {isMissing ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 tracking-wider">
                              NULL
                            </span>
                          ) : typeof val === 'number' ? (
                            <span className="text-blue-700">{val.toLocaleString()}</span>
                          ) : typeof val === 'boolean' ? (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                val
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {String(val)}
                            </span>
                          ) : (
                            <span className="text-slate-800">{String(val)}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-1">
        <span>
          Mostrando{' '}
          <strong className="text-slate-800 font-mono">{processedRows.length}</strong> de{' '}
          <strong className="text-slate-800 font-mono">{rows.length.toLocaleString()}</strong> filas
          {searchQuery && ' (filtradas por búsqueda)'}
        </span>
        <span className="text-[11px] text-slate-400">
          💡 Haz clic en los encabezados de columna para ordenar ascendentemente o descendentemente.
        </span>
      </div>
    </div>
  );
};
