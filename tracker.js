// ===============================
// EDUTRACK - MULTI PAGE TRACKER
// PURE FRONTEND USING localStorage
// ===============================

const STORAGE_KEY = "edutrack_state_v2";
const MAX_ACTIVITY = 10;
const MODULES = [
  "HTML Basics",
  "CSS Styling",
  "JavaScript",
  "DOM Interactivity",
  "Algorithms",
  "Data Structures"
];

// -----------------------------
// QUEUE
// -----------------------------
class EventQueue {
  constructor(items = []) {
    this.items = items;
  }

  enqueue(item) {
    this.items.push(item);
  }

  dequeue() {
    return this.items.length ? this.items.shift() : null;
  }

  size() {
    return this.items.length;
  }

  clear() {
    this.items = [];
  }
}

// -----------------------------
// STACK
// -----------------------------
class ActionStack {
  constructor(items = []) {
    this.items = items;
  }

  push(item) {
    this.items.push(item);
  }

  pop() {
    return this.items.length ? this.items.pop() : null;
  }

  clear() {
    this.items = [];
  }
}

// -----------------------------
// STATE
// -----------------------------
function defaultModuleStats(name) {
  return {
    name,
    opens: 0,
    clicks: 0,
    timeSpent: 0,
    scrollDepth: 0,
    bookmarked: false,
    completed: false
  };
}

