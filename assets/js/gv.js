

let allTasks = []; // lưu tất cả task gọi từ Apps Script
let gvRateMap = new Map();


// Hiển thị animation loading dạng sóng trong phần bảng
function showLoadingWave() {
  const tableBody = document.querySelector(".gvchiso").getElementsByTagName('tbody')[0];
  const tablegv = document.querySelector(".gvthongtin").getElementsByTagName('tbody')[0];
  const gvNote = document.querySelector(".gvNote").getElementsByTagName('tbody')[0];
  var ani = [tableBody, tablegv, gvNote];
  ani.forEach((tableBody) => {
    tableBody.innerHTML = `
    <tr>
      <td colspan="10" style="text-align:center; padding: 40px 0;">
        <div class="wave-loader">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
      </td>
    </tr>
  `;
  })
}
// Thêm CSS cho hiệu ứng sóng
const style = document.createElement('style');
document.querySelectorAll('table').forEach((e) => {
  e.classList.add("table_full_width"); // Thêm các lớp Bootstrap
}) // Đảm bảo bảng có chiều rộng 100%
style.innerHTML = `
.wave-loader {
  display: inline-block;
  height: 30px;
}
.wave-loader span {
  display: inline-block;
  width: 8px;
  height: 100%;
  margin: 0 2px;
  background: #3498db;
  border-radius: 4px;
  animation: wave 1s infinite ease-in-out;
}
.wave-loader span:nth-child(2) { animation-delay: 0.1s; }
.wave-loader span:nth-child(3) { animation-delay: 0.2s; }
.wave-loader span:nth-child(4) { animation-delay: 0.3s; }
.wave-loader span:nth-child(5) { animation-delay: 0.4s; }
@keyframes wave {
  0%, 100% { transform: scaleY(0.4); }
  50% { transform: scaleY(1); }
}
`;
document.head.appendChild(style);

// Gọi showLoadingWave() trước khi fetch dữ liệu
async function data() {
  try {
    showLoadingWave();
    console.log("🔄 Đang gọi Apps Script...");
    const res = await fetch("https://script.google.com/macros/s/AKfycbwk-IyOJogcDAMrTzz8gxH3MRK6iYnRI9JKBpDLtMmjaD-K3_V-BjnQeJvm9Np62Jysag/exec");
    const json = await res.json();
    console.log(json);

    allTasks = json.dataresult;
    allgv = json.datagv // lưu lại tất cả dữ liệu
    allNote = json.datanote
    gvRateMap = new Map(
      allgv.map(gv => [
        gv["Họ và tên"].trim().toLowerCase(),
        Number(gv["Rate lương K12"]) || 0            // rỗng → 0
      ])
    );
    renderTable(allTasks);
    renderTableGV(allgv)
    renderTableNote(allNote) // hiển thị tất cả ban đầu


  } catch (error) {
    console.error("❌ Lỗi khi gọi Apps Script:", error);
  }
}
function getRateForTeacher(teacherName) {
  return gvRateMap.get(teacherName.trim().toLowerCase()) ?? 0;
}

function renderTableGV(taskList) {
  let taskCount = 0;
  const table = document.querySelector(".gvthongtin").getElementsByTagName('tbody')[0];
  table.innerHTML = "";
  const success = allTasks.filter(t => t.trialStatus == "Đồng ý").length;
  const canceled = allTasks.filter(t => t.trialStatus == "Hủy").length;



  taskList.forEach(task => {
    taskCount++;
    const newRow = table.insertRow();
    if (isNaN(task["Điểm trung bình chuyên môn"])) {
      task["Điểm trung bình chuyên môn"] = "Chưa đánh giá";
    }

    keys = Object.keys(task)
    keys[19]
    newRow.innerHTML = `
      <td>${task['Mã GV']}</td>
      <td>${task['Họ và tên']}</td>
      <td>${task["Username (lms)"]}</td>
      <td>${(task["Bộ phận"])}</td>
        <td> ${(task["Email cá nhân"])}</td>
      <td>${(task['Email công việc'])}</td>
      <td>${task[`Rate lương K12`]}</td>
        `;
  });
}
function formatDateVN(inputDate) {
  const parts = inputDate.split("-"); // yyyy-mm-dd
  return `${parts[2]} / ${parts[1]} / ${parts[0]} `;
}



