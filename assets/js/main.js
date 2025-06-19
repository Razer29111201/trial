let allTasks = []; // lưu tất cả task gọi từ Apps Script

async function data() {
  try {
    console.log("🔄 Đang gọi Apps Script...");
    const res = await fetch("https://script.google.com/macros/s/AKfycbzwkST95xuDJW_sXBDaNiv4221mTnnewJ1JY3s1VPcBzmXTyZileK4TGRn77nqh804/exec");
    const json = await res.json();
    console.log(json);

    allTasks = json.data; // lưu lại tất cả dữ liệu

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
    newRow.innerHTML = `
      <td>${taskCount}</td>
      <td>${task.sale}</td>
      <td>${task.hvName}</td>
      <td>${task.class}</td>
      <td>${task.subject}</td>
      <td>${task.date}</td>
      <td>${task.hours}</td>
      <td>${task.type}</td>
      <td>${task.trialStatus}</td>
      <td>${task.teacher}</td>
    `;
  });
}
function formatDateVN(inputDate) {
  const parts = inputDate.split("-"); // yyyy-mm-dd
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
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
    const taskDate = new Date(`${year}-${month}-${day}`);

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