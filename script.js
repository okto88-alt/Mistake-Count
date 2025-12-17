// Mistake Count Dashboard JavaScript - Professional Version

class MistakeDashboard {
    constructor() {
        this.staffData = [];
        this.nextId = 1;
        this.storageKey = 'mistake_dashboard_data';
        
        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
        this.renderTables();
        this.updateSummary();
    }

    // Scoring Logic
    calculateTxnScore(mistakeCount) {
        if (mistakeCount === 0) return 0.0;
        if (mistakeCount <= 2) return 0.3;
        if (mistakeCount <= 5) return 0.5;
        if (mistakeCount <= 7) return 0.8;
        return 1.0;
    }

    calculateAmountScore(amount) {
        if (amount < 100000) return 0.0;
        if (amount <= 200000) return 0.3;
        if (amount <= 500000) return 0.5;
        if (amount <= 2000000) return 0.8;
        return 1.0;
    }

    calculateAverageScore(txnScore, amountScore) {
        return ((txnScore + amountScore) / 2).toFixed(2);
    }

    calculateWeightedScore(txnScore, amountScore) {
        // 30% transaction score, 70% amount score ( sesuai gambar )
        return (txnScore * 0.3 + amountScore * 0.7).toFixed(2);
    }

    getScoreClass(score) {
        const numScore = parseFloat(score);
        if (numScore === 0.0) return 'score-critical';
        if (numScore <= 0.3) return 'score-poor';
        if (numScore <= 0.5) return 'score-fair';
        if (numScore <= 0.8) return 'score-good';
        return 'score-excellent';
    }

    // Calculate deduction based on score (Multiplier: 1,000,000 IDR)
    calculateAmountDeduction(score) {
        return Math.round(parseFloat(score) * 1000000);
    }

    // Final Decision Logic
    calculateFinalAmount(txnAmount, amountAmount, averageAmount, weightedAmount, decision) {
        const amounts = [txnAmount, amountAmount, averageAmount, weightedAmount];
        
        switch(decision) {
            case 'Minimum':
                return Math.min(...amounts);
            case 'Medium':
                amounts.sort((a, b) => a - b);
                return amounts[Math.floor(amounts.length / 2)];
            case 'Maximum':
                return Math.max(...amounts);
            default:
                return txnAmount;
        }
    }

