/*
 * ===================================================================
 * Painel de Inteligência Financeira v4.4 - COMPLETO
 * ===================================================================
 * HISTÓRICO DE MUDANÇAS (v4.4):
 * - Aumentado o tamanho do gráfico de pizza.
 * - Movida a legenda do gráfico para a parte inferior para melhor
 * visualização e organização.
 * ===================================================================
 */

// --- VARIÁVEIS GLOBAIS ---
let fullDataset = [];
let pizzaChart = null;

// --- FUNÇÕES UTILITÁRIAS ---
function parseBrazilianCurrency(value) {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string' || value.trim() === '') return 0;
    let cleanedValue = value.replace('R$', '').trim();
    if (cleanedValue.includes(',')) {
        cleanedValue = cleanedValue.replace(/\./g, '').replace(',', '.');
    }
    const number = parseFloat(cleanedValue);
    return isNaN(number) ? 0 : number;
}

function formatCurrency(value) {
    const number = typeof value === 'number' ? value : 0;
    return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseDate(dateString) {
    if (typeof dateString !== 'string' || !dateString.includes('/')) return null;
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10), month = parseInt(parts[1], 10) - 1, year = parseInt(parts[2], 10);
    if (year < 1900 || year > 2100) return null;
    const date = new Date(year, month, day);
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
    return date;
}

// --- FUNÇÃO PARA RENDERIZAR O GRÁFICO DE PIZZA ---
function renderPizzaChart(departmentData) {
    const ctx = document.getElementById('pizzaChart').getContext('2d');
    
    if (pizzaChart) {
        pizzaChart.destroy();
    }

    const sortedDepts = Object.entries(departmentData).sort(([, a], [, b]) => b - a);
    const labels = sortedDepts.map(entry => entry[0]);
    const data = sortedDepts.map(entry => entry[1]);

    pizzaChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total por Departamento',
                data: data,
                backgroundColor: [
                    '#FF5722', '#FF8A65', '#212529', '#6c757d', '#BF360C',
                    '#ffab91', '#5d4037', '#757575', '#455a64', '#f57c00'
                ],
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    // MUDANÇA: Posição da legenda para a parte inferior
                    position: 'bottom', 
                    labels: {
                        color: '#212529',
                        padding: 20, // Aumenta o espaçamento para a legenda
                        font: {
                            size: 12,
                            weight: 'bold' 
                        }
                    }
                }
            }
        }
    });
}


