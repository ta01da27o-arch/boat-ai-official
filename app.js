// app.js
// 競艇AI予想 フロントエンド制御
// 2025-11版

// ===== DOMキャッシュ =====
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");
const dateLabel = document.getElementById("dateLabel");
const aiStatus = document.getElementById("aiStatus");

// 各画面
const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");

const backToVenues = document.getElementById("backToVenues");
const backToRaces = document.getElementById("backToRaces");

const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");

// 出走表テーブル
const entryTable = document.getElementById("entryTable").querySelector("tbody");

// ===== 状態 =====
let currentData = null;
let currentVenue = null;
let currentRace = null;

// ===== 初期化 =====
window.addEventListener("DOMContentLoaded", () => {
  todayBtn.addEventListener("click", () => switchDate("today"));
  yesterdayBtn.addEventListener("click", () => switchDate("yesterday"));
  refreshBtn.addEventListener("click", fetchTodayData);
  backToVenues.addEventListener("click", () => showScreen("venues"));
  backToRaces.addEventListener("click", () => showScreen("races"));

  switchDate("today"); // 初回読み込み
});

// ===== 日付切替 =====
async function switchDate(mode) {
  todayBtn.classList.toggle("active", mode === "today");
  yesterdayBtn.classList.toggle("active", mode === "yesterday");

  if (mode === "today") {
    await fetchTodayData();
  } else {
    await fetchYesterdayData();
  }
}

// ===== データ取得 =====
async function fetchTodayData() {
  aiStatus.textContent = "取得中...";
  try {
    const res = await fetch("/api/today");
    if (!res.ok) throw new Error("通信エラー");
    const data = await res.json();
    currentData = data;
    renderVenues(data);
    dateLabel.textContent = formatDate(data.date);
    aiStatus.textContent = "取得完了";
  } catch (e) {
    console.error(e);
    aiStatus.textContent = "取得失敗";
  }
}

async function fetchYesterdayData() {
  aiStatus.textContent = "取得中...";
  try {
    const res = await fetch("/api/yesterday");
    if (!res.ok) throw new Error("通信エラー");
    const data = await res.json();
    currentData = data;
    renderVenues(data);
    dateLabel.textContent = formatDate(data.date);
    aiStatus.textContent = "取得完了";
  } catch (e) {
    console.error(e);
    aiStatus.textContent = "取得失敗";
  }
}

// ===== 画面描画 =====
function renderVenues(data) {
  showScreen("venues");
  venuesGrid.innerHTML = "";
  (data.venues || []).forEach(v => {
    const div = document.createElement("div");
    div.className = "venue-card clickable";
    div.innerHTML = `
      <div class="v-name">${v.name}</div>
      <div class="v-status">${v.races?.length || 0}R</div>
      <div class="v-rate">${v.comment || ""}</div>
    `;
    div.addEventListener("click", () => openVenue(v));
    venuesGrid.appendChild(div);
  });
}

function openVenue(v) {
  currentVenue = v;
  venueTitle.textContent = v.name;
  showScreen("races");
  renderRaces(v.races);
}

function renderRaces(races) {
  racesGrid.innerHTML = "";
  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    const race = races.find(r => r.raceNo === i);
    btn.className = "race-btn" + (race ? "" : " disabled");
    btn.textContent = `${i}R`;
    if (race) btn.addEventListener("click", () => openRace(race));
    racesGrid.appendChild(btn);
  }
}

function openRace(race) {
  currentRace = race;
  raceTitle.textContent = `${currentVenue.name} ${race.raceNo}R`;
  showScreen("detail");
  renderEntries(race.entries);
}

// ===== 出走表描画 =====
function renderEntries(entries) {
  entryTable.innerHTML = "";
  entries.forEach(e => {
    const tr = document.createElement("tr");
    tr.classList.add(`row-${e.lane}`);
    tr.innerHTML = `
      <td>${e.lane}</td>
      <td>
        <div class="entry-left">
          <div class="klass">${e.class}</div>
          <div class="name">${e.name}</div>
          <div class="st">ST ${e.st}</div>
        </div>
      </td>
      <td>${e.f || "-"}</td>
      <td>${e.local || "-"}</td>
      <td>${e.mt || "-"}</td>
      <td>${e.course || "-"}</td>
      <td><span class="eval-mark">${e.eval || "-"}</span></td>
    `;
    entryTable.appendChild(tr);
  });
}

// ===== 汎用関数 =====
function showScreen(screen) {
  screenVenues.classList.toggle("active", screen === "venues");
  screenRaces.classList.toggle("active", screen === "races");
  screenDetail.classList.toggle("active", screen === "detail");
}

function formatDate(str) {
  if (!str) return "--/--/----";
  const d = new Date(str);
  const y = d.getFullYear();
  const m = ("0" + (d.getMonth() + 1)).slice(-2);
  const day = ("0" + d.getDate()).slice(-2);
  return `${y}/${m}/${day}`;
      }