    // LocalStorage Management
    saveData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.staffData));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    loadData() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                this.staffData = JSON.parse(savedData);
                // Calculate nextId based on existing data
                if (this.staffData.length > 0) {
                    this.nextId = Math.max(...this.staffData.map(staff => staff.id)) + 1;
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.staffData = [];
        }
    }

    resetData() {
        if (confirm('Apakah Anda yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.')) {
            this.staffData = [];
            this.nextId = 1;
            localStorage.removeItem(this.storageKey);
            this.renderTables();
            this.updateSummary();
        }
    }

    // Data Management
    addStaff() {
        const newStaff = {
            id: this.nextId++,
            name: '',
            mistakeTxn: 0,
            mistakeAmount: 0,
            txnScore: 0.0,
            amountScore: 0.0,
            averageScore: 0.0,
            weightedScore: 0.0,
            txnAmount: 0,
            amountAmount: 0,
            averageAmount: 0,
            weightedAmount: 0,
            decision: 'Minimum',
            finalAmount: 0
        };
        
        this.staffData.push(newStaff);
        this.saveData();
        this.renderTables();
        this.updateSummary();
        
        // Focus on the new row's name input
        setTimeout(() => {
            const nameInput = document.querySelector(`[data-id="${newStaff.id}"][data-field="name"]`);
            if (nameInput) nameInput.focus();
        }, 100);
    }

    removeStaff(id) {
        this.staffData = this.staffData.filter(staff => staff.id !== id);
        this.saveData();
        this.renderTables();
        this.updateSummary();
    }

    updateStaff(id, field, value) {
        const staff = this.staffData.find(s => s.id === id);
        if (!staff) return;

        // Update the field
        if (field === 'name') {
            staff.name = value;
        } else if (field === 'mistakeTxn') {
            staff.mistakeTxn = parseInt(value) || 0;
        } else if (field === 'mistakeAmount') {
            staff.mistakeAmount = parseInt(value) || 0;
        } else if (field === 'decision') {
            staff.decision = value;
        }

        // Recalculate scores
        staff.txnScore = this.calculateTxnScore(staff.mistakeTxn);
        staff.amountScore = this.calculateAmountScore(staff.mistakeAmount);
        staff.averageScore = this.calculateAverageScore(staff.txnScore, staff.amountScore);
        staff.weightedScore = this.calculateWeightedScore(staff.txnScore, staff.amountScore);

        // Calculate amount deductions (1,000,000 multiplier)
        staff.txnAmount = this.calculateAmountDeduction(staff.txnScore);
        staff.amountAmount = this.calculateAmountDeduction(staff.amountScore);
        staff.averageAmount = this.calculateAmountDeduction(staff.averageScore);
        staff.weightedAmount = this.calculateAmountDeduction(staff.weightedScore);

        // Calculate final amount based on decision
        staff.finalAmount = this.calculateFinalAmount(
            staff.txnAmount,
            staff.amountAmount,
            staff.averageAmount,
            staff.weightedAmount,
            staff.decision
        );

        this.saveData();
        this.updateTables();
        this.updateSummary();
    }

    // Rendering
    renderTables() {
        this.renderStaffTable();
        this.renderDecisionTable();
    }

    renderStaffTable() {
        const tbody = document.getElementById('staffTableBody');
        tbody.innerHTML = '';

        this.staffData.forEach(staff => {
            const row = this.createStaffRow(staff);
            tbody.appendChild(row);
        });
    }

    createStaffRow(staff) {
        const row = document.createElement('tr');
        row.className = 'new-row';
        row.innerHTML = `
            <td>
                <input type="text" 
                       class="input-field" 
                       data-id="${staff.id}" 
                       data-field="name" 
                       value="${staff.name}"
                       placeholder="Masukkan nama staf">
            </td>
            <td>
                <input type="number" 
                       class="input-field" 
                       data-id="${staff.id}" 
                       data-field="mistakeTxn" 
                       value="${staff.mistakeTxn}"
                       min="0">
            </td>
            <td>
                <input type="number" 
                       class="input-field" 
                       data-id="${staff.id}" 
                       data-field="mistakeAmount" 
                       value="${staff.mistakeAmount}"
                       min="0"
                       placeholder="0">
            </td>
            <td class="${this.getScoreClass(staff.txnScore)}">${staff.txnScore.toFixed(1)}</td>
            <td class="${this.getScoreClass(staff.amountScore)}">${staff.amountScore.toFixed(1)}</td>
            <td class="${this.getScoreClass(staff.averageScore)}">${staff.averageScore}</td>
            <td class="${this.getScoreClass(staff.weightedScore)}">${staff.weightedScore}</td>
            <td class="${this.getScoreClass(staff.weightedScore)}">${this.formatRupiah(staff.weightedAmount)}</td>
            <td>
                <button class="btn btn-danger" data-id="${staff.id}" data-action="delete">
                    Hapus
                </button>
            </td>
        `;
        return row;
    }

    renderDecisionTable() {
        const tbody = document.getElementById('decisionTableBody');
        tbody.innerHTML = '';

        this.staffData.forEach(staff => {
            const row = this.createDecisionRow(staff);
            tbody.appendChild(row);
        });
    }

    createDecisionRow(staff) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${staff.name || 'Staf Tanpa Nama'}</td>
            <td class="${this.getScoreClass(staff.txnScore)}">${this.formatRupiah(staff.txnAmount)}</td>
            <td class="${this.getScoreClass(staff.amountScore)}">${this.formatRupiah(staff.amountAmount)}</td>
            <td class="${this.getScoreClass(staff.averageScore)}">${this.formatRupiah(staff.averageAmount)}</td>
            <td class="${this.getScoreClass(staff.weightedScore)}">${this.formatRupiah(staff.weightedAmount)}</td>
            <td>
                <select class="select-field" data-id="${staff.id}" data-field="decision">
                    <option value="Minimum" ${staff.decision === 'Minimum' ? 'selected' : ''}>Potongan Minimum</option>
                    <option value="Medium" ${staff.decision === 'Medium' ? 'selected' : ''}>Potongan Medium</option>
                    <option value="Maximum" ${staff.decision === 'Maximum' ? 'selected' : ''}>Potongan Maksimum</option>
                </select>
            </td>
            <td class="${this.getScoreClass(staff.weightedScore)}" style="font-weight: 700; font-size: 15px;">${this.formatRupiah(staff.finalAmount)}</td>
        `;
        return row;
    }

    updateTables() {
        // Update staff table scores
        this.staffData.forEach(staff => {
            const rowIndex = this.staffData.findIndex(s => s.id === staff.id);
            const row = document.querySelector(`#staffTableBody tr:nth-child(${rowIndex + 1})`);
            
            if (row) {
                const txnCell = row.children[3];
                const amountCell = row.children[4];
                const avgCell = row.children[5];
                const weightedCell = row.children[6];
                const deductionCell = row.children[7];
                
                if (txnCell) {
                    txnCell.textContent = staff.txnScore.toFixed(1);
                    txnCell.className = this.getScoreClass(staff.txnScore);
                }
                if (amountCell) {
                    amountCell.textContent = staff.amountScore.toFixed(1);
                    amountCell.className = this.getScoreClass(staff.amountScore);
                }
                if (avgCell) {
                    avgCell.textContent = staff.averageScore;
                    avgCell.className = this.getScoreClass(staff.averageScore);
                }
                if (weightedCell) {
                    weightedCell.textContent = staff.weightedScore;
                    weightedCell.className = this.getScoreClass(staff.weightedScore);
                }
                if (deductionCell) {
                    deductionCell.textContent = this.formatRupiah(staff.weightedAmount);
                    deductionCell.className = this.getScoreClass(staff.weightedScore);
                }
            }
        });

        // Update decision table
        this.renderDecisionTable();
    }

    updateSummary() {
        const totalStaff = this.staffData.length;
        const totalDeduction = this.staffData.length > 0 
            ? this.staffData.reduce((sum, staff) => sum + staff.finalAmount, 0)
            : 0;
        const averageDeduction = totalStaff > 0 ? Math.round(totalDeduction / totalStaff) : 0;

        document.getElementById('totalStaff').textContent = totalStaff;
        document.getElementById('totalDeduction').textContent = this.formatRupiah(totalDeduction);
        document.getElementById('averageDeduction').textContent = this.formatRupiah(averageDeduction);
    }

    // Export functionality
    exportData() {
        const data = {
            exportDate: new Date().toISOString(),
            staffData: this.staffData,
            summary: {
                totalStaff: this.staffData.length,
                totalDeduction: document.getElementById('totalDeduction').textContent,
                averageDeduction: document.getElementById('averageDeduction').textContent
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mistake_dashboard_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Format Rupiah with dot as thousand separator
    formatRupiah(amount) {
        return `Rp ${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    }

    // Event Binding
    bindEvents() {
        // Add staff button
        document.getElementById('addRowBtn').addEventListener('click', () => {
            this.addStaff();
        });

        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetData();
        });

        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        // Event delegation for table inputs
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('input-field') || e.target.classList.contains('select-field')) {
                const id = parseInt(e.target.dataset.id);
                const field = e.target.dataset.field;
                const value = e.target.value;
                
                if (id && field) {
                    this.updateStaff(id, field, value);
                }
            }
        });

        // Event delegation for delete buttons
        document.addEventListener('click', (e) => {
            if (e.target.dataset.action === 'delete') {
                const id = parseInt(e.target.dataset.id);
                this.removeStaff(id);
            }
        });

        // Handle Enter key in name inputs to add new row
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.dataset.field === 'name' && e.target.value.trim()) {
                this.addStaff();
            }
        });
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MistakeDashboard();
});

// Additional utility functions
function formatNumber(number) {
    return new Intl.NumberFormat('id-ID').format(number);
}

// Enhanced CSS for professional scrollbars
const style = document.createElement('style');
style.textContent = `
    .table-container::-webkit-scrollbar {
        height: 10px;
    }
    
    .table-container::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 5px;
    }
    
    .table-container::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        border-radius: 5px;
    }
    
    .table-container::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, #1d4ed8, #7c3aed);
    }
`;
document.head.appendChild(style);
