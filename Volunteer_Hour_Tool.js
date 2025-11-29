// === 登入設定（前端假登入，每次重新開頁面都要再登入） ===
const APP_LOGIN_PASSWORD = "dasan123"; // 可以自行修改

const loginSection = document.getElementById("loginSection");
const appSection = document.getElementById("appSection");
const loginForm = document.getElementById("loginForm");
const loginPasswordInput = document.getElementById("loginPassword");
const loginErrorEl = document.getElementById("loginError");

function showApp() {
  if (loginSection) loginSection.classList.add("hidden");
  if (appSection) appSection.classList.remove("hidden");
}

function showLogin() {
  if (appSection) appSection.classList.add("hidden");
  if (loginSection) loginSection.classList.remove("hidden");
}

// 一開始顯示登入畫面
showLogin();

// 登入表單處理
if (loginForm) {
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    loginErrorEl.textContent = "";

    const inputPassword = loginPasswordInput.value.trim();

    if (!inputPassword) {
      loginErrorEl.textContent = "請先輸入密碼。";
      return;
    }

    if (inputPassword !== APP_LOGIN_PASSWORD) {
      loginErrorEl.textContent = "密碼錯誤，請再試一次。";
      loginPasswordInput.value = "";
      loginPasswordInput.focus();
      return;
    }

    loginPasswordInput.value = "";
    showApp();
  });
}

// === 服務項目 / 服務內容代碼表 ===
const SERVICE_ITEMS = [
  { code: "0060", label: "老人服務" },
  { code: "0130", label: "社區服務" },
];

const SERVICE_CONTENTS_BY_ITEM = {
  "0060": [
    { code: "0056", label: "共餐服務" },
    { code: "0055", label: "健康促進" },
    { code: "0053", label: "關懷訪視" },
  ],
  "0130": [
    { code: "0049", label: "行政支援" },
    { code: "0006", label: "資料整理" },
    { code: "0020", label: "活動支援服務" }, // 新增的服務內容
    { code: "0028", label: "引導服務" },
    { code: "0012", label: "宣導推廣服務" },
    { code: "0017", label: "環保服務" },
  ],
};

// === 資料暫存 ===
const volunteers = [];
const records = [];
let displayMode = "readable";

// 志工名單 localStorage key
const VOLUNTEER_STORAGE_KEY = "volToolVolunteers";

// DOM：志工與紀錄相關
const volunteerForm = document.getElementById("volunteer-form");
const volunteerNameInput = document.getElementById("volunteerName");
const volunteerIdInput = document.getElementById("volunteerId");
const volunteerSubmitBtn = document.getElementById("volunteerSubmitBtn");
const volunteerListEl = document.getElementById("volunteerList");

const recordVolunteerSelect = document.getElementById("recordVolunteerName");
const recordVolunteerIdInput = document.getElementById("recordVolunteerId");

const recordForm = document.getElementById("record-form");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const serviceItemSelect = document.getElementById("serviceItemSelect");
const serviceContentSelect = document.getElementById("serviceContentSelect");
const hoursInput = document.getElementById("hours");
const minutesInput = document.getElementById("minutes");
const clientCountInput = document.getElementById("clientCount");
const peopleCountDisplayInput = document.getElementById("peopleCountDisplay");
const trafficFeeInput = document.getElementById("trafficFee");
const mealFeeInput = document.getElementById("mealFee");
const recordErrorEl = document.getElementById("recordError");
const volunteerIdErrorEl = document.getElementById("volunteerIdError");
const recordSubmitBtn = document.getElementById("recordSubmitBtn");

const recordsTableBody = document.getElementById("recordsTableBody");
const copyTableBtn = document.getElementById("copyTableBtn");
const clearRecordsBtn = document.getElementById("clearRecordsBtn");
const displayModeInputs = document.querySelectorAll('input[name="displayMode"]');

// 志工編輯模式：null 表示不是在編輯
let editingVolunteerIndex = null;
// 服務紀錄編輯模式：null 表示新增，數字表示正在編輯第幾筆
let editingRecordIndex = null;

// === 工具函式 ===
function trimValue(inputEl) {
  return inputEl.value.trim();
}

