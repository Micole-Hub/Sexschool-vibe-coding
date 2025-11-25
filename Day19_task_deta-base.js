// ==========================================
// 👇 任務區域：請將你的 Google Sheet CSV 網址貼在下面 👇
// ==========================================
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQKNOyjy7V5EVG67_bT4PGT2ugk_E119dsDfSa4ElPszFUn96XtOcR7uqwkxVXvTKx09G8JAkf5yzp8/pub?output=csv";

// === 核心程式碼 (負責把資料畫出來) ===
const app = document.getElementById('app');
let allData = []; // 儲存所有資料
let currentFilter = 'all'; // 目前的篩選條件

function init() {
  if (CSV_URL.includes("你的_CSV_網址")) {
    console.warn("還沒設定網址喔！");
    return;
  }

  Papa.parse(CSV_URL, {
    download: true,
    header: true,
    complete: function (results) {
      console.log("CSV 載入成功！資料筆數:", results.data.length);
      console.log("第一筆資料:", results.data[0]);
      allData = results.data;
      renderCards(allData);
      setupFilterButtons();
    },
    error: function (error) {
      console.error("載入錯誤:", error);
      app.innerHTML = '<div class="msg-box" style="color:#ff4444; border-color:#ff4444"><h2>❌ 連線失敗</h2><p>請確認網址格式是否為 CSV</p><p>錯誤訊息: ' + error.message + '</p></div>';
    }
  });
}

// 設定篩選按鈕的點擊事件
function setupFilterButtons() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      // 移除所有按鈕的 active 樣式
      filterBtns.forEach(b => b.classList.remove('active'));
      // 加上當前按鈕的 active 樣式
      this.classList.add('active');
      // 取得篩選條件
      currentFilter = this.dataset.filter;
      filterAndRender();
    });
  });
}

// 根據篩選條件過濾並顯示資料
function filterAndRender() {
  let filteredData = allData;

  if (currentFilter !== 'all') {
    filteredData = allData.filter(item => {
      const price = parseFloat(item.price || item['price ']) || 0;
      switch (currentFilter) {
        case 'low':
          return price < 10000;
        case 'mid':
          return price >= 10000 && price <= 30000;
        case 'high':
          return price > 30000;
        default:
          return true;
      }
    });
  }

  renderCards(filteredData);
}

function renderCards(data) {
  app.innerHTML = ''; // 清除載入訊息

  // 如果沒有資料，顯示提示訊息
  if (data.length === 0 || (data.length === 1 && !data[0].name)) {
    app.innerHTML = '<div class="msg-box"><h2>😅 找不到符合條件的商品</h2><p>試試其他價格範圍吧！</p></div>';
    return;
  }

  data.forEach((item, index) => {
    // 除錯：看看實際的欄位名稱
    if (index === 0) {
      console.log("所有欄位名稱:", Object.keys(item));
      console.log("完整資料:", item);
    }

    // 取得欄位資料（處理可能的空格問題）
    const name = item.name || item['name'];
    const price = item.price || item['price '] || item['price'];
    const tags = item.tags || item['tags'];

    console.log(`商品 ${index}: name=${name}, price=${price}, tags=${tags}`);

    // 確保至少有商品名稱
    if (!name) return;

    // 處理圖片：如果沒填圖片，用預設圖示代替
    const img = item.image_url || 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&q=80';

    // 處理價格：確保轉換為數字
    const priceNum = parseFloat(price) || 0;
    const priceDisplay = priceNum.toLocaleString();

    // 處理標籤：分割標籤（可能是逗號分隔）
    const tagText = tags ? tags.split(',')[0].trim() : '';
    const tagHtml = tagText ? `<span class="tag">${tagText}</span>` : '';

    // 產生卡片 HTML
    const html = `
      <div class="card">
        ${tagHtml}
        <img src="${img}" class="card-img">
        <div class="card-info">
          <h3 class="card-title">${name}</h3>
          <span class="card-price">$${priceDisplay}</span>
        </div>
      </div>
    `;

    app.innerHTML += html;
  });
}

// 初始化
init();