function renderTable(taskList) {
  let taskCount = 0;
  const table = document.querySelector(".gvchiso").getElementsByTagName('tbody')[0];
  table.innerHTML = "";
  const success = allTasks.filter(t => t.trialStatus == "Đồng ý").length;
  const canceled = allTasks.filter(t => t.trialStatus == "Hủy").length;



  taskList.forEach(task => {
    taskCount++;
    const newRow = table.insertRow();
    if (isNaN(task["Điểm trung bình chuyên môn"])) {
      task["Điểm trung bình chuyên môn"] = "Chưa đánh giá";
    }

    keys = Object.keys(task)
    keys[19]
    newRow.innerHTML = `
      <td>${taskCount}</td>
      <td>${task['Full name']}</td>
      <td>${task.Code}</td>
      <td>${(task["Completion rate"] * 100).toFixed(2) + "%"}</td>
        <td> ${(task["TP"]).toFixed(2)}</td>
          <td> ${(Number(task["Điểm trung bình chuyên môn"])).toFixed(2)} </td>
      <td>${(Number((task.Technical)) || 0).toFixed(2)}</td>
      <td>${(task.Trial).toFixed(2)}</td>
      <td>${task[`Sư phạm`]}</td>
      <td>${task[keys[19]].toFixed(2)}</td>
      <td>${task[`Xếp loại`]}</td>
      <td>${task[`Đánh giá`]}</td>
        `;
  });
}
function formatDateVN(inputDate) {
  const parts = inputDate.split("-"); // yyyy-mm-dd
  return `${parts[2]} / ${parts[1]} / ${parts[0]} `;
}





function renderTableNote(taskList) {
  const table = document.querySelector(".gvNote tbody");
  table.innerHTML = "";

  taskList.forEach((task, index) => {
    let luong = 0;

    if (task["Loại"] === "Trial OFF" || task["Loại"] === "Dạy buổi 0" || task["Loại"] === "Bổ trợ") {
      luong = 80000 + (task["SL"] * 30000);
    } else if (task["Loại"] === "Dạy Bù") {
      const rate = getRateForTeacher(task["Tên Giảng Viên"]);
      luong = (task["SL"] || 0) * rate;
    }
    else if (task["Loại"] === "Trial ON") {
      luong = 40000 + (task["SL"] * 20000);
    }

    // Định dạng ngày: yyyy-mm-dd → dd/mm/yyyy
    let ngay = "";
    if (task["Ngày"]) {
      const d = new Date(task["Ngày"]);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      ngay = `${dd}/${mm}/${yyyy}`;
    }

    const newRow = table.insertRow();
    newRow.innerHTML = `
      <td>${index + 1}</td>
      <td>${task["Tên Giảng Viên"] || ""}</td>
      <td>${task["SL"] || 0}</td>
      <td>${task["Tên HV"] || ""}</td>
      <td>${task["Loại"] || ""}</td>
      <td>${task["Lớp"] || ""}</td>
      <td>${task["Buổi"] || ""}</td>
      <td>${ngay}</td>
      <td>${task["BỘ MÔN"] || ""}</td>
      <td>${luong.toLocaleString()}</td>
      <td>${task["GHI CHÚ"] || ""}</td>
    `;
  });
}




data(); // gọi hàm data để lấy dữ liệu từ Apps Script


// sidebar


var item_ = document.querySelectorAll(".item_");
console.log(item_);

var item = document.querySelectorAll(".item");
item_.forEach((item1, i) => {
  item1.addEventListener("click", function () {
    item.forEach(i => {
      i.classList.add("hidden")

    })
    item[i].classList.remove("hidden");
    item[i].classList.add("table_full_width");
    item_.forEach(itemmm => {
      itemmm.classList.remove("bg_sidebar");
    });
    item1.classList.add("bg_sidebar");

  });
});