function formatPeopleCountValue(value) {
  if (value === null || value === undefined || isNaN(value)) return "";
  return String(value);
}

function getServiceItemLabel(code) {
  const item = SERVICE_ITEMS.find((i) => i.code === code);
  return item ? item.label : "";
}

function getServiceContentLabel(itemCode, contentCode) {
  const list = SERVICE_CONTENTS_BY_ITEM[itemCode] || [];
  const found = list.find((c) => c.code === contentCode);
  return found ? found.label : "";
}

function toRocDate(isoDateStr) {
  if (!isoDateStr) return "";
  const parts = isoDateStr.split("-");
  if (parts.length !== 3) return isoDateStr;
  const year = Number(parts[0]) - 1911;
  const month = parts[1];
  const day = parts[2];
  const rocYear = String(year).padStart(3, "0");
  return rocYear + month + day;
}

function padCode4(code) {
  if (code === null || code === undefined) return "";
  const str = String(code).trim();
  if (!str) return "";
  return str.padStart(4, "0");
}

function parseIsoDateToDate(isoDateStr) {
  const parts = isoDateStr.split("-");
  if (parts.length !== 3) return null;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m - 1, d);
}

// 👉 台灣身分證「格式」驗證（1 個英文字母 + 9 個數字）
function isValidTaiwanId(id) {
  if (!id) return false;
  id = id.toUpperCase().trim();
  const pattern = /^[A-Z][0-9]{9}$/;
  return pattern.test(id);
}

// === localStorage：志工名單儲存 / 讀取 ===
function saveVolunteersToStorage() {
  try {
    const data = JSON.stringify(volunteers);
    localStorage.setItem(VOLUNTEER_STORAGE_KEY, data);
  } catch (e) {
    console.error("無法儲存志工名單到 localStorage", e);
  }
}

function loadVolunteersFromStorage() {
  try {
    const raw = localStorage.getItem(VOLUNTEER_STORAGE_KEY);
    if (!raw) return;

    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return;

    volunteers.length = 0;
    list.forEach((item) => {
      if (!item) return;
      if (!item.name || !item.id) return;
      volunteers.push({
        name: String(item.name),
        id: String(item.id),
      });
    });
  } catch (e) {
    console.error("無法從 localStorage 讀取志工名單", e);
  }
}

// === 服務項目 / 內容下拉 ===
function renderServiceItemOptions() {
  if (!serviceItemSelect) return;

  serviceItemSelect.innerHTML = '<option value="">請選擇服務項目</option>';

  SERVICE_ITEMS.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = item.code;
    opt.textContent = `${padCode4(item.code)} - ${item.label}`;
    serviceItemSelect.appendChild(opt);
  });

  renderServiceContentOptions("");
}

function renderServiceContentOptions(itemCode) {
  if (!serviceContentSelect) return;

  serviceContentSelect.innerHTML = "";

  if (!itemCode || !SERVICE_CONTENTS_BY_ITEM[itemCode]) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "請先選擇服務項目";
    serviceContentSelect.appendChild(opt);
    return;
  }

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "請選擇服務內容";
  serviceContentSelect.appendChild(placeholder);

  SERVICE_CONTENTS_BY_ITEM[itemCode].forEach((content) => {
    const opt = document.createElement("option");
    opt.value = content.code;
    opt.textContent = `${padCode4(content.code)} - ${content.label}`;
    serviceContentSelect.appendChild(opt);
  });
}

if (serviceItemSelect) {
  serviceItemSelect.addEventListener("change", function () {
    const itemCode = serviceItemSelect.value;
    renderServiceContentOptions(itemCode);
  });
}

// === 身分證輸入限制與 blur 檢查 ===
if (volunteerIdInput) {
  volunteerIdInput.addEventListener("input", function (e) {
    let value = e.target.value.toUpperCase();
    value = value.replace(/[^A-Z0-9]/g, "");
    if (value.length > 10) {
      value = value.slice(0, 10);
    }
    e.target.value = value;
  });

  volunteerIdInput.addEventListener("blur", function () {
    const id = volunteerIdInput.value.trim().toUpperCase();

    if (!id) {
      volunteerIdErrorEl.textContent = "";
      return;
    }

    if (!isValidTaiwanId(id)) {
      volunteerIdErrorEl.textContent =
        "身分證格式看起來怪怪的，請再確認一次。";
    } else {
      volunteerIdErrorEl.textContent = "";
    }
  });
}