function getDefaultState() {
  const modules = {};
  MODULES.forEach((name) => {
    modules[name] = defaultModuleStats(name);
  });

  return {
    totalClicks: 0,
    goals: [],
    recentActivity: [],
    modules,
    queue: [],
    undoStack: []
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return getDefaultState();

  try {
    const parsed = JSON.parse(raw);
    const fresh = getDefaultState();

    fresh.totalClicks = parsed.totalClicks || 0;
    fresh.goals = Array.isArray(parsed.goals) ? parsed.goals : [];
    fresh.recentActivity = Array.isArray(parsed.recentActivity) ? parsed.recentActivity : [];
    fresh.queue = Array.isArray(parsed.queue) ? parsed.queue : [];
    fresh.undoStack = Array.isArray(parsed.undoStack) ? parsed.undoStack : [];

    if (parsed.modules) {
      MODULES.forEach((name) => {
        fresh.modules[name] = {
          ...defaultModuleStats(name),
          ...parsed.modules[name]
        };
      });
    }

    return fresh;
  } catch (error) {
    return getDefaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();
let eventQueue = new EventQueue(state.queue);
let undoStack = new ActionStack(state.undoStack);

// -----------------------------
// HELPERS
// -----------------------------
function syncStructuresToState() {
  state.queue = eventQueue.items;
  state.undoStack = undoStack.items;
}

function getTimeLabel() {
  return new Date().toLocaleTimeString();
}

function addRecentActivity(message) {
  state.recentActivity.unshift({
    time: getTimeLabel(),
    message
  });

  if (state.recentActivity.length > MAX_ACTIVITY) {
    state.recentActivity.length = MAX_ACTIVITY;
  }
}

function queueEvent(type, topic, extra = {}) {
  eventQueue.enqueue({
    type,
    topic,
    extra,
    createdAt: Date.now()
  });
  syncStructuresToState();
  saveState();
  updateUI();
}

function processQueue() {
  let processed = 0;

  while (eventQueue.size() > 0 && processed < 6) {
    const event = eventQueue.dequeue();
    const topic = event.topic;

    if (topic && state.modules[topic]) {
      if (event.type === "open") {
        state.modules[topic].opens += 1;
        addRecentActivity(`Opened ${topic}`);
      } else if (event.type === "click") {
        state.totalClicks += 1;
        state.modules[topic].clicks += 1;
      } else if (event.type === "bookmark") {
        addRecentActivity(`Bookmarked ${topic}`);
      } else if (event.type === "complete") {
        addRecentActivity(`Completed ${topic}`);
      } else if (event.type === "goal-add") {
        addRecentActivity(`Added goal: ${event.extra.text}`);
      } else if (event.type === "goal-pop") {
        addRecentActivity(`Popped goal: ${event.extra.text}`);
      } else if (event.type === "goal-clear") {
        addRecentActivity("Cleared all goals");
      } else if (event.type === "note") {
        addRecentActivity(`Saved note in ${topic}`);
      }
    } else {
      if (event.type === "goal-add") addRecentActivity(`Added goal: ${event.extra.text}`);
      if (event.type === "goal-pop") addRecentActivity(`Popped goal: ${event.extra.text}`);
      if (event.type === "goal-clear") addRecentActivity("Cleared all goals");
    }

    processed++;
  }

  syncStructuresToState();
  saveState();
  updateUI();
}

setInterval(processQueue, 350);

function getTopTopics() {
  return Object.values(state.modules)
    .map((m) => ({
      name: m.name,
      score: m.opens + m.clicks + (m.bookmarked ? 3 : 0) + (m.completed ? 4 : 0),
      timeSpent: m.timeSpent
    }))
    .sort((a, b) => b.score - a.score || b.timeSpent - a.timeSpent);
}

function getAverageScroll() {
  const values = Object.values(state.modules).map((m) => m.scrollDepth || 0);
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return Math.round(sum / values.length);
}

function getTotalTime() {
  return Object.values(state.modules).reduce((acc, module) => acc + module.timeSpent, 0);
}

function getBookmarkCount() {
  return Object.values(state.modules).filter((m) => m.bookmarked).length;
}

function getCompletedCount() {
  return Object.values(state.modules).filter((m) => m.completed).length;
}

// -----------------------------
// DASHBOARD UI
// -----------------------------
function updateDashboardUI() {
  const clickCountEl = document.getElementById("clickCount");
  const scrollDepthEl = document.getElementById("scrollDepth");
  const timeSpentEl = document.getElementById("timeSpent");
  const queueSizeEl = document.getElementById("queueSize");
  const bookmarkCountEl = document.getElementById("bookmarkCount");
  const completedModulesCountEl = document.getElementById("completedModulesCount");
  const totalModulesCountEl = document.getElementById("totalModulesCount");
  const mostActiveTopicEl = document.getElementById("mostActiveTopic");
  const topTopicsListEl = document.getElementById("topTopicsList");
  const recentActivityListEl = document.getElementById("recentActivityList");
  const goalListEl = document.getElementById("goalList");
  const searchResultsEl = document.getElementById("searchResults");

  if (!clickCountEl) return;

  clickCountEl.textContent = state.totalClicks;
  scrollDepthEl.textContent = `${getAverageScroll()}%`;
  timeSpentEl.textContent = `${getTotalTime()}s`;
  queueSizeEl.textContent = eventQueue.size();
  bookmarkCountEl.textContent = getBookmarkCount();
  completedModulesCountEl.textContent = getCompletedCount();
  totalModulesCountEl.textContent = MODULES.length;

  const topTopics = getTopTopics();
  mostActiveTopicEl.textContent = topTopics.length && topTopics[0].score > 0 ? topTopics[0].name : "-";

  topTopicsListEl.innerHTML = "";
  if (topTopics.every((item) => item.score === 0 && item.timeSpent === 0)) {
    topTopicsListEl.innerHTML = "<li>No topic activity yet.</li>";
  } else {
    topTopics.slice(0, 5).forEach((item, index) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${index + 1}. ${item.name}</strong><br>Score: ${item.score} | Time: ${item.timeSpent}s`;
      topTopicsListEl.appendChild(li);
    });
  }

  recentActivityListEl.innerHTML = "";
  if (state.recentActivity.length === 0) {
    recentActivityListEl.innerHTML = "<li>No recent activity yet.</li>";
  } else {
    state.recentActivity.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${item.time}</strong><br>${item.message}`;
      recentActivityListEl.appendChild(li);
    });
  }

  if (goalListEl) {
    goalListEl.innerHTML = "";
    if (state.goals.length === 0) {
      goalListEl.innerHTML = "<li>No goals added yet.</li>";
    } else {
      state.goals.forEach((goal, index) => {
        const label = goal.priority === 1 ? "High" : goal.priority === 2 ? "Medium" : "Low";
        const li = document.createElement("li");
        li.textContent = `${index + 1}. ${goal.text} (${label})`;
        goalListEl.appendChild(li);
      });
    }
  }

  if (searchResultsEl && searchResultsEl.dataset.initialized !== "true") {
    searchResultsEl.dataset.initialized = "true";
    searchResultsEl.innerHTML = "";
  }
}

function setupDashboardActions() {
  const goalForm = document.getElementById("goalForm");
  const goalText = document.getElementById("goalText");
  const goalPriority = document.getElementById("goalPriority");
  const popGoalBtn = document.getElementById("popGoalBtn");
  const clearGoalsBtn = document.getElementById("clearGoalsBtn");
  const searchInput = document.getElementById("searchInput");
  const resetAnalyticsBtn = document.getElementById("resetAnalyticsBtn");
  const undoBtn = document.getElementById("undoBtn");
  const searchResultsEl = document.getElementById("searchResults");

  if (goalForm) {
    goalForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const text = goalText.value.trim();
      const priority = Number(goalPriority.value);

      if (!text || !priority) return;

      state.goals.push({ text, priority });
      state.goals.sort((a, b) => a.priority - b.priority);
      undoStack.push({ type: "goal-add" });
      queueEvent("goal-add", "Goals", { text });
      syncStructuresToState();
      saveState();
      updateUI();
      goalForm.reset();
    });
  }

  if (popGoalBtn) {
    popGoalBtn.addEventListener("click", function () {
      if (state.goals.length === 0) return;

      state.goals.sort((a, b) => a.priority - b.priority);
      const removed = state.goals.shift();
      undoStack.push({ type: "goal-pop", payload: removed });
      queueEvent("goal-pop", "Goals", { text: removed.text });
      syncStructuresToState();
      saveState();
      updateUI();
    });
  }

  if (clearGoalsBtn) {
    clearGoalsBtn.addEventListener("click", function () {
      if (state.goals.length === 0) return;

      const oldGoals = [...state.goals];
      state.goals = [];
      undoStack.push({ type: "goal-clear", payload: oldGoals });
      queueEvent("goal-clear", "Goals");
      syncStructuresToState();
      saveState();
      updateUI();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const query = this.value.trim().toLowerCase();
      searchResultsEl.innerHTML = "";

      if (query === "") return;

      const results = MODULES.filter((module) => module.toLowerCase().includes(query));

      if (results.length === 0) {
        searchResultsEl.innerHTML = "<li>No matching module found.</li>";
        return;
      }

      results.forEach((result) => {
        const href = getModuleHref(result);
        const li = document.createElement("li");
        li.innerHTML = `<a href="${href}">${result}</a>`;
        searchResultsEl.appendChild(li);
      });
    });
  }

  if (resetAnalyticsBtn) {
    resetAnalyticsBtn.addEventListener("click", function () {
      localStorage.removeItem(STORAGE_KEY);
      state = getDefaultState();
      eventQueue = new EventQueue(state.queue);
      undoStack = new ActionStack(state.undoStack);
      saveState();
      updateUI();
    });
  }

  if (undoBtn) {
    undoBtn.addEventListener("click", function () {
      const action = undoStack.pop();
      if (!action) return;

      if (action.type === "bookmark-toggle") {
        const topic = action.topic;
        state.modules[topic].bookmarked = action.previous;
        addRecentActivity(`Undo bookmark change for ${topic}`);
      } else if (action.type === "complete-toggle") {
        const topic = action.topic;
        state.modules[topic].completed = action.previous;
        addRecentActivity(`Undo completion change for ${topic}`);
      } else if (action.type === "goal-add") {
        state.goals.pop();
        addRecentActivity("Undo goal add");
      } else if (action.type === "goal-pop") {
        state.goals.unshift(action.payload);
        state.goals.sort((a, b) => a.priority - b.priority);
        addRecentActivity("Undo goal pop");
      } else if (action.type === "goal-clear") {
        state.goals = [...action.payload];
        addRecentActivity("Undo clear goals");
      }

      syncStructuresToState();
      saveState();
      updateUI();
    });
  }
}

