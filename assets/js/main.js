// dashboard.js – ES module covering both Admin dashboards
// =============================================================
// Load with:
// <script type="module" src="./dashboard.js"></script>
// -------------------------------------------------------------
import { checkLogin } from "./checklogin.js";

// Redirect if logged‑in user hits login page
if (!checkLogin()) {
  window.location.href = "account.html";
}

// -------------------------------------------------------------
// 0) Style utilities (wave loader injected exactly once) -------
// -------------------------------------------------------------
let _styleInjected = false;
function injectWaveLoaderCss() {
  if (_styleInjected) return;
  _styleInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    table{width:100%}
    .wave-loader{display:inline-block;height:30px}
    .wave-loader span{display:inline-block;width:8px;height:100%;margin:0 2px;background:#3498db;border-radius:4px;animation:wave 1s infinite ease-in-out}
    .wave-loader span:nth-child(2){animation-delay:.1s}
    .wave-loader span:nth-child(3){animation-delay:.2s}
    .wave-loader span:nth-child(4){animation-delay:.3s}
    .wave-loader span:nth-child(5){animation-delay:.4s}
    @keyframes wave{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}`;
  document.head.append(style);
}

// -------------------------------------------------------------
// 1) Detect which page we are on --------------------------------
// -------------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  injectWaveLoaderCss();
  if (document.querySelector(".gvchiso")) initGVDashboard(); // page with gv* tables
  if (document.getElementById("taskTable")) initTaskPage();   // page with taskTable
  setupSidebarIfAny();
});

// -------------------------------------------------------------
// 2) GV Dashboard implementation (gvchiso / gvthongtin / gvNote)
// -------------------------------------------------------------
function initGVDashboard() {
  // --- state
  let allTasks = [], allGv = [], allNote = [], gvRateMap = new Map();

  // --- fetch
  const url = "https://script.google.com/macros/s/AKfycbwk-IyOJogcDAMrTzz8gxH3MRK6iYnRI9JKBpDLtMmjaD-K3_V-BjnQeJvm9Np62Jysag/exec";
  fetchData();

  async function fetchData() {
    showLoadingWave([".gvchiso tbody", ".gvthongtin tbody", ".gvNote tbody"]);
    try {
      const res = await fetch(url);
      const json = await res.json();
      allTasks = json.dataresult ?? [];
      allGv = json.datagv ?? [];
      allNote = json.datanote ?? [];
      gvRateMap = new Map(allGv.map(gv => [(gv["Họ và tên"] || "").trim().toLowerCase(), Number(gv["Rate lương K12"]) || 0]));

      renderGVTables();
      populateTeacherSelect(allNote);
    } catch (err) {
      console.error("GV dashboard fetch error", err);
    }
  }

  // ---------- render helpers -------------------------------
  function renderGVTables() {
    renderTableGV(allGv);
    renderTable(allTasks);
    renderTableNote(allNote);
  }

  const getRate = name => gvRateMap.get(name.trim().toLowerCase()) ?? 0;

  function renderTableGV(list) {
    const tbody = document.querySelector(".gvthongtin tbody");
    if (!tbody) return; tbody.innerHTML = "";
    list.forEach(t => {
      const r = tbody.insertRow();
      r.innerHTML = `<td>${t["Mã GV"]}</td><td>${t["Họ và tên"]}</td><td>${t["Username (lms)"]}</td><td>${t["Bộ phận"]}</td><td>${t["Email cá nhân"]}</td><td>${t["Email công việc"]}</td><td>${t["Rate lương K12"]}</td>`;
    });
  }

  function renderTable(list) {
    const tbody = document.querySelector(".gvchiso tbody"); if (!tbody) return; tbody.innerHTML = "";
    list.forEach((t, i) => {
      const avg = isNaN(t["Điểm trung bình chuyên môn"]) ? "Chưa đánh giá" : Number(t["Điểm trung bình chuyên môn"]).toFixed(2);
      const r = tbody.insertRow();
      r.innerHTML = `<td>${i + 1}</td><td>${t["Full name"]}</td><td>${t.Code}</td><td>${(t["Completion rate"] * 100).toFixed(2)}%</td><td>${Number(t["TP"]).toFixed(2)}</td><td>${avg}</td><td>${Number(t.Technical || 0).toFixed(2)}</td><td>${Number(t.Trial).toFixed(2)}</td><td>${t["Sư phạm"]}</td><td>${Number(t[Object.keys(t)[19]]).toFixed(2)}</td><td>${t["Xếp loại"]}</td><td>${t["Đánh giá"]}</td>`;
    });
  }

  function renderTableNote(list) {
    const tbody = document.querySelector(".gvNote tbody"); if (!tbody) return; tbody.innerHTML = "";
    list.forEach((t, i) => {
      let s = 0;
      switch (t["Loại"]) { case "Trial OFF": case "Dạy buổi 0": case "Bổ trợ": s = 80000 + t["SL"] * 30000; break; case "Trial ON": s = 40000 + t["SL"] * 20000; break; case "Dạy Bù": s = (t["SL"] || 0) * getRate(t["Tên Giảng Viên"]); break; }
      const d = t["Ngày"] ? new Date(t["Ngày"]) : null;
      const dateStr = d ? `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}` : "";
      const r = tbody.insertRow();
      r.innerHTML = `<td>${i + 1}</td><td>${t["Tên Giảng Viên"] || ""}</td><td>${t["SL"] || 0}</td><td>${t["Tên HV"] || ""}</td><td>${t["Loại"] || ""}</td><td>${t["Lớp"] || ""}</td><td>${t["Buổi"] || ""}</td><td>${dateStr}</td><td>${t["BỘ MÔN"] || ""}</td><td>${s.toLocaleString()}</td><td>${t["GHI CHÚ"] || ""}</td>`;
    });
  }

  // ---------- filtering & teacher select --------------------
  document.getElementById("btnFilter")?.addEventListener("click", applyFilter);
  document.getElementById("startDate")?.addEventListener("change", applyFilter);
  document.getElementById("endDate")?.addEventListener("change", applyFilter);
  document.getElementById("teacherSelect")?.addEventListener("change", applyFilter);

  function applyFilter() {
    const from = document.getElementById("startDate").value;
    const to = document.getElementById("endDate").value;
    const teach = document.getElementById("teacherSelect").value;
    renderTableNote(filterNotes(allNote, from, to, teach));
  }

  function filterNotes(list, from, to, name) {
    const st = from ? new Date(from) : new Date(-864e13);
    const en = to ? new Date(new Date(to).setHours(23, 59, 59, 999)) : new Date(864e13);
    const key = name ? name.trim().toLowerCase() : null;
    return list.filter(n => {
      const d = new Date(n["Ngày"] || 0);
      const okDate = d >= st && d <= en;
      const okName = key ? (n["Tên Giảng Viên"] || "").toLowerCase().includes(key) : true;
      return okDate && okName;
    });
  }

  function populateTeacherSelect(list) {
    const sel = document.getElementById("teacherSelect"); if (!sel) return; sel.length = 1;
    [...new Set(list.map(n => n["Tên Giảng Viên"]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi', { sensitivity: 'base' })).forEach(n => { const o = document.createElement('option'); o.value = n; o.textContent = n; sel.appendChild(o); });
  }
}

// -------------------------------------------------------------
// 3) Task page implementation (taskTable & date filter) --------
// -------------------------------------------------------------
function initTaskPage() {
  injectWaveLoaderCss();
  const api = "https://script.google.com/macros/s/AKfycbzwkST95xuDJW_sXBDaNiv4221mTnnewJ1JY3s1VPcBzmXTyZileK4TGRn77nqh804/exec";
  let allTasks = [];

  fetchData();
  document.getElementById("filterBtn")?.addEventListener("click", filterByDateRange);
  document.getElementById("reset")?.addEventListener("click", resetFilters);

  async function fetchData() {
    showLoadingWave(["#taskTable tbody"]);
    try {
      const res = await fetch(api);
      const json = await res.json();
      allTasks = json.data ?? [];
      renderTable(allTasks);
    } catch (err) { console.error("Task page fetch error", err); }
  }

  function showLoadingWave(selectors) {
    (selectors).forEach(sel => { const el = document.querySelector(sel); if (!el) return; el.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:40px 0;"><div class="wave-loader"><span></span><span></span><span></span><span></span><span></span></div></td></tr>`; });
  }

  function renderTable(list) {
    const tbody = document.querySelector("#taskTable tbody"); if (!tbody) return; tbody.innerHTML = "";
    const success = list.filter(t => t.trialStatus === "Đã đồng ý trải nghiệm" || t.trialStatus === "Đồng ý").length;
    const canceled = list.filter(t => t.trialStatus === "Đã bị hủy" || t.trialStatus === "Hủy").length;
    document.getElementById("totalCases").textContent = list.length;
    document.getElementById("successCases").textContent = success;
    document.getElementById("canceledCases").textContent = canceled;
    list.forEach((t, i) => {
      const r = tbody.insertRow();
      r.innerHTML = `<td>${i + 1}</td><td>${t.sale}</td><td>${t.hvName}</td><td>${t.class}</td><td>${t.subject}</td><td>${t.date}</td><td>${t.hours}</td><td>${t.type}</td><td>${t.trialStatus}</td><td>${t.teacher}</td>`;
    });
  }

  function filterByDateRange() {
    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate").value;
    if (!start || !end) { alert("Vui lòng chọn đủ cả hai ngày!"); return; }
    const st = new Date(start); const en = new Date(end); let total = 0, success = 0, cancel = 0;
    const filtered = allTasks.filter(t => {
      const [d, m, y] = t.date.split("/"); const date = new Date(`${y}-${m}-${d}`);
      const inRange = date >= st && date <= en; if (inRange) { total++; if (t.trialStatus === "Đã bị hủy" || t.trialStatus === "Hủy") cancel++; else success++; } return inRange;
    });
    renderTable(filtered);
    document.getElementById("totalCases").textContent = total;
    document.getElementById("successCases").textContent = success;
    document.getElementById("canceledCases").textContent = cancel;
  }

  function resetFilters() {
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";
    renderTable(allTasks);
  }
}

// -------------------------------------------------------------
// 4) Sidebar highlight toggle (shared) -------------------------
// -------------------------------------------------------------
function setupSidebarIfAny() {
  const tabs = document.querySelectorAll(".item_");
  const sections = document.querySelectorAll(".item");
  if (!tabs.length) return;
  tabs.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      sections.forEach(s => s.classList.add('hidden'));
      sections[i].classList.remove('hidden', 'table_full_width');
      tabs.forEach(b => b.classList.remove('bg_sidebar'));
      btn.classList.add('bg_sidebar');
    });
  });
}

// -------------------------------------------------------------
// No exports needed for browser usage, but kept for tests ------

