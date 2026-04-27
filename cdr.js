const CDR_DATA = {
  title: "CDR — Clinical Dementia Rating",
  description: "Escala de Evaluación de Demencia Clínica. Seleccione el descriptor que mejor describe al paciente en cada categoría.",
  categories: [
    {
      id: "memory",
      name: "Memoria",
      options: [
        { score: 0,   label: "Sin pérdida de memoria o olvidos leves e inconsistentes." },
        { score: 0.5, label: "Olvidos leves consistentes; recuerdo parcial de eventos; 'olvidos benignos'." },
        { score: 1,   label: "Pérdida de memoria moderada; más marcada para eventos recientes; interfiere con actividades cotidianas." },
        { score: 2,   label: "Pérdida de memoria severa; solo se retiene material muy aprendido; olvida rápidamente material nuevo." },
        { score: 3,   label: "Pérdida de memoria severa; solo fragmentos persisten." }
      ]
    },
    {
      id: "orientation",
      name: "Orientación",
      options: [
        { score: 0,   label: "Completamente orientado." },
        { score: 0.5, label: "Completamente orientado excepto por ligeras dificultades con las relaciones temporales." },
        { score: 1,   label: "Dificultad moderada con las relaciones temporales; orientado para el lugar en el examen; puede haber desorientación geográfica en otros momentos." },
        { score: 2,   label: "Dificultad severa con las relaciones temporales; usualmente desorientado en el tiempo, frecuentemente en el lugar." },
        { score: 3,   label: "Solo orientado a la persona." }
      ]
    },
    {
      id: "judgment",
      name: "Juicio y Resolución de Problemas",
      options: [
        { score: 0,   label: "Resuelve bien los problemas cotidianos; juicio bueno en relación con el desempeño pasado." },
        { score: 0.5, label: "Ligera dificultad para resolver problemas, similitudes y diferencias." },
        { score: 1,   label: "Dificultad moderada para manejar problemas complejos; juicio social generalmente mantenido." },
        { score: 2,   label: "Dificultad severa para manejar problemas, similitudes y diferencias; juicio social generalmente deteriorado." },
        { score: 3,   label: "Incapaz de hacer juicios o resolver problemas." }
      ]
    },
    {
      id: "community",
      name: "Asuntos Comunitarios",
      options: [
        { score: 0,   label: "Función independiente al nivel habitual en trabajo, compras, negocios, asuntos financieros, grupos sociales." },
        { score: 0.5, label: "Ligero deterioro en estas actividades." },
        { score: 1,   label: "Incapaz de funcionar independientemente en estas actividades aunque aún puede participar en algunas; parece normal en examen superficial." },
        { score: 2,   label: "Sin pretensión de función independiente fuera del hogar; parece suficientemente bien para ser llevado a actividades fuera del hogar." },
        { score: 3,   label: "Sin pretensión de función independiente fuera del hogar; parece demasiado enfermo para ser llevado a actividades fuera del hogar." }
      ]
    },
    {
      id: "home",
      name: "Hogar y Aficiones",
      options: [
        { score: 0,   label: "Vida en el hogar, aficiones e intereses intelectuales bien mantenidos." },
        { score: 0.5, label: "Vida en el hogar, aficiones e intereses intelectuales ligeramente deteriorados." },
        { score: 1,   label: "Deterioro leve pero definido en el hogar; abandona las tareas más difíciles; abandona aficiones más complejas." },
        { score: 2,   label: "Solo tareas simples preservadas; intereses muy restringidos, mal mantenidos." },
        { score: 3,   label: "Sin función significativa en el hogar." }
      ]
    },
    {
      id: "care",
      name: "Cuidado Personal",
      options: [
        { score: 0,   label: "Completamente capaz de cuidarse a sí mismo." },
        { score: 0.5, label: "Completamente capaz de cuidarse a sí mismo." },
        { score: 1,   label: "Necesita ocasionalmente que se le recuerde." },
        { score: 2,   label: "Requiere asistencia para vestirse, higiene, mantenimiento de efectos personales." },
        { score: 3,   label: "Requiere mucha ayuda con el cuidado personal; frecuentemente incontinente." }
      ]
    }
  ]
};

// ── CDR Global Score — Método estándar Hughes (1982) ──
// Memoria es la categoría primaria (M).
// Las otras 5 son secundarias (S).
function calcCDRGlobal(scores) {
  const M = scores.memory;
  if (M === undefined || M === null) return null;

  const secKeys = ["orientation", "judgment", "community", "home", "care"];
  const S = secKeys.map(k => scores[k]);
  if (S.some(v => v === undefined || v === null)) return null;

  const matchM  = S.filter(v => v === M).length;
  const gtM     = S.filter(v => v > M);
  const ltM     = S.filter(v => v < M);

  // Regla 1: si ≥3 secundarias = M → CDR = M
  if (matchM >= 3) return M;

  // Regla 2: si mayoría de secundarias > M → CDR = valor más frecuente entre las mayores
  //          si mayoría de secundarias < M → CDR = valor más frecuente entre las menores
  // "Mayoría" = más de la mitad de las 5 secundarias (≥3)
  if (gtM.length >= 3) {
    return mode(gtM);
  }
  if (ltM.length >= 3) {
    // Excepción: si M=0 el CDR no puede ser 0.5 por las secundarias menores (no existen menores a 0)
    return mode(ltM);
  }

  // Regla 3: empate (ninguna mayoría) → CDR = M
  // Excepción especial: si M=0.5 el CDR global no puede ser 0
  if (M === 0.5) return 0.5;

  return M;
}

// Devuelve la moda de un array; en caso de empate, el valor más cercano a M
function mode(arr) {
  const freq = {};
  arr.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
  let maxFreq = 0;
  let result = arr[0];
  for (const [val, count] of Object.entries(freq)) {
    if (count > maxFreq) { maxFreq = count; result = parseFloat(val); }
  }
  return result;
}

// Sum of Boxes
function calcSOB(scores) {
  const keys = ["memory","orientation","judgment","community","home","care"];
  let sum = 0;
  let complete = true;
  for (const k of keys) {
    if (scores[k] === undefined || scores[k] === null) { complete = false; break; }
    sum += scores[k];
  }
  return complete ? sum : null;
}

function interpretCDR(global) {
  if (global === null) return { text: "—", cls: "" };
  if (global === 0)   return { text: "Normal", cls: "interp-0" };
  if (global === 0.5) return { text: "Deterioro cognitivo cuestionable", cls: "interp-05" };
  if (global === 1)   return { text: "Demencia leve", cls: "interp-1" };
  if (global === 2)   return { text: "Demencia moderada", cls: "interp-2" };
  if (global === 3)   return { text: "Demencia severa", cls: "interp-3" };
  return { text: "—", cls: "" };
}

function interpretSOB(sob) {
  if (sob === null) return "";
  if (sob === 0) return "Normal";
  if (sob <= 2.5) return "Muy leve";
  if (sob <= 4.0) return "Leve";
  if (sob <= 9.0) return "Moderado";
  if (sob <= 16.0) return "Moderado-severo";
  return "Severo";
}
