class MistakeDashboard {
  constructor() {
    this.staffData = [];
    this.nextId = 1;
    this.storageKey = "mistake_dashboard_data";
    this.init();
  }

  init() {
    this.loadData();
    this.bindEvents();
    this.renderTables();
    this.updateSummary();
  }

  /* ======================
     SCORING (MATCH FILE B)
  ====================== */

  calculateTxnScore(v) {
    if (v === 0) return 0;
    if (v <= 2) return 0.3;
    if (v <= 5) return 0.5;
    if (v <= 7) return 0.8;
    return 1.0;
  }

  calculateAmountScore(v) {
    if (v === 0) return 0;
    if (v <= 200000) return 0.3;
    if (v <= 500000) return 0.5;
    if (v <= 2000000) return 0.8;
    return 1.0;
  }

  calculateAverage(txn, amt) {
    return (txn + amt) / 2;
  }

  calculateWeighted(txn, amt) {
    // FILE B logic
    return (amt * 0.7) + (txn * 0.3);
  }

  /* ======================
     POTONGAN RUPIAH
  ====================== */

  calculateDeductions(staff) {
    const base = staff.mistakeAmount || 0;
    return {
      byTxn: base * staff.txnScore,
      byAmount: base * staff.amountScore,
      average: base * staff.avgScore,
      weighted: base * staff.weightedScore
    };
  }

  getFinalAmount(staff, d) {
    const vals = Object.values(d);
    switch (staff.decision) {
      case "txn": return d.byTxn;
      case "amount": return d.byAmount;
      case "average": return d.average;
      case "weighted": return d.weighted;
      case "maximum": return Math.max(...vals);
      default: return Math.min(...vals); // minimum
    }
  }

  /* ======================
     STORAGE
  ====================== */

  saveData() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.staffData));
  }

  loadData() {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return;
    this.staffData = JSON.parse(raw);
    if (this.staffData.length) {
      this.nextId = Math.max(...this.staffData.map(s => s.id)) + 1;
    }
  }

  resetData() {
    if (confirm("Reset semua data?")) {
      this.staffData = [];
      this.nextId = 1;
      localStorage.removeItem(this.storageKey);
      this.renderTables();
      this.updateSummary();
    }
  }

  /* ======================
     DATA
  ====================== */

  addStaff() {
    this.staffData.push({
      id: this.nextId++,
      name: "",
      mistakeTxn: 0,
      mistakeAmount: 0,
      txnScore: 0,
      amountScore: 0,
      avgScore: 0,
      weightedScore: 0,
      decision: "minimum"
    });
    this.saveData();
    this.renderTables();
  }

  updateStaff(id, field, value) {
    const s = this.staffData.find(x => x.id === id);
    if (!s) return;

    if (field === "name") s.name = value;
    if (field === "mistakeTxn") s.mistakeTxn = Number(value) || 0;
    if (field === "mistakeAmount") s.mistakeAmount = Number(value) || 0;
    if (field === "decision") s.decision = value;

    s.txnScore = this.calculateTxnScore(s.mistakeTxn);
    s.amountScore = this.calculateAmountScore(s.mistakeAmount);
    s.avgScore = this.calculateAverage(s.txnScore, s.amountScore);
    s.weightedScore = this.calculateWeighted(s.txnScore, s.amountScore);

    this.saveData();
    this.renderTables();
    this.updateSummary();
  }

  removeStaff(id) {
    this.staffData = this.staffData.filter(s => s.id !== id);
    this.saveData();
    this.renderTables();
    this.updateSummary();
  }

  /* ======================
     RENDER
  ====================== */

  renderTables() {
    const body = document.getElementById("staffTableBody");
    body.innerHTML = "";

    this.staffData.forEach(s => {
      const d = this.calculateDeductions(s);
      const finalAmount = this.getFinalAmount(s, d);

      body.insertAdjacentHTML("beforeend", `
        <tr>
          <td><input data-id="${s.id}" data-field="name" value="${s.name}"></td>
          <td><input type="number" data-id="${s.id}" data-field="mistakeTxn" value="${s.mistakeTxn}"></td>
          <td><input type="number" data-id="${s.id}" data-field="mistakeAmount" value="${s.mistakeAmount}"></td>

          <td>${s.txnScore.toFixed(2)}</td>
          <td>${s.amountScore.toFixed(2)}</td>
          <td>${s.avgScore.toFixed(2)}</td>
          <td>${s.weightedScore.toFixed(2)}</td>

          <td>${formatNumber(finalAmount)}</td>

          <td>
            <select data-id="${s.id}" data-field="decision">
              <option value="minimum">Minimum</option>
              <option value="maximum">Maximum</option>
              <option value="txn">By Txn</option>
              <option value="amount">By Amount</option>
              <option value="average">Average</option>
              <option value="weighted">Weighted</option>
            </select>
          </td>

          <td><button class="delete-btn" data-id="${s.id}">Hapus</button></td>
        </tr>
      `);
    });
  }

  updateSummary() {
    const total = this.staffData.reduce((sum, s) => {
      const d = this.calculateDeductions(s);
      return sum + this.getFinalAmount(s, d);
    }, 0);

    document.getElementById("totalStaff").textContent = this.staffData.length;
    document.getElementById("totalPotongan").textContent = formatNumber(total);
    document.getElementById("avgPotongan").textContent =
      formatNumber(this.staffData.length ? total / this.staffData.length : 0);
  }

  /* ======================
     EVENTS
  ====================== */

  bindEvents() {
    document.getElementById("addRowBtn").onclick = () => this.addStaff();
    document.getElementById("resetBtn").onclick = () => this.resetData();

    document.addEventListener("input", e => {
      const id = Number(e.target.dataset.id);
      const field = e.target.dataset.field;
      if (id && field) this.updateStaff(id, field, e.target.value);
    });

    document.addEventListener("click", e => {
      if (e.target.classList.contains("delete-btn")) {
        this.removeStaff(Number(e.target.dataset.id));
      }
    });
  }
}

/* ======================
   FORMAT ANGKA 10,000
====================== */
function formatNumber(n) {
  return Number(n || 0).toLocaleString("en-US");
}

document.addEventListener("DOMContentLoaded", () => {
  new MistakeDashboard();
});
