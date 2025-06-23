

let allTasks = []; // lưu tất cả task gọi từ Apps Script



// Hiển thị animation loading dạng sóng trong phần bảng
function showLoadingWave() {
    const tableBody = document.getElementById("taskTable").getElementsByTagName('tbody')[0];
    tableBody.innerHTML = `
    <tr>
      <td colspan="10" style="text-align:center; padding: 40px 0;">
        <div class="wave-loader">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
      </td>
    </tr>
  `;
}
// Thêm CSS cho hiệu ứng sóng
const style = document.createElement('style');
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

        allTasks = json; // lưu lại tất cả dữ liệu

        renderTable(allTasks); // hiển thị tất cả ban đầu
    } catch (error) {
        console.error("❌ Lỗi khi gọi Apps Script:", error);
    }
}

function renderTable(taskList) {
    let taskCount = 0;
    const table = document.getElementById("taskTable").getElementsByTagName('tbody')[0];
    table.innerHTML = "";
    const success = allTasks.filter(t => t.trialStatus == "Đồng ý").length;
    const canceled = allTasks.filter(t => t.trialStatus == "Hủy").length;

    document.getElementById("totalCases").textContent = allTasks.length;
    document.getElementById("successCases").textContent = success;
    document.getElementById("canceledCases").textContent = canceled;

    taskList.forEach(task => {
        taskCount++;
        const newRow = table.insertRow();
        if (isNaN(task["Điểm trung bình chuyên môn"])) {
            task["Điểm trung bình chuyên môn"] = "Chưa đánh giá";
        }
        newRow.innerHTML = `
      <td>${taskCount}</td>
      <td>${task['Full name']}</td>
      <td>${task.Code}</td>
      <td>${(task["Completion rate"] * 100).toFixed(2)}</td>
        <td> ${(task["TP"])}</td>
          <td> ${(Number(task["Điểm trung bình chuyên môn"])).toFixed(2) || 'Chưa đánh giá'} </td>
      <td>${(Number((task.Technical)) || 0).toFixed(2)}</td>
      <td>${(task.Trial).toFixed(2)}</td>
      <td>${task[`Sư phạm`]}</td>
      <td>${task[`Điểm đánh giá↵(Max = 5)`]}</td>
      <td>${task[`Xếp loại`]}</td>
      <td>${task[`Đánh giá`]}</td>
        `;
    });
}
function formatDateVN(inputDate) {
    const parts = inputDate.split("-"); // yyyy-mm-dd
    return `${parts[2]} / ${parts[1]} / ${parts[0]} `;
}
function filterByDateRange() {
    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate").value;

    if (!start || !end) {
        alert("Vui lòng chọn đủ cả hai ngày!");
        return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    let total = 0;
    let success = 0;
    let canceled = 0;

    const filteredTasks = allTasks.filter(task => {
        const [day, month, year] = task.date.split("/");
        const taskDate = new Date(`${year} - ${month} - ${day} `);

        const inRange = taskDate >= startDate && taskDate <= endDate;

        if (inRange) {
            total++;
            if (task.trialStatus === "Đã bị hủy") {
                canceled++;
            } else {
                success++;
            }
        }

        return inRange;
    });

    // Hiển thị bảng và thống kê
    renderTable(filteredTasks);

    document.getElementById("totalCases").textContent = total;
    document.getElementById("successCases").textContent = success;
    document.getElementById("canceledCases").textContent = canceled;
}

data(); // gọi hàm data để lấy dữ liệu từ Apps Script

const resetButton = document.getElementById("reset");
resetButton.addEventListener("click", function () {
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";
    renderTable(allTasks);

    document.getElementById("totalCases").textContent = allTasks.length;

    const success = allTasks.filter(t => t.trialStatus === "Đã đồng ý trải nghiệm").length;
    const canceled = allTasks.filter(t => t.trialStatus === "Đã bị hủy").length;

    document.getElementById("successCases").textContent = success;
    document.getElementById("canceledCases").textContent = canceled;
})




// sidebar
document.addEventListener('DOMContentLoaded', function () {
    var submenu = document.querySelector('.submenu');
    submenu.querySelector('a').addEventListener('click', function (e) {
        e.preventDefault();
        submenu.classList.toggle('open');
    });
});