// === 志工編輯模式控制 ===
function enterVolunteerEditMode(index) {
  editingVolunteerIndex = index;
  const v = volunteers[index];

  volunteerNameInput.value = v.name;
  volunteerIdInput.value = v.id;
  volunteerIdErrorEl.textContent = "";

  if (volunteerSubmitBtn) {
    volunteerSubmitBtn.textContent = "儲存修改";
  }
}

function exitVolunteerEditMode() {
  editingVolunteerIndex = null;
  if (volunteerForm) {
    volunteerForm.reset();
  }
  volunteerIdErrorEl.textContent = "";

  if (volunteerSubmitBtn) {
    volunteerSubmitBtn.textContent = "新增志工";
  }
}

// === 受服務人次預覽 ===
function updatePeopleCountPreview() {
  if (!hoursInput || !minutesInput || !clientCountInput || !peopleCountDisplayInput) {
    return;
  }

  const hours =
    hoursInput.value !== "" ? Number(hoursInput.value) : 0;
  const minutes =
    minutesInput.value !== "" ? Number(minutesInput.value) : 0;
  const clientCount =
    clientCountInput.value !== "" ? Number(clientCountInput.value) : 0;

  const totalMinutes = hours * 60 + minutes;

  // 規則：總時間不能少於 30 分鐘，否則不顯示預覽
  if (totalMinutes < 30) {
    peopleCountDisplayInput.value = "";
    return;
  }

  const totalHours = totalMinutes / 60;
  const rawPeopleCount = clientCount * totalHours;
  const roundedPeopleCount = Math.round(rawPeopleCount);

  peopleCountDisplayInput.value = String(roundedPeopleCount);
}

[hoursInput, minutesInput, clientCountInput].forEach((el) => {
  if (!el) return;
  el.addEventListener("input", updatePeopleCountPreview);
});

// === 志工名單：新增 / 修改 ===
if (volunteerForm) {
  volunteerForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = trimValue(volunteerNameInput);
    const id = trimValue(volunteerIdInput).toUpperCase();

    if (!name || !id) {
      alert("請輸入完整的志工姓名與身分證字號");
      return;
    }

    if (!isValidTaiwanId(id)) {
      volunteerIdErrorEl.textContent =
        "身分證格式看起來怪怪的，請確認後再新增或修改。";
      alert("身分證格式看起來怪怪的，請再確認一次。");
      return;
    } else {
      volunteerIdErrorEl.textContent = "";
    }

    // 檢查是否與其他志工重複（編輯時排除自己）
    const exists = volunteers.some((v, idx) => {
      if (editingVolunteerIndex !== null && idx === editingVolunteerIndex) {
        return false;
      }
      return v.id === id;
    });

    if (exists) {
      alert("此身分證字號已在志工名單中");
      return;
    }

    if (editingVolunteerIndex === null) {
      volunteers.push({ name, id });
    } else {
      volunteers[editingVolunteerIndex].name = name;
      volunteers[editingVolunteerIndex].id = id;
    }

    saveVolunteersToStorage();

    renderVolunteerList();
    renderVolunteerSelect();
    exitVolunteerEditMode();
  });
}

// === 志工名單列表渲染 + 修改 / 刪除按鈕 ===
function renderVolunteerList() {
  if (!volunteerListEl) return;
  volunteerListEl.innerHTML = "";

  volunteers.forEach((v, index) => {
    const li = document.createElement("li");
    li.dataset.index = String(index);

    li.innerHTML = `
      <div class="volunteer-text">
        ${v.name} <small>（身分證：${v.id}）</small>
      </div>
      <div class="volunteer-actions">
        <button type="button" class="btn btn-small btn-secondary" data-action="edit">
          修改
        </button>
        <button type="button" class="btn btn-small btn-danger" data-action="delete">
          刪除
        </button>
      </div>
    `;

    volunteerListEl.appendChild(li);
  });
}

