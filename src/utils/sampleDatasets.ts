import { calculateFullDatasetState } from './fileParser';
import { DatasetState } from '../types/data';

export const SAMPLE_DATASETS: {
  id: string;
  title: string;
  description: string;
  category: string;
  generate: () => DatasetState;
}[] = [
  {
    id: 'retail_sales',
    title: 'E-commerce: Ventas, Descuentos y Margen de Beneficio',
    description: '120 transacciones con ventas, costes, descuentos, categorías de producto, edad del cliente y margen de beneficio.',
    category: 'Comercial & Finanzas',
    generate: () => {
      const categories = ['Tecnología', 'Mobiliario', 'Material Oficina', 'Ropa & Calzado'];
      const regions = ['Norte', 'Sur', 'Este', 'Oeste', 'Centro'];
      const rows: Record<string, any>[] = [];

      // Seed-like deterministic generation
      for (let i = 1; i <= 120; i++) {
        const cat = categories[i % categories.length];
        const reg = regions[(i * 3) % regions.length];
        const edad = 20 + ((i * 7) % 50);
        const descuento = (i % 6) * 0.05; // 0% to 25%
        const precioUnitario = 30 + ((i * 23) % 450);
        const cantidad = 1 + ((i * 3) % 8);
        const venta = Number((precioUnitario * cantidad * (1 - descuento)).toFixed(2));
        const costo = Number((venta * (0.45 + ((i % 5) * 0.05))).toFixed(2));
        const ganancia = Number((venta - costo).toFixed(2));
        const margen = Number(((ganancia / venta) * 100).toFixed(1));
        const satisfaccion = 1 + ((i * 4) % 5); // 1-5 rating
        const devuelto = i % 14 === 0 ? 'Sí' : 'No';

        // Intentionally inject a few realistic missing values (e.g. in satisfaccion or margen)
        const rowSatisfaccion = i % 18 === 0 ? null : satisfaccion;
        const rowEdad = i % 25 === 0 ? null : edad;

        // An outlier in transaction 42 and 89
        const finalVenta = i === 42 ? 3850 : i === 89 ? 4200 : venta;
        const finalGanancia = i === 42 ? 1650 : i === 89 ? 1900 : ganancia;

        rows.push({
          ID_Transaccion: `TX-${1000 + i}`,
          Fecha: `2025-0${1 + (i % 9)}-${String(1 + (i % 28)).padStart(2, '0')}`,
          Categoria: cat,
          Region: reg,
          Edad_Cliente: rowEdad,
          Ventas_USD: finalVenta,
          Ganancia_USD: finalGanancia,
          Descuento_Pct: Number((descuento * 100).toFixed(0)),
          Margen_Pct: margen,
          Satisfaccion_Cliente: rowSatisfaccion,
          Devuelto: devuelto,
        });
      }

      return calculateFullDatasetState('Ventas_Ecommerce_2025.xlsx', rows, ['Transacciones']);
    },
  },
  {
    id: 'healthcare_cardio',
    title: 'Salud: Estudio Clínico de Factores Cardiovasculares',
    description: '100 pacientes evaluados en presión arterial, colesterol, glucosa, frecuencia cardíaca e índice de masa corporal (IMC).',
    category: 'Salud & Medicina',
    generate: () => {
      const rows: Record<string, any>[] = [];
      const generos = ['Masculino', 'Femenino'];
      const fumador = ['Sí', 'No'];

      for (let i = 1; i <= 100; i++) {
        const edad = 35 + ((i * 5) % 45);
        const gen = generos[i % 2];
        const fuma = fumador[(i * 3) % 2];
        const imc = Number((21 + ((i * 13) % 18) + (fuma === 'Sí' ? 1.5 : 0)).toFixed(1));
        const presionSistolica = 105 + ((i * 7) % 55) + (edad > 60 ? 15 : 0);
        const colesterol = 160 + ((i * 11) % 120);
        const glucosa = 75 + ((i * 9) % 65);
        const frecuencia = 58 + ((i * 4) % 38);
        const riesgo =
          presionSistolica > 140 || colesterol > 240 || glucosa > 125 ? 'Alto' : edad > 55 ? 'Moderado' : 'Bajo';

        // Missing values in 5 rows
        const colestVal = i % 15 === 0 ? null : colesterol;
        const glucVal = i % 20 === 0 ? null : glucosa;

        // Outlier in cholesterol
        const finalCol = i === 31 ? 385 : colestVal;
        const finalPresion = i === 77 ? 210 : presionSistolica;

        rows.push({
          ID_Paciente: `PAC-${200 + i}`,
          Edad: edad,
          Genero: gen,
          Fumador: fuma,
          IMC: imc,
          Presion_Sistolica: finalPresion,
          Colesterol_Total: finalCol,
          Glucosa_Basal: glucVal,
          Frecuencia_Cardiaca: frecuencia,
          Riesgo_Cardiovascular: riesgo,
        });
      }

      return calculateFullDatasetState('Estudio_Cardiovascular_Clinico.csv', rows);
    },
  },
  {
    id: 'real_estate',
    title: 'Inmobiliario: Precios y Tasación de Viviendas',
    description: '90 propiedades con superficie construida, dormitorios, baños, antigüedad, distancia al centro y precio de tasación.',
    category: 'Bienes Raíces',
    generate: () => {
      const rows: Record<string, any>[] = [];
      const tipos = ['Apartamento', 'Casa Unifamiliar', 'Ático', 'Dúplex'];
      const zonas = ['Centro Histórico', 'Zona Financiera', 'Residencial Norte', 'Periferia Sur'];

      for (let i = 1; i <= 90; i++) {
        const tipo = tipos[i % tipos.length];
        const zona = zonas[(i * 2) % zonas.length];
        const superficieM2 = 50 + ((i * 17) % 180);
        const dormitorios = 1 + ((i * 3) % 4);
        const banos = 1 + ((i * 2) % 3);
        const antiguedadAnos = (i * 4) % 35;
        const distanciaCentroKm = Number((1.2 + ((i * 5) % 18)).toFixed(1));
        const ascensor = tipo === 'Ático' ? 'Sí' : i % 3 === 0 ? 'No' : 'Sí';

        // Price calculation correlated with m2 and distance
        const basePrice = superficieM2 * 2100 - distanciaCentroKm * 4500 - antiguedadAnos * 800;
        const precioMiles = Number((Math.max(80, basePrice / 1000) + ((i * 9) % 30)).toFixed(1));

        rows.push({
          ID_Inmueble: `VIV-${500 + i}`,
          Tipo: tipo,
          Zona: zona,
          Superficie_m2: superficieM2,
          Dormitorios: dormitorios,
          Banos: banos,
          Antiguedad_Anos: antiguedadAnos,
          Distancia_Centro_km: distanciaCentroKm,
          Tiene_Ascensor: ascensor,
          Precio_Tasacion_kUSD: i === 15 ? 850.0 : precioMiles, // Outlier luxury penthouse
        });
      }

      return calculateFullDatasetState('Tasacion_Inmobiliaria_2025.xlsx', rows, ['Propiedades']);
    },
  },
  {
    id: 'telecom_churn',
    title: 'Telecomunicaciones: Churn y Fidelización de Clientes',
    description: '110 clientes analizados por antigüedad del contrato, cargos mensuales, llamadas al servicio técnico y estado de deserción.',
    category: 'Retención de Clientes',
    generate: () => {
      const rows: Record<string, any>[] = [];
      const planes = ['Básico 50MB', 'Estándar 300MB', 'Gamer 1GB', 'Empresarial Pro'];

      for (let i = 1; i <= 110; i++) {
        const plan = planes[i % planes.length];
        const mesesContrato = 1 + ((i * 7) % 65);
        const cargosMensuales = Number((25 + ((i * 13) % 85)).toFixed(2));
        const cargosTotales = Number((cargosMensuales * mesesContrato).toFixed(2));
        const llamadasSoporte = (i * 3) % 7;
        const churn = llamadasSoporte >= 4 || (cargosMensuales > 85 && mesesContrato < 6) ? 'Canceló (Churn)' : 'Activo';
        const satisfaccion = churn === 'Canceló (Churn)' ? 1 + (i % 2) : 3 + (i % 3);

        rows.push({
          Cliente_ID: `CLI-${7000 + i}`,
          Plan: plan,
          Antiguedad_Meses: mesesContrato,
          Cargos_Mensuales: cargosMensuales,
          Cargos_Totales: cargosTotales,
          Llamadas_Soporte: llamadasSoporte,
          Puntaje_Satisfaccion: satisfaccion,
          Estado_Cliente: churn,
        });
      }

      return calculateFullDatasetState('Telecom_Churn_Analisis.csv', rows);
    },
  },
];
