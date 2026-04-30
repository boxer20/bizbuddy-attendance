const T = {
  serviceName: "\ube44\uc988\ubc84\ub514 \uadfc\ud0dc\uad00\ub9ac",
  role: {
    EXECUTIVE: "\uad00\ub9ac\uc790",
    TEAM_LEAD: "\ud300\uc7a5",
    EMPLOYEE: "\uc77c\ubc18\uc9c1\uc6d0"
  },
  status: {
    ACTIVE: "\uc7ac\uc9c1",
    INACTIVE: "\ube44\ud65c\uc131",
    ON_LEAVE: "\ud734\uc9c1",
    LEFT: "\ud1f4\uc0ac"
  },
  leaveType: {
    ANNUAL: "\uc5f0\ucc28",
    AM_HALF: "\uc624\uc804 \ubc18\ucc28",
    PM_HALF: "\uc624\ud6c4 \ubc18\ucc28",
    COMPENSATORY: "\ub300\uccb4\ud734\uac00"
  },
  requestStatus: {
    PENDING_TEAM_LEAD: "\ud300\uc7a5 \uc2b9\uc778 \ub300\uae30",
    PENDING_EXECUTIVE: "\uad00\ub9ac\uc790 \uc2b9\uc778 \ub300\uae30",
    APPROVED: "\uc2b9\uc778",
    REJECTED: "\ubc18\ub824",
    CANCELED: "\ucde8\uc18c"
  },
  overtimeDayType: {
    WEEKDAY: "\ud3c9\uc77c",
    HOLIDAY: "\ud734\uc77c"
  },
  overtimeStatus: {
    RECORDED: "\uae30\ub85d\uc644\ub8cc",
    PENDING_EXECUTIVE: "\uad00\ub9ac\uc790 \uc2b9\uc778 \ub300\uae30",
    APPROVED: "\uc2b9\uc778",
    REJECTED: "\ubc18\ub824"
  }
};

const state = {
  me: null,
  team: null,
  currentIp: "",
  users: [],
  teams: [],
  attendance: [],
  attendanceRequests: [],
  attendanceAdjustmentLogs: [],
  leaveBalances: [],
  leaveRequests: [],
  leaveAdjustments: [],
  overtimeRecords: [],
  holidays: [],
  allowedIps: [],
  auditLogs: [],
  ipRestrictionEnabled: false,
  tab: "dashboard",
  dashboardDate: today(),
  dashboardMode: "day",
  dashboardUserId: "",
  attendanceViewMode: "table",
  attendanceCalendarMonth: today().slice(0, 7),
  leaveViewMode: "table",
  leaveCalendarMonth: today().slice(0, 7),
  attendanceFilters: {
    from: recentWeekStart(),
    to: today(),
    userId: ""
  },
  attendanceRequestYear: today().slice(0, 4),
  attendanceRequestMonth: today().slice(5, 7),
  attendanceRequestStatus: "",
  selectedUserId: "",
  leaveFilters: {
    from: `${today().slice(0, 7)}-01`,
    to: today(),
    userId: "",
    status: ""
  },
  leaveManageFilters: {
    from: `${today().slice(0, 4)}-01-01`,
    to: today(),
    userId: "",
    kind: ""
  },
  overtimeViewMode: "table",
  overtimeCalendarMonth: today().slice(0, 7),
  overtimeFilters: {
    from: `${today().slice(0, 7)}-01`,
    to: today(),
    userId: "",
    status: ""
  },
  leaveYear: today().slice(0, 4)
};

function today() {
  return new Date().toLocaleDateString("en-CA");
}

function recentWeekStart() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toLocaleDateString("en-CA");
}

function monthValue(dateValue = today()) {
  return String(dateValue).slice(0, 7);
}