// 志工列表事件代理：處理修改 / 刪除
if (volunteerListEl) {
  volunteerListEl.addEventListener("click", function (e) {
    const button = e.target.closest("button");
    if (!button) return;

    const action = button.dataset.action;
    const li = button.closest("li");
    if (!li) return;

    const index = Number(li.dataset.index);
    if (Number.isNaN(index)) return;

    if (action === "edit") {
      enterVolunteerEditMode(index);
    } else if (action === "delete") {
      const v = volunteers[index];
      const confirmed = confirm(`確定要刪除志工「${v.name}」嗎？`);
      if (!confirmed) return;

      volunteers.splice(index, 1);
      saveVolunteersToStorage();

      renderVolunteerList();
      renderVolunteerSelect();

      if (editingVolunteerIndex === index) {
        exitVolunteerEditMode();
      } else if (editingVolunteerIndex !== null && editingVolunteerIndex > index) {
        editingVolunteerIndex -= 1;
      }

      const selectedName = recordVolunteerSelect.value;
      if (selectedName === v.name) {
        recordVolunteerSelect.value = "";
        recordVolunteerIdInput.value = "";
      }
    }
  });
}

function renderVolunteerSelect() {
  if (!recordVolunteerSelect) return;
  recordVolunteerSelect.innerHTML = '<option value="">請選擇志工</option>';
  volunteers.forEach((v) => {
    const option = document.createElement("option");
    option.value = v.name;
    option.textContent = v.name;
    recordVolunteerSelect.appendChild(option);
  });
}

if (recordVolunteerSelect) {
  recordVolunteerSelect.addEventListener("change", function () {
    const selectedName = recordVolunteerSelect.value;
    const matched = volunteers.find((v) => v.name === selectedName);
    recordVolunteerIdInput.value = matched ? matched.id : "";
  });
}

// === 服務紀錄：編輯模式控制 ===
function enterRecordEditMode(index) {
  editingRecordIndex = index;
  const r = records[index];

  if (recordVolunteerSelect) {
    recordVolunteerSelect.value = r.name;
  }
  if (recordVolunteerIdInput) {
    recordVolunteerIdInput.value = r.id;
  }
  if (startDateInput) startDateInput.value = r.startDate;
  if (endDateInput) endDateInput.value = r.endDate;

  if (serviceItemSelect) {
    serviceItemSelect.value = r.serviceItemCode;
    renderServiceContentOptions(r.serviceItemCode);
  }
  if (serviceContentSelect) {
    serviceContentSelect.value = r.serviceContentCode;
  }

  if (hoursInput) hoursInput.value = r.hours ?? 0;
  if (minutesInput) minutesInput.value = r.minutes ?? 0;
  if (clientCountInput) clientCountInput.value = r.clientCount ?? 0;
  if (trafficFeeInput) trafficFeeInput.value = r.trafficFee ?? 0;
  if (mealFeeInput) mealFeeInput.value = r.mealFee ?? 0;

  if (recordErrorEl) recordErrorEl.textContent = "";
  updatePeopleCountPreview();

  if (recordSubmitBtn) {
    recordSubmitBtn.textContent = "儲存修改";
  }
}

function exitRecordEditMode() {
  editingRecordIndex = null;
  if (recordForm) {
    recordForm.reset();
  }
  if (recordVolunteerIdInput) recordVolunteerIdInput.value = "";
  if (peopleCountDisplayInput) peopleCountDisplayInput.value = "";
  renderServiceContentOptions("");

  if (clientCountInput) clientCountInput.value = "0";
  if (trafficFeeInput) trafficFeeInput.value = "0";
  if (mealFeeInput) mealFeeInput.value = "0";
  if (recordErrorEl) recordErrorEl.textContent = "";

  if (recordSubmitBtn) {
    recordSubmitBtn.textContent = "新增服務紀錄";
  }
}

