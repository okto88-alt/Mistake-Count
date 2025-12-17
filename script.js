// Scoring Rules (Hard Coded)
const SCORING_RULES = {
    transaction: {
        '1-2': 0.3,
        '3-5': 0.5,
        '6-7': 0.8,
        '>7': 1.0
    },
    amount: {
        '10K-200K': 0.3,
        '201K-500K': 0.5,
        '501K-2000K': 0.8,
        '>2001K': 1.0
    }
};

// Global variables
let staffData = [];
let staffCounter = 0;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    renderTables();

    document.getElementById('addStaff')
        .addEventListener('click', addNewStaff);

    document.getElementById('resetData')
        .addEventListener('click', resetAllData);

    const exportBtn = document.getElementById('exportExcelBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportExcel);
    }
});

// Get Txn Score based on mistake count
function getTxnScore(mistakeTxn) {
    if (mistakeTxn >= 1 && mistakeTxn <= 2) return SCORING_RULES.transaction['1-2'];
    if (mistakeTxn >= 3 && mistakeTxn <= 5) return SCORING_RULES.transaction['3-5'];
    if (mistakeTxn >= 6 && mistakeTxn <= 7) return SCORING_RULES.transaction['6-7'];
    if (mistakeTxn > 7) return SCORING_RULES.transaction['>7'];
    return 0;
}

// Get Amount Score based on mistake amount
function getAmountScore(mistakeAmount) {
    if (mistakeAmount >= 10000 && mistakeAmount <= 200000) return SCORING_RULES.amount['10K-200K'];
    if (mistakeAmount >= 201000 && mistakeAmount <= 500000) return SCORING_RULES.amount['201K-500K'];
    if (mistakeAmount >= 501000 && mistakeAmount <= 2000000) return SCORING_RULES.amount['501K-2000K'];
    if (mistakeAmount > 2001000) return SCORING_RULES.amount['>2001K'];
    return 0;
}

// Format currency in Indonesian style with Rp and periods
function formatCurrency(amount) {
    if (amount === 0) return 'Rp 0';
    
    const number = Math.floor(amount);
    const formatted = number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `Rp ${formatted}`;
}

// Parse currency input (remove periods and convert to number)
function parseCurrency(input) {
    if (!input) return 0;
    const cleanInput = input.replace(/[^0-9]/g, '');
    return parseInt(cleanInput) || 0;
}

// Add new staff
function addNewStaff() {
    const newStaff = {
        id: ++staffCounter,
        nama: '',
        mistakeTxn: 0,
        mistakeAmount: 0,
        txnScore: 0,
        amountScore: 0,
        avgScore: 0,
        weightedScore: 0,
        byTxnAmount: 0,
        byAmountAmount: 0,
        averageAmount: 0,
        weightedAmount: 0,
        finalDecision: 'Average'
    };
    
    staffData.push(newStaff);
    saveData();
    renderTables();
}

// Reset all data
function resetAllData() {
    if (confirm('Apakah Anda yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.')) {
        staffData = [];
        staffCounter = 0;
        saveData();
        addNewStaff(); // Add one empty row
    }
}

// Delete staff
function deleteStaff(id) {
    staffData = staffData.filter(staff => staff.id !== id);
    saveData();
    renderTables();
}

// Update staff data
function updateStaffData(id, field, value) {
    const staff = staffData.find(s => s.id === id);
    if (!staff) return;
    
    if (field === 'mistakeAmount') {
        staff.mistakeAmount = parseCurrency(value);
    } else if (field === 'mistakeTxn') {
        staff.mistakeTxn = parseInt(value) || 0;
    } else {
        staff[field] = value;
    }
    
    calculateScores(staff);
    saveData();
    renderTables();
}

// Calculate all scores for a staff
function calculateScores(staff) {
    // Get base scores
    staff.txnScore = getTxnScore(staff.mistakeTxn);
    staff.amountScore = getAmountScore(staff.mistakeAmount);
    
    // Calculate AVG Score
    staff.avgScore = (staff.txnScore + staff.amountScore) / 2;
    
    // Calculate Weighted Score
    staff.weightedScore = (staff.txnScore * 0.30) + (staff.amountScore * 0.70);
    
    // Calculate deduction amounts
    staff.byTxnAmount = staff.mistakeAmount * staff.txnScore;
    staff.byAmountAmount = staff.mistakeAmount * staff.amountScore;
    staff.averageAmount = staff.mistakeAmount * staff.avgScore;
    staff.weightedAmount = staff.mistakeAmount * staff.weightedScore;
}

// Update final decision selection
function updateFinalDecision(id, selection) {
    const staff = staffData.find(s => s.id === id);
    if (!staff) return;
    
    staff.finalDecision = selection;
    saveData();
    renderTables();
}

// Render both tables
function renderTables() {
    renderInputTable();
    renderDecisionTable();
}

