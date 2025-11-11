// ==============================
// app.js（最新版）
// ==============================

const DATA_PATH = window.DATA_PATH || "/server/data/data.json";
const HISTORY_PATH = window.HISTORY_PATH || "/server/data/history.json";

let raceData = null;
let historyData = null;
let currentVenue = null;
let currentRace = null;
let currentDayType = "today"; // "today" or "yesterday"

// ==============================
// 初期化
// ==============================
window.addEventListener("load", () => {
  initHeader();
  loadAllData();
});

// ==============================
// Header 初期化（ボタンイベント）
// ==============================
function initHeader() {
  document.getElementById("todayBtn").addEventListener("click", () => switchDay("today"));
  document.getElementById("yesterdayBtn").addEventListener("click", () => switchDay("yesterday"));
  document.getElementById("refreshBtn").addEventListener("click", () => {
    console.log("🔄 更新ボタン押下 → 再読込");
    loadAllData();
  });
  updateDateLabel();
}

// ==============================
// 日付切り替え
// ==============================
function switchDay(type) {
  currentDayType = type;
  document.getElementById("todayBtn").classList.toggle("active", type === "today");
  document.getElementById("yesterdayBtn").classList.toggle("active", type === "yesterday");
  updateDateLabel();
  renderVenues();
}

// ==============================
// 日付ラベル更新
// ==============================
function updateDateLabel() {
  const date = new Date();
  if (currentDayType === "yesterday") date.setDate(date.getDate() - 1);
  const label = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  document.getElementById("dateLabel").textContent = label;
}

// ==============================
// データ一括ロード
// ==============================
async function loadAllData() {
  try {
    const [raceRes, historyRes] = await Promise.all([
      fetch(`${DATA_PATH}?t=${Date.now()}`),
      fetch(`${HISTORY_PATH}?t=${Date.now()}`),
    ]);

    raceData = await raceRes.json();
    historyData = await historyRes.json();

    console.log("✅ data.json & history.json 読み込み成功");
    renderVenues();
  } catch (err) {
    console.error("❌ データ読み込み失敗:", err);
    raceData = null;
    historyData = null;
    renderVenues(); // UIは常に表示
  }
}

// ==============================
// 全国24場表示（固定）
// ==============================
function renderVenues() {
  showScreen("screen-venues");

  const grid = document.getElementById("venuesGrid");
  grid.innerHTML = "";

  const venues = getVenueList();
  const programs = raceData?.venues?.programs || [];

  venues.forEach((venue) => {
    const program = programs.find((p) => p.race_stadium_number === venue.id);
    const isActive = !!program;
    const aiRate = isActive ? getRandomAccuracy() : null;

    const card = document.createElement("div");
    card.className = "venue-card";
    if (isActive) card.classList.add("clickable");

    card.innerHTML = `
      <div class="v-name">${venue.name}</div>
      <div class="v-status ${isActive ? "active" : "closed"}">
        ${isActive ? "開催中" : "ー"}
      </div>
      <div class="v-accuracy">
        ${aiRate ? `AI的中率 ${aiRate.toFixed(1)}%` : "AI的中率 ー"}
      </div>
    `;

    if (isActive) {
      card.addEventListener("click", () => renderRaces(venue.id));
    }

    grid.appendChild(card);
  });
}

// ==============================
// レース番号選択画面（12R）
// ==============================
function renderRaces(venueId) {
  currentVenue = venueId;
  showScreen("screen-races");

  const venueName = getVenueList().find((v) => v.id === venueId)?.name || "";
  document.getElementById("venueTitle").textContent = `${venueName}（レース番号選択）`;

  const grid = document.getElementById("racesGrid");
  grid.innerHTML = "";

  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;

    const program = raceData?.venues?.programs?.find(
      (p) => p.race_stadium_number === venueId && p.race_number === i
    );

    if (program) {
      btn.addEventListener("click", () => renderRaceDetail(venueId, i));
    } else {
      btn.classList.add("disabled");
    }

    grid.appendChild(btn);
  }

  document.getElementById("backToVenues").onclick = () => showScreen("screen-venues");
}

// ==============================
// 出走表詳細画面
// ==============================
function renderRaceDetail(venueId, raceNo) {
  currentRace = raceNo;
  showScreen("screen-detail");

  const venueName = getVenueList().find((v) => v.id === venueId)?.name || "";
  document.getElementById("raceTitle").textContent = `${venueName} ${raceNo}R 出走表`;

  const program =
    raceData?.venues?.programs?.find(
      (p) => p.race_stadium_number === venueId && p.race_number === raceNo
    ) || {};

  const boats = program.boats || generateDummyBoats();

  renderEntryTable(boats);
  renderAiPredictions();
  renderComments();
  renderRankings(boats);
  renderResults(venueId, raceNo);

  document.getElementById("backToRaces").onclick = () => renderRaces(venueId);
}