// -----------------------------
// MODULE PAGE UI
// -----------------------------
function getModuleNameFromBody() {
  return document.body.dataset.module || "";
}

function getModuleHref(name) {
  const map = {
    "HTML Basics": "html-module.html",
    "CSS Styling": "css-module.html",
    "JavaScript": "javascript-module.html",
    "DOM Interactivity": "dom-module.html",
    "Algorithms": "algorithms-module.html",
    "Data Structures": "data-structures-module.html"
  };
  return map[name] || "index.html";
}

function updateModulePageUI(moduleName) {
  const moduleStats = state.modules[moduleName];
  if (!moduleStats) return;

  const moduleOpenCount = document.getElementById("moduleOpenCount");
  const moduleTimeSpent = document.getElementById("moduleTimeSpent");
  const moduleScrollDepth = document.getElementById("moduleScrollDepth");
  const moduleClickCount = document.getElementById("moduleClickCount");
  const bookmarkStatus = document.getElementById("bookmarkStatus");
  const completeStatus = document.getElementById("completeStatus");

  if (moduleOpenCount) moduleOpenCount.textContent = moduleStats.opens;
  if (moduleTimeSpent) moduleTimeSpent.textContent = `${moduleStats.timeSpent}s`;
  if (moduleScrollDepth) moduleScrollDepth.textContent = `${moduleStats.scrollDepth}%`;
  if (moduleClickCount) moduleClickCount.textContent = moduleStats.clicks;
  if (bookmarkStatus) bookmarkStatus.textContent = moduleStats.bookmarked ? "Bookmarked" : "Not Bookmarked";
  if (completeStatus) completeStatus.textContent = moduleStats.completed ? "Completed" : "Not Completed";
}

