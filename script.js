// Webhook SheetDB
const WEBHOOK_URL = 'https://sheetdb.io/api/v1/upttn1y5ud4r7';

let sizes = ['PP', 'P', 'M', 'G', 'GG'];
let selectedBaseSize = 'M';

// Referências DOM
const leadForm = document.getElementById('leadForm');
const leadSection = document.getElementById('leadSection');
const appSection = document.getElementById('appSection');
const sizeBadgesContainer = document.getElementById('sizeBadgesContainer');
const newSizeInput = document.getElementById('newSizeInput');
const addSizeBtn = document.getElementById('addSizeBtn');
const baseSizeSelect = document.getElementById('baseSizeSelect');
const measuresContainer = document.getElementById('measuresContainer');
const addMeasureBtn = document.getElementById('addMeasureBtn');
const calculateBtn = document.getElementById('calculateBtn');
const resultSection = document.getElementById('resultSection');
const newTableBtn = document.getElementById('newTableBtn');

document.addEventListener('DOMContentLoaded', () => {
  renderSizeBadges();
  loadDefaultMeasures();
});

function loadDefaultMeasures() {
  measuresContainer.innerHTML = '';
  addMeasureRow('Busto / Tórax', 84, 4);
  addMeasureRow('Cintura', 66, 4);
  addMeasureRow('Quadril', 92, 4);
  addMeasureRow('Comprimento Total', 58, 1);
}

// 1. Envio do Lead
leadForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nomeInput = document.getElementById('leadName').value.trim();
  const whatsappInput = document.getElementById('leadPhone').value.trim();
  const emailInput = document.getElementById('leadEmail').value.trim();

  const agora = new Date();
  const dataFormatada = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  leadSection.classList.add('hidden');
  appSection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (WEBHOOK_URL) {
    try {
      const searchUrl = `${WEBHOOK_URL}/search?whatsapp=${encodeURIComponent(whatsappInput)}`;
      const checkResponse = await fetch(searchUrl);
      const existingLeads = await checkResponse.json();

      if (Array.isArray(existingLeads) && existingLeads.length > 0) {
        console.log('Cliente já cadastrado. Envio duplicado ignorado.');
        return;
      }

      const leadPayload = {
        data: {
          nome: nomeInput,
          whatsapp: whatsappInput,
          email: emailInput,
          data: "'" + dataFormatada
        }
      };

      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(leadPayload)
      });

    } catch (err) {
      console.error('Erro no envio do lead:', err);
    }
  }
});

