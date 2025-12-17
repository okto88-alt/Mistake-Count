// Mistake Count Dashboard JavaScript

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
        // 60% transaction score, 40% amount score
        return (txnScore * 0.6 + amountScore * 0.4).toFixed(2);
    }

    getScoreClass(score) {
        const numScore = parseFloat(score);
        if (numScore === 0.0) return 'score-critical';
        if (numScore <= 0.3) return 'score-poor';
        if (numScore <= 0.5) return 'score-fair';
        if (numScore <= 0.8) return 'score-good';
        return 'score-excellent';
    }

    // Calculate deduction based on weighted score
    calculateDeduction(weightedScore) {
        // Base deduction calculation: higher score = higher deduction
        // Maximum deduction: 5,000,000 IDR
        return Math.round(parseFloat(weightedScore) * 5000000);
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
        if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
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
            deduction: 0,
            decision: 'Minimum'
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
        staff.deduction = this.calculateDeduction(staff.weightedScore);

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
                       placeholder="Enter staff name">
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
            <td class="${this.getScoreClass(staff.weightedScore)}">${formatCurrency(staff.deduction)}</td>
            <td>
                <button class="btn btn-danger" data-id="${staff.id}" data-action="delete">
                    Delete
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
            <td>${staff.name || 'Unnamed Staff'}</td>
            <td class="${this.getScoreClass(staff.txnScore)}">${staff.txnScore.toFixed(1)}</td>
            <td class="${this.getScoreClass(staff.amountScore)}">${staff.amountScore.toFixed(1)}</td>
            <td class="${this.getScoreClass(staff.averageScore)}">${staff.averageScore}</td>
            <td class="${this.getScoreClass(staff.weightedScore)}">${staff.weightedScore}</td>
            <td class="${this.getScoreClass(staff.weightedScore)}">${formatCurrency(staff.deduction)}</td>
            <td>
                <select class="select-field" data-id="${staff.id}" data-field="decision">
                    <option value="Minimum" ${staff.decision === 'Minimum' ? 'selected' : ''}>Minimum</option>
                    <option value="Medium" ${staff.decision === 'Medium' ? 'selected' : ''}>Medium</option>
                    <option value="Maximum" ${staff.decision === 'Maximum' ? 'selected' : ''}>Maximum</option>
                </select>
            </td>
        `;
        return row;
    }

    updateTables() {
        // Update staff table scores
        this.staffData.forEach(staff => {
            const txnCell = document.querySelector(`#staffTableBody tr td:nth-child(4)`);
            const amountCell = document.querySelector(`#staffTableBody tr td:nth-child(5)`);
            const avgCell = document.querySelector(`#staffTableBody tr td:nth-child(6)`);
            const weightedCell = document.querySelector(`#staffTableBody tr td:nth-child(7)`);
            
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
            
            // Update deduction cell (8th column)
            const deductionCell = document.querySelector(`#staffTableBody tr td:nth-child(8)`);
            if (deductionCell) {
                deductionCell.textContent = formatCurrency(staff.deduction);
                deductionCell.className = this.getScoreClass(staff.weightedScore);
            }
        });

        // Update decision table
        this.renderDecisionTable();
    }

    updateSummary() {
        const totalStaff = this.staffData.length;
        const totalDeduction = this.staffData.length > 0 
            ? this.staffData.reduce((sum, staff) => sum + staff.deduction, 0)
            : 0;
        const averageDeduction = totalStaff > 0 ? Math.round(totalDeduction / totalStaff) : 0;

        document.getElementById('totalStaff').textContent = totalStaff;
        document.getElementById('totalDeduction').textContent = formatCurrency(totalDeduction);
        document.getElementById('averageDeduction').textContent = formatCurrency(averageDeduction);
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

// Add some global utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatNumber(number) {
    return new Intl.NumberFormat('id-ID').format(number);
}

// Add CSS for responsive table scroll
const style = document.createElement('style');
style.textContent = `
    .table-container::-webkit-scrollbar {
        height: 8px;
    }
    
    .table-container::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
    }
    
    .table-container::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
    }
    
    .table-container::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
    }
`;
document.head.appendChild(style);