// --- FUNÇÃO CENTRAL QUE ATUALIZA O PAINEL ---
function updateDashboardUI(dataToDisplay, filterName = null) {
    const COLS = {
        DEPARTAMENTO: 'DEPARTAMENTO',
        NATUREZA: 'NATUREZA',
        VALOR_A_CALCULAR: 'VALOR DEPARTAMENTO',
        DATA_PAGO: 'DT. PAGO'
    };
    
    const totalsByNature = {};
    let totalInCurrentView = 0;
    dataToDisplay.forEach(row => {
        const rowValue = parseBrazilianCurrency(row[COLS.VALOR_A_CALCULAR]);
        totalInCurrentView += rowValue;
        const nature = row[COLS.NATUREZA];
        if (nature) totalsByNature[nature] = (totalsByNature[nature] || 0) + rowValue;
    });

    let latestDate = null;
    const totalsByDept = {};
    const issues = [];
    fullDataset.forEach(row => {
        const rowValue = parseBrazilianCurrency(row[COLS.VALOR_A_CALCULAR]);
        const dept = row[COLS.DEPARTAMENTO];
        if (dept) {
            totalsByDept[dept] = (totalsByDept[dept] || 0) + rowValue;
        } else {
            issues.push(row);
        }
        const paidDate = parseDate(row[COLS.DATA_PAGO]);
        if (paidDate && (!latestDate || paidDate > latestDate)) latestDate = paidDate;
    });

    if (!filterName) {
        renderPizzaChart(totalsByDept);
    }

    document.getElementById('last-update').textContent = latestDate ? latestDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "N/A";
    document.getElementById('total-geral-valor').textContent = formatCurrency(totalInCurrentView);
    document.getElementById('total-geral-title').textContent = filterName ? `Total Depto. (${filterName})` : 'Contas Pagas Mês';
    document.getElementById('natureza-title').textContent = filterName ? `Gastos por Natureza (${filterName})` : 'Gastos por Natureza (Geral)';
    
    const deptsContainer = document.getElementById('info-departamentos');
    deptsContainer.innerHTML = '';
    const sortedDepts = Object.entries(totalsByDept).sort(([, a], [, b]) => b - a);
    sortedDepts.slice(0, 5).forEach(([name, total]) => {
        deptsContainer.innerHTML += `
            <div class="card card-base" data-departamento="${name}">
                <h3>${name}</h3>
                <p>${formatCurrency(total)}</p>
            </div>
        `;
    });

    const natureList = document.getElementById('lista-natureza');
    natureList.innerHTML = '';
    const sortedNatures = Object.entries(totalsByNature).sort(([, a], [, b]) => b - a);
    sortedNatures.forEach(([name, total]) => {
        const percentage = totalInCurrentView > 0 ? (total / totalInCurrentView) * 100 : 0;
        natureList.innerHTML += `
            <li class="natureza-card">
                <div>
                    <h4 class="natureza-card-nome">${name}</h4>
                    <p class="natureza-card-valor">${formatCurrency(total)}</p>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${percentage}%;"></div>
                </div>
            </li>
        `;
    });

    const issuesList = document.getElementById('lista-sem-departamento');
    issuesList.innerHTML = '';
    if (issues.length === 0) {
        issuesList.innerHTML = '<li>Ótimo! Nenhum lançamento com problemas encontrado.</li>';
    } else {
        issues.forEach(row => {
            issuesList.innerHTML += `<li><span>${row[COLS.NATUREZA] || 'Natureza não informada'}</span> <span>${formatCurrency(parseBrazilianCurrency(row[COLS.VALOR_A_CALCULAR]))}</span></li>`;
        });
    }
}

// --- CONFIGURAÇÃO DOS EVENTOS DE INTERATIVIDADE ---
function setupEventListeners() {
    const deptsContainer = document.getElementById('info-departamentos');
    const mainContainer = document.getElementById('main-container');
    const resetButton = document.getElementById('reset-view-button');

    deptsContainer.addEventListener('click', (event) => {
        const card = event.target.closest('.card-base');
        if (!card) return;
        const deptName = card.dataset.departamento;
        if (!deptName) return;
        const filteredData = fullDataset.filter(row => row.DEPARTAMENTO === deptName);
        updateDashboardUI(filteredData, deptName);
        mainContainer.classList.add('filtered-view');
        resetButton.classList.remove('hidden');
    });

    resetButton.addEventListener('click', () => {
        updateDashboardUI(fullDataset);
        mainContainer.classList.remove('filtered-view');
        resetButton.classList.add('hidden');
    });
}

// --- PONTO DE ENTRADA DO SCRIPT ---
document.addEventListener('DOMContentLoaded', () => {
    if (typeof Papa === 'undefined' || typeof Chart === 'undefined') {
        console.error("ERRO CRÍTICO: Uma das bibliotecas essenciais (PapaParse ou Chart.js) não foi carregada.");
        return;
    }

    const repoName = window.location.pathname.split('/')[1];
    const csvFilePath = `/${repoName}/data/BRUDAM (2).csv`;

    Papa.parse(csvFilePath, {
        download: true,
        header: true,
        skipEmptyLines: true,
        delimiter: ";",
        transformHeader: header => header.trim(),
        complete: (results) => {
            if (results.data && results.data.length > 0) {
                fullDataset = results.data;
                updateDashboardUI(fullDataset);
                setupEventListeners();
            } else {
                console.error("Erro: O ficheiro CSV está vazio ou num formato não reconhecido.");
            }
        },
        error: (error) => {
            console.error("Erro fatal ao carregar o ficheiro CSV:", error);
        }
    });
});