function shiftMonth(month, offset) {
  const [year, mon] = String(month).split("-").map(Number);
  const next = new Date(year, mon - 1 + Number(offset), 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

function monthTitle(month) {
  const [year, mon] = String(month).split("-").map(Number);
  return `${year}\ub144 ${mon}\uc6d4`;
}

function monthDays(month) {
  const [year, mon] = String(month).split("-").map(Number);
  const first = new Date(year, mon - 1, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const d = new Date(start);
    d.setDate(start.getDate() + index);
    return {
      date: d.toLocaleDateString("en-CA"),
      day: d.getDate(),
      inMonth: d.getMonth() === mon - 1
    };
  });
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function q(selector) {
  return document.querySelector(selector);
}

function isExecutive(user = state.me) {
  return user?.role === "EXECUTIVE";
}

function isTeamLead(user = state.me) {
  return user?.role === "TEAM_LEAD";
}

function isAttendanceTarget(user) {
  return user?.role !== "EXECUTIVE";
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("ko-KR");
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function timeValue(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function formatMinutes(minutes) {
  const value = Number(minutes || 0);
  const hours = Math.floor(value / 60);
  const remain = value % 60;
  if (!value) return "0시간";
  if (!remain) return `${hours}시간`;
  return `${hours}시간 ${remain}분`;
}

function yearRange(year) {
  const value = String(year || today().slice(0, 4));
  return { from: `${value}-01-01`, to: `${value}-12-31` };
}

function monthRange(month) {
  const value = String(month || today().slice(0, 7));
  const [year, monthNumber] = value.split("-").map(Number);
  const last = new Date(year, monthNumber, 0).getDate();
  return { from: `${value}-01`, to: `${value}-${String(last).padStart(2, "0")}` };
}

function shiftDate(date, offsetDays) {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + offsetDays);
  return value.toLocaleDateString("en-CA");
}

function teamName(teamId) {
  return state.teams.find((team) => team.id === teamId)?.name || "-";
}

function userTeamLabel(user) {
  if (!user) return "-";
  if (user.role === "EXECUTIVE") return "\uc18c\uc18d \uc5c6\uc74c";
  return teamName(user.teamId) || "-";
}

function badgeClass(name) {
  if (["APPROVED", "ACTIVE", "NORMAL"].includes(name)) return "green";
  if (["REJECTED", "LATE"].includes(name)) return "red";
  if (["PENDING_TEAM_LEAD", "PENDING_EXECUTIVE"].includes(name)) return "amber";
  return "blue";
}

function notify(message, type = "info") {
  q(".message")?.remove();
  const node = document.createElement("div");
  node.className = `message ${type === "error" ? "error" : ""}`;
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 2600);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json().catch(() => ({ ok: false, message: "\uc54c \uc218 \uc5c6\ub294 \uc751\ub2f5\uc785\ub2c8\ub2e4." }));
  if (!response.ok) {
    if (response.status === 401) {
      state.me = null;
      renderLogin();
    }
    throw new Error(data.message || "\uc694\uccad\uc744 \ucc98\ub9ac\ud558\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.");
  }
  return data;
}

function attendanceJudge(record) {
  if (!record?.checkInAt) return "UNKNOWN";
  const user = record.user || state.users.find((item) => item.id === record.userId);
  const workStart = user?.workStart || "09:30";
  return timeValue(record.checkInAt) > workStart ? "LATE" : "NORMAL";
}

function attendanceStatusText(record) {
  return attendanceJudge(record) === "LATE" ? "\uc9c0\uac01" : "\uc815\uc0c1";
}

function attendanceBadgeText(record) {
  return attendanceJudge(record) === "LATE" ? "\uc9c0\uac01" : "\uc815\uc0c1\ucd9c\uadfc";
}

function attendanceSummary(records) {
  return {
    normal: records.filter((item) => attendanceJudge(item) === "NORMAL").length,
    late: records.filter((item) => attendanceJudge(item) === "LATE").length,
    notCheckedOut: records.filter((item) => item.checkInAt && !item.checkOutAt).length
  };
}

function balanceNumbers(balance) {
  const base = Number(balance.baseAnnualGranted || 0);
  const tenure = Number(balance.tenureAnnualGranted || 0);
  const adjust = Number(balance.annualAdjustments || 0);
  const comp = Number(balance.compensatoryGranted || 0);
  const annualUsed = Number(balance.annualUsed || 0);
  const compUsed = Number(balance.compensatoryUsed || 0);
  const total = base + tenure + adjust + comp;
  const used = annualUsed + compUsed;
  return { base, tenure, adjust, comp, annualUsed, compUsed, total, used, remaining: total - used };
}

function dateRange(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const dates = [];
  for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
    dates.push(current.toLocaleDateString("en-CA"));
  }
  return dates;
}

function leaveRequestsForDate(date) {
  return filteredLeaveRequests().filter((item) => {
    if (item.status === "CANCELED") return false;
    return dateRange(item.startDate, item.endDate).includes(date);
  });
}

function filteredLeaveRequests() {
  return state.leaveRequests.filter((item) => {
    if (state.leaveFilters.userId && item.userId !== state.leaveFilters.userId) return false;
    if (state.leaveFilters.status && item.status !== state.leaveFilters.status) return false;
    if (state.leaveFilters.from && item.endDate < state.leaveFilters.from) return false;
    if (state.leaveFilters.to && item.startDate > state.leaveFilters.to) return false;
    return true;
  });
}

function filteredLeaveAdjustments() {
  return state.leaveAdjustments.filter((item) => {
    if (state.leaveManageFilters.userId && item.userId !== state.leaveManageFilters.userId) return false;
    if (state.leaveManageFilters.kind && item.kind !== state.leaveManageFilters.kind) return false;
    const createdDate = String(item.createdAt || "").slice(0, 10);
    if (state.leaveManageFilters.from && createdDate < state.leaveManageFilters.from) return false;
    if (state.leaveManageFilters.to && createdDate > state.leaveManageFilters.to) return false;
    return true;
  });
}

function filteredOvertimeRecords() {
  return state.overtimeRecords.filter((item) => {
    if (state.overtimeFilters.userId && item.userId !== state.overtimeFilters.userId) return false;
    if (state.overtimeFilters.status && item.status !== state.overtimeFilters.status) return false;
    if (state.overtimeFilters.from && item.date < state.overtimeFilters.from) return false;
    if (state.overtimeFilters.to && item.date > state.overtimeFilters.to) return false;
    return true;
  });
}

function holidayName(date) {
  return state.holidays.find((item) => item.date === date)?.name || "";
}

function isHolidayDateClient(date) {
  const day = new Date(`${date}T00:00:00`).getDay();
  return day === 0 || day === 6 || state.holidays.some((item) => item.date === date);
}

function overtimeDayLabel(date) {
  return isHolidayDateClient(date) ? "휴일" : "평일";
}

function attendanceRecordForDate(date, userId = state.me?.id) {
  return state.attendance.find((item) => item.userId === userId && item.date === date) || null;
}

function overtimeFormDefaults(date = today()) {
  const attendanceRecord = attendanceRecordForDate(date);
  return {
    date,
    checkInTime: attendanceRecord?.checkInAt ? timeValue(attendanceRecord.checkInAt) : "",
    checkOutDate: date
  };
}

function overtimeSummary(records) {
  return records.reduce((acc, item) => {
    acc.total += 1;
    acc.actualMinutes += Number(item.actualMinutes || 0);
    acc.recognizedMinutes += Number(item.recognizedMinutes || 0);
    acc.pending += item.status === "PENDING_EXECUTIVE" ? 1 : 0;
    acc.approved += item.status === "APPROVED" ? 1 : 0;
    acc.requestedDays += Number(item.requestedGrantDays || 0);
    return acc;
  }, { total: 0, actualMinutes: 0, recognizedMinutes: 0, pending: 0, approved: 0, requestedDays: 0 });
}

function menuGroups() {
  const groups = [
    {
      title: "",
      single: true,
      items: [
        { key: "dashboard", label: "\ub300\uc2dc\ubcf4\ub4dc" }
      ]
    },
    {
      title: "\uadfc\ud0dc\uad00\ub9ac",
      items: [
        { key: "attendance", label: "\ucd9c\ud1f4\uadfc\uae30\ub85d" },
        { key: "overtime", label: "\ucd94\uac00\uadfc\ubb34 \uad00\ub9ac" },
        { key: "attendanceRequests", label: "\uadfc\ud0dc \uc2b9\uc778\uad00\ub9ac" }
      ]
    },
    {
      title: "\ud734\uac00\uad00\ub9ac",
      items: [
        { key: "leave", label: "\ud734\uac00 \uc2e0\uccad/\ub0b4\uc5ed" }
      ]
    }
  ];

  if (isExecutive()) {
    groups[2].items.push({ key: "leaveManage", label: "\ub300\uccb4\ud734\uac00/\uc870\uc815 \uad00\ub9ac" });
  }

  if (isExecutive() || isTeamLead()) {
    groups[2].items.push({ key: "approvals", label: "\ud734\uac00 \uc2b9\uc778\uad00\ub9ac" });
  }

  if (isExecutive()) {
    groups.push({
      title: "\uc6b4\uc601\uad00\ub9ac",
      items: [
        { key: "users", label: "\uc9c1\uc6d0\uad00\ub9ac" },
        { key: "teams", label: "\ud300\uad00\ub9ac" },
        { key: "holidays", label: "\ud734\uc77c \ub4f1\ub85d\uad00\ub9ac" },
        { key: "settings", label: "\uc124\uc815" },
        { key: "audit", label: "\uac10\uc0ac\ub85c\uadf8" }
      ]
    });
  }

  return groups;
}

function appFrame(title, description, content) {
  const todayRecord = state.attendance.find((item) => item.userId === state.me?.id && item.date === today());
  const topbarCheckInLabel = todayRecord?.checkInAt
    ? `\ucd9c\uadfc<br><span class="button-sub">(완료 : ${esc(formatTime(todayRecord.checkInAt))})</span>`
    : "\ucd9c\uadfc";
  const topbarCheckOutLabel = todayRecord?.checkOutAt
    ? `\ud1f4\uadfc<br><span class="button-sub">(완료 : ${esc(formatTime(todayRecord.checkOutAt))})</span>`
    : "\ud1f4\uadfc";
  return `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand-panel">
          <div class="brand-row">
            <img class="brand-logo" src="/assets/logo.png" alt="logo" onerror="this.style.display='none'">
            <h1>\uadfc\ud0dc\uad00\ub9ac</h1>
            <p>\ube44\uc988\ubc84\ub514 \uadfc\ud0dc\uad00\ub9ac</p>
          </div>
        </div>
        <nav class="nav">
          ${menuGroups().map((group) => `
            <div class="nav-group ${group.single ? "single" : ""}">
              ${group.title ? `<div class="nav-title">${esc(group.title)}</div>` : ""}
              <div class="nav-children">
                ${group.items.map((item) => `
                  <button
                    class="nav-child ${state.tab === item.key ? "active" : ""}"
                    type="button"
                    data-action="switch-tab"
                    data-tab="${item.key}"
                  >${esc(item.label)}</button>
                `).join("")}
              </div>
            </div>
          `).join("")}
        </nav>
        <div class="sidebar-foot">
          <div class="user-chip">
            <strong>${esc(state.me?.teamId ? teamName(state.me.teamId) : "\uc18c\uc18d \uc5c6\uc74c")}</strong><br>
            ${esc(T.role[state.me?.role] || state.me?.role || "-")} / ${esc(state.me?.name || "-")}<br>
            IP ${esc(state.currentIp || "-")}
          </div>
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div class="page-title">
            <span class="page-kicker">BIZBUDDY</span>
            <h1>${esc(title)}</h1>
            <p>${esc(description)}</p>
          </div>
          <div class="topbar-actions">
            ${state.me?.role === "EMPLOYEE" ? `<button type="button" data-action="check-in">${topbarCheckInLabel}</button><button class="secondary" type="button" data-action="check-out">${topbarCheckOutLabel}</button>` : ""}
            <button class="secondary" type="button" data-action="open-mypage">\ub9c8\uc774\ud398\uc774\uc9c0</button>
            <button class="secondary" type="button" data-action="refresh">\uc0c8\ub85c\uace0\uce68</button>
            <button class="ghost" type="button" data-action="logout">\ub85c\uadf8\uc544\uc6c3</button>
          </div>
        </header>
        ${content}
      </main>
    </div>
    <div id="modal-root"></div>
  `;
}

function summaryItem(label, value, extraClass = "") {
  return `<div class="summary-item ${extraClass}"><span>${esc(label)}</span><strong>${value}</strong></div>`;
}

function summaryButton(label, value, action, extraClass = "") {
  return `<button class="summary-item clickable ${extraClass}" type="button" data-action="${esc(action)}"><span>${esc(label)}</span><strong>${value}</strong></button>`;
}

function dashboardDayData() {
  const date = state.dashboardDate || today();
  const targets = state.users.filter((user) => isAttendanceTarget(user));
  const attendance = state.attendance.filter((item) => item.date === date && isAttendanceTarget(item.user));
  const normal = attendance.filter((item) => attendanceJudge(item) === "NORMAL");
  const late = attendance.filter((item) => attendanceJudge(item) === "LATE");
  const notCheckedOut = attendance.filter((item) => item.checkInAt && !item.checkOutAt);
  const leave = state.leaveRequests.filter((item) => (
    item.status === "APPROVED" &&
    item.startDate <= date &&
    item.endDate >= date
  ));
  return { date, targets, attendance, normal, late, notCheckedOut, leave };
}

function dashboardLeaveSummary(items) {
  if (!items.length) return "\uc5c6\uc74c";
  const labels = items.slice(0, 2).map((item) => `${esc(item.user?.name || "-")} / ${esc(T.leaveType[item.type] || item.type)}`);
  const extra = items.length > 2 ? ` \uc678 ${items.length - 2}\uba85` : "";
  return `${labels.join("<br>")}${extra}`;
}

function dashboardSelectedUser() {
  const targets = state.users.filter((user) => isAttendanceTarget(user));
  if (!state.dashboardUserId || !targets.some((user) => user.id === state.dashboardUserId)) {
    state.dashboardUserId = targets[0]?.id || "";
  }
  return targets.find((user) => user.id === state.dashboardUserId) || null;
}

function dashboardYearData() {
  const year = String(state.dashboardDate || today()).slice(0, 4);
  const user = dashboardSelectedUser();
  const records = state.attendance.filter((item) => item.userId === user?.id && String(item.date || "").startsWith(year));
  const summary = attendanceSummary(records);
  const balance = state.leaveBalances.find((item) => item.userId === user?.id);
  const numbers = balance ? balanceNumbers(balance) : null;
  return { year, user, records, summary, numbers };
}

function dashboardPage() {
  const dayData = dashboardDayData();
  const yearData = dashboardYearData();
  const isDashboardYear = isExecutive() && state.dashboardMode === "year";
  const attendanceTargets = state.users.filter((user) => isAttendanceTarget(user));
  const myBalance = state.leaveBalances.find((item) => item.userId === state.me.id);
  const myNumbers = myBalance ? balanceNumbers(myBalance) : null;
  const myRecords = state.attendance.filter((item) => item.userId === state.me.id);
  const todayRecord = myRecords.find((item) => item.date === today());
  const todayCheckInSummary = todayRecord?.checkInAt
    ? `${esc(formatTime(todayRecord.checkInAt))} <span class="badge ${badgeClass(attendanceJudge(todayRecord))}">${esc(attendanceBadgeText(todayRecord))}</span>`
    : "-";
  const mySummary = attendanceSummary(myRecords);
  const orgRecords = dayData.attendance;
  const orgSummary = attendanceSummary(orgRecords);
  const pendingLeaveApprovals = state.leaveRequests.filter((item) => {
    if (item.status === "PENDING_EXECUTIVE" && isExecutive()) return true;
    if (item.status === "PENDING_TEAM_LEAD" && isTeamLead() && item.user?.teamId === state.me.teamId) return true;
    return false;
  });
  const pendingAttendanceApprovals = state.attendanceRequests.filter((item) => {
    if (isExecutive()) return item.status === "PENDING_EXECUTIVE";
    return item.status === "PENDING_TEAM_LEAD" && isTeamLead() && item.user?.teamId === state.me.teamId;
  });
  const pendingOvertimeApprovals = state.overtimeRecords.filter((item) => {
    if (isExecutive()) return item.status === "PENDING_EXECUTIVE";
    return item.status === "PENDING_TEAM_LEAD" && isTeamLead() && item.user?.teamId === state.me.teamId;
  });
  return appFrame(
    "\ub300\uc2dc\ubcf4\ub4dc",
    "\uc624\ub298 \ud604\ud669\uacfc \uc8fc\uc694 \uc815\ubcf4\ub97c \ud655\uc778\ud569\ub2c8\ub2e4.",
    `
      <section class="summary-band">
        <div class="summary-title">
          <h2>${isExecutive() ? (isDashboardYear ? `${esc(yearData.year)} \uadfc\ud0dc\ud604\ud669` : `${esc(dayData.date)} \ud604\ud669 \uc694\uc57d`) : `${esc(state.me?.name || "")}\ub2d8\uc758 \uc624\ub298`}</h2>
          <p>${esc(T.role[state.me?.role] || state.me?.role || "")} / ${esc(userTeamLabel(state.me))}</p>
          ${isExecutive() ? `
            <div class="dashboard-date-control">
              ${isDashboardYear
                ? `<label>\uc9c1\uc6d0 <select data-dashboard-user>${attendanceTargets.map((user) => `<option value="${esc(user.id)}" ${yearData.user?.id === user.id ? "selected" : ""}>${esc(user.name)} (${esc(userTeamLabel(user))})</option>`).join("")}</select></label>`
                : `<label>\uc870\ud68c\ub0a0\uc9dc <input type="date" data-dashboard-date value="${esc(dayData.date)}"></label><button class="link-button" type="button" data-action="dashboard-yesterday">\uc804\uc77c</button>`}
              <button class="secondary" type="button" data-action="dashboard-mode" data-mode="${isDashboardYear ? "day" : "year"}">${isDashboardYear ? "\uc77c\uc790 \ud604\ud669\uc694\uc57d" : `${esc(today().slice(0, 4))}\ub144 \ud604\ud669 \uc804\uccb4\ubcf4\uae30`}</button>
            </div>
          ` : ""}
        </div>
        <div class="summary-grid">
          ${isDashboardYear ? `
            ${summaryButton("\uc815\uc0c1\ucd9c\uadfc\ud69f\uc218", `${yearData.summary.normal}\uac74`, "dashboard-year-detail-normal")}
            ${summaryButton("\uc9c0\uac01", `${yearData.summary.late}\uac74`, "dashboard-year-detail-late", yearData.summary.late ? "danger-value" : "")}
            ${summaryButton("\ubbf8\ud1f4\uadfc", `${yearData.summary.notCheckedOut}\uac74`, "dashboard-year-detail-not-checked-out", yearData.summary.notCheckedOut ? "danger-value" : "")}
            ${summaryItem("\ucd1d\uc5f0\ucc28", yearData.numbers ? `${yearData.numbers.total}\uc77c` : "-")}
            ${summaryButton("\uc5f0\ucc28\uc0ac\uc6a9\ud69f\uc218", yearData.numbers ? `${yearData.numbers.used}\uc77c` : "-", "dashboard-year-detail-leave")}
            ${summaryItem("\uc794\uc5ec\uc5f0\ucc28", yearData.numbers ? `${yearData.numbers.remaining}\uc77c` : "-")}
          ` : isExecutive()
            ? summaryButton("\ucd9c\ud1f4\uadfc \ub300\uc0c1", `${dayData.targets.length}\uba85`, "dashboard-detail-targets")
            : summaryItem("\uc624\ub298 \ucd9c\uadfc", todayCheckInSummary)}
          ${!isDashboardYear && isExecutive() ? summaryButton("\uc815\uc0c1\ucd9c\uadfc", `${dayData.normal.length}\uac74`, "dashboard-detail-normal") : ""}
          ${!isDashboardYear && isExecutive()
            ? summaryButton("\uc9c0\uac01 / \ubbf8\ud1f4\uadfc", `${dayData.late.length}\uac74 / ${dayData.notCheckedOut.length}\uac74`, "dashboard-detail-issues", dayData.late.length || dayData.notCheckedOut.length ? "danger-value" : "")
            : !isDashboardYear ? summaryItem("\uc624\ub298 \ud1f4\uadfc", todayRecord?.checkOutAt ? esc(formatTime(todayRecord.checkOutAt)) : "-") : ""}
          ${!isDashboardYear && isExecutive()
            ? summaryButton("\uc5f0\ucc28\uc815\ubcf4", dashboardLeaveSummary(dayData.leave), "dashboard-detail-leave", dayData.leave.length ? "" : "is-muted")
            : !isDashboardYear ? summaryItem("\ub0a8\uc740 \uc5f0\ucc28", myNumbers ? `${myNumbers.remaining}\uc77c` : "-") : ""}
          ${isExecutive() ? "" : summaryItem("\ud734\uac00 \ucd1d\uc0ac\uc6a9", myNumbers ? `${myNumbers.used}\uc77c` : "-")}
        </div>
      </section>
      ${isExecutive() && !isDashboardYear ? `
        <section class="surface">
          <h3>${esc(dayData.date)} \uc9c1\uc6d0\ubcc4 \uadfc\ud0dc\uc815\ubcf4</h3>
          ${attendanceTable(orgRecords, false)}
        </section>
      ` : ""}
      ${isExecutive() ? `
        <section class="surface">
          <h3>Today \uc2b9\uc778\uc694\uccad \ud604\ud669</h3>
          <div class="summary-grid summary-grid-attendance">
            ${summaryButton("\ud734\uac00 \uc2b9\uc778 \ub300\uae30", `${pendingLeaveApprovals.length}\uac74`, "open-approval-window-leave", pendingLeaveApprovals.length ? "danger-value" : "")}
            ${summaryButton("\uadfc\ud0dc \uc2b9\uc778 \ub300\uae30", `${pendingAttendanceApprovals.length}\uac74`, "open-approval-window-attendance", pendingAttendanceApprovals.length ? "danger-value" : "")}
            ${summaryButton("\ub300\uccb4\ud734\uac00\ubcf4\uc0c1 \ub300\uae30", `${pendingOvertimeApprovals.length}\uac74`, "open-approval-window-overtime", pendingOvertimeApprovals.length ? "danger-value" : "")}
          </div>
        </section>
      ` : ""}
      ${isExecutive() ? "" : `<section class="surface">
          <div class="actions" style="justify-content: space-between;">
            <h3>${isExecutive() ? `${esc(state.leaveYear)}\ub144 \uadfc\ud0dc \ud604\ud669` : "\uc624\ub298 \uadfc\ud0dc"}</h3>
            ${isExecutive() ? "" : `<div class="actions"><button type="button" data-action="check-in">\ucd9c\uadfc \uccb4\ud06c</button><button class="secondary" type="button" data-action="check-out">\ud1f4\uadfc \uccb4\ud06c</button></div>`}
          </div>
          ${isExecutive()
            ? `
              <div class="summary-grid summary-grid-attendance dashboard-metric-grid" style="margin-bottom:14px;">
                ${summaryItem("\uc815\uc0c1\ucd9c\uadfc", `${orgSummary.normal}\uac74`)}
                ${summaryItem("\uc9c0\uac01", `${orgSummary.late}\uac74`, "danger-value")}
                ${summaryItem("\ubbf8\ud1f4\uadfc", `${orgSummary.notCheckedOut}\uac74`)}
              </div>
              ${attendanceTable(orgRecords.slice(0, 10), false)}
            `
            : `
              <div class="summary-grid summary-grid-attendance dashboard-metric-grid" style="margin-bottom:14px;">
                ${summaryItem("\uc815\uc0c1\ucd9c\uadfc", `${mySummary.normal}\uac74`)}
                ${summaryItem("\uc9c0\uac01", `${mySummary.late}\uac74`, "danger-value")}
                ${summaryItem("\ubbf8\ud1f4\uadfc", `${mySummary.notCheckedOut}\uac74`)}
              </div>
              ${attendanceTable(myRecords.slice(0, 5), false)}
            `}
      </section>`}
      <section class="surface">
        <div class="actions" style="justify-content: space-between;">
          <h3>${esc(state.leaveYear)}\ub144 \ud734\uac00 \ud604\ud669</h3>
          ${isExecutive() ? `<button class="secondary" type="button" data-action="switch-tab" data-tab="leave">\uc0c1\uc138\ubcf4\uae30</button>` : `<button type="button" data-action="open-leave-request">\ud734\uac00 \uc2e0\uccad</button>`}
        </div>
        ${leaveBalanceTable(isExecutive() ? state.leaveBalances : state.leaveBalances.filter((item) => item.userId === state.me.id))}
      </section>
      <section class="grid two dashboard-grid">
        <div class="surface">
          <h3>\ucd5c\uadfc \ud734\uac00 \ub0b4\uc5ed</h3>
          ${leaveRequestsTable((isExecutive() ? state.leaveRequests : state.leaveRequests.filter((item) => item.userId === state.me.id)).slice(0, 5), false)}
        </div>
        <div class="surface">
          <h3>${canDashboardQueueTitle()}</h3>
          ${isExecutive() ? `<div class="empty">Today \uc8fc\uc694 \ud604\ud669\uc5d0\uc11c \uc2b9\uc778 \ub300\uae30\ub97c \ud655\uc778\ud569\ub2c8\ub2e4.</div>` : dashboardQueueContent(pendingLeaveApprovals, pendingAttendanceApprovals, pendingOvertimeApprovals)}
        </div>
      </section>
    `
  );
}

function attendanceTable(records, showActions = true) {
  if (!records.length) return `<div class="empty">\ucd9c\ud1f4\uadfc \uae30\ub85d\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>\ub0a0\uc9dc</th>
            <th>\uc9c1\uae09</th>
            <th>\uc9c1\uc6d0\uba85</th>
            <th>\ucd9c\uadfc\uc2dc\uac04 / \ud1f4\uadfc\uc2dc\uac04</th>
            <th>\uc0c1\ud0dc</th>
            <th>\ucd9c\ud1f4\uadfc \uccb4\ud06c IP</th>
            <th>\uc218\uc815\uc774\ub825</th>
            <th>\uc218\uc815</th>
          </tr>
        </thead>
        <tbody>
          ${records.map((record, index) => {
            const divider = index > 0 && records[index - 1].date !== record.date ? ' class="group-divider"' : "";
            const action = !showActions
              ? "-"
              : isExecutive()
                ? `<button class="secondary" type="button" data-action="open-direct-adjust" data-record-id="${esc(record.id)}">\uc218\uc815</button>`
                : `<button class="secondary" type="button" data-action="open-attendance-request" data-record-id="${esc(record.id)}">\uc218\uc815\uc694\uccad</button>`;
            const hasHistory = state.attendanceAdjustmentLogs.some((log) => log.recordId === record.id);
            const historyAction = hasHistory
              ? `<button class="secondary" type="button" data-action="show-attendance-record-history" data-record-id="${esc(record.id)}">\uc218\uc815\uc774\ub825</button>`
              : "\uc5c6\uc74c";
            return `
              <tr${divider}>
                <td>${esc(record.date)}</td>
                <td>${esc(T.role[record.user?.role] || record.user?.role || "-")}</td>
                <td>
                  <div>${esc(record.user?.name || "-")}</div>
                  <div class="muted">${esc(userTeamLabel(record.user))}</div>
                </td>
                <td>
                  <div class="attendance-time-line">\ucd9c\uadfc ${esc(formatTime(record.checkInAt))}${record.checkInAt ? ` <span class="badge ${badgeClass(attendanceJudge(record))}">${esc(attendanceBadgeText(record))}</span>` : ""}</div>
                  ${record.checkInNote ? `<div class="muted">\ucd9c\uadfc \uba54\ubaa8: ${esc(record.checkInNote)}</div>` : ""}
                  <div class="attendance-time-line">\ud1f4\uadfc ${esc(formatTime(record.checkOutAt))}</div>
                  ${record.checkOutNote ? `<div class="muted">\ud1f4\uadfc \uba54\ubaa8: ${esc(record.checkOutNote)}</div>` : ""}
                </td>
                <td><span class="badge ${badgeClass(attendanceJudge(record))}">${esc(attendanceStatusText(record))}</span></td>
                <td>
                  <div>\ucd9c\uadfc ${esc(record.checkInIp || "-")}</div>
                  <div>\ud1f4\uadfc ${esc(record.checkOutIp || "-")}</div>
                </td>
                <td>${historyAction}</td>
                <td>${action}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function attendanceCalendar() {
  const days = monthDays(state.attendanceCalendarMonth);
  const weekLabels = ["\uc77c", "\uc6d4", "\ud654", "\uc218", "\ubaa9", "\uae08", "\ud1a0"];
  const isPersonalView = !isExecutive() && !isTeamLead() && isAttendanceTarget(state.me);
  const userLabel = state.attendanceFilters.userId
    ? (state.users.find((user) => user.id === state.attendanceFilters.userId)?.name || "\uc120\ud0dd \uc0ac\uc6a9\uc790")
    : "\uc804\uccb4";
  return `
    <div class="calendar-toolbar">
      <div class="view-toggle">
        <button class="${state.attendanceViewMode === "table" ? "secondary" : "ghost"}" type="button" data-action="attendance-view" data-view="table">\ubaa9\ub85d</button>
        <button class="${state.attendanceViewMode === "calendar" ? "secondary" : "ghost"}" type="button" data-action="attendance-view" data-view="calendar">\uce98\ub9b0\ub354</button>
      </div>
      <div class="actions">
        <button class="secondary" type="button" data-action="attendance-month-shift" data-offset="0">\uc624\ub298</button>
        <button class="secondary" type="button" data-action="attendance-month-shift" data-offset="-1">\uc774\uc804 \ub2ec</button>
        <strong>${esc(monthTitle(state.attendanceCalendarMonth))}</strong>
        <button class="secondary" type="button" data-action="attendance-month-shift" data-offset="1">\ub2e4\uc74c \ub2ec</button>
      </div>
      <span class="muted">${esc(userLabel)} \uae30\uc900</span>
    </div>
    <div class="calendar-grid" style="margin-top:14px;">
      ${weekLabels.map((label) => `<div class="calendar-weekday">${label}</div>`).join("")}
      ${days.map((day) => {
        const dayRecords = state.attendance.filter((record) => record.date === day.date);
        const dayOvertimeRecords = state.overtimeRecords.filter((record) => record.date === day.date);
        if (isPersonalView) {
          const record = dayRecords.find((item) => item.userId === state.me.id);
          const overtimeMinutes = dayOvertimeRecords
            .filter((item) => item.userId === state.me.id)
            .reduce((sum, item) => sum + Number(item.recognizedMinutes || 0), 0);
          return `
            <div class="calendar-day ${day.inMonth ? "" : "is-other-month"} ${day.date === today() ? "is-today" : ""}">
              <header><span>${day.day}</span></header>
              <div class="calendar-body">
                <button class="calendar-summary-button" type="button" data-action="show-attendance-day" data-date="${esc(day.date)}">
                  <div class="calendar-metric total"><span>\ucd9c\uadfc\uc0c1\ud0dc</span><strong>${record?.checkInAt ? esc(attendanceStatusText(record)) : "\uc5c6\uc74c"}</strong></div>
                  <div class="calendar-metric"><span>\ucd9c\uadfc\uc2dc\uac04</span><strong>${record?.checkInAt ? esc(formatTime(record.checkInAt)) : "\uc5c6\uc74c"}</strong></div>
                  <div class="calendar-metric"><span>\ud1f4\uadfc\uc0c1\ud0dc</span><strong>${record?.checkOutAt ? "\uc644\ub8cc" : record?.checkInAt ? "\ubbf8\ud1f4\uadfc" : "\uc5c6\uc74c"}</strong></div>
                  <div class="calendar-metric"><span>\ud1f4\uadfc\uc2dc\uac04</span><strong>${record?.checkOutAt ? esc(formatTime(record.checkOutAt)) : "\uc5c6\uc74c"}</strong></div>
                  <div class="calendar-metric"><span>\ucd94\uac00\uadfc\ubb34\uc2dc\uac04</span><strong>${overtimeMinutes ? esc(formatMinutes(overtimeMinutes)) : "\uc5c6\uc74c"}</strong></div>
                </button>
              </div>
            </div>
          `;
        }
        const normal = dayRecords.filter((record) => attendanceJudge(record) === "NORMAL").length;
        const late = dayRecords.filter((record) => attendanceJudge(record) === "LATE").length;
        const notCheckedOut = dayRecords.filter((record) => record.checkInAt && !record.checkOutAt).length;
        const overtimeUsers = new Set(dayOvertimeRecords.map((record) => record.userId)).size;
        const totalTargets = state.attendanceFilters.userId ? 1 : Math.max(0, state.users.filter((user) => isAttendanceTarget(user)).length);
        const hasRecords = dayRecords.length > 0 || dayOvertimeRecords.length > 0;
        return `
          <div class="calendar-day ${day.inMonth ? "" : "is-other-month"} ${day.date === today() ? "is-today" : ""}">
            <header><span>${day.day}</span></header>
            <div class="calendar-body">
              ${hasRecords ? `
                <button class="calendar-summary-button" type="button" data-action="show-attendance-day" data-date="${esc(day.date)}">
                  <div class="calendar-metric total"><span>\uc804\uccb4\ub300\uc0c1\uc790</span><strong>${totalTargets}\uba85</strong></div>
                  <div class="calendar-metric"><span>\uc815\uc0c1\ucd9c\uadfc</span><strong>${normal}\uac74/${totalTargets}</strong></div>
                  <div class="calendar-metric danger"><span>\uc9c0\uac01</span><strong>${late}\uac74/${totalTargets}</strong></div>
                  <div class="calendar-metric"><span>\ubbf8\ud1f4\uadfc</span><strong>${notCheckedOut}\uac74/${totalTargets}</strong></div>
                  <div class="calendar-metric"><span>\ucd94\uac00\uadfc\ubb34\uc790</span><strong>${overtimeUsers}\uba85</strong></div>
                </button>
              ` : ""}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function attendancePage() {
  const filtered = state.attendance;
  const summary = attendanceSummary(filtered);
  return appFrame(
    "\ucd9c\ud1f4\uadfc\uae30\ub85d",
    "\uae30\uac04\ubcc4 \ucd9c\ud1f4\uadfc \uae30\ub85d\uc744 \ud655\uc778\ud569\ub2c8\ub2e4.",
    `
      <section class="surface">
        <form id="attendance-filter-form" class="filters">
          <label>\uc2dc\uc791\uc77c<input type="date" name="from" value="${esc(state.attendanceFilters.from)}"></label>
          <label>\uc885\ub8cc\uc77c<input type="date" name="to" value="${esc(state.attendanceFilters.to)}"></label>
          ${isExecutive() ? `
            <label>\uc0ac\uc6a9\uc790
              <select name="userId">
                <option value="">\uc804\uccb4</option>
                ${state.users.map((user) => `<option value="${esc(user.id)}" ${state.attendanceFilters.userId === user.id ? "selected" : ""}>${esc(user.name)} (${esc(T.role[user.role] || user.role)})</option>`).join("")}
              </select>
            </label>
          ` : ""}
          <button type="submit">\uc870\ud68c</button>
        </form>
        <div class="actions" style="margin-top:10px;">
          <label>\uc6d4\ubcc4\uc870\ud68c<input type="month" data-period-month="attendance" value="${esc(monthValue(state.attendanceFilters.to || today()))}"></label>
          <button class="secondary" type="button" data-action="apply-period" data-scope="attendance" data-mode="month">\uc6d4\ubcc4\uc870\ud68c</button>
          <label>\ub144\ub3c4\ubcc4\uc870\ud68c<input type="number" data-period-year="attendance" value="${esc((state.attendanceFilters.to || today()).slice(0, 4))}" min="2020" max="2100"></label>
          <button class="secondary" type="button" data-action="apply-period" data-scope="attendance" data-mode="year">\ub144\ub3c4\ubcc4\uc870\ud68c</button>
          <button class="secondary" type="button" data-action="open-yearly" data-scope="attendance">\ub144\ub3c4\ubcc4 \uc804\uccb4</button>
          <button type="button" data-action="download-yearly" data-scope="attendance">\uc5d1\uc140\ub2e4\uc6b4\ub85c\ub4dc</button>
        </div>
      </section>
      <section class="summary-band">
        <div class="summary-grid summary-grid-attendance">
          ${summaryItem("\uc815\uc0c1\ucd9c\uadfc", `${summary.normal}\uac74`)}
          ${summaryItem("\uc9c0\uac01", `${summary.late}\uac74`, "danger-value")}
          ${summaryItem("\ubbf8\ud1f4\uadfc", `${summary.notCheckedOut}\uac74`)}
        </div>
      </section>
      <section class="surface">
        <div class="actions" style="justify-content: space-between;">
          <h3>\uc0c1\uc138 \ub0b4\uc5ed</h3>
          <div class="actions">
            <div class="view-toggle">
              <button class="${state.attendanceViewMode === "table" ? "secondary" : "ghost"}" type="button" data-action="attendance-view" data-view="table">\ubaa9\ub85d</button>
              <button class="${state.attendanceViewMode === "calendar" ? "secondary" : "ghost"}" type="button" data-action="attendance-view" data-view="calendar">\uce98\ub9b0\ub354</button>
            </div>
            ${isExecutive() ? "" : `<button type="button" data-action="check-in">\ucd9c\uadfc \uccb4\ud06c</button><button class="secondary" type="button" data-action="check-out">\ud1f4\uadfc \uccb4\ud06c</button>`}
          </div>
        </div>
        ${state.attendanceViewMode === "calendar" ? attendanceCalendar() : attendanceTable(filtered, true)}
      </section>
    `
  );
}

function attendanceRequestsTable() {
  const list = state.attendanceRequests.filter((item) => {
    if (state.attendanceRequestStatus && item.status !== state.attendanceRequestStatus) return false;
    if (state.attendanceRequestYear && String(item.date || "").slice(0, 4) !== state.attendanceRequestYear) return false;
    if (state.attendanceRequestMonth && String(item.date || "").slice(5, 7) !== state.attendanceRequestMonth) return false;
    return true;
  });
  if (!list.length) return `<div class="empty">\uc218\uc815\uc694\uccad \ub0b4\uc5ed\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>\uc694\uccad\uc77c\uc2dc</th>
            <th>\uc9c1\uc6d0</th>
            <th>\ub300\uc0c1\uc77c</th>
            <th>\ubcc0\uacbd \uc694\uccad</th>
            <th>\uc0c1\ud0dc</th>
            <th>\ube44\uace0</th>
            <th>\ucc98\ub9ac</th>
          </tr>
        </thead>
        <tbody>
          ${list.map((item) => `
            <tr>
              <td>${esc(formatDateTime(item.createdAt))}</td>
              <td>${esc(item.user?.name || "-")}</td>
              <td>${esc(item.date)}</td>
              <td>\ucd9c\uadfc ${esc(formatTime(item.proposedCheckInAt))}<br>\ud1f4\uadfc ${esc(formatTime(item.proposedCheckOutAt))}</td>
              <td><span class="badge ${badgeClass(item.status)}">${esc(T.requestStatus[item.status] || item.status)}</span></td>
              <td>${renderReasonButton(item.executiveComment || item.reason)}</td>
              <td>
                ${((item.status === "PENDING_TEAM_LEAD" && isTeamLead() && item.user?.teamId === state.me.teamId) || (item.status === "PENDING_EXECUTIVE" && isExecutive()))
                  ? `<div class="actions"><button type="button" data-action="attendance-approve" data-request-id="${esc(item.id)}">\uc2b9\uc778</button><button class="secondary" type="button" data-action="attendance-reject" data-request-id="${esc(item.id)}">\ubc18\ub824</button></div>`
                  : item.status === "APPROVED" ? `<button class="secondary" type="button" data-action="show-attendance-history" data-request-id="${esc(item.id)}">\uc218\uc815\uc774\ub825</button>` : "-"}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function attendanceRequestsPage() {
  return appFrame(
    "\uadfc\ud0dc \uc2b9\uc778\uad00\ub9ac",
    "\uadfc\ud0dc \uc218\uc815 \uc2e0\uccad\ub0b4\uc5ed\uc744 \ud655\uc778\ud558\uace0 \uc2b9\uc778 \ucc98\ub9ac\ud569\ub2c8\ub2e4.",
    `
      <section class="surface">
        <form id="attendance-request-filter-form" class="filters">
          <label>\ub144\ub3c4<input type="number" name="year" value="${esc(state.attendanceRequestYear)}" min="2020" max="2100"></label>
          <label>\uc6d4
            <select name="month">
              <option value="">\uc804\uccb4</option>
              ${Array.from({ length: 12 }, (_, index) => {
                const value = String(index + 1).padStart(2, "0");
                return `<option value="${value}" ${state.attendanceRequestMonth === value ? "selected" : ""}>${Number(value)}\uc6d4</option>`;
              }).join("")}
            </select>
          </label>
          <label>\uc0c1\ud0dc
            <select name="status">
              <option value="">\uc804\uccb4</option>
              <option value="PENDING_TEAM_LEAD" ${state.attendanceRequestStatus === "PENDING_TEAM_LEAD" ? "selected" : ""}>${T.requestStatus.PENDING_TEAM_LEAD}</option>
              <option value="PENDING_EXECUTIVE" ${state.attendanceRequestStatus === "PENDING_EXECUTIVE" ? "selected" : ""}>${T.requestStatus.PENDING_EXECUTIVE}</option>
              <option value="APPROVED" ${state.attendanceRequestStatus === "APPROVED" ? "selected" : ""}>${T.requestStatus.APPROVED}</option>
              <option value="REJECTED" ${state.attendanceRequestStatus === "REJECTED" ? "selected" : ""}>${T.requestStatus.REJECTED}</option>
            </select>
          </label>
          <button type="submit">\uc870\ud68c</button>
        </form>
      </section>
      <section class="surface">
        <h3>\uadfc\ud0dc \uc218\uc815 \uc2e0\uccad\ub0b4\uc5ed</h3>
        ${attendanceRequestsTable()}
      </section>
    `
  );
}

function overtimeTable(records, approvals = false, requestActions = false) {
  if (!records.length) return `<div class="empty">${approvals ? "\ub300\uccb4\ud734\uac00\ubcf4\uc0c1 \uc2e0\uccad\ub0b4\uc5ed\uc774 \uc5c6\uc2b5\ub2c8\ub2e4." : "\ucd94\uac00\uadfc\ubb34 \ub0b4\uc5ed\uc774 \uc5c6\uc2b5\ub2c8\ub2e4."}</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>\ub0a0\uc9dc</th>
            <th>\uad6c\ubd84</th>
            <th>\uc9c1\uc6d0</th>
            <th>\ucd9c\uadfc / \ud1f4\uadfc</th>
            <th>\uc2e4\uadfc\ubb34\uc2dc\uac04</th>
            <th>\uc778\uc815\uc2dc\uac04</th>
              <th>\ub300\uccb4\ud734\uac00 \uc694\uccad</th>
              <th>\uc0c1\ud0dc</th>
              <th>\ube44\uace0</th>
              ${requestActions ? "<th>\uc694\uccad</th>" : ""}
              ${approvals ? "<th>\ucc98\ub9ac</th>" : ""}
            </tr>
          </thead>
          <tbody>
          ${records.map((item) => `
            <tr>
              <td>${esc(item.date)}</td>
              <td>${esc(T.overtimeDayType[item.dayType] || item.dayType || "-")}</td>
              <td>${esc(item.user?.name || "-")}</td>
              <td>${esc(formatTime(item.checkInAt))} / ${esc(formatTime(item.checkOutAt))}${item.checkOutDate && item.checkOutDate !== item.date ? `<div class="muted">\ud1f4\uadfc\uc77c: ${esc(item.checkOutDate)}</div>` : ""}</td>
              <td>${esc(formatMinutes(item.actualMinutes))}</td>
              <td>${esc(formatMinutes(item.recognizedMinutes))}</td>
                <td>${item.requestedGrantDays ? `${esc(item.requestedGrantDays)}\uc77c` : "-"}</td>
                <td><span class="badge ${badgeClass(item.status)}">${esc(T.overtimeStatus[item.status] || item.status)}</span></td>
                <td>${renderReasonButton(item.decisionComment || item.reason)}</td>
                ${requestActions ? `<td>${overtimeRequestButtons(item)}</td>` : ""}
                ${approvals ? `<td>${overtimeApprovalButtons(item)}</td>` : ""}
              </tr>
            `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function overtimeApprovalButtons(item) {
  if (item.status === "PENDING_TEAM_LEAD" && isTeamLead() && item.user?.teamId === state.me.teamId) {
    return `<div class="actions"><button type="button" data-action="overtime-approve" data-record-id="${esc(item.id)}">\uc2b9\uc778</button><button class="secondary" type="button" data-action="overtime-reject" data-record-id="${esc(item.id)}">\ubc18\ub824</button></div>`;
  }
  if (isExecutive() && item.status === "PENDING_EXECUTIVE") {
    return `<div class="actions"><button type="button" data-action="overtime-approve" data-record-id="${esc(item.id)}">\uc2b9\uc778</button><button class="secondary" type="button" data-action="overtime-reject" data-record-id="${esc(item.id)}">\ubc18\ub824</button></div>`;
  }
  return "-";
}

function overtimeRequestButtons(item) {
  if (item.userId !== state.me?.id || !isAttendanceTarget(state.me)) return "-";
  if (item.leaveAdjustmentId || item.status === "APPROVED") return `<span class="badge green">\ubd80\uc5ec\uc644\ub8cc</span>`;
  const eligible = Number(item.eligibleGrantDays || 0);
  if (eligible < 0.5) return "-";
  if (item.status === "PENDING_EXECUTIVE") {
    return `<div class="actions"><span class="badge amber">${esc(`${item.requestedGrantDays}일 요청중`)}</span><button class="secondary" type="button" data-action="overtime-cancel-grant" data-record-id="${esc(item.id)}">\uc694\uccad\ucde8\uc18c</button></div>`;
  }
  const buttons = [];
  if (eligible >= 0.5) buttons.push(`<button type="button" data-action="overtime-request-grant" data-record-id="${esc(item.id)}" data-days="0.5">\ubc18\ucc28 \uc694\uccad</button>`);
  if (eligible >= 1) buttons.push(`<button class="secondary" type="button" data-action="overtime-request-grant" data-record-id="${esc(item.id)}" data-days="1">\uc804\uc77c \uc694\uccad</button>`);
  return `<div class="actions">${buttons.join("")}</div>`;
}

function overtimeRecordsForDate(date) {
  return filteredOvertimeRecords().filter((item) => item.date === date);
}

function overtimeCalendar() {
  const days = monthDays(state.overtimeCalendarMonth);
  const weekLabels = ["\uc77c", "\uc6d4", "\ud654", "\uc218", "\ubaa9", "\uae08", "\ud1a0"];
  return `
    <div class="calendar-toolbar">
      <div class="actions">
        <button class="secondary" type="button" data-action="overtime-month-shift" data-offset="0">\uc624\ub298</button>
        <button class="secondary" type="button" data-action="overtime-month-shift" data-offset="-1">\uc774\uc804 \ub2ec</button>
        <strong>${esc(monthTitle(state.overtimeCalendarMonth))}</strong>
        <button class="secondary" type="button" data-action="overtime-month-shift" data-offset="1">\ub2e4\uc74c \ub2ec</button>
      </div>
      <span class="muted">\ub0a0\uc9dc\ub97c \ud074\ub9ad\ud558\uba74 \ucd94\uac00\uadfc\ubb34 \uc0c1\uc138 \ub0b4\uc5ed\uc744 \ubd05\ub2c8\ub2e4.</span>
    </div>
    <div class="calendar-grid" style="margin-top:14px;">
      ${weekLabels.map((label) => `<div class="calendar-weekday">${label}</div>`).join("")}
      ${days.map((day) => {
        const records = overtimeRecordsForDate(day.date);
        const requested = records.filter((item) => item.requestedGrantDays > 0).length;
        const approved = records.filter((item) => item.status === "APPROVED").length;
        const recognizedHours = records.reduce((sum, item) => sum + Number(item.recognizedMinutes || 0), 0);
        const hasRecords = records.length > 0;
        return `
          <div class="calendar-day ${day.inMonth ? "" : "is-other-month"} ${day.date === today() ? "is-today" : ""}">
            <header><span>${day.day}</span></header>
            <div class="calendar-body">
              ${hasRecords ? `
                <button class="calendar-summary-button" type="button" data-action="show-overtime-day" data-date="${esc(day.date)}">
                  <div class="calendar-metric total"><span>\uae30\ub85d \uac74\uc218</span><strong>${records.length}\uac74</strong></div>
                  <div class="calendar-metric"><span>\uc778\uc815\uc2dc\uac04</span><strong>${esc(formatMinutes(recognizedHours))}</strong></div>
                  <div class="calendar-metric"><span>\ub300\uccb4\ud734\uac00 \uc694\uccad</span><strong>${requested}\uac74</strong></div>
                  <div class="calendar-metric"><span>\uc2b9\uc778\uc644\ub8cc</span><strong>${approved}\uac74</strong></div>
                </button>
                ${records.slice(0, 2).map((item) => `
                  <div class="calendar-entry">
                    <strong>${esc(item.user?.name || "-")}</strong>
                    <span>${esc(T.overtimeDayType[item.dayType] || item.dayType)} / ${esc(formatMinutes(item.recognizedMinutes))}</span>
                  </div>
                `).join("")}
                ${records.length > 2 ? `<div class="calendar-empty">+ ${records.length - 2}\uac74 \ub354\ubcf4\uae30</div>` : ""}
              ` : ""}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function overtimePage() {
  const records = filteredOvertimeRecords();
  const summary = overtimeSummary(records);
  return appFrame(
    "\ucd94\uac00\uadfc\ubb34 \uad00\ub9ac",
    "\ud734\uc77c\u00b7\uc5f0\uc7a5 \uadfc\ubb34 \ub0b4\uc5ed\uacfc \ub300\uccb4\ud734\uac00 \uc694\uccad \ud604\ud669\uc744 \ud568\uaed8 \uad00\ub9ac\ud569\ub2c8\ub2e4.",
    `
      <section class="surface">
        <form id="overtime-filter-form" class="filters">
          <label>\uc2dc\uc791\uc77c<input type="date" name="from" value="${esc(state.overtimeFilters.from)}"></label>
          <label>\uc885\ub8cc\uc77c<input type="date" name="to" value="${esc(state.overtimeFilters.to)}"></label>
          ${(isExecutive() || isTeamLead()) ? `
            <label>\uc0ac\uc6a9\uc790
              <select name="userId">
                <option value="">\uc804\uccb4</option>
                ${state.users.filter((user) => isAttendanceTarget(user)).map((user) => `<option value="${esc(user.id)}" ${state.overtimeFilters.userId === user.id ? "selected" : ""}>${esc(user.name)} (${esc(T.role[user.role] || user.role)})</option>`).join("")}
              </select>
            </label>
          ` : ""}
          <label>\uc0c1\ud0dc
            <select name="status">
              <option value="">\uc804\uccb4</option>
              ${Object.entries(T.overtimeStatus).map(([key, label]) => `<option value="${esc(key)}" ${state.overtimeFilters.status === key ? "selected" : ""}>${esc(label)}</option>`).join("")}
            </select>
          </label>
          <button type="submit">\uc870\ud68c</button>
        </form>
        <div class="actions" style="margin-top:10px;">
          <label>\uc6d4\ubcc4\uc870\ud68c<input type="month" data-period-month="overtime" value="${esc(monthValue(state.overtimeFilters.to || today()))}"></label>
          <button class="secondary" type="button" data-action="apply-period" data-scope="overtime" data-mode="month">\uc6d4\ubcc4\uc870\ud68c</button>
          <label>\ub144\ub3c4\ubcc4\uc870\ud68c<input type="number" data-period-year="overtime" value="${esc((state.overtimeFilters.to || today()).slice(0, 4))}" min="2020" max="2100"></label>
          <button class="secondary" type="button" data-action="apply-period" data-scope="overtime" data-mode="year">\ub144\ub3c4\ubcc4\uc870\ud68c</button>
          <button class="secondary" type="button" data-action="open-yearly" data-scope="overtime">\ub144\ub3c4\ubcc4 \uc804\uccb4</button>
          <button type="button" data-action="download-yearly" data-scope="overtime">\uc5d1\uc140\ub2e4\uc6b4\ub85c\ub4dc</button>
        </div>
      </section>
        <section class="summary-band">
          <div class="summary-title">
            <h2>\ucd94\uac00\uadfc\ubb34 \uc694\uc57d</h2>
            <p>\ud734\uc77c \uadfc\ubb34\ub294 4\uc2dc\uac04 \ucd08\uacfc \uc2dc \ubc18\ucc28, 8\uc2dc\uac04 \ucd08\uacfc \uc2dc 1\uc77c \uc694\uccad\uc774 \uac00\ub2a5\ud569\ub2c8\ub2e4.</p>
          </div>
          <div class="summary-grid summary-grid-attendance" style="grid-template-columns: repeat(4, minmax(0, 1fr));">
            ${summaryButton("\uae30\ub85d \uac74\uc218", `${summary.total}\uac74`, "show-overtime-summary-records")}
            ${summaryButton("\uc778\uc815\uc2dc\uac04", esc(formatMinutes(summary.recognizedMinutes)), "show-overtime-summary-recognized")}
            ${summaryItem("\ub300\uccb4\ud734\uac00 \uc694\uccad", `${summary.requestedDays}\uc77c`)}
            ${summaryItem("\uc2b9\uc778 \ub300\uae30", `${summary.pending}\uac74`, summary.pending ? "danger-value" : "")}
          </div>
        </section>
      <section class="surface">
        <div class="actions" style="justify-content: space-between;">
          <h3>\ucd94\uac00\uadfc\ubb34 \ub0b4\uc5ed</h3>
          <div class="actions">
            <div class="view-toggle">
              <button class="${state.overtimeViewMode === "table" ? "secondary" : "ghost"}" type="button" data-action="overtime-view" data-view="table">\ubaa9\ub85d</button>
              <button class="${state.overtimeViewMode === "calendar" ? "secondary" : "ghost"}" type="button" data-action="overtime-view" data-view="calendar">\uce98\ub9b0\ub354</button>
            </div>
            ${isAttendanceTarget(state.me) ? `<button type="button" data-action="open-overtime-create">\ucd94\uac00\uadfc\ubb34 \ub4f1\ub85d</button>` : ""}
          </div>
        </div>
        ${state.overtimeViewMode === "calendar" ? overtimeCalendar() : overtimeTable(records, false, true)}
        <p class="table-note overtime-note">
          \ud1f4\uadfc \uc608\uc815\uc2dc\uac04 \ud6c4 30\ubd84 \uc774\ub0b4 \uccb4\ub958\ub294 \uc6d0\uce59\uc801\uc73c\ub85c \uc5f0\uc7a5\uadfc\ub85c\ub85c \ubcf4\uc9c0 \uc54a\ub418,<br>
          \uc2e4\uc81c \uc5c5\ubb34 \uc218\ud589\uc774 \uc788\uc5c8\ub358 \uacbd\uc6b0 \uadfc\ub85c\uc790\uac00 \uc0ac\ud6c4 \uc2e0\uccad\ud560 \uc218 \uc788\uace0,<br>
          \uad00\ub9ac\uc790\ub294 \uc5c5\ubb34\uc9c0\uc2dc\u00b7\uc5c5\ubb34\uc218\ud589 \ub0b4\uc5ed\uc744 \ud655\uc778\ud574 \uc2b9\uc778 \ub610\ub294 \ubc18\ub824\ud55c\ub2e4.
        </p>
      </section>
    `
  );
}

function leaveBalanceTable(items) {
  if (!items.length) return `<div class="empty">\ud734\uac00 \ub370\uc774\ud130\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th rowspan="2">\uc9c1\uc6d0</th>
            <th rowspan="2">\ucd1d\uc5f0\ucc28<br>(\uae30\ubcf8+\uae30\ud0c0)</th>
            <th colspan="2">\uae30\ubcf8 \uc5f0\ucc28</th>
            <th colspan="2">\uae30\ud0c0</th>
            <th rowspan="2">\uc0ac\uc6a9\uc5f0\ucc28<br>(\uae30\ubcf8+\uae30\ud0c0)</th>
            <th rowspan="2">\uc794\uc5ec\uc5f0\ucc28</th>
          </tr>
          <tr>
            <th>\uae30\ubcf8\uc5f0\ucc28</th>
            <th>\uadfc\uc18d\ucd94\uac00</th>
            <th>\uc5f0\ucc28\uc870\uc815</th>
            <th>\ub300\uccb4\ud734\uac00\ubd80\uc5ec</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item) => {
            const n = balanceNumbers(item);
            return `
              <tr>
                <td>${esc(item.user?.name || "-")}</td>
                <td><strong>${n.total}\uc77c</strong><br><span class="muted">(${n.base}+${n.tenure}+${n.adjust}+${n.comp})</span></td>
                <td>${n.base}\uc77c</td>
                <td>${n.tenure}\uc77c</td>
                <td>${n.adjust}\uc77c</td>
                <td>${n.comp}\uc77c</td>
                <td><button class="reason-button" type="button" data-action="show-leave-balance" data-user-id="${esc(item.userId)}"><span>${esc(`${n.used}\uc77c (${n.annualUsed}+${n.compUsed})`)}</span></button></td>
                <td><button class="reason-button" type="button" data-action="show-leave-balance" data-user-id="${esc(item.userId)}"><span>${esc(`${n.remaining}\uc77c`)}</span></button></td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function leaveRequestsTable(list, approvals = false) {
  if (!list.length) return `<div class="empty">\ud734\uac00 \ub0b4\uc5ed\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>\uc9c1\uc6d0</th>
            <th>\uc720\ud615</th>
            <th>\uae30\uac04</th>
            <th>\uc77c\uc218</th>
            <th>\uc0c1\ud0dc</th>
            <th>\ube44\uace0</th>
            ${approvals ? "<th>\ucc98\ub9ac</th>" : ""}
          </tr>
        </thead>
        <tbody>
          ${list.map((item) => `
            <tr>
              <td>${esc(item.user?.name || "-")}</td>
              <td>${esc(T.leaveType[item.type] || item.type)}</td>
              <td>${esc(item.startDate)} ~ ${esc(item.endDate)}</td>
              <td>${esc(item.days)}\uc77c</td>
              <td><span class="badge ${badgeClass(item.status)}">${esc(T.requestStatus[item.status] || item.status)}</span></td>
              <td>${renderReasonButton(item.executiveComment || item.teamLeadComment || item.reason)}</td>
              ${approvals ? `<td>${leaveApprovalButtons(item)}</td>` : ""}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function leaveApprovalButtons(item) {
  if (item.status === "PENDING_TEAM_LEAD" && isTeamLead() && item.user?.teamId === state.me.teamId) {
    return `<div class="actions"><button type="button" data-action="leave-approve" data-request-id="${esc(item.id)}">\uc2b9\uc778</button><button class="secondary" type="button" data-action="leave-reject" data-request-id="${esc(item.id)}">\ubc18\ub824</button></div>`;
  }
  if (item.status === "PENDING_EXECUTIVE" && isExecutive()) {
    return `<div class="actions"><button type="button" data-action="leave-approve" data-request-id="${esc(item.id)}">\uc2b9\uc778</button><button class="secondary" type="button" data-action="leave-reject" data-request-id="${esc(item.id)}">\ubc18\ub824</button></div>`;
  }
  return "-";
}

function leavePage() {
  const requests = filteredLeaveRequests();
  return appFrame(
    "\ud734\uac00 \uc2e0\uccad/\ub0b4\uc5ed",
    "\ud734\uac00 \uc794\uc5ec, \uc2e0\uccad, \ubd80\uc5ec/\uc870\uc815 \ud604\ud669\uc744 \ud655\uc778\ud569\ub2c8\ub2e4.",
    `
      <section class="surface">
        <div class="actions" style="justify-content: space-between;">
          <div>
            <h3>${esc(state.leaveYear)}\ub144 \ud604\ud669</h3>
            <p class="muted">\ucd1d\uc5f0\ucc28\uc5d0\uc11c \uc0ac\uc6a9\uc5f0\ucc28\ub97c \uc81c\uc678\ud55c \uc794\uc5ec\uc5f0\ucc28\ub97c \ud45c\uc2dc\ud569\ub2c8\ub2e4.</p>
          </div>
          <div class="actions">
            <button type="button" data-action="open-leave-request">\ud734\uac00 \uc2e0\uccad</button>
            ${isExecutive() ? `<button class="secondary" type="button" data-action="open-leave-adjust">\ud734\uac00 \ubd80\uc5ec/\uc870\uc815</button>` : ""}
          </div>
        </div>
        ${leaveBalanceTable(state.leaveBalances)}
      </section>
      <section class="surface">
        <form id="leave-filter-form" class="filters">
          <label>\uc2dc\uc791\uc77c<input type="date" name="from" value="${esc(state.leaveFilters.from)}"></label>
          <label>\uc885\ub8cc\uc77c<input type="date" name="to" value="${esc(state.leaveFilters.to)}"></label>
          ${(isExecutive() || isTeamLead()) ? `
            <label>\uc0ac\uc6a9\uc790
              <select name="userId">
                <option value="">\uc804\uccb4</option>
                ${state.users.map((user) => `<option value="${esc(user.id)}" ${state.leaveFilters.userId === user.id ? "selected" : ""}>${esc(user.name)} (${esc(T.role[user.role] || user.role)})</option>`).join("")}
              </select>
            </label>
          ` : ""}
          <label>\uc0c1\ud0dc
            <select name="status">
              <option value="">\uc804\uccb4</option>
              ${Object.entries(T.requestStatus).map(([key, label]) => `<option value="${esc(key)}" ${state.leaveFilters.status === key ? "selected" : ""}>${esc(label)}</option>`).join("")}
            </select>
          </label>
          <button type="submit">\uc870\ud68c</button>
        </form>
        <div class="actions" style="margin-top:10px;">
          <label>\uc6d4\ubcc4\uc870\ud68c<input type="month" data-period-month="leave" value="${esc(monthValue(state.leaveFilters.to || today()))}"></label>
          <button class="secondary" type="button" data-action="apply-period" data-scope="leave" data-mode="month">\uc6d4\ubcc4\uc870\ud68c</button>
          <label>\ub144\ub3c4\ubcc4\uc870\ud68c<input type="number" data-period-year="leave" value="${esc((state.leaveFilters.to || today()).slice(0, 4))}" min="2020" max="2100"></label>
          <button class="secondary" type="button" data-action="apply-period" data-scope="leave" data-mode="year">\ub144\ub3c4\ubcc4\uc870\ud68c</button>
          <button class="secondary" type="button" data-action="open-yearly" data-scope="leave">\ub144\ub3c4\ubcc4 \uc804\uccb4</button>
          <button type="button" data-action="download-yearly" data-scope="leave">\uc5d1\uc140\ub2e4\uc6b4\ub85c\ub4dc</button>
        </div>
      </section>
      <section class="surface">
        <div class="actions" style="justify-content: space-between;">
          <h3>\ud734\uac00 \uc2e0\uccad \ub0b4\uc5ed</h3>
          <div class="view-toggle">
            <button class="${state.leaveViewMode === "table" ? "secondary" : "ghost"}" type="button" data-action="leave-view" data-view="table">\ubaa9\ub85d</button>
            <button class="${state.leaveViewMode === "calendar" ? "secondary" : "ghost"}" type="button" data-action="leave-view" data-view="calendar">\uce98\ub9b0\ub354</button>
          </div>
        </div>
        ${state.leaveViewMode === "calendar" ? leaveCalendar() : leaveRequestsTable(requests, false)}
      </section>
    `
  );
}

function leaveCalendar() {
  const days = monthDays(state.leaveCalendarMonth);
  const weekLabels = ["\uc77c", "\uc6d4", "\ud654", "\uc218", "\ubaa9", "\uae08", "\ud1a0"];
  return `
    <div class="calendar-toolbar">
      <div class="actions">
        <button class="secondary" type="button" data-action="leave-month-shift" data-offset="0">\uc624\ub298</button>
        <button class="secondary" type="button" data-action="leave-month-shift" data-offset="-1">\uc774\uc804 \ub2ec</button>
        <strong>${esc(monthTitle(state.leaveCalendarMonth))}</strong>
        <button class="secondary" type="button" data-action="leave-month-shift" data-offset="1">\ub2e4\uc74c \ub2ec</button>
      </div>
      <span class="muted">\uc77c\uc790\ub97c \ud074\ub9ad\ud558\uba74 \ud734\uac00 \uc0c1\uc138 \ub0b4\uc5ed\uc744 \ubd05\ub2c8\ub2e4.</span>
    </div>
    <div class="calendar-grid" style="margin-top:14px;">
      ${weekLabels.map((label) => `<div class="calendar-weekday">${label}</div>`).join("")}
      ${days.map((day) => {
        const requests = leaveRequestsForDate(day.date);
        const approved = requests.filter((item) => item.status === "APPROVED").length;
        const pending = requests.filter((item) => item.status === "PENDING_TEAM_LEAD" || item.status === "PENDING_EXECUTIVE").length;
        const hasRequests = requests.length > 0;
        return `
          <div class="calendar-day ${day.inMonth ? "" : "is-other-month"} ${day.date === today() ? "is-today" : ""}">
            <header><span>${day.day}</span></header>
            <div class="calendar-body">
              ${hasRequests ? `
                <button class="calendar-summary-button" type="button" data-action="show-leave-day" data-date="${esc(day.date)}">
                  <div class="calendar-metric total"><span>\ud734\uac00 \uac74\uc218</span><strong>${requests.length}\uac74</strong></div>
                  <div class="calendar-metric"><span>\uc2b9\uc778\uc644\ub8cc</span><strong>${approved}\uac74</strong></div>
                  <div class="calendar-metric"><span>\uc2b9\uc778\ub300\uae30</span><strong>${pending}\uac74</strong></div>
                </button>
                ${requests.slice(0, 2).map((item) => `
                  <div class="calendar-entry">
                    <strong>${esc(item.user?.name || "-")}</strong>
                    <span>${esc(T.leaveType[item.type] || item.type)}</span>
                  </div>
                `).join("")}
                ${requests.length > 2 ? `<div class="calendar-empty">+ ${requests.length - 2}\uac74 \ub354\ubcf4\uae30</div>` : ""}
              ` : ""}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function leaveAdjustmentTable() {
  const adjustments = filteredLeaveAdjustments();
  if (!adjustments.length) return `<div class="empty">\ud734\uac00 \ubd80\uc5ec/\uc870\uc815 \uc774\ub825\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>\ub4f1\ub85d\uc77c\uc2dc</th><th>\uc9c1\uc6d0</th><th>\uad6c\ubd84</th><th>\uc77c\uc218</th><th>\uc0ac\uc720</th><th>\ucc98\ub9ac</th></tr></thead>
        <tbody>
          ${adjustments.map((item) => `
            <tr>
              <td>${esc(formatDateTime(item.createdAt))}</td>
              <td>${esc(item.user?.name || "-")}</td>
              <td>${esc(item.kind === "COMPENSATORY" ? "\ub300\uccb4\ud734\uac00 \ubd80\uc5ec" : "\uc5f0\ucc28 \uc870\uc815")}</td>
              <td>${esc(item.days)}\uc77c</td>
              <td>${esc(item.reason || "-")}</td>
              <td><button class="ghost" type="button" data-action="delete-leave-adjustment" data-adjustment-id="${esc(item.id)}">\ud68c\uc218/\ucde8\uc18c</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function leaveManagePage() {
  return appFrame(
    "\ub300\uccb4\ud734\uac00/\uc870\uc815 \uad00\ub9ac",
    "\uc778\uc6d0\ubcc4 \ubd80\uc5ec\uc640 \uc870\uc815 \uc774\ub825\uc744 \ud655\uc778\ud569\ub2c8\ub2e4.",
    `
      <section class="surface">
        <div class="actions" style="justify-content: space-between;">
          <div>
            <h3>${esc(state.leaveYear)}\ub144 \uc778\uc6d0\ubcc4 \ud604\ud669</h3>
            <p class="muted">\ub300\uccb4\ud734\uac00 \ubd80\uc5ec\uc640 \uc5f0\ucc28 \uc870\uc815\uc744 \uad00\ub9ac\ud569\ub2c8\ub2e4.</p>
          </div>
          <button type="button" data-action="open-leave-adjust">\ud734\uac00 \ubd80\uc5ec/\uc870\uc815</button>
        </div>
        ${leaveBalanceTable(state.leaveBalances)}
      </section>
      <section class="surface">
        <form id="leave-manage-filter-form" class="filters">
          <label>\uc2dc\uc791\uc77c<input type="date" name="from" value="${esc(state.leaveManageFilters.from)}"></label>
          <label>\uc885\ub8cc\uc77c<input type="date" name="to" value="${esc(state.leaveManageFilters.to)}"></label>
          <label>\uc0ac\uc6a9\uc790
            <select name="userId">
              <option value="">\uc804\uccb4</option>
              ${state.users.map((user) => `<option value="${esc(user.id)}" ${state.leaveManageFilters.userId === user.id ? "selected" : ""}>${esc(user.name)} (${esc(T.role[user.role] || user.role)})</option>`).join("")}
            </select>
          </label>
          <label>\uad6c\ubd84
            <select name="kind">
              <option value="">\uc804\uccb4</option>
              <option value="ANNUAL" ${state.leaveManageFilters.kind === "ANNUAL" ? "selected" : ""}>\uc5f0\ucc28 \uc870\uc815</option>
              <option value="COMPENSATORY" ${state.leaveManageFilters.kind === "COMPENSATORY" ? "selected" : ""}>\ub300\uccb4\ud734\uac00 \ubd80\uc5ec</option>
            </select>
          </label>
          <button type="submit">\uc870\ud68c</button>
        </form>
      </section>
      <section class="surface">
        <h3>\ud734\uac00 \ubd80\uc5ec/\uc870\uc815 \uc774\ub825</h3>
        ${leaveAdjustmentTable()}
      </section>
    `
  );
}

function approvalsPage() {
  const leaveList = state.leaveRequests.filter((item) => {
    if (isExecutive()) return item.status === "PENDING_EXECUTIVE";
    return item.status === "PENDING_TEAM_LEAD" && isTeamLead() && item.user?.teamId === state.me.teamId;
  });
  const overtimeList = state.overtimeRecords.filter((item) => {
    if (isExecutive()) return item.status === "PENDING_EXECUTIVE";
    return item.status === "PENDING_TEAM_LEAD" && isTeamLead() && item.user?.teamId === state.me.teamId;
  });
  return appFrame(
    "\ud734\uac00 \uc2b9\uc778\uad00\ub9ac",
    "\ud734\uac00 \uc2e0\uccad\uacfc \ucd94\uac00\uadfc\ubb34 \ub300\uccb4\ud734\uac00\ubcf4\uc0c1 \uc2e0\uccad\ub0b4\uc5ed\uc744 \ucc98\ub9ac\ud569\ub2c8\ub2e4.",
    `
      <section class="summary-band">
        <div class="summary-grid" style="grid-template-columns: repeat(3, minmax(0, 1fr));">
          ${summaryItem("\ud734\uac00 \uc2b9\uc778 \ub300\uae30", `${leaveList.length}\uac74`)}
          ${summaryItem("\ub300\uccb4\ud734\uac00\ubcf4\uc0c1 \ub300\uae30", `${overtimeList.length}\uac74`)}
          ${summaryItem("\ucd1d \ucc98\ub9ac \ub300\uae30", `${leaveList.length + overtimeList.length}\uac74`)}
        </div>
      </section>
      <section class="surface">
        <h3>\ud734\uac00 \uc2e0\uccad\ub0b4\uc5ed</h3>
        ${leaveRequestsTable(leaveList, true)}
      </section>
      <section class="surface">
        <h3>\ub300\uccb4\ud734\uac00\ubcf4\uc0c1 \uc2e0\uccad\ub0b4\uc5ed</h3>
        ${overtimeTable(overtimeList, true)}
      </section>
    `
  );
}

function usersPage() {
  const selectedUser = state.users.find((item) => item.id === state.selectedUserId) || state.users[0] || null;
  return appFrame(
    "\uc9c1\uc6d0\uad00\ub9ac",
    "\uc9c1\uc6d0 \uc815\ubcf4\ub97c \uc0dd\uc131\ud558\uace0 \uc218\uc815\ud569\ub2c8\ub2e4.",
    `
      <section class="surface">
        <div class="actions" style="justify-content: space-between;">
          <h3>\uc9c1\uc6d0 \ubaa9\ub85d</h3>
          <button type="button" data-action="open-user-create">\uc9c1\uc6d0 \uc0dd\uc131</button>
        </div>
        ${usersTable(selectedUser?.id || "")}
      </section>
      <section class="surface">
        <div class="actions" style="justify-content: space-between;">
          <h3>\uc9c1\uc6d0 \uc815\ubcf4</h3>
          ${selectedUser ? `<button class="secondary" type="button" data-action="open-user-edit" data-user-id="${esc(selectedUser.id)}">\uc218\uc815</button>` : ""}
        </div>
        ${selectedUser ? userDetailPanel(selectedUser) : `<div class="empty">\uc9c1\uc6d0\uc744 \uc120\ud0dd\ud574 \uc8fc\uc138\uc694.</div>`}
      </section>
    `
  );
}

function usersTable(selectedId = "") {
  if (!state.users.length) return `<div class="empty">\uc9c1\uc6d0 \uc815\ubcf4\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>\uc774\ub984</th><th>\ub85c\uadf8\uc778 ID</th><th>\uad8c\ud55c</th><th>\ud300</th><th>\uc0c1\ud0dc</th><th>\ucc98\ub9ac</th></tr></thead>
        <tbody>
          ${state.users.map((user) => `
            <tr class="selectable-row ${selectedId === user.id ? "selected-row" : ""}" data-action="select-user" data-user-id="${esc(user.id)}">
              <td>${esc(user.name)}</td>
              <td>${esc(user.loginId)}</td>
              <td>${esc(T.role[user.role] || user.role)}</td>
              <td>${esc(userTeamLabel(user))}</td>
              <td>${esc(T.status[user.status] || user.status)}</td>
              <td><button class="secondary" type="button" data-action="open-user-edit" data-user-id="${esc(user.id)}">\uc218\uc815</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function userDetailPanel(user) {
  const balance = state.leaveBalances.find((item) => item.userId === user.id);
  const numbers = balance ? balanceNumbers(balance) : null;
  return `
    <div class="grid two">
      <section class="surface">
        <h3>\uae30\ubcf8 \uc815\ubcf4</h3>
        <dl class="detail-list">
          <div><dt>\uc774\ub984</dt><dd>${esc(user.name)}</dd></div>
          <div><dt>\ub85c\uadf8\uc778 ID</dt><dd>${esc(user.loginId)}</dd></div>
          <div><dt>\uad8c\ud55c</dt><dd>${esc(T.role[user.role] || user.role)}</dd></div>
          <div><dt>\ud300</dt><dd>${esc(userTeamLabel(user))}</dd></div>
          <div><dt>\uc0c1\ud0dc</dt><dd>${esc(T.status[user.status] || user.status)}</dd></div>
          <div><dt>\uc785\uc0ac\uc77c</dt><dd>${esc(user.hireDate || "-")}</dd></div>
        </dl>
      </section>
      <section class="surface">
        <h3>\uadfc\ubb34 \uc124\uc815</h3>
        <dl class="detail-list">
          <div><dt>\ucd9c\uadfc\uc2dc\uac04</dt><dd>${esc(user.workStart || "-")}</dd></div>
          <div><dt>\ud1f4\uadfc\uc2dc\uac04</dt><dd>${esc(user.workEnd || "-")}</dd></div>
          <div><dt>\uc810\uc2ec\uc2dc\uc791</dt><dd>${esc(user.breakStart || "-")}</dd></div>
          <div><dt>\uc810\uc2ec\uc885\ub8cc</dt><dd>${esc(user.breakEnd || "-")}</dd></div>
          <div><dt>\uae30\ubcf8 \uc5f0\ucc28</dt><dd>${esc(user.baseAnnualLeaveDays ?? 15)}\uc77c</dd></div>
          <div><dt>\uc18c\uc18d \ud30c\uc545</dt><dd>${user.role === "EXECUTIVE" ? "\uad00\ub9ac\uc790 \uacc4\uc815" : "\ud300 \uc18c\uc18d"}</dd></div>
        </dl>
      </section>
    </div>
    <section class="surface" style="margin-top:16px;">
      <h3>${esc(state.leaveYear)}\ub144 \ud734\uac00 \ud604\ud669</h3>
      ${numbers ? `
        <div class="summary-grid summary-grid-attendance">
          ${summaryItem("\ucd1d\uc5f0\ucc28", `${numbers.total}\uc77c`)}
          ${summaryItem("\uc0ac\uc6a9\uc5f0\ucc28", `${numbers.used}\uc77c`)}
          ${summaryItem("\uc794\uc5ec\uc5f0\ucc28", `${numbers.remaining}\uc77c`)}
        </div>
      ` : `<div class="empty">\ud734\uac00 \uc815\ubcf4\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.</div>`}
    </section>
  `;
}

function teamsPage() {
  return appFrame(
    "\ud300\uad00\ub9ac",
    "\ud300\uc744 \ucd94\uac00\ud558\uace0 \uc218\uc815\ud569\ub2c8\ub2e4.",
    `<section class="surface"><div class="actions" style="justify-content: space-between;"><h3>\ud300 \ubaa9\ub85d</h3><button type="button" data-action="open-team-create">\ud300 \uc0dd\uc131</button></div>${teamsTable()}</section>`
  );
}

function holidaysPage() {
  return appFrame(
    "\ud734\uc77c \ub4f1\ub85d\uad00\ub9ac",
    "\uad00\ub9ac\uc790\uac00 \uacf5\ud734\uc77c\uc744 \ub4f1\ub85d\ud558\uba74 \ucd94\uac00\uadfc\ubb34 \uad6c\ubd84\uc5d0\uc11c \uc790\ub3d9\uc73c\ub85c \ud734\uc77c\ub85c \ucc98\ub9ac\ud569\ub2c8\ub2e4.",
    `
      <section class="surface">
        <div class="actions" style="justify-content: space-between;">
          <h3>\ud734\uc77c \ubaa9\ub85d</h3>
          <button type="button" data-action="open-holiday-create">\ud734\uc77c \ub4f1\ub85d</button>
        </div>
        ${holidaysTable()}
      </section>
    `
  );
}

function holidaysTable() {
  if (!state.holidays.length) return `<div class="empty">\ub4f1\ub85d\ub41c \ud734\uc77c\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>\ub0a0\uc9dc</th><th>\uba85\uce6d</th><th>\ucc98\ub9ac</th></tr></thead>
        <tbody>
          ${state.holidays.map((item) => `
            <tr>
              <td>${esc(item.date)}</td>
              <td>${esc(item.name)}</td>
              <td><button class="ghost" type="button" data-action="delete-holiday" data-holiday-id="${esc(item.id)}">\uc0ad\uc81c</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function teamsTable() {
  if (!state.teams.length) return `<div class="empty">\ud300\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>\ud300\uba85</th><th>\uc18c\uc18d \uc778\uc6d0</th><th>\ucc98\ub9ac</th></tr></thead>
        <tbody>
          ${state.teams.map((team) => `
            <tr>
              <td>${esc(team.name)}</td>
              <td>${state.users.filter((user) => user.teamId === team.id).length}\uba85</td>
              <td><div class="actions"><button class="secondary" type="button" data-action="open-team-edit" data-team-id="${esc(team.id)}">\uc218\uc815</button><button class="ghost" type="button" data-action="delete-team" data-team-id="${esc(team.id)}">\uc0ad\uc81c</button></div></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function settingsPage() {
  return appFrame(
    "\uc124\uc815",
    "IP \uc81c\ud55c \uc124\uc815\uacfc \ud5c8\uc6a9 IP \ubaa9\ub85d\uc744 \uad00\ub9ac\ud569\ub2c8\ub2e4.",
    `
      <section class="surface">
        <h3>IP \uc81c\ud55c \uc124\uc815</h3>
        <form id="ip-restriction-form" class="filters">
          <label>\uc0ac\uc6a9 \uc5ec\ubd80
            <select name="enabled">
              <option value="false" ${!state.ipRestrictionEnabled ? "selected" : ""}>\ubbf8\uc0ac\uc6a9</option>
              <option value="true" ${state.ipRestrictionEnabled ? "selected" : ""}>\uc0ac\uc6a9</option>
            </select>
          </label>
          <button type="submit">\uc800\uc7a5</button>
        </form>
        <p class="muted">\ud604\uc7ac \uc811\uc18d IP: ${esc(state.currentIp || "-")}</p>
      </section>
      <section class="surface">
        <div class="actions" style="justify-content: space-between;"><h3>\ud5c8\uc6a9 IP \ubaa9\ub85d</h3><button type="button" data-action="open-ip-create">IP \ub4f1\ub85d</button></div>
        ${allowedIpTable()}
      </section>
    `
  );
}

function allowedIpTable() {
  if (!state.allowedIps.length) return `<div class="empty">\ub4f1\ub85d\ub41c \ud5c8\uc6a9 IP\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>\ub77c\ubca8</th><th>IP</th><th>\ucc98\ub9ac</th></tr></thead>
        <tbody>
          ${state.allowedIps.map((item) => `
            <tr>
              <td>${esc(item.label || "-")}</td>
              <td>${esc(item.ip)}</td>
              <td><button class="ghost" type="button" data-action="delete-ip" data-ip-id="${esc(item.id)}">\uc0ad\uc81c</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function auditPage() {
  return appFrame(
    "\uac10\uc0ac\ub85c\uadf8",
    "\uc8fc\uc694 \uc791\uc5c5 \uc774\ub825\uc744 \ud655\uc778\ud569\ub2c8\ub2e4.",
    `
      <section class="surface">
        ${!state.auditLogs.length ? `<div class="empty">\uac10\uc0ac\ub85c\uadf8\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.</div>` : `
          <div class="table-wrap">
            <table>
              <thead><tr><th>\uc77c\uc2dc</th><th>\ud589\uc704\uc790</th><th>\uc774\ubca4\ud2b8</th></tr></thead>
              <tbody>
                ${state.auditLogs.map((item) => `<tr><td>${esc(formatDateTime(item.createdAt))}</td><td>${esc(item.actor?.name || "-")}</td><td>${esc(item.event)}</td></tr>`).join("")}
              </tbody>
            </table>
          </div>
        `}
      </section>
    `
  );
}

function renderReasonButton(text) {
  const value = String(text || "").trim();
  if (!value) return "-";
  const short = value.length > 18 ? `${value.slice(0, 18)}...` : value;
  return `<button class="reason-button" type="button" data-action="show-text" data-title="\ube44\uace0" data-content="${esc(value)}"><span>${esc(short)}</span></button>`;
}

function attendanceRequestsApprovalTable(list) {
  if (!list.length) return `<div class="empty">\ucc98\ub9ac\ud560 \uadfc\ud0dc \uc218\uc815 \uc694\uccad\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>\uc694\uccad\uc77c\uc2dc</th>
            <th>\uc9c1\uc6d0</th>
            <th>\ub300\uc0c1\uc77c</th>
            <th>\ubcc0\uacbd \uc694\uccad</th>
            <th>\ube44\uace0</th>
            <th>\ucc98\ub9ac</th>
          </tr>
        </thead>
        <tbody>
          ${list.map((item) => `
            <tr>
              <td>${esc(formatDateTime(item.createdAt))}</td>
              <td>${esc(item.user?.name || "-")}</td>
              <td>${esc(item.date)}</td>
              <td>\ucd9c\uadfc ${esc(formatTime(item.proposedCheckInAt))}<br>\ud1f4\uadfc ${esc(formatTime(item.proposedCheckOutAt))}</td>
              <td>${renderReasonButton(item.reason)}</td>
              <td>${attendanceApprovalButtons(item)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function attendanceApprovalButtons(item) {
  if (item.status === "PENDING_TEAM_LEAD" && isTeamLead() && item.user?.teamId === state.me.teamId) {
    return `<div class="actions"><button type="button" data-action="attendance-approve" data-request-id="${esc(item.id)}">\uc2b9\uc778</button><button class="secondary" type="button" data-action="attendance-reject" data-request-id="${esc(item.id)}">\ubc18\ub824</button></div>`;
  }
  if (item.status === "PENDING_EXECUTIVE" && isExecutive()) {
    return `<div class="actions"><button type="button" data-action="attendance-approve" data-request-id="${esc(item.id)}">\uc2b9\uc778</button><button class="secondary" type="button" data-action="attendance-reject" data-request-id="${esc(item.id)}">\ubc18\ub824</button></div>`;
  }
  return "-";
}

function canDashboardQueueTitle() {
  if (isExecutive() || isTeamLead()) return "\uc2b9\uc778 \ub300\uae30 \ud604\ud669";
  return "\ub0b4 \uc548\ub0b4";
}

function dashboardQueueContent(pendingLeaveApprovals, pendingAttendanceApprovals, pendingOvertimeApprovals = []) {
  if (isExecutive() || isTeamLead()) {
    const items = [];
    if (pendingLeaveApprovals.length) items.push(`<div class="notice">\ud734\uac00 \uc2b9\uc778 \ub300\uae30 ${pendingLeaveApprovals.length}\uac74</div>`);
    if (pendingAttendanceApprovals.length) items.push(`<div class="notice">\uadfc\ud0dc \uc2b9\uc778 \ub300\uae30 ${pendingAttendanceApprovals.length}\uac74</div>`);
    if (pendingOvertimeApprovals.length) items.push(`<div class="notice">\ub300\uccb4\ud734\uac00\ubcf4\uc0c1 \uc2b9\uc778 \ub300\uae30 ${pendingOvertimeApprovals.length}\uac74</div>`);
    if (!items.length) return `<div class="empty">\ucc98\ub9ac\ud560 \uc2b9\uc778 \ub300\uae30 \uac74\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.</div>`;
    return `<div class="stack">${items.join("")}</div>`;
  }
  return `
    <div class="stack">
      <div class="notice">\ud734\uac00 \uc2e0\uccad\uacfc \ucd9c\ud1f4\uadfc \uc218\uc815\uc694\uccad\uc740 \uba54\ub274\uc5d0\uc11c \ubc14\ub85c \uc9c4\ud589\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.</div>
      <div class="notice">\ub0a8\uc740 \uc5f0\ucc28 \ubcc0\ub3d9\uc740 \ud734\uac00 \ud604\ud669\uc5d0\uc11c \ud655\uc778\ud574 \uc8fc\uc138\uc694.</div>
    </div>
  `;
}

function myPageDetailList(balance, summary) {
  const numbers = balance ? balanceNumbers(balance) : null;
  return `
    <dl class="detail-list">
      <div><dt>\uc774\ub984</dt><dd>${esc(state.me?.name || "-")}</dd></div>
      <div><dt>\uad8c\ud55c</dt><dd>${esc(T.role[state.me?.role] || state.me?.role || "-")}</dd></div>
      <div><dt>\ud300</dt><dd>${esc(userTeamLabel(state.me))}</dd></div>
      <div><dt>\ub85c\uadf8\uc778 ID</dt><dd>${esc(state.me?.loginId || "-")}</dd></div>
      <div><dt>\uc785\uc0ac\uc77c</dt><dd>${esc(state.me?.hireDate || "-")}</dd></div>
      <div><dt>\uadfc\ubb34\uc2dc\uac04</dt><dd>${esc(state.me?.workStart || "-")} ~ ${esc(state.me?.workEnd || "-")}</dd></div>
      <div><dt>\uc810\uc2ec\uc2dc\uac04</dt><dd>${esc(state.me?.breakStart || "-")} ~ ${esc(state.me?.breakEnd || "-")}</dd></div>
      <div><dt>\ub0a8\uc740 \uc5f0\ucc28</dt><dd>${numbers ? `${numbers.remaining}\uc77c` : "-"}</dd></div>
      <div><dt>\ud734\uac00 \ucd1d\uc0ac\uc6a9</dt><dd>${numbers ? `${numbers.used}\uc77c` : "-"}</dd></div>
      <div><dt>\uc815\uc0c1\ucd9c\uadfc</dt><dd>${isExecutive() ? "\ub300\uc0c1\uc544\ub2d8" : `${summary.normal}\uac74`}</dd></div>
      <div><dt>\uc9c0\uac01</dt><dd>${isExecutive() ? "\ub300\uc0c1\uc544\ub2d8" : `${summary.late}\uac74`}</dd></div>
      <div><dt>\ubbf8\ud1f4\uadfc</dt><dd>${isExecutive() ? "\ub300\uc0c1\uc544\ub2d8" : `${summary.notCheckedOut}\uac74`}</dd></div>
    </dl>
  `;
}

function myPagePage() {
  const balance = state.leaveBalances.find((item) => item.userId === state.me.id);
  const numbers = balance ? balanceNumbers(balance) : null;
  const mine = state.attendance.filter((item) => item.userId === state.me.id);
  const myLeaves = state.leaveRequests.filter((item) => item.userId === state.me.id);
  const summary = attendanceSummary(mine);
  return appFrame(
    "\ub9c8\uc774\ud398\uc774\uc9c0",
    "\ub0b4 \uacc4\uc815, \uadfc\ud0dc, \ud734\uac00 \uc815\ubcf4\ub97c \ud55c \uacf3\uc5d0\uc11c \ud655\uc778\ud569\ub2c8\ub2e4.",
    `
      <section class="surface">
        <div class="actions" style="justify-content: space-between;">
          <div>
            <h3>\ub0b4 \uacc4\uc815 \uc815\ubcf4</h3>
            <p class="muted">${esc(T.role[state.me?.role] || state.me?.role || "-")} / ${esc(userTeamLabel(state.me))}</p>
          </div>
        </div>
        ${myPageDetailList(balance, summary)}
      </section>
      <section class="summary-band">
        <div class="summary-title">
          <h2>${esc(state.leaveYear)}\ub144 \ub0b4 \ud604\ud669</h2>
          <p>\uadfc\ud0dc\uc640 \ud734\uac00 \uc694\uc57d\uc744 \ud568\uaed8 \ubd05\ub2c8\ub2e4.</p>
        </div>
        <div class="summary-grid">
          ${isExecutive() ? summaryItem("\uc815\uc0c1\ucd9c\uadfc", "\ub300\uc0c1\uc544\ub2d8", "is-muted") : summaryItem("\uc815\uc0c1\ucd9c\uadfc", `${summary.normal}\uac74`)}
          ${isExecutive() ? summaryItem("\uc9c0\uac01", "\ub300\uc0c1\uc544\ub2d8", "is-muted") : summaryItem("\uc9c0\uac01", `${summary.late}\uac74`, "danger-value")}
          ${isExecutive() ? summaryItem("\ubbf8\ud1f4\uadfc", "\ub300\uc0c1\uc544\ub2d8", "is-muted") : summaryItem("\ubbf8\ud1f4\uadfc", `${summary.notCheckedOut}\uac74`)}
          ${summaryItem("\ud734\uac00 \ucd1d\uc0ac\uc6a9", numbers ? `${numbers.used}\uc77c` : "-")}
          ${summaryItem("\ub0a8\uc740 \uc5f0\ucc28", numbers ? `${numbers.remaining}\uc77c` : "-")}
          ${summaryItem("\uc5f0\ucc28 \uc870\uc815", numbers ? `${numbers.adjust}\uc77c` : "-")}
          ${summaryItem("\ub300\uccb4\ud734\uac00 \ubd80\uc5ec", numbers ? `${numbers.comp}\uc77c` : "-")}
        </div>
      </section>
      <section class="grid two">
        <div class="surface">
          <h3>\ube44\ubc00\ubc88\ud638 \ubcc0\uacbd</h3>
          <form id="password-form" class="form-grid">
            <label>\ud604\uc7ac \ube44\ubc00\ubc88\ud638<input type="password" name="currentPassword" required></label>
            <label>\uc0c8 \ube44\ubc00\ubc88\ud638<input type="password" name="newPassword" required></label>
            <div class="wide"><button type="submit">\ube44\ubc00\ubc88\ud638 \ubcc0\uacbd</button></div>
          </form>
        </div>
        <div class="surface">
          <h3>${esc(state.leaveYear)}\ub144 \ud734\uac00 \ud604\ud669</h3>
          ${leaveBalanceTable(balance ? [balance] : [])}
        </div>
      </section>
      <section class="grid two">
        <section class="surface">
          <h3>\ucd5c\uadfc \ucd9c\ud1f4\uadfc\uae30\ub85d</h3>
          ${isExecutive() ? `<div class="empty">\uad00\ub9ac\uc790 \uacc4\uc815\uc740 \ucd9c\ud1f4\uadfc \uae30\ub85d \ub300\uc0c1\uc774 \uc544\ub2d9\ub2c8\ub2e4.</div>` : attendanceTable(mine.slice(0, 10), false)}
        </section>
        <section class="surface">
          <h3>\ucd5c\uadfc \ud734\uac00 \ub0b4\uc5ed</h3>
          ${leaveRequestsTable(myLeaves.slice(0, 10), false)}
        </section>
      </section>
    `
  );
}

function renderApp() {
  if (!state.me) {
    renderLogin();
    return;
  }
  let html = "";
  if (state.tab === "dashboard") html = dashboardPage();
  else if (state.tab === "attendance") html = attendancePage();
  else if (state.tab === "overtime") html = overtimePage();
  else if (state.tab === "attendanceRequests") html = attendanceRequestsPage();
  else if (state.tab === "leave") html = leavePage();
  else if (state.tab === "leaveManage") html = leaveManagePage();
  else if (state.tab === "approvals") html = approvalsPage();
  else if (state.tab === "mypage") html = myPagePage();
  else if (state.tab === "users") html = usersPage();
  else if (state.tab === "teams") html = teamsPage();
  else if (state.tab === "holidays") html = holidaysPage();
  else if (state.tab === "settings") html = settingsPage();
  else if (state.tab === "audit") html = auditPage();
  q("#app").innerHTML = html;
}

function renderLogin() {
  q("#app").innerHTML = `
    <main class="login-shell">
      <section class="login-card">
        <div class="brand-row">
          <img class="brand-logo" src="/assets/logo.png" alt="logo" onerror="this.style.display='none'">
          <h1>${T.serviceName}</h1>
          <p>\uad00\ub9ac\uc790\uac00 \ub9cc\ub4e0 \uacc4\uc815\uc73c\ub85c \ub85c\uadf8\uc778\ud569\ub2c8\ub2e4.</p>
        </div>
        <form id="login-form" class="form-grid compact">
          <label class="wide">\ub85c\uadf8\uc778 ID<input name="loginId" required></label>
          <label class="wide">\ube44\ubc00\ubc88\ud638<input type="password" name="password" required></label>
          <div class="wide form-error" data-login-error hidden></div>
          <div class="wide"><button type="submit">\ub85c\uadf8\uc778</button></div>
        </form>
      </section>
    </main>
  `;
}

function myPageContent() {
  const balance = state.leaveBalances.find((item) => item.userId === state.me.id);
  const numbers = balance ? balanceNumbers(balance) : null;
  const mine = state.attendance.filter((item) => item.userId === state.me.id);
  const summary = attendanceSummary(mine);
  return `
    <section class="modal-panel wide-modal">
      <div class="modal-head">
        <div><h2>\ub9c8\uc774\ud398\uc774\uc9c0</h2><p>${esc(T.role[state.me.role] || state.me.role)} / ${esc(userTeamLabel(state.me))}</p></div>
        <button class="secondary" type="button" data-action="close-modal">\ub2eb\uae30</button>
      </div>
      <form id="password-form" class="form-grid">
        <label>\ud604\uc7ac \ube44\ubc00\ubc88\ud638<input type="password" name="currentPassword" required></label>
        <label>\uc0c8 \ube44\ubc00\ubc88\ud638<input type="password" name="newPassword" required></label>
        <div class="wide"><button type="submit">\ube44\ubc00\ubc88\ud638 \ubcc0\uacbd</button></div>
      </form>
      <div class="summary-grid">
        ${isExecutive() ? summaryItem("\uc815\uc0c1\ucd9c\uadfc", "\ub300\uc0c1\uc544\ub2d8", "is-muted") : summaryItem("\uc815\uc0c1\ucd9c\uadfc", `${summary.normal}\uac74`)}
        ${isExecutive() ? summaryItem("\uc9c0\uac01", "\ub300\uc0c1\uc544\ub2d8", "is-muted") : summaryItem("\uc9c0\uac01", `${summary.late}\uac74`, "danger-value")}
        ${isExecutive() ? summaryItem("\ubbf8\ud1f4\uadfc", "\ub300\uc0c1\uc544\ub2d8", "is-muted") : summaryItem("\ubbf8\ud1f4\uadfc", `${summary.notCheckedOut}\uac74`)}
        ${summaryItem("\ud734\uac00 \ucd1d\uc0ac\uc6a9 / \uc794\uc5ec", numbers ? `${numbers.used}\uc77c / ${numbers.remaining}\uc77c` : "-")}
      </div>
      <div class="grid two">
        <section class="surface">
          <h3>\ucd5c\uadfc \ucd9c\ud1f4\uadfc\uae30\ub85d</h3>
          ${isExecutive() ? `<div class="empty">\uad00\ub9ac\uc790 \uacc4\uc815\uc740 \ucd9c\ud1f4\uadfc \uae30\ub85d \ub300\uc0c1\uc774 \uc544\ub2d9\ub2c8\ub2e4.</div>` : attendanceTable(mine.slice(0, 5), false)}
        </section>
        <section class="surface">
          <h3>\ucd5c\uadfc \ud734\uac00 \ub0b4\uc5ed</h3>
          ${leaveRequestsTable(state.leaveRequests.filter((item) => item.userId === state.me.id).slice(0, 5), false)}
        </section>
      </div>
    </section>
  `;
}

function openModal(content) {
  const root = q("#modal-root");
  if (!root) return;
  root.innerHTML = `<div class="modal-backdrop">${content}</div>`;
}

function closeModal() {
  const root = q("#modal-root");
  if (root) root.innerHTML = "";
}

function openTextModal(title, content) {
  openModal(`
    <section class="modal-panel">
      <div class="modal-head">
        <div><h2>${esc(title)}</h2></div>
        <button class="secondary" type="button" data-action="close-modal">\ub2eb\uae30</button>
      </div>
      <div class="surface"><pre style="white-space: pre-wrap; margin: 0;">${esc(content || "-")}</pre></div>
    </section>
  `);
}

function openAttendanceMarkModal(kind) {
  const placeholder = kind === "checkIn" ? "\uc608) \uc678\uadfc \ud6c4 \ubc14\ub85c \ucd9c\uadfc" : "\uc608) \uc678\uadfc \ud6c4 \ubc14\ub85c \ud1f4\uadfc";
  openModal(`
    <section class="modal-panel">
      <div class="modal-head">
        <div><h2>${kind === "checkIn" ? "\ucd9c\uadfc \uccb4\ud06c" : "\ud1f4\uadfc \uccb4\ud06c"}</h2><p>\ube44\uace0 \uba54\ubaa8\ub97c \ub0a8\uae38 \uc218 \uc788\uc2b5\ub2c8\ub2e4.</p></div>
        <button class="secondary" type="button" data-action="close-modal">\ub2eb\uae30</button>
      </div>
      <form id="attendance-mark-form" class="form-grid compact">
        <input type="hidden" name="kind" value="${esc(kind)}">
        <label class="wide">\ube44\uace0<textarea name="note" placeholder="${esc(placeholder)}"></textarea></label>
        <div class="wide"><button type="submit">${kind === "checkIn" ? "\ucd9c\uadfc \uc800\uc7a5" : "\ud1f4\uadfc \uc800\uc7a5"}</button></div>
      </form>
    </section>
  `);
}

function openAttendanceRequestModal(recordId) {
  const record = state.attendance.find((item) => item.id === recordId);
  if (!record) return;
  openModal(`
    <section class="modal-panel">
      <div class="modal-head">
        <div><h2>\uadfc\ud0dc \uc218\uc815\uc694\uccad</h2><p>${esc(record.date)} / ${esc(record.user?.name || "")}</p></div>
        <button class="secondary" type="button" data-action="close-modal">\ub2eb\uae30</button>
      </div>
      <form id="attendance-request-form" class="form-grid">
        <input type="hidden" name="date" value="${esc(record.date)}">
        <label>\ucd9c\uadfc\uc2dc\uac04<input type="time" name="proposedCheckInTime" value="${esc(timeValue(record.checkInAt))}"></label>
        <label>\ud1f4\uadfc\uc2dc\uac04<input type="time" name="proposedCheckOutTime" value="${esc(timeValue(record.checkOutAt))}"></label>
        <label class="wide">\uc0ac\uc720<textarea name="reason" required></textarea></label>
        <div class="wide"><button type="submit">\uc218\uc815\uc694\uccad \ub4f1\ub85d</button></div>
      </form>
    </section>
  `);
}

function openAttendanceDecisionModal(requestId, action) {
  openModal(`
    <section class="modal-panel">
      <div class="modal-head">
        <div><h2>${action === "approve" ? "\uc218\uc815\uc694\uccad \uc2b9\uc778" : "\uc218\uc815\uc694\uccad \ubc18\ub824"}</h2></div>
        <button class="secondary" type="button" data-action="close-modal">\ub2eb\uae30</button>
      </div>
      <form id="attendance-decision-form" class="form-grid compact">
        <input type="hidden" name="requestId" value="${esc(requestId)}">
        <input type="hidden" name="action" value="${esc(action)}">
        <label class="wide">\ube44\uace0<textarea name="comment"></textarea></label>
        <div class="wide"><button type="submit">${action === "approve" ? "\uc2b9\uc778" : "\ubc18\ub824"}</button></div>
      </form>
    </section>
  `);
}

function openAttendanceDayModal(date) {
  const records = state.attendance.filter((item) => item.date === date);
  const overtimeRecords = state.overtimeRecords.filter((item) => item.date === date);
  const overtimeUsers = new Set(overtimeRecords.map((item) => item.userId)).size;
  const overtimeMinutes = overtimeRecords.reduce((sum, item) => sum + Number(item.recognizedMinutes || 0), 0);
  const totalTargets = state.attendanceFilters.userId ? 1 : Math.max(0, state.users.filter((user) => isAttendanceTarget(user)).length);
  const summary = attendanceSummary(records);
  openModal(`
    <section class="modal-panel wide-modal">
      <div class="modal-head">
        <div><h2>${esc(date)} \ucd9c\ud1f4\uadfc \ud604\ud669</h2><p>\uc77c\uc790 \uae30\uc900 \uc0c1\uc138 \ub0b4\uc5ed\uc785\ub2c8\ub2e4.</p></div>
        <button class="secondary" type="button" data-action="close-modal">\ub2eb\uae30</button>
      </div>
      <div class="summary-grid summary-grid-attendance" style="grid-template-columns: repeat(5, minmax(0, 1fr));">
        ${summaryItem("\uc804\uccb4\ub300\uc0c1\uc790", `${totalTargets}\uba85`)}
        ${summaryItem("\uc815\uc0c1\ucd9c\uadfc", `${summary.normal}\uac74`, "")}
        ${summaryItem("\uc9c0\uac01", `${summary.late}\uac74`, "danger-value")}
        ${summaryItem("\ucd94\uac00\uadfc\ubb34\uc790", `${overtimeUsers}\uba85`)}
        ${summaryItem("\ucd94\uac00\uadfc\ubb34\uc2dc\uac04", overtimeMinutes ? esc(formatMinutes(overtimeMinutes)) : "\uc5c6\uc74c")}
      </div>
      <section class="surface" style="margin-top:14px;">
        <h3>\uc0c1\uc138 \ubaa9\ub85d</h3>
        ${attendanceTable(records, false)}
      </section>
      <section class="surface" style="margin-top:14px;">
        <h3>\ucd94\uac00\uadfc\ubb34\uc790</h3>
        ${overtimeRecords.length ? overtimeTable(overtimeRecords, false, false) : `<div class="empty">\uc5c6\uc74c</div>`}
      </section>
    </section>
  `);
}

function openDirectAdjustModal(recordId) {
  const record = state.attendance.find((item) => item.id === recordId);
  if (!record) return;
  openModal(`
    <section class="modal-panel">
      <div class="modal-head">
        <div><h2>\uadfc\ud0dc \uc9c1\uc811 \uc218\uc815</h2><p>${esc(record.user?.name || "")} / ${esc(record.date)}</p></div>
        <button class="secondary" type="button" data-action="close-modal">\ub2eb\uae30</button>
      </div>
      <form id="direct-adjust-form" class="form-grid">
        <input type="hidden" name="userId" value="${esc(record.userId)}">
        <input type="hidden" name="date" value="${esc(record.date)}">
        <label>\ucd9c\uadfc\uc2dc\uac04<input type="time" name="checkInTime" value="${esc(timeValue(record.checkInAt))}"></label>
        <label>\ud1f4\uadfc\uc2dc\uac04<input type="time" name="checkOutTime" value="${esc(timeValue(record.checkOutAt))}"></label>
        <label class="wide">\uc218\uc815 \uc0ac\uc720<textarea name="reason" required></textarea></label>
        <div class="wide"><button type="submit">\uc218\uc815 \uc800\uc7a5</button></div>
      </form>
    </section>
  `);
}

function openLeaveRequestModal() {
  openModal(`
    <section class="modal-panel">
      <div class="modal-head">
        <div><h2>\ud734\uac00 \uc2e0\uccad</h2><p>\uae30\uac04\uacfc \uc0ac\uc720\ub97c \uc785\ub825\ud574 \uc8fc\uc138\uc694.</p></div>
        <button class="secondary" type="button" data-action="close-modal">\ub2eb\uae30</button>
      </div>
      <form id="leave-request-form" class="form-grid">
        <label>\uc720\ud615
          <select name="type">
            <option value="ANNUAL">${T.leaveType.ANNUAL}</option>
            <option value="AM_HALF">${T.leaveType.AM_HALF}</option>
            <option value="PM_HALF">${T.leaveType.PM_HALF}</option>
            <option value="COMPENSATORY">${T.leaveType.COMPENSATORY}</option>
          </select>
        </label>
        <label>\uc2dc\uc791\uc77c<input type="date" name="startDate" value="${esc(today())}" required></label>
        <label>\uc885\ub8cc\uc77c<input type="date" name="endDate" value="${esc(today())}" required></label>
        <label class="wide">\uc0ac\uc720<textarea name="reason" required></textarea></label>
        <div class="wide"><button type="submit">\uc2e0\uccad</button></div>
      </form>
    </section>
  `);
}

function openLeaveDecisionModal(requestId, action) {
  openModal(`
    <section class="modal-panel">
      <div class="modal-head">
        <div><h2>${action === "approve" ? "\ud734\uac00 \uc2b9\uc778" : "\ud734\uac00 \ubc18\ub824"}</h2></div>
        <button class="secondary" type="button" data-action="close-modal">\ub2eb\uae30</button>
      </div>
      <form id="leave-decision-form" class="form-grid compact">
        <input type="hidden" name="requestId" value="${esc(requestId)}">
        <input type="hidden" name="action" value="${esc(action)}">
        <label class="wide">\ube44\uace0<textarea name="comment"></textarea></label>
        <div class="wide"><button type="submit">${action === "approve" ? "\uc2b9\uc778" : "\ubc18\ub824"}</button></div>
      </form>
    </section>
  `);
}

function openLeaveAdjustModal() {
  openModal(`
    <section class="modal-panel">
      <div class="modal-head">
        <div><h2>\ud734\uac00 \ubd80\uc5ec/\uc870\uc815</h2><p>\uc5f0\ucc28 \uc870\uc815 \ub610\ub294 \ub300\uccb4\ud734\uac00 \ubd80\uc5ec\ub97c \ub4f1\ub85d\ud569\ub2c8\ub2e4.</p></div>
        <button class="secondary" type="button" data-action="close-modal">\ub2eb\uae30</button>
      </div>
      <form id="leave-adjust-form" class="form-grid">
        <label>\uc9c1\uc6d0
          <select name="userId">
            ${state.users.map((user) => `<option value="${esc(user.id)}">${esc(user.name)} (${esc(T.role[user.role] || user.role)})</option>`).join("")}
          </select>
        </label>
        <label>\uc5f0\ub3c4<input type="number" name="year" value="${esc(state.leaveYear)}"></label>
        <label>\uad6c\ubd84
          <select name="kind">
            <option value="ANNUAL">\uc5f0\ucc28 \uc870\uc815</option>
            <option value="COMPENSATORY">\ub300\uccb4\ud734\uac00 \ubd80\uc5ec</option>
          </select>
        </label>
        <label>\uc77c\uc218<input type="number" step="0.5" name="days" required></label>
        <label class="wide">\uc0ac\uc720<textarea name="reason" required></textarea></label>
        <div class="wide"><button type="submit">\uc800\uc7a5</button></div>
      </form>
    </section>
  `);
}

function openDashboardDetail(mode) {
  const data = dashboardDayData();
  let title = `${data.date} \ud604\ud669`;
  let content = "";
  if (mode === "targets") {
    title = `${data.date} \ucd9c\ud1f4\uadfc \ub300\uc0c1`;
    content = data.targets.length ? `
      <div class="table-wrap"><table><thead><tr><th>\uc9c1\uc6d0</th><th>\uc9c1\uae09</th><th>\ud300</th></tr></thead><tbody>
        ${data.targets.map((user) => `<tr><td>${esc(user.name)}</td><td>${esc(T.role[user.role] || user.role)}</td><td>${esc(userTeamLabel(user))}</td></tr>`).join("")}
      </tbody></table></div>
    ` : `<div class="empty">\ub300\uc0c1\uc790\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.</div>`;
  } else if (mode === "normal") {
    title = `${data.date} \uc815\uc0c1\ucd9c\uadfc`;
    content = attendanceTable(data.normal, false);
  } else if (mode === "issues") {
    title = `${data.date} \uc9c0\uac01 / \ubbf8\ud1f4\uadfc`;
    const rows = [...data.late, ...data.notCheckedOut.filter((item) => !data.late.some((late) => late.id === item.id))];
    content = attendanceTable(rows, false);
  } else {
    title = `${data.date} \uc5f0\ucc28\uc815\ubcf4`;
    content = data.leave.length ? leaveRequestsTable(data.leave, false) : `<div class="empty">\uc5f0\ucc28 \uc0ac\uc6a9\uc790\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.</div>`;
  }
  openModal(`
    <section class="modal-panel wide-modal">
      <div class="modal-head">
        <div><h2>${esc(title)}</h2></div>
        <button class="secondary" type="button" data-action="close-modal">\ub2eb\uae30</button>
      </div>
      ${content}
    </section>
  `);
}

function openDashboardYearDetail(mode) {
  const data = dashboardYearData();
  let records = data.records;
  let title = `${data.year} ${data.user?.name || ""} \uadfc\ud0dc\ud604\ud669`;
  if (mode === "normal") {
    records = records.filter((item) => attendanceJudge(item) === "NORMAL");
    title = `${data.year} \uc815\uc0c1\ucd9c\uadfc`;
  } else if (mode === "late") {
    records = records.filter((item) => attendanceJudge(item) === "LATE");
    title = `${data.year} \uc9c0\uac01`;
  } else if (mode === "notCheckedOut") {
    records = records.filter((item) => item.checkInAt && !item.checkOutAt);
    title = `${data.year} \ubbf8\ud1f4\uadfc`;
  } else if (mode === "leave") {
    const leaves = state.leaveRequests.filter((item) => item.userId === data.user?.id && item.status === "APPROVED" && String(item.startDate || "").startsWith(data.year));
    openModal(`
      <section class="modal-panel wide-modal">
        <div class="modal-head"><div><h2>${esc(data.year)} \uc5f0\ucc28\uc0ac\uc6a9\ub0b4\uc5ed</h2></div><button class="secondary" type="button" data-action="close-modal">\ub2eb\uae30</button></div>
        ${leaveRequestsTable(leaves, false)}
      </section>
    `);
    return;
  }
  openModal(`
    <section class="modal-panel wide-modal">
      <div class="modal-head"><div><h2>${esc(title)}</h2></div><button class="secondary" type="button" data-action="close-modal">\ub2eb\uae30</button></div>
      ${attendanceTable(records, false)}
    </section>
  `);
}

function openLeaveBalanceModal(userId) {
  const balance = state.leaveBalances.find((item) => item.userId === userId);
  if (!balance) return;
  const n = balanceNumbers(balance);
  const requests = state.leaveRequests.filter((item) => item.userId === userId && item.status === "APPROVED");
  openModal(`
    <section class="modal-panel wide-modal">
      <div class="modal-head">
        <div><h2>${esc(balance.user?.name || "-")} \ud734\uac00 \uc0c1\uc138\ub0b4\uc5ed</h2><p>${esc(state.leaveYear)}\ub144 \uc0ac\uc6a9/\uc794\uc5ec \uc0c1\uc138\uc785\ub2c8\ub2e4.</p></div>
        <button class="secondary" type="button" data-action="close-modal">\ub2eb\uae30</button>
      </div>
      <div class="summary-grid">
        ${summaryItem("\ucd1d\uc5f0\ucc28", `${n.total}\uc77c`)}
        ${summaryItem("\uc0ac\uc6a9\uc5f0\ucc28", `${n.used}\uc77c`)}
        ${summaryItem("\uc794\uc5ec\uc5f0\ucc28", `${n.remaining}\uc77c`)}
      </div>
      <section class="surface">
        <h3>\uc0ac\uc6a9 \uc0c1\uc138\ub0b4\uc5ed</h3>
        ${leaveRequestsTable(requests, false)}
      </section>
    </section>
  `);
}

function openLeaveDayModal(date) {
  const requests = leaveRequestsForDate(date);
  openModal(`
    <section class="modal-panel wide-modal">
      <div class="modal-head">
        <div><h2>${esc(date)} \ud734\uac00 \ud604\ud669</h2><p>\uc77c\uc790 \uae30\uc900 \ud734\uac00 \uc0c1\uc138 \ub0b4\uc5ed\uc785\ub2c8\ub2e4.</p></div>
        <button class="secondary" type="button" data-action="close-modal">\ub2eb\uae30</button>
      </div>
      <div class="summary-grid summary-grid-attendance">
        ${summaryItem("\uc804\uccb4 \uc2e0\uccad", `${requests.length}\uac74`)}
        ${summaryItem("\uc2b9\uc778\uc644\ub8cc", `${requests.filter((item) => item.status === "APPROVED").length}\uac74`)}
        ${summaryItem("\uc2b9\uc778\ub300\uae30", `${requests.filter((item) => item.status === "PENDING_TEAM_LEAD" || item.status === "PENDING_EXECUTIVE").length}\uac74`)}
      </div>
      <section class="surface" style="margin-top:14px;">
        <h3>\uc0c1\uc138 \ubaa9\ub85d</h3>
        ${leaveRequestsTable(requests, false)}
      </section>
    </section>
  `);
}

function openOvertimeDayModal(date) {
  const records = overtimeRecordsForDate(date);
  const summary = overtimeSummary(records);
  openModal(`
    <section class="modal-panel wide-modal">
      <div class="modal-head">
        <div><h2>${esc(date)} \ucd94\uac00\uadfc\ubb34 \ud604\ud669</h2><p>\uc77c\uc790 \uae30\uc900 \uc0c1\uc138 \ub0b4\uc5ed\uc785\ub2c8\ub2e4.</p></div>
        <button class="secondary" type="button" data-action="close-modal">\ub2eb\uae30</button>
      </div>
      <div class="summary-grid summary-grid-attendance" style="grid-template-columns: repeat(4, minmax(0, 1fr));">
        ${summaryItem("\uae30\ub85d \uac74\uc218", `${summary.total}\uac74`)}
        ${summaryItem("\uc778\uc815\uc2dc\uac04", esc(formatMinutes(summary.recognizedMinutes)))}
        ${summaryItem("\ub300\uccb4\ud734\uac00 \uc694\uccad", `${summary.requestedDays}\uc77c`)}
        ${summaryItem("\uc2b9\uc778\uc644\ub8cc", `${summary.approved}\uac74`)}
      </div>
      <section class="surface" style="margin-top:14px;">
        <h3>\uc0c1\uc138 \ubaa9\ub85d</h3>
        ${overtimeTable(records, false, true)}
      </section>
    </section>
  `);
}

function openOvertimeSummaryModal(mode) {
  const records = filteredOvertimeRecords();
  const title = mode === "recognized" ? "\uc778\uc815\uc2dc\uac04 \uc0c1\uc138" : "\uae30\ub85d \uac74\uc218 \uc0c1\uc138";
  const description = mode === "recognized"
    ? "\uc778\uc815\uc2dc\uac04 \uae30\uc900\uc73c\ub85c \ubc18\ucc28/\uc804\uc77c \uc694\uccad\uc744 \uc9c4\ud589\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4."
    : "\ud604\uc7ac \uc870\ud68c \uc870\uac74\uc758 \ucd94\uac00\uadfc\ubb34 \uae30\ub85d \ubaa9\ub85d\uc785\ub2c8\ub2e4.";
  const summary = overtimeSummary(records);
  openModal(`
    <section class="modal-panel wide-modal">
      <div class="modal-head">
        <div><h2>${title}</h2><p>${description}</p></div>
        <button class="secondary" type="button" data-action="close-modal">\ub2eb\uae30</button>
      </div>
      <div class="summary-grid summary-grid-attendance" style="grid-template-columns: repeat(4, minmax(0, 1fr));">
        ${summaryItem("\uae30\ub85d \uac74\uc218", `${summary.total}\uac74`)}
        ${summaryItem("\uc778\uc815\uc2dc\uac04", esc(formatMinutes(summary.recognizedMinutes)))}
        ${summaryItem("\ub300\uccb4\ud734\uac00 \uc694\uccad", `${summary.requestedDays}\uc77c`)}
        ${summaryItem("\uc2b9\uc778 \ub300\uae30", `${summary.pending}\uac74`)}
      </div>
      <section class="surface" style="margin-top:14px;">
        <h3>\uc0c1\uc138 \ub0b4\uc5ed</h3>
        ${overtimeTable(records, false, true)}
      </section>
    </section>
  `);
}

function openOvertimeModal() {
  const defaults = overtimeFormDefaults();
  openModal(`
    <section class="modal-panel wide-modal">
      <div class="modal-head">
        <div><h2>\ucd94\uac00\uadfc\ubb34 \ub4f1\ub85d</h2><p>\ud734\uc77c \uadfc\ubb34\ub294 4\uc2dc\uac04 \ucd08\uacfc \uc2dc 0.5\uc77c, 8\uc2dc\uac04 \ucd08\uacfc \uc2dc 1\uc77c \uc694\uccad\uc774 \uac00\ub2a5\ud569\ub2c8\ub2e4.</p></div>
        <button class="secondary" type="button" data-action="close-modal">\ub2eb\uae30</button>
      </div>
      <form id="overtime-form" class="form-grid">
        <label>\uae30\uc900\uc77c<input type="date" name="date" value="${esc(defaults.date)}" required></label>
        <label>\uadfc\ubb34 \uad6c\ubd84<input name="dayTypeText" value="${esc(overtimeDayLabel(defaults.date))}" readonly data-overtime-day-type></label>
        <label>\ucd9c\uadfc\uc2dc\uac04<input type="time" name="checkInTime" value="${esc(defaults.checkInTime)}" required data-overtime-check-in></label>
        <div class="wide">
          <div class="grid two">
            <label>\ud1f4\uadfc\uc77c<input type="date" name="checkOutDate" value="${esc(defaults.checkOutDate)}" required></label>
            <label>\ud1f4\uadfc\uc2dc\uac04<input type="time" name="checkOutTime" required></label>
          </div>
        </div>
        <label class="wide">\uc0ac\uc720<textarea name="reason" placeholder="\ucd94\uac00\uadfc\ubb34 \uc0ac\uc720\ub97c \uc785\ub825\ud574 \uc8fc\uc138\uc694." required></textarea></label>
        <div class="wide">
          <p class="field-hint">\uc120\ud0dd\ud55c \ub0a0\uc9dc\uc5d0 \ucd9c\uadfc\uae30\ub85d\uc774 \uc788\uc73c\uba74 \ucd9c\uadfc\uc2dc\uac04\uc744 \uc790\ub3d9\uc73c\ub85c \uac00\uc838\uc635\ub2c8\ub2e4. \ud3c9\uc77c\uc740 \uac1c\uc778\ubcc4 \uc815\uc0c1 \ud1f4\uadfc\uc2dc\uac04 \uc774\ud6c4\ubd80\ud130 \uc2e4\uc81c \ud1f4\uadfc\uc2dc\uac04\uae4c\uc9c0\ub9cc \ucd94\uac00\uadfc\ubb34\ub85c \uacc4\uc0b0\ud569\ub2c8\ub2e4.</p>
          <button type="submit">\ub4f1\ub85d</button>
        </div>
      </form>
    </section>
  `);
}

function openOvertimeDecisionModal(recordId, action) {
  const record = state.overtimeRecords.find((item) => item.id === recordId);
  if (!record) return;
  openModal(`
    <section class="modal-panel">
      <div class="modal-head">
        <div><h2>${action === "approve" ? "\ub300\uccb4\ud734\uac00\ubcf4\uc0c1 \uc2b9\uc778" : "\ub300\uccb4\ud734\uac00\ubcf4\uc0c1 \ubc18\ub824"}</h2></div>
        <button class="secondary" type="button" data-action="close-modal">\ub2eb\uae30</button>
      </div>
      <form id="overtime-decision-form" class="form-grid compact">
        <input type="hidden" name="recordId" value="${esc(record.id)}">
        <input type="hidden" name="action" value="${esc(action)}">
        <label class="wide">\ub300\uc0c1
          <input value="${esc(`${record.user?.name || "-"} / ${record.date} / ${formatMinutes(record.recognizedMinutes)} / ${record.requestedGrantDays || 0}일`)}" readonly>
        </label>
        <label class="wide">\ube44\uace0<textarea name="comment" placeholder="${action === "approve" ? "\uc2b9\uc778 \uba54\ubaa8 (\uc120\ud0dd)" : "\ubc18\ub824 \uc0ac\uc720 (\uc120\ud0dd)"}"></textarea></label>
        <div class="wide"><button type="submit">${action === "approve" ? "\uc2b9\uc778" : "\ubc18\ub824"}</button></div>
      </form>
    </section>
  `);
}

function scopeRows(scope) {
  if (scope === "attendance") return state.attendance.map((item) => ({
    date: item.date,
    user: item.user?.name || "",
    team: userTeamLabel(item.user),
    checkIn: formatTime(item.checkInAt),
    checkOut: formatTime(item.checkOutAt),
    status: attendanceStatusText(item),
    checkInIp: item.checkInIp || "",
    checkOutIp: item.checkOutIp || ""
  }));
  if (scope === "leave") return filteredLeaveRequests().map((item) => ({
    user: item.user?.name || "",
    type: T.leaveType[item.type] || item.type,
    startDate: item.startDate,
    endDate: item.endDate,
    days: item.days,
    status: T.requestStatus[item.status] || item.status,
    reason: item.reason || ""
  }));
  return filteredOvertimeRecords().map((item) => ({
    date: item.date,
    user: item.user?.name || "",
    dayType: T.overtimeDayType[item.dayType] || item.dayType,
    checkIn: formatTime(item.checkInAt),
    checkOut: formatTime(item.checkOutAt),
    actual: formatMinutes(item.actualMinutes),
    recognized: formatMinutes(item.recognizedMinutes),
    grantDays: item.requestedGrantDays || "",
    status: T.overtimeStatus[item.status] || item.status
  }));
}

function rowsToCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const cell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [headers.map(cell).join(","), ...rows.map((row) => headers.map((key) => cell(row[key])).join(","))].join("\r\n");
}

function openYearlyView(scope) {
  const rows = scopeRows(scope);
  const title = scope === "attendance" ? "\ucd9c\ud1f4\uadfc \ub144\ub3c4\ubcc4 \uc804\uccb4" : scope === "leave" ? "\ud734\uac00 \ub144\ub3c4\ubcc4 \uc804\uccb4" : "\ucd94\uac00\uadfc\ubb34 \ub144\ub3c4\ubcc4 \uc804\uccb4";
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Arial,sans-serif;padding:24px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background:#f6f8f7;}</style></head><body><h1>${esc(title)}</h1>${rows.length ? `<table><thead><tr>${headers.map((key) => `<th>${esc(key)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((key) => `<td>${esc(row[key])}</td>`).join("")}</tr>`).join("")}</tbody></table>` : "<p>내역이 없습니다.</p>"}</body></html>`;
  const win = window.open("", "_blank");
  if (!win) return notify("\ud31d\uc5c5\uc774 \ucc28\ub2e8\ub418\uc5c8\uc2b5\ub2c8\ub2e4.");
  win.document.write(html);
  win.document.close();
}

function downloadYearlyCsv(scope) {
  const csv = "\ufeff" + rowsToCsv(scopeRows(scope));
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${scope}-${today().slice(0, 4)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function openUserModal(userId = "") {
  const user = state.users.find((item) => item.id === userId) || null;
  const role = user?.role || "EMPLOYEE";
  const teamDisabled = role === "EXECUTIVE" ? "disabled" : "";
  const loginReadonly = user ? "readonly" : "";
  openModal(`
    <section class="modal-panel wide-modal">
      <div class="modal-head">
        <div><h2>${user ? "\uc9c1\uc6d0 \uc218\uc815" : "\uc9c1\uc6d0 \uc0dd\uc131"}</h2></div>
        <button class="secondary" type="button" data-action="close-modal">\ub2eb\uae30</button>
      </div>
      <form id="user-form" class="form-grid">
        <input type="hidden" name="userId" value="${esc(user?.id || "")}">
        <label>\uc774\ub984<input name="name" value="${esc(user?.name || "")}" required></label>
        <label>\ub85c\uadf8\uc778 ID<input name="loginId" value="${esc(user?.loginId || "")}" ${loginReadonly} required></label>
        <label>\ucd08\uae30 \ube44\ubc00\ubc88\ud638<input type="password" name="password"></label>
        <label>\uad8c\ud55c
          <select name="role" data-role-select>
            <option value="EXECUTIVE" ${role === "EXECUTIVE" ? "selected" : ""}>${T.role.EXECUTIVE}</option>
            <option value="TEAM_LEAD" ${role === "TEAM_LEAD" ? "selected" : ""}>${T.role.TEAM_LEAD}</option>
            <option value="EMPLOYEE" ${role === "EMPLOYEE" ? "selected" : ""}>${T.role.EMPLOYEE}</option>
          </select>
        </label>
        <label>\ud300
          <select name="teamId" ${teamDisabled}>
            <option value="">\uc120\ud0dd</option>
            ${state.teams.map((team) => `<option value="${esc(team.id)}" ${(user?.teamId || "") === team.id ? "selected" : ""}>${esc(team.name)}</option>`).join("")}
          </select>
        </label>
        <label>\uc0c1\ud0dc
          <select name="status">
            ${Object.keys(T.status).map((key) => `<option value="${key}" ${(user?.status || "ACTIVE") === key ? "selected" : ""}>${esc(T.status[key])}</option>`).join("")}
          </select>
        </label>
        <label>\uc785\uc0ac\uc77c<input type="date" name="hireDate" value="${esc(user?.hireDate || today())}"></label>
        <label>\uae30\ubcf8 \uc5f0\ucc28<input type="number" name="baseAnnualLeaveDays" value="${esc(user?.baseAnnualLeaveDays ?? 15)}"></label>
        <label>\ucd9c\uadfc\uc2dc\uac04<input type="time" name="workStart" value="${esc(user?.workStart || "09:30")}"></label>
        <label>\ud1f4\uadfc\uc2dc\uac04<input type="time" name="workEnd" value="${esc(user?.workEnd || "18:30")}"></label>
        <label>\uc810\uc2ec\uc2dc\uc791<input type="time" name="breakStart" value="${esc(user?.breakStart || "12:30")}"></label>
        <label>\uc810\uc2ec\uc885\ub8cc<input type="time" name="breakEnd" value="${esc(user?.breakEnd || "13:30")}"></label>
        <div class="wide"><button type="submit">${user ? "\uc218\uc815 \uc800\uc7a5" : "\uc9c1\uc6d0 \uc0dd\uc131"}</button></div>
      </form>
    </section>
  `);
}

function openTeamModal(teamId = "") {
  const team = state.teams.find((item) => item.id === teamId) || null;
  openModal(`
    <section class="modal-panel">
      <div class="modal-head">
        <div><h2>${team ? "\ud300 \uc218\uc815" : "\ud300 \uc0dd\uc131"}</h2></div>
        <button class="secondary" type="button" data-action="close-modal">\ub2eb\uae30</button>
      </div>
      <form id="team-form" class="form-grid compact">
        <input type="hidden" name="teamId" value="${esc(team?.id || "")}">
        <label class="wide">\ud300\uba85<input name="name" value="${esc(team?.name || "")}" required></label>
        <div class="wide"><button type="submit">${team ? "\uc218\uc815 \uc800\uc7a5" : "\ud300 \uc0dd\uc131"}</button></div>
      </form>
    </section>
  `);
}

function openHolidayModal() {
  openModal(`
    <section class="modal-panel">
      <div class="modal-head">
        <div><h2>\ud734\uc77c \ub4f1\ub85d</h2></div>
        <button class="secondary" type="button" data-action="close-modal">\ub2eb\uae30</button>
      </div>
      <form id="holiday-form" class="form-grid compact">
        <label>\ub0a0\uc9dc<input type="date" name="date" value="${esc(today())}" required></label>
        <label class="wide">\uba85\uce6d<input name="name" placeholder="\uc608: \uc5b4\ub9b0\uc774\ub0a0, \ub300\uccb4\uacf5\ud734\uc77c" required></label>
        <div class="wide"><button type="submit">\ub4f1\ub85d</button></div>
      </form>
    </section>
  `);
}

function openIpModal() {
  openModal(`
    <section class="modal-panel">
      <div class="modal-head">
        <div><h2>\ud5c8\uc6a9 IP \ub4f1\ub85d</h2></div>
        <button class="secondary" type="button" data-action="close-modal">\ub2eb\uae30</button>
      </div>
      <form id="ip-form" class="form-grid compact">
        <label>\ub77c\ubca8<input name="label"></label>
        <label>IP<input name="ip" required></label>
        <div class="wide"><button type="submit">\ub4f1\ub85d</button></div>
      </form>
    </section>
  `);
}

async function loadSession() {
  let data;
  try {
    data = await api("/api/me");
  } catch {
    renderLogin();
    return;
  }
  state.me = data.user;
  state.team = data.team;
  state.currentIp = data.currentIp || "";
  const hashTab = location.hash.replace("#", "");
  if (hashTab) state.tab = hashTab;
  await refreshAll();
}

async function refreshAll() {
  if (!state.me) return;
  const dashboardRangeStart = shiftDate(state.dashboardDate || today(), -7);
  const dashboardRangeEnd = shiftDate(state.dashboardDate || today(), 7);
  const dashboardYear = String(state.dashboardDate || today()).slice(0, 4);
  const attendanceFrom = state.tab === "dashboard" && isExecutive()
    ? (state.dashboardMode === "year" ? `${dashboardYear}-01-01` : (state.attendanceFilters.from < dashboardRangeStart ? state.attendanceFilters.from : dashboardRangeStart))
    : state.attendanceFilters.from;
  const attendanceTo = state.tab === "dashboard" && isExecutive()
    ? (state.dashboardMode === "year" ? `${dashboardYear}-12-31` : (state.attendanceFilters.to > dashboardRangeEnd ? state.attendanceFilters.to : dashboardRangeEnd))
    : state.attendanceFilters.to;
  const tasks = [
    api("/api/users"),
    api("/api/teams"),
    api(`/api/attendance?from=${encodeURIComponent(attendanceFrom)}&to=${encodeURIComponent(attendanceTo)}${state.attendanceFilters.userId ? `&userId=${encodeURIComponent(state.attendanceFilters.userId)}` : ""}`),
    api("/api/attendance-change-requests"),
    api("/api/attendance-adjustment-logs"),
    api(`/api/leave-balances?year=${encodeURIComponent(state.leaveYear)}`),
    api("/api/leave-requests"),
    api("/api/overtime-records"),
    api("/api/holidays")
  ];
  if (isExecutive()) {
    tasks.push(api("/api/leave-adjustments"));
    tasks.push(api("/api/allowed-ips"));
    tasks.push(api("/api/audit-logs"));
  }
  const results = await Promise.all(tasks);
  state.users = results[0].users || [];
  state.teams = results[1].teams || [];
  state.attendance = results[2].records || [];
  state.attendanceRequests = results[3].requests || [];
  state.attendanceAdjustmentLogs = results[4].logs || [];
  state.leaveBalances = results[5].balances || [];
  state.leaveRequests = results[6].requests || [];
  state.overtimeRecords = results[7].records || [];
  state.holidays = results[8].holidays || [];
  if (!state.selectedUserId || !state.users.some((user) => user.id === state.selectedUserId)) {
    state.selectedUserId = state.users[0]?.id || "";
  }
  if (isExecutive()) {
    state.leaveAdjustments = results[9].adjustments || [];
    state.allowedIps = results[10].allowedIps || [];
    state.ipRestrictionEnabled = Boolean(results[10].ipRestrictionEnabled);
    state.auditLogs = results[11].logs || [];
  }
  renderApp();
}

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  try {
    if (action === "switch-tab") {
      state.tab = button.dataset.tab;
      renderApp();
      return;
    }
    if (action === "refresh") {
      await refreshAll();
      notify("\uc0c8\ub85c\uace0\uce68\ud588\uc2b5\ub2c8\ub2e4.");
      return;
    }
    if (action === "dashboard-yesterday") {
      state.dashboardDate = shiftDate(today(), -1);
      await refreshAll();
      return;
    }
    if (action === "dashboard-mode") {
      state.dashboardMode = button.dataset.mode || "day";
      await refreshAll();
      return;
    }
    if (action === "dashboard-year-detail-normal") {
      openDashboardYearDetail("normal");
      return;
    }
    if (action === "dashboard-year-detail-late") {
      openDashboardYearDetail("late");
      return;
    }
    if (action === "dashboard-year-detail-not-checked-out") {
      openDashboardYearDetail("notCheckedOut");
      return;
    }
    if (action === "dashboard-year-detail-leave") {
      openDashboardYearDetail("leave");
      return;
    }
    if (action === "dashboard-detail-targets") {
      openDashboardDetail("targets");
      return;
    }
    if (action === "dashboard-detail-normal") {
      openDashboardDetail("normal");
      return;
    }
    if (action === "dashboard-detail-issues") {
      openDashboardDetail("issues");
      return;
    }
    if (action === "dashboard-detail-leave") {
      openDashboardDetail("leave");
      return;
    }
    if (action === "open-approval-window-leave" || action === "open-approval-window-overtime") {
      window.open(`${location.pathname}#approvals`, "_blank");
      return;
    }
    if (action === "open-approval-window-attendance") {
      window.open(`${location.pathname}#attendanceRequests`, "_blank");
      return;
    }
    if (action === "apply-period" || action === "open-yearly" || action === "download-yearly") {
      const scope = button.dataset.scope;
      const mode = button.dataset.mode;
      const root = button.closest(".surface") || document;
      const range = mode === "month"
        ? monthRange(root.querySelector(`[data-period-month="${scope}"]`)?.value)
        : yearRange(root.querySelector(`[data-period-year="${scope}"]`)?.value);
      const filters = scope === "attendance" ? state.attendanceFilters : scope === "leave" ? state.leaveFilters : state.overtimeFilters;
      filters.from = range.from;
      filters.to = range.to;
      if (scope === "leave") state.leaveYear = range.from.slice(0, 4);
      await refreshAll();
      if (action === "open-yearly") openYearlyView(scope);
      if (action === "download-yearly") downloadYearlyCsv(scope);
      return;
    }
    if (action === "logout") {
      await api("/api/logout", { method: "POST" });
      state.me = null;
      renderLogin();
      return;
    }
    if (action === "close-modal") {
      closeModal();
      return;
    }
    if (action === "open-mypage") {
      state.tab = "mypage";
      renderApp();
      return;
    }
    if (action === "show-text") {
      openTextModal(button.dataset.title || "\uc0c1\uc138", button.dataset.content || "");
      return;
    }
    if (action === "attendance-view") {
      state.attendanceViewMode = button.dataset.view || "table";
      renderApp();
      return;
    }
    if (action === "attendance-month-shift") {
      const offset = Number(button.dataset.offset || 0);
      state.attendanceCalendarMonth = offset === 0 ? monthValue(today()) : shiftMonth(state.attendanceCalendarMonth, offset);
      state.attendanceViewMode = "calendar";
      renderApp();
      return;
    }
    if (action === "show-attendance-day") {
      openAttendanceDayModal(button.dataset.date);
      return;
    }
    if (action === "leave-view") {
      state.leaveViewMode = button.dataset.view || "table";
      renderApp();
      return;
    }
    if (action === "leave-month-shift") {
      const offset = Number(button.dataset.offset || 0);
      state.leaveCalendarMonth = offset === 0 ? monthValue(today()) : shiftMonth(state.leaveCalendarMonth, offset);
      state.leaveViewMode = "calendar";
      renderApp();
      return;
    }
    if (action === "show-leave-day") {
      openLeaveDayModal(button.dataset.date);
      return;
    }
    if (action === "overtime-view") {
      state.overtimeViewMode = button.dataset.view || "table";
      renderApp();
      return;
    }
    if (action === "overtime-month-shift") {
      const offset = Number(button.dataset.offset || 0);
      state.overtimeCalendarMonth = offset === 0 ? monthValue(today()) : shiftMonth(state.overtimeCalendarMonth, offset);
      state.overtimeViewMode = "calendar";
      renderApp();
      return;
    }
    if (action === "show-overtime-day") {
      openOvertimeDayModal(button.dataset.date);
      return;
    }
    if (action === "show-overtime-summary-records") {
      openOvertimeSummaryModal("records");
      return;
    }
    if (action === "show-overtime-summary-recognized") {
      openOvertimeSummaryModal("recognized");
      return;
    }
    if (action === "check-in") {
      openAttendanceMarkModal("checkIn");
      return;
    }
    if (action === "check-out") {
      openAttendanceMarkModal("checkOut");
      return;
    }
    if (action === "open-attendance-request") {
      openAttendanceRequestModal(button.dataset.recordId);
      return;
    }
    if (action === "attendance-approve") {
      openAttendanceDecisionModal(button.dataset.requestId, "approve");
      return;
    }
    if (action === "attendance-reject") {
      openAttendanceDecisionModal(button.dataset.requestId, "reject");
      return;
    }
    if (action === "show-attendance-history") {
      const data = await api(`/api/attendance-adjustment-logs?requestId=${encodeURIComponent(button.dataset.requestId)}`);
      const rows = (data.logs || []).map((item) => `<tr><td>${esc(formatDateTime(item.createdAt))}</td><td>${esc(item.changedByUser?.name || "-")}</td><td>${esc(item.reason || "-")}</td></tr>`).join("");
      openModal(`<section class="modal-panel"><div class="modal-head"><div><h2>\uc218\uc815\uc774\ub825</h2></div><button class="secondary" type="button" data-action="close-modal">\ub2eb\uae30</button></div><div class="table-wrap"><table><thead><tr><th>\uc77c\uc2dc</th><th>\ucc98\ub9ac\uc790</th><th>\ube44\uace0</th></tr></thead><tbody>${rows || '<tr><td colspan="3">-</td></tr>'}</tbody></table></div></section>`);
      return;
    }
    if (action === "show-attendance-record-history") {
      const data = await api(`/api/attendance-adjustment-logs?recordId=${encodeURIComponent(button.dataset.recordId)}`);
      const rows = (data.logs || []).map((item) => `<tr><td>${esc(formatDateTime(item.createdAt))}</td><td>${esc(item.changedByUser?.name || "-")}</td><td>${esc(item.reason || "-")}</td></tr>`).join("");
      openModal(`<section class="modal-panel"><div class="modal-head"><div><h2>\uc218\uc815\uc774\ub825</h2></div><button class="secondary" type="button" data-action="close-modal">\ub2eb\uae30</button></div><div class="table-wrap"><table><thead><tr><th>\uc77c\uc2dc</th><th>\ucc98\ub9ac\uc790</th><th>\ube44\uace0</th></tr></thead><tbody>${rows || '<tr><td colspan="3">-</td></tr>'}</tbody></table></div></section>`);
      return;
    }
    if (action === "open-direct-adjust") {
      openDirectAdjustModal(button.dataset.recordId);
      return;
    }
    if (action === "open-leave-request") {
      openLeaveRequestModal();
      return;
    }
    if (action === "leave-approve") {
      openLeaveDecisionModal(button.dataset.requestId, "approve");
      return;
    }
    if (action === "leave-reject") {
      openLeaveDecisionModal(button.dataset.requestId, "reject");
      return;
    }
    if (action === "open-leave-adjust") {
      openLeaveAdjustModal();
      return;
    }
    if (action === "open-overtime-create") {
      openOvertimeModal();
      return;
    }
    if (action === "overtime-approve") {
      openOvertimeDecisionModal(button.dataset.recordId, "approve");
      return;
    }
    if (action === "overtime-reject") {
      openOvertimeDecisionModal(button.dataset.recordId, "reject");
      return;
    }
    if (action === "overtime-request-grant") {
      const days = Number(button.dataset.days || 0);
      const recordId = button.dataset.recordId;
      const label = days === 0.5 ? "반차" : "전일";
      if (!confirm(`${label} 대체휴가를 요청할까요?`)) return;
      await api(`/api/overtime-records/${encodeURIComponent(recordId)}/grant-request`, {
        method: "POST",
        body: { requestedGrantDays: days }
      });
      await refreshAll();
      notify(`${label} 대체휴가 요청을 등록했습니다.`);
      return;
    }
    if (action === "overtime-cancel-grant") {
      if (!confirm("대체휴가 요청을 취소할까요?")) return;
      await api(`/api/overtime-records/${encodeURIComponent(button.dataset.recordId)}/grant-request`, {
        method: "POST",
        body: { requestedGrantDays: 0 }
      });
      await refreshAll();
      notify("대체휴가 요청을 취소했습니다.");
      return;
    }
    if (action === "show-leave-balance") {
      openLeaveBalanceModal(button.dataset.userId);
      return;
    }
    if (action === "delete-leave-adjustment") {
      if (!confirm("\ud574\ub2f9 \ud734\uac00 \ubd80\uc5ec/\uc870\uc815 \uc774\ub825\uc744 \ud68c\uc218 \ub610\ub294 \ucde8\uc18c\ud560\uae4c\uc694?")) return;
      await api(`/api/leave-adjustments/${encodeURIComponent(button.dataset.adjustmentId)}`, { method: "DELETE" });
      await refreshAll();
      notify("\ud734\uac00 \ubd80\uc5ec/\uc870\uc815 \uc774\ub825\uc744 \ud68c\uc218\ud588\uc2b5\ub2c8\ub2e4.");
      return;
    }
    if (action === "open-user-create") {
      openUserModal();
      return;
    }
    if (action === "select-user") {
      state.selectedUserId = button.dataset.userId || "";
      renderApp();
      return;
    }
    if (action === "open-user-edit") {
      openUserModal(button.dataset.userId);
      return;
    }
    if (action === "open-team-create") {
      openTeamModal();
      return;
    }
    if (action === "open-holiday-create") {
      openHolidayModal();
      return;
    }
    if (action === "open-team-edit") {
      openTeamModal(button.dataset.teamId);
      return;
    }
    if (action === "delete-team") {
      if (!confirm("\ud300\uc744 \uc0ad\uc81c\ud560\uae4c\uc694?")) return;
      await api(`/api/teams/${encodeURIComponent(button.dataset.teamId)}`, { method: "DELETE" });
      await refreshAll();
      notify("\ud300\uc744 \uc0ad\uc81c\ud588\uc2b5\ub2c8\ub2e4.");
      return;
    }
    if (action === "delete-holiday") {
      if (!confirm("\ud734\uc77c\uc744 \uc0ad\uc81c\ud560\uae4c\uc694?")) return;
      await api(`/api/holidays/${encodeURIComponent(button.dataset.holidayId)}`, { method: "DELETE" });
      await refreshAll();
      notify("\ud734\uc77c\uc744 \uc0ad\uc81c\ud588\uc2b5\ub2c8\ub2e4.");
      return;
    }
    if (action === "open-ip-create") {
      openIpModal();
      return;
    }
    if (action === "delete-ip") {
      if (!confirm("IP\ub97c \uc0ad\uc81c\ud560\uae4c\uc694?")) return;
      await api(`/api/allowed-ips/${encodeURIComponent(button.dataset.ipId)}`, { method: "DELETE" });
      await refreshAll();
      notify("IP\ub97c \uc0ad\uc81c\ud588\uc2b5\ub2c8\ub2e4.");
      return;
    }
  } catch (error) {
    notify(error.message, "error");
  }
});

document.addEventListener("change", (event) => {
  const dashboardDate = event.target.closest("[data-dashboard-date]");
  if (dashboardDate) {
    state.dashboardDate = dashboardDate.value || today();
    refreshAll();
    return;
  }
  const dashboardUser = event.target.closest("[data-dashboard-user]");
  if (dashboardUser) {
    state.dashboardUserId = dashboardUser.value || "";
    renderApp();
    return;
  }
  const select = event.target.closest("[data-role-select]");
  if (select) {
    const form = select.closest("form");
    const teamSelect = form?.querySelector('select[name="teamId"]');
    if (!teamSelect) return;
    const disabled = select.value === "EXECUTIVE";
    teamSelect.disabled = disabled;
    if (disabled) teamSelect.value = "";
    return;
  }
  const overtimeDate = event.target.closest('input[name="date"]');
  if (overtimeDate && overtimeDate.form?.id === "overtime-form") {
    const indicator = overtimeDate.form.querySelector("[data-overtime-day-type]");
    if (indicator) indicator.value = overtimeDayLabel(overtimeDate.value || today());
    const checkIn = overtimeDate.form.querySelector("[data-overtime-check-in]");
    const attendanceRecord = attendanceRecordForDate(overtimeDate.value || today());
    if (checkIn) checkIn.value = attendanceRecord?.checkInAt ? timeValue(attendanceRecord.checkInAt) : "";
  }
});

document.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form).entries());
  try {
    if (form.id === "login-form") {
      const loginError = form.querySelector("[data-login-error]");
      if (loginError) {
        loginError.hidden = true;
        loginError.textContent = "";
      }
      await api("/api/login", { method: "POST", body: data });
      await loadSession();
      return;
    }
    if (form.id === "attendance-filter-form") {
      state.attendanceFilters.from = data.from || recentWeekStart();
      state.attendanceFilters.to = data.to || today();
      state.attendanceFilters.userId = data.userId || "";
      await refreshAll();
      return;
    }
    if (form.id === "attendance-request-filter-form") {
      state.attendanceRequestYear = data.year || today().slice(0, 4);
      state.attendanceRequestMonth = data.month || "";
      state.attendanceRequestStatus = data.status || "";
      renderApp();
      return;
    }
    if (form.id === "leave-filter-form") {
      state.leaveFilters.from = data.from || "";
      state.leaveFilters.to = data.to || "";
      state.leaveFilters.userId = data.userId || "";
      state.leaveFilters.status = data.status || "";
      renderApp();
      return;
    }
    if (form.id === "leave-manage-filter-form") {
      state.leaveManageFilters.from = data.from || "";
      state.leaveManageFilters.to = data.to || "";
      state.leaveManageFilters.userId = data.userId || "";
      state.leaveManageFilters.kind = data.kind || "";
      renderApp();
      return;
    }
    if (form.id === "overtime-filter-form") {
      state.overtimeFilters.from = data.from || "";
      state.overtimeFilters.to = data.to || "";
      state.overtimeFilters.userId = data.userId || "";
      state.overtimeFilters.status = data.status || "";
      renderApp();
      return;
    }
    if (form.id === "attendance-mark-form") {
      await api(data.kind === "checkIn" ? "/api/attendance/check-in" : "/api/attendance/check-out", {
        method: "POST",
        body: { note: data.note || "" }
      });
      closeModal();
      await refreshAll();
      notify(data.kind === "checkIn" ? "\ucd9c\uadfc \ucc98\ub9ac\ub418\uc5c8\uc2b5\ub2c8\ub2e4." : "\ud1f4\uadfc \ucc98\ub9ac\ub418\uc5c8\uc2b5\ub2c8\ub2e4.");
      return;
    }
    if (form.id === "attendance-request-form") {
      await api("/api/attendance-change-requests", {
        method: "POST",
        body: {
          date: data.date,
          proposedCheckInTime: data.proposedCheckInTime || "",
          proposedCheckOutTime: data.proposedCheckOutTime || "",
          reason: data.reason || ""
        }
      });
      closeModal();
      await refreshAll();
      notify("\uc218\uc815\uc694\uccad\uc744 \ub4f1\ub85d\ud588\uc2b5\ub2c8\ub2e4.");
      return;
    }
    if (form.id === "attendance-decision-form") {
      await api(`/api/attendance-change-requests/${encodeURIComponent(data.requestId)}/${data.action}`, {
        method: "POST",
        body: { comment: data.comment || "" }
      });
      closeModal();
      await refreshAll();
      notify(data.action === "approve" ? "\uc2b9\uc778 \ucc98\ub9ac\ud588\uc2b5\ub2c8\ub2e4." : "\ubc18\ub824 \ucc98\ub9ac\ud588\uc2b5\ub2c8\ub2e4.");
      return;
    }
    if (form.id === "direct-adjust-form") {
      await api("/api/attendance/direct-adjust", {
        method: "POST",
        body: {
          userId: data.userId,
          date: data.date,
          checkInTime: data.checkInTime || "",
          checkOutTime: data.checkOutTime || "",
          reason: data.reason || ""
        }
      });
      closeModal();
      await refreshAll();
      notify("\uadfc\ud0dc\ub97c \uc218\uc815\ud588\uc2b5\ub2c8\ub2e4.");
      return;
    }
    if (form.id === "leave-request-form") {
      await api("/api/leave-requests", { method: "POST", body: data });
      closeModal();
      await refreshAll();
      notify("\ud734\uac00 \uc2e0\uccad\uc744 \ub4f1\ub85d\ud588\uc2b5\ub2c8\ub2e4.");
      return;
    }
    if (form.id === "leave-decision-form") {
      await api(`/api/leave-requests/${encodeURIComponent(data.requestId)}/${data.action}`, {
        method: "POST",
        body: { comment: data.comment || "" }
      });
      closeModal();
      await refreshAll();
      notify(data.action === "approve" ? "\ud734\uac00 \uc2b9\uc778 \ucc98\ub9ac\ud588\uc2b5\ub2c8\ub2e4." : "\ud734\uac00 \ubc18\ub824 \ucc98\ub9ac\ud588\uc2b5\ub2c8\ub2e4.");
      return;
    }
    if (form.id === "leave-adjust-form") {
      await api("/api/leave-adjustments", {
        method: "POST",
        body: {
          userId: data.userId,
          year: Number(data.year),
          kind: data.kind,
          days: Number(data.days),
          reason: data.reason
        }
      });
      closeModal();
      await refreshAll();
      notify("\ud734\uac00 \ubd80\uc5ec/\uc870\uc815\uc744 \uc800\uc7a5\ud588\uc2b5\ub2c8\ub2e4.");
      return;
    }
    if (form.id === "overtime-form") {
      await api("/api/overtime-records", {
        method: "POST",
        body: {
          date: data.date,
          dayType: data.dayType,
          checkInTime: data.checkInTime,
          checkOutDate: data.checkOutDate,
          checkOutTime: data.checkOutTime,
          reason: data.reason || ""
        }
      });
      closeModal();
      await refreshAll();
      notify("\ucd94\uac00\uadfc\ubb34 \ub0b4\uc5ed\uc744 \ub4f1\ub85d\ud588\uc2b5\ub2c8\ub2e4.");
      return;
    }
    if (form.id === "overtime-decision-form") {
      await api(`/api/overtime-records/${encodeURIComponent(data.recordId)}/${data.action}`, {
        method: "POST",
        body: { comment: data.comment || "" }
      });
      closeModal();
      await refreshAll();
      notify(data.action === "approve" ? "\ub300\uccb4\ud734\uac00\ubcf4\uc0c1 \uc694\uccad\uc744 \uc2b9\uc778\ud588\uc2b5\ub2c8\ub2e4." : "\ub300\uccb4\ud734\uac00\ubcf4\uc0c1 \uc694\uccad\uc744 \ubc18\ub824\ud588\uc2b5\ub2c8\ub2e4.");
      return;
    }
    if (form.id === "password-form") {
      await api("/api/me/password", { method: "PATCH", body: data });
      closeModal();
      notify("\ube44\ubc00\ubc88\ud638\ub97c \ubcc0\uacbd\ud588\uc2b5\ub2c8\ub2e4.");
      return;
    }
    if (form.id === "user-form") {
      const payload = {
        name: data.name,
        loginId: data.loginId,
        password: data.password || "",
        role: data.role,
        teamId: data.role === "EXECUTIVE" ? "" : data.teamId,
        status: data.status,
        hireDate: data.hireDate,
        baseAnnualLeaveDays: Number(data.baseAnnualLeaveDays),
        workStart: data.workStart,
        workEnd: data.workEnd,
        breakStart: data.breakStart,
        breakEnd: data.breakEnd
      };
      if (data.userId) {
        await api(`/api/users/${encodeURIComponent(data.userId)}`, { method: "PUT", body: payload });
      } else {
        await api("/api/users", { method: "POST", body: payload });
      }
      closeModal();
      await refreshAll();
      notify(data.userId ? "\uc9c1\uc6d0 \uc815\ubcf4\ub97c \uc218\uc815\ud588\uc2b5\ub2c8\ub2e4." : "\uc9c1\uc6d0\uc744 \uc0dd\uc131\ud588\uc2b5\ub2c8\ub2e4.");
      return;
    }
    if (form.id === "team-form") {
      if (data.teamId) {
        await api(`/api/teams/${encodeURIComponent(data.teamId)}`, { method: "PUT", body: { name: data.name } });
      } else {
        await api("/api/teams", { method: "POST", body: { name: data.name } });
      }
      closeModal();
      await refreshAll();
      notify(data.teamId ? "\ud300\uc744 \uc218\uc815\ud588\uc2b5\ub2c8\ub2e4." : "\ud300\uc744 \uc0dd\uc131\ud588\uc2b5\ub2c8\ub2e4.");
      return;
    }
    if (form.id === "holiday-form") {
      await api("/api/holidays", { method: "POST", body: { date: data.date, name: data.name } });
      closeModal();
      await refreshAll();
      notify("\ud734\uc77c\uc744 \ub4f1\ub85d\ud588\uc2b5\ub2c8\ub2e4.");
      return;
    }
    if (form.id === "ip-form") {
      await api("/api/allowed-ips", { method: "POST", body: data });
      closeModal();
      await refreshAll();
      notify("IP\ub97c \ub4f1\ub85d\ud588\uc2b5\ub2c8\ub2e4.");
      return;
    }
    if (form.id === "ip-restriction-form") {
      await api("/api/ip-restriction", { method: "PUT", body: { enabled: data.enabled === "true" } });
      await refreshAll();
      notify("IP \uc81c\ud55c \uc124\uc815\uc744 \uc800\uc7a5\ud588\uc2b5\ub2c8\ub2e4.");
      return;
    }
  } catch (error) {
    if (form.id === "login-form") {
      const loginError = form.querySelector("[data-login-error]");
      if (loginError) {
        loginError.textContent = error.message || "\ub85c\uadf8\uc778\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.";
        loginError.hidden = false;
      }
    }
    notify(error.message, "error");
  }
});

loadSession().catch((error) => {
  notify(error.message || "\ud654\uba74\uc744 \ubd88\ub7ec\uc624\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.", "error");
});