function setupModulePage(moduleName) {
  const bookmarkBtn = document.getElementById("bookmarkModuleBtn");
  const completeBtn = document.getElementById("completeModuleBtn");
  const saveNoteBtn = document.getElementById("saveNoteBtn");
  const noteInput = document.getElementById("noteInput");

  if (!state.modules[moduleName]) {
    state.modules[moduleName] = defaultModuleStats(moduleName);
  }

  state.modules[moduleName].opens += 1;
  addRecentActivity(`Opened ${moduleName}`);
  saveState();

  if (bookmarkBtn) {
    bookmarkBtn.addEventListener("click", function () {
      const previous = state.modules[moduleName].bookmarked;
      state.modules[moduleName].bookmarked = !previous;
      undoStack.push({
        type: "bookmark-toggle",
        topic: moduleName,
        previous
      });
      queueEvent("bookmark", moduleName);
      syncStructuresToState();
      saveState();
      updateUI();
    });
  }

  if (completeBtn) {
    completeBtn.addEventListener("click", function () {
      const previous = state.modules[moduleName].completed;
      state.modules[moduleName].completed = !previous;
      undoStack.push({
        type: "complete-toggle",
        topic: moduleName,
        previous
      });
      queueEvent("complete", moduleName);
      syncStructuresToState();
      saveState();
      updateUI();
    });
  }

  if (saveNoteBtn && noteInput) {
    saveNoteBtn.addEventListener("click", function () {
      const text = noteInput.value.trim();
      if (!text) return;

      addRecentActivity(`Saved note in ${moduleName}`);
      queueEvent("note", moduleName, { text });
      noteInput.value = "";
      saveState();
      updateUI();
    });
  }

  document.addEventListener("click", function (e) {
    if (e.target.tagName === "BUTTON" || e.target.tagName === "A") {
      state.totalClicks += 1;
      state.modules[moduleName].clicks += 1;
      saveState();
      updateUI();
    }
  });

  let seconds = 0;
  setInterval(() => {
    seconds += 1;
    state.modules[moduleName].timeSpent += 1;
    saveState();
    updateUI();
  }, 1000);

  function updateScrollDepthLive() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;

  let percent = 0;

  if (docHeight > 0) {
    percent = Math.round((scrollTop / docHeight) * 100);
  }

  percent = Math.max(0, Math.min(percent, 100));

  // keep the maximum scroll reached
  if (percent > state.modules[moduleName].scrollDepth) {
    state.modules[moduleName].scrollDepth = percent;
  }

  saveState();
  updateUI();
}

  window.addEventListener("scroll", updateScrollDepthLive);
  window.addEventListener("resize", updateScrollDepthLive);
  window.addEventListener("load", updateScrollDepthLive);

  const readObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("highlighted-reading");
        } else {
          entry.target.classList.remove("highlighted-reading");
        }
      });
    },
    { threshold: 0.45 }
  );

  document.querySelectorAll(".module-content-block").forEach((block) => {
    readObserver.observe(block);
  });
}

// -----------------------------
// SHARED UI UPDATE
// -----------------------------
function updateUI() {
  updateDashboardUI();

  const moduleName = getModuleNameFromBody();
  if (moduleName) {
    updateModulePageUI(moduleName);
  }

  syncStructuresToState();
  saveState();
}

document.addEventListener("DOMContentLoaded", function () {
  const pageType = document.body.dataset.page;
  updateUI();

  if (pageType === "dashboard") {
    setupDashboardActions();
    updateUI();
  }

  if (pageType === "module") {
    const moduleName = getModuleNameFromBody();
    setupModulePage(moduleName);
    queueEvent("open", moduleName);
    updateUI();
  }
});