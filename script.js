// Webhook SheetDB
const WEBHOOK_URL = 'https://sheetdb.io/api/v1/upttn1y5ud4r7';

let sizes = ['PP', 'P', 'M', 'G', 'GG'];
let selectedBaseSize = 'M';
let tableBlockCounter = 0;

// Referências DOM
const leadForm = document.getElementById('leadForm');
const leadSection = document.getElementById('leadSection');
const appSection = document.getElementById('appSection');
const sizeBadgesContainer = document.getElementById('sizeBadgesContainer');
const newSizeInput = document.getElementById('newSizeInput');
const addSizeBtn = document.getElementById('addSizeBtn');
const baseSizeSelect = document.getElementById('baseSizeSelect');
const addNewTableBlockBtn = document.getElementById('addNewTableBlockBtn');
const tableBlocksContainer = document.getElementById('tableBlocksContainer');
const calculateBtn = document.getElementById('calculateBtn');
const resultSection = document.getElementById('resultSection');
const resetFormBtn = document.getElementById('resetFormBtn');
const tablesOutputContainer = document.getElementById('tablesOutputContainer');

// Referências Modal de Guia
const guideModal = document.getElementById('guideModal');
const closeGuideBtn = document.getElementById('closeGuideBtn');
const closeGuideModalIcon = document.getElementById('closeGuideModalIcon');
const openGuideBtn = document.getElementById('openGuideBtn');

document.addEventListener('DOMContentLoaded', () => {
  renderSizeBadges();
  initDefaultTableBlocks();
  setupGuideModalEvents();
});

function setupGuideModalEvents() {
  const closeModal = () => guideModal.classList.add('hidden');
  const openModal = () => guideModal.classList.remove('hidden');

  closeGuideBtn.addEventListener('click', closeModal);
  closeGuideModalIcon.addEventListener('click', closeModal);
  openGuideBtn.addEventListener('click', openModal);

  guideModal.addEventListener('click', (e) => {
    if (e.target === guideModal) closeModal();
  });
}

function initDefaultTableBlocks() {
  tableBlocksContainer.innerHTML = '';
  tableBlockCounter = 0;

  const block1 = addTableBlock('Parte Superior (Blusa)');
  addMeasureToBlock(block1, 'Busto / Tórax', 84, 4);
  addMeasureToBlock(block1, 'Comprimento Blusa', 58, 1);

  const block2 = addTableBlock('Parte Inferior (Calça)');
  addMeasureToBlock(block2, 'Cintura', 66, 4);
  addMeasureToBlock(block2, 'Quadril', 92, 4);
  addMeasureToBlock(block2, 'Comprimento Calça', 100, 1.5);
}

