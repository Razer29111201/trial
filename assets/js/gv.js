// dashboard.js – ES module version
// ============================================================
// This file assumes it is loaded with <script type="module" src="./dashboard.js"></script>
// ------------------------------------------------------------
// ✅ 1) Dependencies
// ------------------------------------------------------------
import { checkLogin } from "./checklogin.js";
console.log(checkLogin());

// If the user already has a session cookie → redirect
if (!checkLogin()) {
  window.location.href = "account.html";
}

// ------------------------------------------------------------
// ✅ 2) Module‑scoped state
// ------------------------------------------------------------
let allTasks = [];
let allGv = [];
let allNote = [];
let gvRateMap = new Map(); // Map<tenGV, rate>

// ------------------------------------------------------------
// ✅ 3) Kick‑off when DOM ready
// ------------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  injectWaveLoaderCss();
  fetchData();
  setupSidebar();
  setupFilters();
});

// ------------------------------------------------------------
// Styling helper (injects once) --------------------------------
function injectWaveLoaderCss() {
  const style = document.createElement("style");
  style.textContent = `
    table          { width: 100%; }
    .wave-loader   { display: inline-block; height: 30px; }
    .wave-loader span {
      display: inline-block; width: 8px; height: 100%; margin: 0 2px;
      background: #3498db; border-radius: 4px; animation: wave 1s infinite ease-in-out;
    }
    .wave-loader span:nth-child(2){animation-delay:.1s}
    .wave-loader span:nth-child(3){animation-delay:.2s}
    .wave-loader span:nth-child(4){animation-delay:.3s}
    .wave-loader span:nth-child(5){animation-delay:.4s}
    @keyframes wave{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}`;
  document.head.append(style);

  // Ensure every table gets full width once
  document.querySelectorAll("table").forEach(t => t.classList.add("table_full_width"));
}

// ------------------------------------------------------------
// Wave loader placeholder -------------------------------------
function showLoadingWave() {
  const selectors = [
    ".gvchiso tbody",
    ".gvthongtin tbody",
    ".gvNote tbody"
  ];
  selectors.forEach(sel => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.innerHTML = `
      <tr>
        <td colspan="10" style="text-align:center; padding:40px 0;">
          <div class="wave-loader">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
        </td>
      </tr>`;
  });
}

// ------------------------------------------------------------
// 4) Fetch data from Apps Script web‑app -----------------------
async function fetchData() {
  try {
    showLoadingWave();
    console.log("🔄 Fetching data from Apps Script …");
    const res = await fetch("https://script.google.com/macros/s/AKfycbwk-IyOJogcDAMrTzz8gxH3MRK6iYnRI9JKBpDLtMmjaD-K3_V-BjnQeJvm9Np62Jysag/exec");
    const json = await res.json();

    allTasks = json.dataresult ?? [];
    allGv = json.datagv ?? [];
    allNote = json.datanote ?? [];

    gvRateMap = new Map(
      allGv.map(gv => [
        (gv["Họ và tên"] || "").trim().toLowerCase(),
        Number(gv["Rate lương K12"]) || 0
      ])
    );

    // Initial renders
    renderTable(allTasks);
    renderTableGV(allGv);
    renderTableNote(allNote);
    populateTeacherSelect(allNote);
  } catch (err) {
    console.error("❌ Error fetching data:", err);
  }
}

// ------------------------------------------------------------
// Helper to get rate for GV -----------------------------------
const getRateForTeacher = name => gvRateMap.get(name.trim().toLowerCase()) ?? 0;

// ------------------------------------------------------------
// 5) Rendering helpers ----------------------------------------
function renderTableGV(taskList) {
  const tbody = document.querySelector(".gvthongtin tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  taskList.forEach(task => {
    const row = tbody.insertRow();
    const avgScore = isNaN(task["Điểm trung bình chuyên môn"])
      ? "Chưa đánh giá"
      : Number(task["Điểm trung bình chuyên môn"]).toFixed(2);

    row.innerHTML = `
      <td>${task["Mã GV"]}</td>
      <td>${task["Họ và tên"]}</td>
      <td>${task["Username (lms)"]}</td>
      <td>${task["Bộ phận"]}</td>
      <td>${task["Email cá nhân"]}</td>
      <td>${task["Email công việc"]}</td>
      <td>${task["Rate lương K12"]}</td>`;
  });
}