// 2. Tamanhos Dinâmicos
function renderSizeBadges() {
  sizeBadgesContainer.innerHTML = '';
  
  sizes.forEach((size, index) => {
    const badge = document.createElement('div');
    badge.className = 'flex items-center neo-badge border border-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg gap-2';
    badge.innerHTML = `
      <span>${size}</span>
      <button type="button" onclick="removeSize(${index})" class="text-slate-400 hover:text-rose-600 transition">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;
    sizeBadgesContainer.appendChild(badge);
  });

  updateBaseSizeOptions();
  rebuildAllCustomStepInputs();
}

addSizeBtn.addEventListener('click', () => {
  const val = newSizeInput.value.trim().toUpperCase();
  if (val && !sizes.includes(val)) {
    sizes.push(val);
    newSizeInput.value = '';
    renderSizeBadges();
  }
});

newSizeInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addSizeBtn.click();
  }
});

function removeSize(index) {
  if (sizes.length <= 1) {
    alert('A tabela precisa de pelo menos um tamanho.');
    return;
  }
  sizes.splice(index, 1);
  renderSizeBadges();
}

function updateBaseSizeOptions() {
  baseSizeSelect.innerHTML = '';
  sizes.forEach(size => {
    const opt = document.createElement('option');
    opt.value = size;
    opt.textContent = size;
    if (size === selectedBaseSize) opt.selected = true;
    baseSizeSelect.appendChild(opt);
  });
  
  if (!sizes.includes(selectedBaseSize)) {
    selectedBaseSize = sizes[0];
    baseSizeSelect.value = selectedBaseSize;
  }
}

baseSizeSelect.addEventListener('change', (e) => {
  selectedBaseSize = e.target.value;
});

// 3. Linhas de Medidas com Alternância de Modo (Uniforme / Personalizado)
addMeasureBtn.addEventListener('click', () => addMeasureRow());

function addMeasureRow(name = '', val = '', step = '') {
  const row = document.createElement('div');
  row.className = 'measure-row grid grid-cols-1 md:grid-cols-12 gap-3 items-start neo-card-sm p-3.5 rounded-2xl border border-white/80';
  row.dataset.mode = 'uniform'; // 'uniform' ou 'custom'

  row.innerHTML = `
    <!-- Descrição -->
    <div class="md:col-span-4">
      <label class="block md:hidden text-[10px] font-bold text-slate-600 uppercase mb-1">Descrição da Medida</label>
      <input type="text" value="${name}" placeholder="Ex: Busto, Cintura" class="measure-name neo-input w-full px-3.5 py-2 text-sm text-brand-black placeholder-slate-400 focus:outline-none">
    </div>

    <!-- Valor Base -->
    <div class="md:col-span-2">
      <label class="block md:hidden text-[10px] font-bold text-slate-600 uppercase mb-1">Medida Base (cm)</label>
      <input type="number" step="0.1" value="${val}" placeholder="Ex: 84" class="measure-val neo-input w-full px-3.5 py-2 text-sm text-brand-black placeholder-slate-400 focus:outline-none">
    </div>

    <!-- Seção de Salto / Variação -->
    <div class="md:col-span-5 space-y-2">
      <div class="flex items-center justify-between">
        <label class="block text-[10px] font-bold text-slate-600 uppercase">Tipo de Salto</label>
        <button type="button" class="toggle-mode-btn text-[11px] font-bold text-brand-orange hover:underline focus:outline-none">
          <i class="fa-solid fa-sliders mr-1"></i> <span class="mode-label-text">Alternar p/ Por Tamanho</span>
        </button>
      </div>

      <!-- Container Uniforme -->
      <div class="uniform-step-container">
        <input type="number" step="0.1" value="${step}" placeholder="Aumento único p/ todos (cm)" class="measure-step neo-input w-full px-3.5 py-2 text-sm text-brand-black placeholder-slate-400 focus:outline-none">
      </div>

      <!-- Container Personalizado por Tamanho -->
      <div class="custom-step-container hidden grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
        <!-- Renderizado dinamicamente via JS -->
      </div>
    </div>

    <!-- Ação Excluir -->
    <div class="md:col-span-1 text-right md:text-center pt-2 md:pt-0">
      <button type="button" onclick="this.closest('.measure-row').remove()" title="Excluir medida" class="text-slate-400 hover:text-rose-600 transition p-2">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `;

  // Configura botão de alternar modo
  const toggleBtn = row.querySelector('.toggle-mode-btn');
  toggleBtn.addEventListener('click', () => {
    if (row.dataset.mode === 'uniform') {
      row.dataset.mode = 'custom';
      toggleBtn.querySelector('.mode-label-text').textContent = 'Alternar p/ Salto Único';
      row.querySelector('.uniform-step-container').classList.add('hidden');
      row.querySelector('.custom-step-container').classList.remove('hidden');
      buildCustomStepInputs(row);
    } else {
      row.dataset.mode = 'uniform';
      toggleBtn.querySelector('.mode-label-text').textContent = 'Alternar p/ Por Tamanho';
      row.querySelector('.uniform-step-container').classList.remove('hidden');
      row.querySelector('.custom-step-container').classList.add('hidden');
    }
  });

  measuresContainer.appendChild(row);
  buildCustomStepInputs(row, step);
}

// Constrói os campos de entrada de salto individual entre os tamanhos
function buildCustomStepInputs(row, defaultStep = '') {
  const customContainer = row.querySelector('.custom-step-container');
  const existingValues = {};

  // Preserva valores digitados previamente
  customContainer.querySelectorAll('.custom-step-input').forEach(inp => {
    existingValues[inp.dataset.interval] = inp.value;
  });

  customContainer.innerHTML = '';

  for (let i = 0; i < sizes.length - 1; i++) {
    const fromSize = sizes[i];
    const toSize = sizes[i + 1];
    const key = `${fromSize}_${toSize}`;
    const val = existingValues[key] !== undefined ? existingValues[key] : (defaultStep || '');

    const div = document.createElement('div');
    div.className = 'flex flex-col';
    div.innerHTML = `
      <span class="text-[9px] font-bold text-slate-500 uppercase tracking-tight">${fromSize} ➔ ${toSize}</span>
      <input type="number" step="0.1" value="${val}" data-interval="${key}" data-from="${fromSize}" data-to="${toSize}" placeholder="cm" class="custom-step-input neo-input px-2 py-1 text-xs text-brand-black placeholder-slate-400 focus:outline-none">
    `;
    customContainer.appendChild(div);
  }
}

function rebuildAllCustomStepInputs() {
  document.querySelectorAll('.measure-row').forEach(row => {
    buildCustomStepInputs(row);
  });
}

// 4. Gerar Tabela (Calcula salto uniforme ou variação individual por tamanho)
calculateBtn.addEventListener('click', () => {
  const modelRefText = document.getElementById('modelRef').value.trim();
  if (!modelRefText) {
    alert('Por favor, informe a Referência/Modelo da peça.');
    document.getElementById('modelRef').focus();
    return;
  }

  const baseIndex = sizes.indexOf(selectedBaseSize);
  if (baseIndex === -1) {
    alert('Selecione um tamanho base válido.');
    return;
  }

  const rows = document.querySelectorAll('.measure-row');
  const measures = [];

  rows.forEach(row => {
    const name = row.querySelector('.measure-name').value.trim();
    const value = parseFloat(row.querySelector('.measure-val').value);
    const mode = row.dataset.mode;

    if (!name || isNaN(value)) return;

    if (mode === 'uniform') {
      const step = parseFloat(row.querySelector('.measure-step').value);
      if (!isNaN(step)) {
        measures.push({ name, value, mode: 'uniform', step });
      }
    } else {
      // Coleta os saltos individuais de cada intervalo entre tamanhos
      const steps = {};
      let valid = true;
      row.querySelectorAll('.custom-step-input').forEach(inp => {
        const intervalKey = inp.dataset.interval;
        const stepVal = parseFloat(inp.value);
        if (isNaN(stepVal)) valid = false;
        steps[intervalKey] = stepVal;
      });

      if (valid) {
        measures.push({ name, value, mode: 'custom', steps });
      }
    }
  });

  if (measures.length === 0) {
    alert('Preencha os valores de medida e variação corretamente.');
    return;
  }

  document.getElementById('pdfModelRef').textContent = modelRefText;
  document.getElementById('pdfDate').textContent = new Date().toLocaleDateString('pt-BR');

  // Cabeçalho da Tabela
  const header = document.getElementById('tableHeader');
  header.innerHTML = `<th class="p-4 border-b-2 border-slate-800 text-slate-800 font-bold">Medida (cm)</th>` +
    sizes.map(s => `
      <th class="p-4 border-b-2 border-slate-800 text-center ${s === selectedBaseSize ? 'text-brand-orange font-extrabold bg-orange-100/50' : 'text-slate-800 font-bold'}">
        ${s} ${s === selectedBaseSize ? '<span class="text-[10px] block font-semibold text-brand-orange">(BASE)</span>' : ''}
      </th>
    `).join('');

  // Corpo da Tabela
  const body = document.getElementById('tableBody');
  body.innerHTML = '';

  measures.forEach(m => {
    let tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-100/50 transition';
    let html = `<td class="p-4 font-bold text-slate-900 border-b border-slate-200/80">${m.name}</td>`;

    // Calcula os valores de cada tamanho com base na regra selecionada
    sizes.forEach((size, idx) => {
      let calcValue = m.value;

      if (m.mode === 'uniform') {
        const multiplier = idx - baseIndex;
        calcValue = m.value + (multiplier * m.step);
      } else {
        // Cálculo acumulativo para o modo personalizado por tamanho
        if (idx > baseIndex) {
          for (let i = baseIndex; i < idx; i++) {
            const key = `${sizes[i]}_${sizes[i + 1]}`;
            calcValue += (m.steps[key] || 0);
          }
        } else if (idx < baseIndex) {
          for (let i = baseIndex; i > idx; i--) {
            const key = `${sizes[i - 1]}_${sizes[i]}`;
            calcValue -= (m.steps[key] || 0);
          }
        }
      }

      const isBase = size === selectedBaseSize;
      html += `
        <td class="p-4 text-center border-b border-slate-200/80 ${isBase ? 'bg-orange-50 font-extrabold text-brand-orange' : 'font-medium text-slate-700'}">
          ${calcValue.toFixed(1)}
        </td>
      `;
    });

    tr.innerHTML = html;
    body.appendChild(tr);
  });

  resultSection.classList.remove('hidden');
  resultSection.scrollIntoView({ behavior: 'smooth' });
});

// 5. Botão "Nova Tabela"
newTableBtn.addEventListener('click', () => {
  document.getElementById('modelRef').value = '';
  loadDefaultMeasures();
  resultSection.classList.add('hidden');
  appSection.scrollIntoView({ behavior: 'smooth' });
});

// 6. Impressão e PDF
document.getElementById('printBtn').addEventListener('click', () => {
  window.print();
});

document.getElementById('pdfBtn').addEventListener('click', () => {
  const element = document.getElementById('pdfExportContainer');
  const modelName = document.getElementById('modelRef').value || 'Tabela_Medidas';
  
  const opt = {
    margin:       [10, 10, 10, 10],
    filename:     `Tabela_${modelName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
  };

  html2pdf().set(opt).from(element).save();
});