// 1. Envio do Lead & Abertura do Guia
leadForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nomeInput = document.getElementById('leadName').value.trim();
  const whatsappInput = document.getElementById('leadPhone').value.trim();
  const emailInput = document.getElementById('leadEmail').value.trim();

  const agora = new Date();
  const dataFormatada = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  leadSection.classList.add('hidden');
  appSection.classList.remove('hidden');
  guideModal.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (WEBHOOK_URL) {
    try {
      const searchUrl = `${WEBHOOK_URL}/search?whatsapp=${encodeURIComponent(whatsappInput)}`;
      const checkResponse = await fetch(searchUrl);
      const existingLeads = await checkResponse.json();

      if (Array.isArray(existingLeads) && existingLeads.length > 0) {
        console.log('Cliente já cadastrado. Envio ignorado.');
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

// 3. Estrutura Modular de Tabelas
addNewTableBlockBtn.addEventListener('click', () => {
  addTableBlock();
});

function addTableBlock(title = '') {
  tableBlockCounter++;
  const blockId = `table-block-${tableBlockCounter}`;
  
  const block = document.createElement('div');
  block.className = 'table-block neo-card p-5 md:p-8 rounded-2xl md:rounded-3xl space-y-4';
  block.id = blockId;

  const defaultTitle = title || `Tabela ${tableBlockCounter} (ex: Cropped, Saia)`;

  block.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-300/60 pb-4">
      <div class="flex items-center space-x-3 flex-grow">
        <span class="neo-orange-btn text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shrink-0">
          <i class="fa-solid fa-table"></i>
        </span>
        <input type="text" value="${defaultTitle}" placeholder="Nome do Bloco (ex: Blusa, Calça, Cropped)" class="table-title-input neo-input font-bold text-base md:text-lg text-brand-black px-3 py-1.5 w-full focus:outline-none">
      </div>
      <div class="flex items-center gap-2 justify-end shrink-0">
        <button type="button" class="add-measure-btn neo-btn-secondary text-brand-orange font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5">
          <i class="fa-solid fa-plus"></i> Nova Medida
        </button>
        <button type="button" class="remove-block-btn text-slate-400 hover:text-rose-600 transition p-2" title="Excluir esta Tabela">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>

    <div class="block-measures-container space-y-3"></div>
  `;

  block.querySelector('.add-measure-btn').addEventListener('click', () => {
    addMeasureToBlock(block);
  });

  block.querySelector('.remove-block-btn').addEventListener('click', () => {
    if (document.querySelectorAll('.table-block').length <= 1) {
      alert('Seu projeto precisa ter pelo menos uma tabela.');
      return;
    }
    block.remove();
  });

  tableBlocksContainer.appendChild(block);
  return block;
}

function addMeasureToBlock(blockElement, name = '', val = '', step = '') {
  const container = blockElement.querySelector('.block-measures-container');
  const row = document.createElement('div');
  row.className = 'measure-row grid grid-cols-1 md:grid-cols-12 gap-3 items-start neo-card-sm p-3.5 rounded-2xl border border-white/80';
  row.dataset.mode = 'uniform';

  row.innerHTML = `
    <div class="md:col-span-4">
      <label class="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nome da Medida</label>
      <input type="text" value="${name}" placeholder="Ex: Busto, Cintura, Comprimento" class="measure-name neo-input w-full px-3.5 py-2 text-sm text-brand-black placeholder-slate-400 focus:outline-none">
    </div>

    <div class="md:col-span-3">
      <label class="block text-[10px] font-bold text-slate-600 uppercase mb-1">Medida Base (cm)</label>
      <input type="number" step="0.1" value="${val}" placeholder="Ex: 84" class="measure-val neo-input w-full px-3.5 py-2 text-sm text-brand-black placeholder-slate-400 focus:outline-none">
    </div>

    <div class="md:col-span-4 space-y-1.5">
      <div class="flex items-center justify-between">
        <label class="block text-[10px] font-bold text-slate-600 uppercase">Salto de Gradação</label>
        <button type="button" class="toggle-mode-btn text-[10px] font-bold text-brand-orange hover:underline focus:outline-none">
          <span class="mode-label-text">Por Tamanho</span>
        </button>
      </div>

      <div class="uniform-step-container">
        <input type="number" step="0.1" value="${step}" placeholder="Aumento único (cm)" class="measure-step neo-input w-full px-3.5 py-2 text-sm text-brand-black placeholder-slate-400 focus:outline-none">
      </div>

      <div class="custom-step-container hidden grid grid-cols-2 gap-1.5 pt-1"></div>
    </div>

    <div class="md:col-span-1 text-right md:text-center pt-2 md:pt-6">
      <button type="button" onclick="this.closest('.measure-row').remove()" title="Excluir medida" class="text-slate-400 hover:text-rose-600 transition p-1.5">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `;

  const toggleBtn = row.querySelector('.toggle-mode-btn');
  toggleBtn.addEventListener('click', () => {
    if (row.dataset.mode === 'uniform') {
      row.dataset.mode = 'custom';
      toggleBtn.querySelector('.mode-label-text').textContent = 'Salto Único';
      row.querySelector('.uniform-step-container').classList.add('hidden');
      row.querySelector('.custom-step-container').classList.remove('hidden');
      buildCustomStepInputs(row);
    } else {
      row.dataset.mode = 'uniform';
      toggleBtn.querySelector('.mode-label-text').textContent = 'Por Tamanho';
      row.querySelector('.uniform-step-container').classList.remove('hidden');
      row.querySelector('.custom-step-container').classList.add('hidden');
    }
  });

  container.appendChild(row);
  buildCustomStepInputs(row, step);
}

function buildCustomStepInputs(row, defaultStep = '') {
  const customContainer = row.querySelector('.custom-step-container');
  const existingValues = {};

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
      <span class="text-[8px] font-bold text-slate-500 uppercase">${fromSize}➔${toSize}</span>
      <input type="number" step="0.1" value="${val}" data-interval="${key}" placeholder="cm" class="custom-step-input neo-input px-2 py-1 text-xs text-brand-black focus:outline-none">
    `;
    customContainer.appendChild(div);
  }
}

function rebuildAllCustomStepInputs() {
  document.querySelectorAll('.measure-row').forEach(row => buildCustomStepInputs(row));
}

// 4. Calcular e Gerar Documento Completo
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

  const blockElements = document.querySelectorAll('.table-block');
  const compiledData = [];

  blockElements.forEach(block => {
    const title = block.querySelector('.table-title-input').value.trim() || 'Tabela de Medidas';
    const rows = block.querySelectorAll('.measure-row');
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

    if (measures.length > 0) {
      compiledData.push({ title, measures });
    }
  });

  if (compiledData.length === 0) {
    alert('Preencha os valores de medida e variação corretamente em pelo menos uma tabela.');
    return;
  }

  document.getElementById('pdfModelRef').textContent = modelRefText;
  document.getElementById('pdfDate').textContent = new Date().toLocaleDateString('pt-BR');

  tablesOutputContainer.innerHTML = '';

  compiledData.forEach(blockData => {
    tablesOutputContainer.appendChild(renderSingleTable(blockData.title, blockData.measures, baseIndex));
  });

  resultSection.classList.remove('hidden');
  resultSection.scrollIntoView({ behavior: 'smooth' });
});