// === 新增 / 修改 服務紀錄 ===
if (recordForm) {
  recordForm.addEventListener("submit", function (event) {
    event.preventDefault();
    recordErrorEl.textContent = "";

    const name = recordVolunteerSelect.value;
    const id = recordVolunteerIdInput.value;
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    const serviceItemCode = serviceItemSelect.value;
    const serviceContentCode = serviceContentSelect.value;

    // 時數相關
    const hoursStr = hoursInput.value.trim();
    const minutesStr = minutesInput.value.trim();
    const clientCountStr = clientCountInput.value.trim();

    if (!name) {
      recordErrorEl.textContent = "請選擇志工姓名。";
      return;
    }
    if (!id) {
      recordErrorEl.textContent = "請確認已選擇志工，並帶出身分證字號。";
      return;
    }
    if (!startDate || !endDate) {
      recordErrorEl.textContent = "請填寫服務起訖日期。";
      return;
    }
    if (endDate < startDate) {
      recordErrorEl.textContent = "服務日期迄不能早於服務日期起。";
      return;
    }

    const start = parseIsoDateToDate(startDate);
    const end = parseIsoDateToDate(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!start || !end) {
      recordErrorEl.textContent = "服務日期格式有問題，請重新選擇。";
      return;
    }
    if (start > today || end > today) {
      recordErrorEl.textContent = "服務日期不能晚於今天（不可填未來日期）。";
      return;
    }

    const startMonthKey = startDate.slice(0, 7);
    const endMonthKey = endDate.slice(0, 7);
    if (startMonthKey !== endMonthKey) {
      recordErrorEl.textContent = "服務起訖日期必須在同一個月份內，不能跨月。";
      return;
    }

    if (!serviceItemCode) {
      recordErrorEl.textContent = "請選擇服務項目。";
      return;
    }
    if (!serviceContentCode) {
      recordErrorEl.textContent = "請選擇服務內容。";
      return;
    }

    // 小時欄位一定要填
    if (!hoursStr) {
      recordErrorEl.textContent = "請填寫服務小時數，若不足 1 小時請填 0 並設定分鐘。";
      return;
    }

    const hours = Number(hoursStr);
    const minutes = minutesStr ? Number(minutesStr) : 0;

    if (Number.isNaN(hours) || hours < 0) {
      recordErrorEl.textContent = "小時欄位格式有問題，請輸入大於等於 0 的數字。";
      return;
    }
    if (Number.isNaN(minutes) || minutes < 0 || minutes >= 60) {
      recordErrorEl.textContent = "分鐘欄位格式有問題，請輸入 0–59 的整數。";
      return;
    }

    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes < 30) {
      recordErrorEl.textContent = "服務時間不能少於 30 分鐘（至少 0 小時 30 分）。";
      return;
    }

    const totalHours = totalMinutes / 60;

    const clientCount = clientCountStr ? Number(clientCountStr) : 0;
    if (Number.isNaN(clientCount) || clientCount < 0) {
      recordErrorEl.textContent = "人數欄位格式有問題，請輸入大於等於 0 的整數。";
      return;
    }

    const trafficFee = trafficFeeInput.value ? Number(trafficFeeInput.value) : 0;
    const mealFee = mealFeeInput.value ? Number(mealFeeInput.value) : 0;

    const rawPeopleCount = clientCount * totalHours;
    const peopleCount = Math.round(rawPeopleCount);

    const serviceItemLabel = getServiceItemLabel(serviceItemCode);
    const serviceContentLabel = getServiceContentLabel(
      serviceItemCode,
      serviceContentCode
    );

    const record = {
      name,
      id,
      startDate,
      endDate,
      serviceItemCode,
      serviceItemLabel,
      serviceContentCode,
      serviceContentLabel,
      hours,
      minutes,
      clientCount,
      peopleCount,
      trafficFee,
      mealFee,
    };

    if (editingRecordIndex === null) {
      records.push(record);
    } else {
      records[editingRecordIndex] = record;
    }

    renderRecordsTable();
    exitRecordEditMode();
  });
}

