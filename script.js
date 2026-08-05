// Webhook para armazenamento dos leads (Cole sua URL do SheetDB ou AppScript aqui)
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
leadForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Estrutura exigida pelo SheetDB
  const leadPayload = {
    data: {
      nome: document.getElementById('leadName').value,
      whatsapp: document.getElementById('leadPhone').value,
      email: document.getElementById('leadEmail').value,
      data: new Date().toLocaleString('pt-BR')
    }
  };

  if (WEBHOOK_URL) {
    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(leadPayload)
    })
    .then(response => response.json())
    .then(data => console.log('Lead salvo com sucesso no Google Sheets:', data))
    .catch(err => console.error('Erro ao registrar contato:', err));
  }

  leadSection.classList.add('hidden');
  appSection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
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

// 3. Linhas de Medidas
addMeasureBtn.addEventListener('click', () => addMeasureRow());

function addMeasureRow(name = '', val = '', step = '') {
  const row = document.createElement('div');
  row.className = 'measure-row grid grid-cols-1 md:grid-cols-12 gap-3 items-center neo-card-sm p-3.5 rounded-2xl border border-white/80';
  row.innerHTML = `
    <div class="md:col-span-5">
      <input type="text" value="${name}" placeholder="Nome da Medida (ex: Busto)" class="measure-name neo-input w-full px-3.5 py-2 text-sm text-brand-black placeholder-slate-400 focus:outline-none">
    </div>
    <div class="md:col-span-3">
      <input type="number" step="0.1" value="${val}" placeholder="Valor Base (cm)" class="measure-val neo-input w-full px-3.5 py-2 text-sm text-brand-black placeholder-slate-400 focus:outline-none">
    </div>
    <div class="md:col-span-3">
      <input type="number" step="0.1" value="${step}" placeholder="Variação (+/- cm)" class="measure-step neo-input w-full px-3.5 py-2 text-sm text-brand-black placeholder-slate-400 focus:outline-none">
    </div>
    <div class="md:col-span-1 text-right">
      <button type="button" onclick="this.closest('.measure-row').remove()" class="text-slate-400 hover:text-rose-600 transition p-2">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `;
  measuresContainer.appendChild(row);
}

// 4. Gerar Tabela
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
    const step = parseFloat(row.querySelector('.measure-step').value);

    if (name && !isNaN(value) && !isNaN(step)) {
      measures.push({ name, value, step });
    }
  });

  if (measures.length === 0) {
    alert('Adicione pelo menos uma medida preenchida corretamente.');
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

    sizes.forEach((size, idx) => {
      const multiplier = idx - baseIndex;
      const calcValue = m.value + (multiplier * m.step);
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

// 5. Botão "Nova Tabela" (Reseta a calculadora mantendo o usuário logado)
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