function renderSingleTable(title, measures, baseIndex) {
  const wrapper = document.createElement('div');
  wrapper.className = 'space-y-3 pdf-table-block'; // adicionado pdf-table-block para controlar a quebra no PDF

  let tableHtml = `
    <div class="flex items-center gap-2 border-b border-brand-orange/40 pb-2">
      <i class="fa-solid fa-scissors text-brand-orange text-sm"></i>
      <h4 class="font-extrabold text-sm md:text-base text-brand-black uppercase tracking-wide">${title}</h4>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b-2 border-slate-800 text-slate-700 text-xs uppercase tracking-wider bg-slate-100/50">
            <th class="p-3 md:p-4 border-b-2 border-slate-800 font-bold">Medida (cm)</th>
            ${sizes.map(s => `
              <th class="p-3 md:p-4 border-b-2 border-slate-800 text-center ${s === selectedBaseSize ? 'text-brand-orange font-extrabold bg-orange-100/50' : 'text-slate-800 font-bold'}">
                ${s} ${s === selectedBaseSize ? '<span class="text-[9px] block font-semibold text-brand-orange">(BASE)</span>' : ''}
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200/80 text-slate-800 text-xs md:text-sm">
  `;

  measures.forEach(m => {
    tableHtml += `<tr class="hover:bg-slate-100/50 transition"><td class="p-3 md:p-4 font-bold text-slate-900 border-b border-slate-200/80">${m.name}</td>`;

    sizes.forEach((size, idx) => {
      let calcValue = m.value;

      if (m.mode === 'uniform') {
        const multiplier = idx - baseIndex;
        calcValue = m.value + (multiplier * m.step);
      } else {
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
      tableHtml += `
        <td class="p-3 md:p-4 text-center border-b border-slate-200/80 ${isBase ? 'bg-orange-50 font-extrabold text-brand-orange' : 'font-medium text-slate-700'}">
          ${calcValue.toFixed(1)}
        </td>
      `;
    });

    tableHtml += `</tr>`;
  });

  tableHtml += `
        </tbody>
      </table>
    </div>
  `;

  wrapper.innerHTML = tableHtml;
  return wrapper;
}

// 5. Botão "Novo Projeto"
resetFormBtn.addEventListener('click', () => {
  document.getElementById('modelRef').value = '';
  initDefaultTableBlocks();
  resultSection.classList.add('hidden');
  appSection.scrollIntoView({ behavior: 'smooth' });
});

// 6. Impressão e PDF com Quebra Automática Multitabelas
document.getElementById('printBtn').addEventListener('click', () => window.print());

document.getElementById('pdfBtn').addEventListener('click', () => {
  const element = document.getElementById('pdfExportContainer');
  const modelName = document.getElementById('modelRef').value || 'Tabela_Medidas';
  
  // Opções do html2pdf com suporte a múltiplas páginas e quebra limpa
  const opt = {
    margin:       [10, 10, 10, 10],
    filename:     `Tabela_${modelName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { 
      scale: 2, 
      useCORS: true, 
      scrollY: 0,
      windowHeight: element.scrollHeight
    },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' },
    pagebreak:    { mode: ['css', 'legacy'], avoid: '.pdf-table-block' }
  };

  html2pdf().set(opt).from(element).save();
});