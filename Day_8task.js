const form = document.getElementById("age-form");
const resultEl = document.getElementById("result");

function formatNumber(num) {
  // 取到小數一位
  return Number(num).toFixed(1);
}

// 由 <input type="date"> 的值 (YYYY-MM-DD) 轉成 Date 物件
function parseBirthdayFromDateInput(value) {
  if (!value) return null; // 空的直接回傳 null
  // 這裡 value 會是 'YYYY-MM-DD'
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

// human_age = 16 ln(dog_age) + 31
function calcHumanAge(dogAgeYears) {
  if (dogAgeYears <= 0) return null;
  return 16 * Math.log(dogAgeYears) + 31;
}

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const nameInput = document.getElementById("name");
  const birthdayInput = document.getElementById("birthday");

  const petName = nameInput.value.trim() || "妙麗";
  const birthdayValue = birthdayInput.value;

  const birthday = parseBirthdayFromDateInput(birthdayValue);

  if (!birthday) {
    resultEl.innerHTML = `
      <p class="error">
        ⚠️ 出生日期格式有問題，請重新選擇一個有效的日期。
      </p>
    `;
    return;
  }

  const today = new Date();
  if (birthday.getTime() > today.getTime()) {
    resultEl.innerHTML = `
      <p class="error">
        ⚠️ 出生日期不能在未來，請再確認一次～ 
      </p>
    `;
    return;
  }

  const dogAgeYears = calcDogAgeYears(birthday);

  if (dogAgeYears <= 0) {
    resultEl.innerHTML = `
      <p class="error">
        ⚠️ 無法計算年齡，請確認日期是否正確。
      </p>
    `;
    return;
  }

  const humanAge = calcHumanAge(dogAgeYears);

  if (humanAge === null || !isFinite(humanAge)) {
    resultEl.innerHTML = `
      <p class="error">
        ⚠️ 發生未知錯誤，請稍後再試一次。
      </p>
    `;
    return;
  }

  const dogAgeDisplay = formatNumber(dogAgeYears);
  const humanAgeDisplay = formatNumber(humanAge);

  resultEl.innerHTML = `
    <p class="name">🐾 ${petName} 的年齡換算結果：</p>
    <p>・實際年齡：約 <strong>${dogAgeDisplay}</strong> 歲（以年計算）</p>
    <p>・換算成人類年齡：約 <strong>${humanAgeDisplay}</strong> 歲</p>
    <p class="note">
      ＊此為估算值，實際狀況會依犬種、體型、健康狀態有所不同。
    </p>
  `;
});
