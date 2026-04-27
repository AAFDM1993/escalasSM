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
    <button class="btn btn-secondary" id="btn-reset">↺ Limpiar</button>
  `;

  bar.querySelector('#btn-print').addEventListener('click', () => window.print());
  bar.querySelector('#btn-reset').addEventListener('click', () => {
    if (confirm('¿Limpiar todos los datos?')) {
      state.scores = {};
      renderCDR();
    }
  });

  return bar;
}

// ── Init ──
renderCDR();