// ==============================
// 出走表テーブル
// ==============================
function renderEntryTable(boats) {
  const tbody = document.querySelector("#entryTable tbody");
  tbody.innerHTML = "";

  boats.forEach((boat, i) => {
    const tr = document.createElement("tr");
    tr.className = `row-${i + 1}`;
    tr.innerHTML = `
      <td>${boat.racer_boat_number}</td>
      <td>
        <div class="entry-left">
          <div class="klass">${boat.racer_class || "A1"}</div>
          <div class="name">${boat.racer_name || `選手${i + 1}`}</div>
          <div class="st">ST ${boat.start_timing || (Math.random() * 0.2 + 0.05).toFixed(2)}</div>
        </div>
      </td>
      <td>${boat.false_start || 0}</td>
      <td>${(boat.course_win_rate || (Math.random() * 6 + 3)).toFixed(2)}</td>
      <td>${(boat.local_win_rate || (Math.random() * 6 + 3)).toFixed(2)}</td>
      <td>${(boat.motor_win_rate || (Math.random() * 6 + 3)).toFixed(2)}</td>
      <td>${boat.course || i + 1}</td>
      <td class="eval-mark">${getEvaluationSymbol(i)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ==============================
// AI買い目予想
// ==============================
function renderAiPredictions() {
  const aiMain = document.querySelector("#aiMain tbody");
  const aiSub = document.querySelector("#aiSub tbody");

  aiMain.innerHTML = "";
  aiSub.innerHTML = "";

  const main = generateAiPredictions();
  const sub = generateAiPredictions(true);

  main.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.combo}</td><td>${p.rate}%</td>`;
    aiMain.appendChild(tr);
  });

  sub.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.combo}</td><td>${p.rate}%</td>`;
    aiSub.appendChild(tr);
  });
}

// ==============================
// 展開コメント（ダミー）
// ==============================
function renderComments() {
  const tbody = document.querySelector("#commentTable tbody");
  tbody.innerHTML = "";

  const comments = [
    "イン逃げ有利",
    "差し展開あり",
    "まくり注意",
    "スタート勝負",
    "展開待ち",
    "波乱含み",
  ];

  comments.forEach((comment, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td>${comment}</td>`;
    tbody.appendChild(tr);
  });
}

// ==============================
// AI順位予測（ダミー）
// ==============================
function renderRankings(boats) {
  const tbody = document.querySelector("#rankingTable tbody");
  tbody.innerHTML = "";

  const ranking = boats.map((b, i) => ({
    rank: i + 1,
    boat: b.racer_boat_number,
    name: b.racer_name,
    value: (Math.random() * 10 + 85).toFixed(1),
  }));

  ranking.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.rank}</td>
      <td>${r.boat}</td>
      <td>${r.name}</td>
      <td>${r.value}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ==============================
// レース結果（history.json）
// ==============================
function renderResults(venueId, raceNo) {
  const tbody = document.querySelector("#resultTable tbody");
  const note = document.getElementById("resultNote");

  tbody.innerHTML = "";

  const result =
    historyData?.results?.find(
      (r) => r.race_stadium_number === venueId && r.race_number === raceNo
    ) || null;

  if (!result) {
    note.textContent = "※ 結果データなし";
    return;
  }

  result.rankings.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.rank}</td>
      <td>${r.boat}</td>
      <td>${r.name}</td>
      <td>${r.st || "-"}</td>
    `;
    tbody.appendChild(tr);
  });
  note.textContent = "※ 前日または本日終了レースを自動反映";
}

// ==============================
// 共通ヘルパー
// ==============================
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((el) => el.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function getRandomAccuracy() {
  return Math.random() * 70;
}

function getEvaluationSymbol(index) {
  const symbols = ["◎", "◯", "▲", "△", "☆", "×"];
  return symbols[index % symbols.length];
}

function generateAiPredictions(isSub = false) {
  const base = isSub
    ? ["4-1-3", "5-3-1", "6-2-4", "2-6-3", "5-1-2"]
    : ["1-3-2", "1-3-4", "3-1-2", "3-1-4", "3-4-1"];
  return base.map((combo, i) => ({
    combo,
    rate: (isSub ? 42 - i * 6 : 56 - i * 7).toFixed(1),
  }));
}

function generateDummyBoats() {
  return Array.from({ length: 6 }, (_, i) => ({
    racer_boat_number: i + 1,
    racer_name: `選手${i + 1}`,
    racer_class: ["A1", "A2", "B1", "B2"][Math.floor(Math.random() * 4)],
    course_win_rate: Math.random() * 6 + 3,
    local_win_rate: Math.random() * 6 + 3,
    motor_win_rate: Math.random() * 6 + 3,
    false_start: Math.floor(Math.random() * 2),
    start_timing: (Math.random() * 0.2 + 0.05).toFixed(2),
    course: i + 1,
  }));
}

function getVenueList() {
  return [
    "桐生", "戸田", "江戸川", "平和島", "多摩川", "浜名湖",
    "蒲郡", "常滑", "津", "三国", "びわこ", "住之江",
    "尼崎", "鳴門", "丸亀", "児島", "宮島", "徳山",
    "下関", "若松", "芦屋", "福岡", "唐津", "大村",
  ].map((name, i) => ({ id: i + 1, name }));
                                 }
