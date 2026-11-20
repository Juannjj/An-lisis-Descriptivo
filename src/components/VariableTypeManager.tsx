import React from 'react';
import {
  Tag,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  Sliders,
  CheckCircle2,
  FileQuestion,
  HelpCircle,
} from 'lucide-react';
import { DatasetState, VariableType } from '../types/data';

interface VariableTypeManagerProps {
  dataset: DatasetState;
  onUpdateColumnType: (columnName: string, newType: VariableType) => void;
}

const TYPE_OPTIONS: { value: VariableType; label: string; desc: string }[] = [
  {
    value: 'numeric_continuous',
    label: 'Numérica Continua',
    desc: 'Mediciones reales con decimales (ej. precio, ingresos, peso, temperatura)',
  },
  {
    value: 'numeric_discrete',
    label: 'Numérica Discreta',
    desc: 'Conteos enteros no negativos (ej. edad, número de hijos, visitas)',
  },
  {
    value: 'categorical_nominal',
    label: 'Categórica Nominal',
    desc: 'Etiquetas o nombres sin orden inherente (ej. país, género, marca)',
  },
  {
    value: 'categorical_ordinal',
    label: 'Categórica Ordinal',
    desc: 'Categorías con jerarquía de valor (ej. bajo/medio/alto, nivel educativo)',
  },
  {
    value: 'date',
    label: 'Fecha / Temporal',
    desc: 'Marcas temporales, fechas de calendario, timestamps',
  },
  {
    value: 'boolean',
    label: 'Booleana / Binaria',
    desc: 'Valores dicotómicos (Verdadero/Falso, Sí/No, 0/1)',
  },
  {
    value: 'identifier_text',
    label: 'Identificador / Texto Libre',
    desc: 'Claves primarias únicas, códigos ID, UUIDs, observaciones de texto',
  },
];

export const VariableTypeManager: React.FC<VariableTypeManagerProps> = ({
  dataset,
  onUpdateColumnType,
}) => {
  const columns = dataset.columns;

  const countByType = columns.reduce((acc, col) => {
    acc[col.type] = (acc[col.type] || 0) + 1;
    return acc;
  }, {} as Record<VariableType, number>);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Title & Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <Tag className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Clasificación y Tipos de Variables
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            El sistema ha inferido automáticamente la naturaleza estadística de cada columna. Puedes reclasificar cualquier variable si es necesario.
          </p>
        </div>

        {/* Aggregate badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold border border-blue-200/60">
            {countByType.numeric_continuous || 0} Num. Continuas
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 font-semibold border border-sky-200/60">
            {countByType.numeric_discrete || 0} Num. Discretas
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-semibold border border-amber-200/60">
            {countByType.categorical_nominal || 0} Cat. Nominales
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60">
            {countByType.date || 0} Fechas
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-semibold border border-purple-200/60">
            {countByType.boolean || 0} Booleanas
          </span>
        </div>
      </div>

      {/* Grid of Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {columns.map((col) => {
          const isNumeric = col.type.startsWith('numeric');
          const isOverridden = col.type !== col.inferredType;

          return (
            <div
              key={col.name}
              className={`p-3.5 rounded-xl border transition-all ${
                isOverridden
                  ? 'border-indigo-300 bg-indigo-50/20 shadow-2xs'
                  : 'border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 truncate max-w-[200px]" title={col.name}>
                    {col.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                    <span>{col.uniqueCount} valores únicos</span>
                    <span>•</span>
                    <span>{col.missingPercentage}% faltante</span>
                  </div>
                </div>

                {isOverridden && (
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                    Personalizado
                  </span>
                )}
              </div>

              {/* Type Select */}
              <div className="mt-2.5">
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Tipo Asignado:
                </label>
                <select
                  value={col.type}
                  onChange={(e) => onUpdateColumnType(col.name, e.target.value as VariableType)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors cursor-pointer"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Small hint on inferred vs current */}
              <p className="text-[10px] text-slate-400 mt-1.5 italic">
                Inferido inicialmente: {TYPE_OPTIONS.find((t) => t.value === col.inferredType)?.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