// Render Input & Calculation Table
function renderInputTable() {
    const tbody = document.getElementById('inputTableBody');
    tbody.innerHTML = '';
    
    staffData.forEach(staff => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" value="${staff.nama}" placeholder="Masukkan nama staff" onchange="updateStaffData(${staff.id}, 'nama', this.value)"></td>
            <td><input type="number" min="0" value="${staff.mistakeTxn}" placeholder="0" onchange="updateStaffData(${staff.id}, 'mistakeTxn', this.value)"></td>
            <td><input type="text" value="${staff.mistakeAmount ? formatCurrency(staff.mistakeAmount) : ''}" placeholder="Rp 0" onchange="updateStaffData(${staff.id}, 'mistakeAmount', this.value)" class="currency-input"></td>
            <td><div class="score-display">${staff.txnScore.toFixed(2)}</div></td>
            <td><div class="score-display">${staff.amountScore.toFixed(2)}</div></td>
            <td><div class="score-display">${staff.avgScore.toFixed(2)}</div></td>
            <td><div class="score-display">${staff.weightedScore.toFixed(2)}</div></td>
            <td class="action-column"><button class="delete-btn" onclick="deleteStaff(${staff.id})">HAPUS</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// Render Decision Table
function renderDecisionTable() {
    const tbody = document.getElementById('decisionTableBody');
    tbody.innerHTML = '';
    
    staffData.forEach(staff => {
        const tr = document.createElement('tr');
        const finalAmount = getFinalAmount(staff);
        
        tr.innerHTML = `
            <td>${staff.nama || '-'}</td>
            <td class="currency-display">${formatCurrency(staff.byTxnAmount)}</td>
            <td class="currency-display">${formatCurrency(staff.byAmountAmount)}</td>
            <td class="currency-display">${formatCurrency(staff.averageAmount)}</td>
            <td class="currency-display">${formatCurrency(staff.weightedAmount)}</td>
            <td>
                <select onchange="updateFinalDecision(${staff.id}, this.value)" class="final-decision">
                    <option value="By Txn" ${staff.finalDecision === 'By Txn' ? 'selected' : ''}>Potongan by Txn</option>
                    <option value="By Amount" ${staff.finalDecision === 'By Amount' ? 'selected' : ''}>Potongan by Amount</option>
                    <option value="Average" ${staff.finalDecision === 'Average' ? 'selected' : ''}>Potongan Rata-rata</option>
                    <option value="Weighted" ${staff.finalDecision === 'Weighted' ? 'selected' : ''}>Potongan Maksimum</option>
                </select>
            </td>
            <td class="currency-display">${formatCurrency(finalAmount)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Get final amount based on decision
function getFinalAmount(staff) {
    switch(staff.finalDecision) {
        case 'By Txn':
            return staff.byTxnAmount;
        case 'By Amount':
            return staff.byAmountAmount;
        case 'Average':
            return staff.averageAmount;
        case 'Weighted':
            return staff.weightedAmount;
        default:
            return staff.averageAmount;
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('staffData', JSON.stringify(staffData));
    localStorage.setItem('staffCounter', staffCounter.toString());
}

// Load data from localStorage
function loadData() {
    const savedData = localStorage.getItem('staffData');
    const savedCounter = localStorage.getItem('staffCounter');
    
    if (savedData) {
        staffData = JSON.parse(savedData);
    }
    
    if (savedCounter) {
        staffCounter = parseInt(savedCounter);
    }
    
    // Initialize first row if no data
    if (staffData.length === 0) {
        addNewStaff();
    }
}

// Currency input formatting on focus/blur
document.addEventListener('focus', function(e) {
    if (e.target.classList.contains('currency-input')) {
        const value = e.target.value;
        const cleanValue = value.replace(/[^0-9]/g, '');
        e.target.value = cleanValue;
    }
}, true);

document.addEventListener('blur', function(e) {
    if (e.target.classList.contains('currency-input') && e.target.value) {
        const number = parseInt(e.target.value) || 0;
        e.target.value = formatCurrency(number);
    }
}, true);

function exportExcel() {
    if (typeof XLSX === "undefined") {
        alert("Library Excel belum ter-load!");
        return;
    }

    if (!staffData || staffData.length === 0) {
        alert("Tidak ada data untuk diexport");
        return;
    }

    const wb = XLSX.utils.book_new();

    /* =========================
       SHEET 1 — INPUT & SCORE
       (TABEL #2)
    ========================= */
    const sheetInput = [
        [
            "Nama Staf",
            "Mistake Txn",
            "Mistake Amount",
            "Txn Score",
            "Amount Score",
            "AVG Score",
            "Weighted Score"
        ],
        ...staffData.map(s => [
            s.nama,
            s.mistakeTxn,
            s.mistakeAmount,
            s.txnScore,
            s.amountScore,
            s.avgScore,
            s.weightedScore
        ])
    ];

    const wsInput = XLSX.utils.aoa_to_sheet(sheetInput);
    XLSX.utils.book_append_sheet(wb, wsInput, "Input & Score");

    /* =========================
       SHEET 2 — FINAL DECISION
       (TABEL #3)
    ========================= */
    const sheetFinal = [
        [
            "Nama Staf",
            "By Txn Amount",
            "By Amount Amount",
            "Average Amount",
            "Weighted Amount",
            "Final Decision",
            "Final Amount"
        ],
        ...staffData.map(s => {
            let finalAmount;
            switch (s.finalDecision) {
                case 'By Txn':
                    finalAmount = s.byTxnAmount;
                    break;
                case 'By Amount':
                    finalAmount = s.byAmountAmount;
                    break;
                case 'Weighted':
                    finalAmount = s.weightedAmount;
                    break;
                case 'Average':
                default:
                    finalAmount = s.averageAmount;
            }

            return [
                s.nama,
                s.byTxnAmount,
                s.byAmountAmount,
                s.averageAmount,
                s.weightedAmount,
                s.finalDecision,
                finalAmount
            ];
        })
    ];

    const wsFinal = XLSX.utils.aoa_to_sheet(sheetFinal);
    XLSX.utils.book_append_sheet(wb, wsFinal, "Final Decision");

    /* =========================
       DOWNLOAD
    ========================= */
    XLSX.writeFile(wb, "Mistake_Count_Report.xlsx");
}