// === 表格渲染（好讀 / 匯入模式） ===
function renderRecordsTable() {
  if (!recordsTableBody) return;

  recordsTableBody.innerHTML = "";

  records.forEach((r, index) => {
    const tr = document.createElement("tr");
    tr.dataset.index = String(index);

    const startDateDisplay =
      displayMode === "import" ? toRocDate(r.startDate) : r.startDate;
    const endDateDisplay =
      displayMode === "import" ? toRocDate(r.endDate) : r.endDate;

    const serviceItemDisplay =
      displayMode === "import"
        ? (r.serviceItemCode ? padCode4(r.serviceItemCode) : "")
        : (r.serviceItemCode
            ? `${padCode4(r.serviceItemCode)}-${r.serviceItemLabel}`
            : "");

    const serviceContentDisplay =
      displayMode === "import"
        ? (r.serviceContentCode ? padCode4(r.serviceContentCode) : "")
        : (r.serviceContentCode
            ? `${padCode4(r.serviceContentCode)}-${r.serviceContentLabel}`
            : "");

    addCell(tr, r.name);
    addCell(tr, r.id);
    addCell(tr, startDateDisplay);
    addCell(tr, endDateDisplay);
    addCell(tr, serviceItemDisplay);
    addCell(tr, serviceContentDisplay);
    addCell(tr, r.hours ?? 0);
    addCell(tr, r.minutes ?? 0);
    addCell(tr, formatPeopleCountValue(r.peopleCount));
    addCell(tr, r.trafficFee ?? 0);
    addCell(tr, r.mealFee ?? 0);
    addCell(tr, "");
    addCell(tr, "");
    addCell(tr, "");
    addCell(tr, "");
    addCell(tr, "");
    addCell(tr, "");

    // 最後一欄：操作（編輯按鈕）
    const actionTd = document.createElement("td");
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "編輯";
    editBtn.className = "btn btn-small btn-secondary";
    editBtn.dataset.action = "editRecord";
    actionTd.appendChild(editBtn);
    tr.appendChild(actionTd);

    recordsTableBody.appendChild(tr);
  });
}

function addCell(tr, value) {
  const td = document.createElement("td");
  td.textContent = value;
  tr.appendChild(td);
}

// 表格列上的「編輯」按鈕事件代理
if (recordsTableBody) {
  recordsTableBody.addEventListener("click", function (e) {
    const button = e.target.closest("button");
    if (!button) return;
    if (button.dataset.action !== "editRecord") return;

    const tr = button.closest("tr");
    if (!tr) return;

    const index = Number(tr.dataset.index);
    if (Number.isNaN(index)) return;

    enterRecordEditMode(index);
  });
}

// === 複製表格內容（只複製前 17 欄，不包含「操作」欄） ===
if (copyTableBtn) {
  copyTableBtn.addEventListener("click", function () {
    if (!recordsTableBody) return;

    const rows = Array.from(recordsTableBody.querySelectorAll("tr"));
    if (rows.length === 0) {
      alert("目前沒有任何紀錄可以複製。");
      return;
    }

    const lines = rows.map((tr) => {
      const cells = Array.from(tr.querySelectorAll("td"));
      // 只取前 17 欄（官方格式需要的欄位數）
      const dataCells = cells.slice(0, 17);
      return dataCells
        .map((td) => (td.textContent || "").trim())
        .join("\t");
    });

    const text = lines.join("\n");

    if (!text.trim()) {
      alert("目前沒有任何紀錄可以複製。");
      return;
    }

    function fallbackCopy() {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        alert("表格內容已複製，可直接貼到 Excel。");
      } catch (e) {
        alert("無法自動複製，請試著手動選取表格內容。");
      } finally {
        document.body.removeChild(textarea);
      }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          alert("表格內容已複製，可直接貼到 Excel。");
        })
        .catch(() => {
          fallbackCopy();
        });
    } else {
      fallbackCopy();
    }
  });
}

// === 清空紀錄 ===
if (clearRecordsBtn) {
  clearRecordsBtn.addEventListener("click", function () {
    if (!confirm("確定要清空目前所有服務紀錄嗎？這個動作無法復原。")) {
      return;
    }
    records.length = 0;
    renderRecordsTable();
  });
}

// === 顯示模式切換 ===
if (displayModeInputs && displayModeInputs.length > 0) {
  displayModeInputs.forEach((input) => {
    input.addEventListener("change", function () {
      if (this.checked) {
        displayMode = this.value;
        renderRecordsTable();
      }
    });
  });
}

// === 初始化 ===
renderServiceItemOptions();
loadVolunteersFromStorage();
renderVolunteerList();
renderVolunteerSelect();

if (trafficFeeInput) trafficFeeInput.value = "0";
if (mealFeeInput) mealFeeInput.value = "0";
if (clientCountInput) clientCountInput.value = "0";
if (peopleCountDisplayInput) peopleCountDisplayInput.value = "";