function renderTable(taskList) {
  const tbody = document.querySelector(".gvchiso tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  taskList.forEach((task, idx) => {
    const row = tbody.insertRow();
    const avgScore = isNaN(task["Điểm trung bình chuyên môn"])
      ? "Chưa đánh giá"
      : Number(task["Điểm trung bình chuyên môn"]).toFixed(2);

    row.innerHTML = `
      <td>${idx + 1}</td>
      <td>${task["Full name"]}</td>
      <td>${task.Code}</td>
      <td>${(task["Completion rate"] * 100).toFixed(2)}%</td>
      <td>${Number(task["TP"]).toFixed(2)}</td>
      <td>${avgScore}</td>
      <td>${Number(task.Technical || 0).toFixed(2)}</td>
      <td>${Number(task.Trial).toFixed(2)}</td>
      <td>${task["Sư phạm"]}</td>
      <td>${Number(task[Object.keys(task)[19]]).toFixed(2)}</td>
      <td>${task["Xếp loại"]}</td>
      <td>${task["Đánh giá"]}</td>`;
  });
}

function renderTableNote(taskList) {
  const tbody = document.querySelector(".gvNote tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  taskList.forEach((task, idx) => {
    let salary = 0;

    switch (task["Loại"]) {
      case "Trial OFF":
      case "Dạy buổi 0":
      case "Bổ trợ":
        salary = 80000 + (task["SL"] * 30000);
        break;
      case "Trial ON":
        salary = 40000 + (task["SL"] * 20000);
        break;
      case "Dạy Bù":
        salary = (task["SL"] || 0) * getRateForTeacher(task["Tên Giảng Viên"]);
        break;
    }

    // Convert yyyy-mm-dd → dd/mm/yyyy
    const d = task["Ngày"] ? new Date(task["Ngày"]) : null;
    const dateStr = d ? `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}` : "";

    const row = tbody.insertRow();
    row.innerHTML = `
      <td>${idx + 1}</td>
      <td>${task["Tên Giảng Viên"] || ""}</td>
      <td>${task["SL"] || 0}</td>
      <td>${task["Tên HV"] || ""}</td>
      <td>${task["Loại"] || ""}</td>
      <td>${task["Lớp"] || ""}</td>
      <td>${task["Buổi"] || ""}</td>
      <td>${dateStr}</td>
      <td>${task["BỘ MÔN"] || ""}</td>
      <td>${salary.toLocaleString()}</td>
      <td>${task["GHI CHÚ"] || ""}</td>`;
  });
}

// ------------------------------------------------------------
// 6) Sidebar navigation ---------------------------------------
function setupSidebar() {
  const menuItems = document.querySelectorAll(".item_");
  const contentDiv = document.querySelectorAll(".item");
  if (!menuItems.length) return;

  menuItems.forEach((btn, idx) => {
    btn.addEventListener("click", () => {
      contentDiv.forEach(div => div.classList.add("hidden"));
      contentDiv[idx].classList.remove("hidden", "table_full_width");
      menuItems.forEach(b => b.classList.remove("bg_sidebar"));
      btn.classList.add("bg_sidebar");
    });
  });
}

// ------------------------------------------------------------
// 7) Filtering -------------------------------------------------
function setupFilters() {
  const btnFilter = document.getElementById("btnFilter");
  const startDate = document.getElementById("startDate");
  const endDate = document.getElementById("endDate");
  const teacherSelect = document.getElementById("teacherSelect");

  if (!btnFilter) return; // filters aren’t on this page

  const applyFilter = () => {
    const from = startDate.value;
    const to = endDate.value;
    const teach = teacherSelect.value; // "" = tất cả

    const filtered = filterNotes(allNote, from, to, teach);
    renderTableNote(filtered);
  };

  [btnFilter, startDate, endDate, teacherSelect].forEach(el => el.addEventListener("click", applyFilter));
}

function filterNotes(notes, fromDate = null, toDate = null, teacherName = null) {
  const start = fromDate ? new Date(fromDate) : new Date(-8640000000000000);
  const end = toDate ? new Date(new Date(toDate).setHours(23, 59, 59, 999)) : new Date(8640000000000000);
  const name = teacherName ? teacherName.trim().toLowerCase() : null;

  return notes.filter(n => {
    const d = new Date(n["Ngày"] || 0);
    const matchDate = d >= start && d <= end;
    const matchName = name ? (n["Tên Giảng Viên"] || "").toLowerCase().includes(name) : true;
    return matchDate && matchName;
  });
}

function populateTeacherSelect(notes) {
  const select = document.getElementById("teacherSelect");
  if (!select) return;

  // clear except first option
  select.length = 1;
  [...new Set(notes.map(n => n["Tên Giảng Viên"]).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "vi", { sensitivity: "base" }))
    .forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    });
}

// ------------------------------------------------------------
// 8) Optional exports (for unit testing) ----------------------
export { fetchData, filterNotes, renderTable, renderTableGV, renderTableNote };
