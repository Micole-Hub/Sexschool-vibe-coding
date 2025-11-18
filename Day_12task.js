const form = document.getElementById("age-form");
const resultEl = document.getElementById("result");

function formatNumber(num) {
  return Number(num).toFixed(1);
}

// 將 YYYY-MM-DD 字串轉 Date 物件
function parseBirthdayFromDateInput(value) {
  if (!value) return null;
  const date = new Date(value + "T00:00:00");
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

// 計算狗狗年齡（年）
function calcDogAgeYears(birthday) {
  const now = new Date();
  const diffMs = now.getTime() - birthday.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const years = diffDays / 365.25;
  return years;
}

// 公式：human_age = 16 ln(dog_age) + 31
function calcHumanAge(dogAgeYears) {
  if (dogAgeYears <= 0) return null;
  return 16 * Math.log(dogAgeYears) + 31;
}

// ----------------------------------------
// ⭐ 新增：結果顯示的獨立函式（方便載入頁面時也能呼叫）
// ----------------------------------------
function renderResult(petName, birthday) {
  const dogAgeYears = calcDogAgeYears(birthday);
  if (dogAgeYears <= 0) {
    resultEl.innerHTML = `<p class="error">⚠️ 日期異常，無法計算</p>`;
    return;
  }

  const humanAge = calcHumanAge(dogAgeYears);
  if (humanAge === null || !isFinite(humanAge)) {
    resultEl.innerHTML = `<p class="error">⚠️ 計算發生錯誤</p>`;
    return;
  }

  const dogAgeDisplay = formatNumber(dogAgeYears);
  const humanAgeDisplay = formatNumber(humanAge);

  resultEl.innerHTML = `
    <p class="name">🐾 ${petName} 的年齡換算結果：</p>
    <p>・實際年齡：約 <strong>${dogAgeDisplay}</strong> 歲</p>
    <p>・換算成人類年齡：約 <strong>${humanAgeDisplay}</strong> 歲</p>
    <p class="note">
      ＊此為估算值，實際狀況會依犬種、體型、健康狀態有所不同。
    </p>
  `;
}

// ----------------------------------------
// ⭐ 新增：頁面載入時自動讀取 localStorage
// ----------------------------------------
window.addEventListener("DOMContentLoaded", function () {
  const savedName = localStorage.getItem("petName");
  const savedBirthday = localStorage.getItem("petBirthday");

  // 如果之前有存資料，就自動填入並顯示結果
  if (savedName && savedBirthday) {
    document.getElementById("name").value = savedName;
    document.getElementById("birthday").value = savedBirthday;

    const birthdayDate = parseBirthdayFromDateInput(savedBirthday);
    renderResult(savedName, birthdayDate);
  }
});

// ----------------------------------------
// 表單送出：計算 + 儲存資料進 localStorage
// ----------------------------------------
form.addEventListener("submit", function (event) {
  event.preventDefault();

  const nameInput = document.getElementById("name");
  const birthdayInput = document.getElementById("birthday");

  const petName = nameInput.value.trim() || "妙麗";
  const birthdayValue = birthdayInput.value;

  const birthday = parseBirthdayFromDateInput(birthdayValue);

  if (!birthday) {
    resultEl.innerHTML = `
      <p class="error">⚠️ 出生日期格式有問題，請重新選擇有效日期。</p>
    `;
    return;
  }

  const today = new Date();
  if (birthday.getTime() > today.getTime()) {
    resultEl.innerHTML = `
      <p class="error">⚠️ 出生日期不能在未來。</p>
    `;
    return;
  }

  // ⭐ 新增：儲存到 localStorage
  localStorage.setItem("petName", petName);
  localStorage.setItem("petBirthday", birthdayValue);

  // ⭐ 顯示結果（用抽出的函式）
  renderResult(petName, birthday);
});
