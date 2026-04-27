// ── State ──
const state = {
  currentScale: 'cdr',
  scores: {}
};

// ── Render ──
function renderCDR() {
  const container = document.getElementById('scale-container');
  container.innerHTML = '';

  // Patient info
  container.appendChild(buildPatientCard());

  // Scale title
  const titleCard = document.createElement('div');
  titleCard.className = 'scale-title-card';
  titleCard.innerHTML = `<h2>${CDR_DATA.title}</h2><p>${CDR_DATA.description}</p>`;
  container.appendChild(titleCard);

  // Categories
  CDR_DATA.categories.forEach(cat => {
    container.appendChild(buildCategoryCard(cat));
  });

  // Results
  container.appendChild(buildResultsCard());

  // Actions
  container.appendChild(buildActionsBar());
}

function calcAge(dob) {
  if (!dob) return '';
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : '';
}

function buildPatientCard() {
  const card = document.createElement('div');
  card.className = 'patient-card';
  card.innerHTML = `
    <h2>Datos del Paciente</h2>
    <div class="patient-grid">
      <div class="field">
        <label>Nombre completo</label>
        <input type="text" id="pt-name" placeholder="Apellidos, Nombre" />
      </div>
      <div class="field">
        <label>Fecha de nacimiento</label>
        <input type="date" id="pt-dob" />
      </div>
      <div class="field">
        <label>Edad</label>
        <input type="number" id="pt-age" placeholder="años" min="0" max="120" readonly
               style="background:#edf2f7; cursor:default;" />
      </div>
      <div class="field">
        <label>Historia clínica</label>
        <input type="text" id="pt-id" placeholder="N° historia" />
      </div>
      <div class="field">
        <label>Evaluador</label>
        <input type="text" id="pt-eval" placeholder="Dr./Dra." />
      </div>
      <div class="field">
        <label>Fecha de evaluación</label>
        <input type="date" id="pt-date" value="${new Date().toISOString().split('T')[0]}" />
      </div>
    </div>
  `;

  // Auto-calculate age when DOB changes
  card.querySelector('#pt-dob').addEventListener('change', function () {
    document.getElementById('pt-age').value = calcAge(this.value);
  });

  return card;
}

function buildCategoryCard(cat) {
  const card = document.createElement('div');
  card.className = 'category-card';
  card.id = `cat-${cat.id}`;

  const currentScore = state.scores[cat.id];
  const scoreLabel = currentScore !== undefined ? currentScore : '—';

  card.innerHTML = `
    <div class="category-header">
      <h3>${cat.name}</h3>
      <span class="category-score-badge" id="badge-${cat.id}">${scoreLabel}</span>
    </div>
    <div class="options-list" id="options-${cat.id}">
      ${cat.options.map(opt => `
        <label class="option-item ${currentScore === opt.score ? 'selected' : ''}"
               data-cat="${cat.id}" data-score="${opt.score}">
          <input type="radio" name="${cat.id}" value="${opt.score}"
                 ${currentScore === opt.score ? 'checked' : ''} />
          <span class="option-dot"></span>
          <span class="option-score">${opt.score}</span>
          <span class="option-text">${opt.label}</span>
        </label>
      `).join('')}
    </div>
  `;

  // Events
  card.querySelectorAll('.option-item').forEach(item => {
    item.addEventListener('click', () => {
      const catId = item.dataset.cat;
      const score = parseFloat(item.dataset.score);
      state.scores[catId] = score;

      // Update UI for this category
      card.querySelectorAll('.option-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      document.getElementById(`badge-${catId}`).textContent = score;

      // Update results
      updateResults();
    });
  });

  return card;
}

function buildResultsCard() {
  const card = document.createElement('div');
  card.className = 'results-card';
  card.id = 'results-card';
  card.innerHTML = `<h3>Resultados</h3><div id="results-content"></div>`;
  updateResultsContent(card.querySelector('#results-content'));
  return card;
}

function updateResults() {
  const content = document.querySelector('#results-card #results-content');
  if (content) updateResultsContent(content);
}

function updateResultsContent(el) {
  const keys = ["memory","orientation","judgment","community","home","care"];
  const labels = {
    memory: "Memoria", orientation: "Orientación", judgment: "Juicio",
    community: "Comunidad", home: "Hogar", care: "Cuidado"
  };

  const global = calcCDRGlobal(state.scores);
  const sob = calcSOB(state.scores);
  const interp = interpretCDR(global);
  const sobInterp = interpretSOB(sob);

  el.innerHTML = `
    <div class="scores-grid">
      ${keys.map(k => `
        <div class="score-box">
          <div class="label">${labels[k]}</div>
          <div class="value">${state.scores[k] !== undefined ? state.scores[k] : '—'}</div>
        </div>
      `).join('')}
    </div>
    <div class="global-score-row">
      <div class="big-score ${interp.cls}">${global !== null ? global : '—'}</div>
      <div class="score-info">
        <div class="title">CDR Global</div>
        <div class="interpretation ${interp.cls}">${interp.text}</div>
      </div>
    </div>
    <div class="sob-row">
      <strong>Suma de Cajas (SOB):</strong> ${sob !== null ? sob.toFixed(1) : '—'}
      ${sob !== null ? `— <em>${sobInterp}</em>` : ''}
    </div>
  `;
}

function buildActionsBar() {
  const bar = document.createElement('div');
  bar.className = 'actions-bar';
  bar.innerHTML = `
    <button class="btn btn-primary" id="btn-print">🖨️ Imprimir / Guardar PDF</button>
    <button class="btn btn-guide" id="btn-guide">📋 ¿Cómo evaluar?</button>
    <button class="btn btn-secondary" id="btn-reset">↺ Limpiar</button>
  `;

  bar.querySelector('#btn-print').addEventListener('click', () => window.print());
  bar.querySelector('#btn-guide').addEventListener('click', () => openGuide());
  bar.querySelector('#btn-reset').addEventListener('click', () => {
    if (confirm('¿Limpiar todos los datos?')) {
      state.scores = {};
      renderCDR();
    }
  });

  return bar;
}

// ── Guide Modal ──
function openGuide() {
  if (document.getElementById('guide-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'guide-overlay';
  overlay.innerHTML = `
    <div class="guide-panel">
      <div class="guide-header">
        <h2>Guía de Evaluación — CDR</h2>
        <button class="guide-close" id="guide-close">✕</button>
      </div>
      <div class="guide-body">

        <div class="guide-section">
          <h3>¿Qué es la CDR?</h3>
          <p>La <strong>Clinical Dementia Rating (CDR)</strong> es una escala clínica semiestructurada diseñada para estadificar la gravedad de la demencia. Fue desarrollada por Hughes et al. (1982) en la Universidad de Washington. Evalúa el funcionamiento cognitivo y funcional del paciente a través de una entrevista con el paciente y un informante confiable (familiar o cuidador).</p>
        </div>

        <div class="guide-section">
          <h3>Fuente de información</h3>
          <p>La evaluación se basa en <strong>dos entrevistas separadas</strong>:</p>
          <ul>
            <li><strong>Informante:</strong> familiar o cuidador que convive con el paciente. Es la fuente principal.</li>
            <li><strong>Paciente:</strong> entrevista directa para observar rendimiento cognitivo.</li>
          </ul>
          <p>No se basa en pruebas neuropsicológicas formales, sino en el juicio clínico del evaluador.</p>
        </div>

        <div class="guide-section">
          <h3>Las 6 categorías</h3>

          <div class="guide-cat">
            <span class="guide-cat-title">1. Memoria</span>
            <p>Es la <strong>categoría primaria</strong> y determina el CDR global. Evalúe la capacidad de aprender y recordar información nueva. Pregunte sobre olvidos cotidianos: citas, nombres, dónde dejó objetos, conversaciones recientes. Distinga entre olvidos benignos (0.5) y pérdida que interfiere con la vida diaria (≥1).</p>
          </div>

          <div class="guide-cat">
            <span class="guide-cat-title">2. Orientación</span>
            <p>Evalúe orientación en tiempo (día, mes, año, estación), lugar (ciudad, dirección) y persona. Pregunte al informante si el paciente se pierde en lugares conocidos o confunde fechas importantes.</p>
          </div>

          <div class="guide-cat">
            <span class="guide-cat-title">3. Juicio y Resolución de Problemas</span>
            <p>Evalúe la capacidad para manejar situaciones complejas: finanzas, emergencias, decisiones. Pregunte si puede manejar su cuenta bancaria, si toma decisiones razonables, si reconoce semejanzas y diferencias entre conceptos.</p>
          </div>

          <div class="guide-cat">
            <span class="guide-cat-title">4. Asuntos Comunitarios</span>
            <p>Evalúe la participación en actividades fuera del hogar: trabajo, compras, transporte, actividades sociales o religiosas. Compare con el nivel previo del paciente.</p>
          </div>

          <div class="guide-cat">
            <span class="guide-cat-title">5. Hogar y Aficiones</span>
            <p>Evalúe el funcionamiento dentro del hogar: tareas domésticas, pasatiempos, lectura, jardinería, cocina. Pregunte si ha abandonado actividades que antes realizaba con regularidad.</p>
          </div>

          <div class="guide-cat">
            <span class="guide-cat-title">6. Cuidado Personal</span>
            <p>Evalúe la autonomía en higiene, vestido, alimentación y continencia. A diferencia de las otras categorías, <strong>no existe puntuación 0.5</strong> — el paciente es independiente (0) o necesita ayuda en algún grado (1, 2 o 3).</p>
          </div>
        </div>

        <div class="guide-section">
          <h3>Puntuaciones</h3>
          <table class="guide-table">
            <thead><tr><th>Puntaje</th><th>Significado</th></tr></thead>
            <tbody>
              <tr><td>0</td><td>Normal — sin deterioro</td></tr>
              <tr><td>0.5</td><td>Deterioro cuestionable / muy leve</td></tr>
              <tr><td>1</td><td>Demencia leve</td></tr>
              <tr><td>2</td><td>Demencia moderada</td></tr>
              <tr><td>3</td><td>Demencia severa</td></tr>
            </tbody>
          </table>
        </div>

        <div class="guide-section">
          <h3>Cálculo del CDR Global</h3>
          <p>Se usa el <strong>método de Hughes</strong>: la Memoria es la categoría primaria (M) y las otras 5 son secundarias (S).</p>
          <ul>
            <li>Si <strong>3 o más S = M</strong> → CDR Global = M</li>
            <li>Si <strong>3 o más S &gt; M</strong> → CDR Global = valor más frecuente entre las mayores</li>
            <li>Si <strong>3 o más S &lt; M</strong> → CDR Global = valor más frecuente entre las menores</li>
            <li>En empate → CDR Global = M</li>
            <li>Si M = 0.5, el CDR Global no puede ser 0</li>
          </ul>
          <p>La <strong>Suma de Cajas (SOB)</strong> es la suma directa de las 6 categorías (0–18) y permite mayor sensibilidad para detectar cambios longitudinales.</p>
        </div>

        <div class="guide-section">
          <h3>Interpretación SOB</h3>
          <table class="guide-table">
            <thead><tr><th>SOB</th><th>Interpretación</th></tr></thead>
            <tbody>
              <tr><td>0</td><td>Normal</td></tr>
              <tr><td>0.5 – 2.5</td><td>Muy leve</td></tr>
              <tr><td>3 – 4</td><td>Leve</td></tr>
              <tr><td>4.5 – 9</td><td>Moderado</td></tr>
              <tr><td>9.5 – 16</td><td>Moderado-severo</td></tr>
              <tr><td>16.5 – 18</td><td>Severo</td></tr>
            </tbody>
          </table>
        </div>

        <div class="guide-section guide-ref">
          <h3>Referencia</h3>
          <p>Hughes CP, et al. <em>A new clinical scale for the staging of dementia.</em> Br J Psychiatry. 1982;140:566-572.</p>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#guide-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// ── Init ──
renderCDR();
