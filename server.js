const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");

const PORT = Number(process.env.PORT || 3000);
const APP_TIME_ZONE = process.env.APP_TIME_ZONE || "Asia/Seoul";
const SESSION_HOURS = Number(process.env.SESSION_HOURS || 12);
const DEFAULT_BASE_ANNUAL_LEAVE_DAYS = 15;
const DEFAULT_WORK_START = "09:30";
const DEFAULT_WORK_END = "18:30";
const DEFAULT_BREAK_START = "12:30";
const DEFAULT_BREAK_END = "13:30";
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const PUBLIC_DIR = path.join(__dirname, "public");

const ROLES = ["EXECUTIVE", "TEAM_LEAD", "EMPLOYEE"];
const STATUSES = ["ACTIVE", "INACTIVE", "ON_LEAVE", "LEFT"];
const LEAVE_TYPES = ["ANNUAL", "AM_HALF", "PM_HALF", "COMPENSATORY"];
const PENDING = ["PENDING_TEAM_LEAD", "PENDING_EXECUTIVE"];

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 120000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("hex");
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  const parts = String(stored || "").split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const [, iterations, salt, savedHash] = parts;
  const hash = crypto.pbkdf2Sync(password, salt, Number(iterations), 32, "sha256").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(savedHash, "hex"));
}

function normalizeLogin(loginId) {
  return String(loginId || "").trim().toLowerCase();
}

function normalizeIp(ip) {
  let value = String(ip || "").trim();
  if (value.includes(",")) value = value.split(",")[0].trim();
  if (value.startsWith("::ffff:")) value = value.slice(7);
  if (value === "::1") value = "127.0.0.1";
  if (value.includes("%")) value = value.split("%")[0];
  return value;
}

function getClientIp(req) {
  return normalizeIp(req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : "");
}

function localDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function parseDateParts(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function normalizeLeaveDays(value, fallback = DEFAULT_BASE_ANNUAL_LEAVE_DAYS) {
  const days = Number(value);
  if (!Number.isFinite(days)) return fallback;
  return Math.max(0, days);
}

function completedYearsAtYearStart(hireDate, year) {
  const hire = parseDateParts(hireDate);
  if (!hire) return 0;
  const targetYear = Number(year);
  let years = targetYear - hire.year;
  if (1 < hire.month || (hire.month === 1 && 1 < hire.day)) years -= 1;
  return Math.max(0, years);
}

function tenureLeaveDaysForYear(hireDate, year) {
  return Math.floor(completedYearsAtYearStart(hireDate, year) / 2);
}

function annualLeaveEntitlement(user, year = Number(localDate().slice(0, 4))) {
  const baseAnnualLeaveDays = normalizeLeaveDays(user.baseAnnualLeaveDays ?? user.annualLeaveDays);
  const tenureLeaveDays = tenureLeaveDaysForYear(user.hireDate, year);
  return {
    baseAnnualLeaveDays,
    tenureLeaveDays,
    annualLeaveDays: baseAnnualLeaveDays + tenureLeaveDays
  };
}

function timeToMinutes(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(String(value || ""));
  if (!match) return null;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  return minutes >= 0 && minutes <= 1439 ? minutes : null;
}

function localTimeMinutes(iso) {
  if (!iso) return null;
  const text = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(iso));
  return timeToMinutes(text);
}

function validateDate(value) {
  const text = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(`${text}T00:00:00`))) {
    throw new Error("INVALID_DATE");
  }
  return text;
}

function validateTime(value, fallback) {
  const text = String(value || fallback || "").trim();
  if (!/^\d{2}:\d{2}$/.test(text) || timeToMinutes(text) === null) throw new Error("INVALID_TIME");
  return text;
}

function isoFromLocalDateTime(date, time) {
  if (!date || !time) return null;
  validateDate(date);
  validateTime(time);
  return new Date(`${date}T${time}:00`).toISOString();
}

function writeDb(db) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

function ensureDataStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) return;
  const initialPassword = process.env.INITIAL_ADMIN_PASSWORD || "Admin1234!";
  const now = nowIso();
  const db = {
    meta: { version: 1, createdAt: now },
    settings: { serviceName: "사내 근태관리", leaveGrantMonthDay: "01-01", ipRestrictionEnabled: true },
    teams: [{ id: "team_default", name: "기본팀", createdAt: now, updatedAt: now }],
    users: [{
      id: "user_admin",
      name: "관리자",
      loginId: "admin",
      passwordHash: hashPassword(initialPassword),
      role: "EXECUTIVE",
      teamId: null,
      status: "ACTIVE",
      hireDate: localDate(),
      baseAnnualLeaveDays: DEFAULT_BASE_ANNUAL_LEAVE_DAYS,
      annualLeaveDays: DEFAULT_BASE_ANNUAL_LEAVE_DAYS,
      workStart: DEFAULT_WORK_START,
      workEnd: DEFAULT_WORK_END,
      breakStart: DEFAULT_BREAK_START,
      breakEnd: DEFAULT_BREAK_END,
      mustChangePassword: true,
      createdAt: now,
      updatedAt: now
    }],
    allowedIps: [{ id: "ip_localhost", ip: "127.0.0.1", label: "서버 PC 로컬 접속", createdAt: now, updatedAt: now }],
    sessions: [],
    attendanceRecords: [],
    attendanceChangeRequests: [],
    attendanceAdjustmentLogs: [],
    leaveRequests: [],
    leaveApprovalLogs: [],
    leaveAdjustments: [],
    auditLogs: []
  };
  writeDb(db);
  console.log("초기 관리자 계정: admin / " + initialPassword);
}

function normalizeDb(db) {
  ["teams", "users", "allowedIps", "sessions", "attendanceRecords", "attendanceChangeRequests", "attendanceAdjustmentLogs", "leaveRequests", "leaveApprovalLogs", "leaveAdjustments", "auditLogs"].forEach((key) => {
    if (!Array.isArray(db[key])) db[key] = [];
  });
  if (!db.settings) db.settings = { serviceName: "사내 근태관리", leaveGrantMonthDay: "01-01", ipRestrictionEnabled: true };
  db.settings.serviceName = db.settings.serviceName || "사내 근태관리";
  db.settings.leaveGrantMonthDay = db.settings.leaveGrantMonthDay || "01-01";
  db.settings.ipRestrictionEnabled = db.settings.ipRestrictionEnabled !== false;
  db.users.forEach((user) => {
    user.loginId = normalizeLogin(user.loginId);
    user.status = user.status || "ACTIVE";
    user.hireDate = user.hireDate || localDate();
    if (user.role === "EXECUTIVE") user.teamId = null;
    user.baseAnnualLeaveDays = normalizeLeaveDays(user.baseAnnualLeaveDays ?? user.annualLeaveDays);
    user.annualLeaveDays = annualLeaveEntitlement(user).annualLeaveDays;
    user.workStart = user.workStart || DEFAULT_WORK_START;
    user.workEnd = user.workEnd || DEFAULT_WORK_END;
    user.breakStart = user.breakStart || DEFAULT_BREAK_START;
    user.breakEnd = user.breakEnd || DEFAULT_BREAK_END;
  });
  db.allowedIps.forEach((entry) => {
    entry.ip = normalizeIp(entry.ip);
  });
  db.attendanceRecords.forEach((record) => {
    record.note = String(record.note || "");
    record.checkInNote = String(record.checkInNote || "");
    record.checkOutNote = String(record.checkOutNote || "");
  });
  db.leaveAdjustments.forEach((entry) => {
    entry.kind = entry.kind || "ANNUAL";
  });
  return db;
}

function readDb() {
  ensureDataStore();
  return normalizeDb(JSON.parse(fs.readFileSync(DB_FILE, "utf8")));
}

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  const entitlement = annualLeaveEntitlement(user);
  return {
    ...safe,
    baseAnnualLeaveDays: entitlement.baseAnnualLeaveDays,
    tenureLeaveDays: entitlement.tenureLeaveDays,
    annualLeaveDays: entitlement.annualLeaveDays,
    annualLeaveTotalDays: entitlement.annualLeaveDays,
    leaveEntitlementYear: Number(localDate().slice(0, 4))
  };
}

function isExecutive(user) {
  return user && user.role === "EXECUTIVE";
}

function isTeamLead(user) {
  return user && user.role === "TEAM_LEAD";
}

function resolveUserTeamId(db, role, teamId) {
  if (role === "EXECUTIVE") return null;
  const normalized = teamId || null;
  if (!normalized) throw new Error("TEAM_REQUIRED");
  if (!db.teams.some((team) => team.id === normalized)) throw new Error("TEAM_NOT_FOUND");
  return normalized;
}

function canAccessUser(actor, target) {
  if (!actor || !target) return false;
  if (actor.role === "EXECUTIVE") return true;
  if (actor.id === target.id) return true;
  return actor.role === "TEAM_LEAD" && actor.teamId && actor.teamId === target.teamId;
}

function scopedUsers(db, actor) {
  if (actor.role === "EXECUTIVE") return db.users;
  if (actor.role === "TEAM_LEAD") {
    return db.users.filter((user) => user.id === actor.id || (actor.teamId && user.teamId === actor.teamId));
  }
  return db.users.filter((user) => user.id === actor.id);
}

function getTeamName(db, teamId) {
  return db.teams.find((team) => team.id === teamId)?.name || "-";
}

function userSummary(db, userId) {
  const user = db.users.find((item) => item.id === userId);
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    loginId: user.loginId,
    role: user.role,
    teamId: user.teamId,
    teamName: getTeamName(db, user.teamId)
  };
}

function isIpAllowed(db, ip) {
  if (db.settings && db.settings.ipRestrictionEnabled === false) return true;
  const normalized = normalizeIp(ip);
  return db.allowedIps.some((entry) => normalizeIp(entry.ip) === normalized);
}

function isIpRestrictionEnabled(db) {
  return !(db.settings && db.settings.ipRestrictionEnabled === false);
}

function audit(db, actorId, action, details, req) {
  db.auditLogs.push({
    id: newId("audit"),
    actorId: actorId || null,
    action,
    details: details || {},
    ip: req ? getClientIp(req) : null,
    userAgent: req ? String(req.headers["user-agent"] || "").slice(0, 200) : null,
    createdAt: nowIso()
  });
  if (db.auditLogs.length > 2000) db.auditLogs = db.auditLogs.slice(-2000);
}

function parseCookies(req) {
  return Object.fromEntries(String(req.headers.cookie || "").split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const index = part.indexOf("=");
    if (index === -1) return [part, ""];
    return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
  }));
}

function setSessionCookie(res, token) {
  const maxAge = SESSION_HOURS * 60 * 60;
  res.setHeader("Set-Cookie", `attendance_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`);
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", "attendance_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
}

function cleanupSessions(db) {
  const before = db.sessions.length;
  const now = Date.now();
  db.sessions = db.sessions.filter((session) => Date.parse(session.expiresAt) > now);
  return before !== db.sessions.length;
}

function createSession(db, user, req) {
  const token = crypto.randomBytes(32).toString("base64url");
  db.sessions.push({
    id: newId("session"),
    tokenHash: sha256(token),
    userId: user.id,
    ip: getClientIp(req),
    userAgent: String(req.headers["user-agent"] || "").slice(0, 200),
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000).toISOString()
  });
  return token;
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(payload));
}

function sendError(res, status, message, code) {
  sendJson(res, status, { ok: false, message, code: code || message });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("BODY_TOO_LARGE"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("INVALID_JSON"));
      }
    });
    req.on("error", reject);
  });
}

function requireAuth(req, res) {
  const db = readDb();
  const cleaned = cleanupSessions(db);
  const ip = getClientIp(req);
  if (!isIpAllowed(db, ip)) {
    audit(db, null, "IP_BLOCKED", { ip, path: req.url }, req);
    writeDb(db);
    sendError(res, 403, "허용되지 않은 IP입니다. 관리자에게 IP 등록을 요청하세요.", "IP_BLOCKED");
    return null;
  }
  const token = parseCookies(req).attendance_session;
  if (!token) {
    if (cleaned) writeDb(db);
    sendError(res, 401, "로그인이 필요합니다.", "UNAUTHORIZED");
    return null;
  }
  const session = db.sessions.find((item) => item.tokenHash === sha256(token));
  const user = session ? db.users.find((item) => item.id === session.userId) : null;
  if (!session || !user || user.status !== "ACTIVE") {
    if (cleaned) writeDb(db);
    clearSessionCookie(res);
    sendError(res, 401, "세션이 만료되었거나 사용할 수 없습니다.", "UNAUTHORIZED");
    return null;
  }
  session.lastSeenAt = nowIso();
  session.lastSeenIp = ip;
  return { db, user, session, ip };
}

function requireExecutive(ctx, res) {
  if (!ctx || !isExecutive(ctx.user)) {
    sendError(res, 403, "관리자 권한이 필요합니다.", "FORBIDDEN");
    return false;
  }
  return true;
}

function isApprovedLeaveOnDate(db, userId, date) {
  return db.leaveRequests.some((leave) => leave.userId === userId && leave.status === "APPROVED" && leave.startDate <= date && leave.endDate >= date);
}

function calculateAttendanceStatus(db, record) {
  const user = db.users.find((item) => item.id === record.userId);
  if (!user) return "UNKNOWN";
  if (isApprovedLeaveOnDate(db, user.id, record.date) && !record.checkInAt && !record.checkOutAt) return "ON_LEAVE";
  if (!record.checkInAt) return "ABSENT";
  if (!record.checkOutAt) return "NOT_CHECKED_OUT";
  const start = timeToMinutes(user.workStart || DEFAULT_WORK_START);
  const end = timeToMinutes(user.workEnd || DEFAULT_WORK_END);
  const checkIn = localTimeMinutes(record.checkInAt);
  const checkOut = localTimeMinutes(record.checkOutAt);
  const late = checkIn !== null && start !== null && checkIn > start;
  const early = checkOut !== null && end !== null && checkOut < end;
  if (late && early) return "LATE_EARLY_LEAVE";
  if (late) return "LATE";
  if (early) return "EARLY_LEAVE";
  return "NORMAL";
}

function decorateAttendance(db, record) {
  return { ...record, status: calculateAttendanceStatus(db, record), user: userSummary(db, record.userId) };
}

function businessDaysInclusive(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (end < start) return 0;
  let days = 0;
  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const weekday = cursor.getDay();
    if (weekday !== 0 && weekday !== 6) days += 1;
  }
  return days;
}

function calculateLeaveDays(type, startDate, endDate) {
  if (type === "AM_HALF" || type === "PM_HALF") {
    if (startDate !== endDate) throw new Error("HALF_DAY_RANGE");
    return 0.5;
  }
  return businessDaysInclusive(startDate, endDate);
}

function leaveBalanceKind(type) {
  return type === "COMPENSATORY" ? "COMPENSATORY" : "ANNUAL";
}

function leaveOverlaps(db, userId, startDate, endDate, exceptId) {
  return db.leaveRequests.some((leave) => (
    leave.id !== exceptId &&
    leave.userId === userId &&
    ["PENDING_TEAM_LEAD", "PENDING_EXECUTIVE", "APPROVED"].includes(leave.status) &&
    leave.startDate <= endDate &&
    leave.endDate >= startDate
  ));
}

function getLeaveBalance(db, userId, year, options = {}) {
  const user = db.users.find((item) => item.id === userId);
  if (!user) return null;
  const includePending = Boolean(options.includePending);
  const excludeRequestId = options.excludeRequestId || null;
  const entitlement = annualLeaveEntitlement(user, year);
  const baseAnnualGranted = entitlement.baseAnnualLeaveDays;
  const tenureAnnualGranted = entitlement.tenureLeaveDays;
  const annualGranted = entitlement.annualLeaveDays;
  const annualAdjustments = db.leaveAdjustments
    .filter((item) => item.userId === userId && Number(item.year) === Number(year) && (item.kind || "ANNUAL") === "ANNUAL")
    .reduce((sum, item) => sum + Number(item.days || 0), 0);
  const compensatoryGranted = db.leaveAdjustments
    .filter((item) => item.userId === userId && Number(item.year) === Number(year) && item.kind === "COMPENSATORY")
    .reduce((sum, item) => sum + Number(item.days || 0), 0);
  const usedStatuses = includePending ? ["APPROVED", "PENDING_TEAM_LEAD", "PENDING_EXECUTIVE"] : ["APPROVED"];
  const annualUsed = db.leaveRequests
    .filter((item) => item.id !== excludeRequestId && item.userId === userId && String(item.startDate).startsWith(String(year)) && usedStatuses.includes(item.status) && leaveBalanceKind(item.type) === "ANNUAL")
    .reduce((sum, item) => sum + Number(item.days || 0), 0);
  const compensatoryUsed = db.leaveRequests
    .filter((item) => item.id !== excludeRequestId && item.userId === userId && String(item.startDate).startsWith(String(year)) && usedStatuses.includes(item.status) && leaveBalanceKind(item.type) === "COMPENSATORY")
    .reduce((sum, item) => sum + Number(item.days || 0), 0);
  const annualRemaining = annualGranted + annualAdjustments - annualUsed;
  const compensatoryRemaining = compensatoryGranted - compensatoryUsed;
  return {
    userId,
    year: Number(year),
    baseAnnualGranted,
    tenureAnnualGranted,
    granted: annualGranted,
    annualEntitled: annualGranted,
    adjustments: annualAdjustments,
    used: annualUsed,
    remaining: annualRemaining,
    annualGranted,
    annualAdjustments,
    annualUsed,
    annualRemaining,
    compensatoryGranted,
    compensatoryUsed,
    compensatoryRemaining,
    totalUsed: annualUsed + compensatoryUsed,
    totalRemaining: annualRemaining + compensatoryRemaining
  };
}

function applyAttendanceChange(db, request, actor, method) {
  let record = request.attendanceRecordId
    ? db.attendanceRecords.find((item) => item.id === request.attendanceRecordId)
    : db.attendanceRecords.find((item) => item.userId === request.userId && item.date === request.date);
  if (!record) {
    record = {
      id: newId("att"),
      userId: request.userId,
      date: request.date,
      checkInAt: null,
      checkOutAt: null,
      checkInIp: null,
      checkOutIp: null,
      source: "REQUEST",
      note: "",
      checkInNote: "",
      checkOutNote: "",
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    db.attendanceRecords.push(record);
    request.attendanceRecordId = record.id;
  }
  const before = { checkInAt: record.checkInAt, checkOutAt: record.checkOutAt };
  record.checkInAt = request.proposedCheckInAt;
  record.checkOutAt = request.proposedCheckOutAt;
  record.source = "REQUEST";
  record.note = request.reason;
  record.updatedAt = nowIso();
  db.attendanceAdjustmentLogs.push({
    id: newId("attlog"),
    recordId: record.id,
    userId: request.userId,
    changedBy: actor.id,
    method,
    before,
    after: { checkInAt: record.checkInAt, checkOutAt: record.checkOutAt },
    reason: request.reason,
    requestId: request.id,
    createdAt: nowIso()
  });
}

function localUrls() {
  const urls = [`http://localhost:${PORT}`];
  Object.values(os.networkInterfaces()).flat().forEach((entry) => {
    if (entry && entry.family === "IPv4" && !entry.internal) urls.push(`http://${entry.address}:${PORT}`);
  });
  return [...new Set(urls)];
}

function routeMatch(pathname, pattern) {
  const match = pattern.exec(pathname);
  return match ? match.slice(1).map(decodeURIComponent) : null;
}

async function handleApi(req, res, pathname, searchParams) {
  if (req.method === "GET" && pathname === "/api/public/status") {
    const db = readDb();
    const ip = getClientIp(req);
    sendJson(res, 200, {
      ok: true,
      currentIp: ip,
      ipAllowed: isIpAllowed(db, ip),
      ipRestrictionEnabled: isIpRestrictionEnabled(db),
      serviceName: db.settings.serviceName,
      localUrls: localUrls(),
      allowedIpCount: db.allowedIps.length
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/login") {
    const body = await readJsonBody(req);
    const db = readDb();
    cleanupSessions(db);
    const ip = getClientIp(req);
    const loginId = normalizeLogin(body.loginId);
    if (!isIpAllowed(db, ip)) {
      audit(db, null, "LOGIN_BLOCKED_BY_IP", { loginId, ip }, req);
      writeDb(db);
      sendError(res, 403, "등록된 IP에서만 로그인할 수 있습니다.", "IP_BLOCKED");
      return;
    }
    const user = db.users.find((item) => item.loginId === loginId && item.status === "ACTIVE");
    if (!user || !verifyPassword(String(body.password || ""), user.passwordHash)) {
      audit(db, null, "LOGIN_FAILED", { loginId, ip }, req);
      writeDb(db);
      sendError(res, 401, "로그인 ID 또는 비밀번호를 확인하세요.", "LOGIN_FAILED");
      return;
    }
    const token = createSession(db, user, req);
    audit(db, user.id, "LOGIN_SUCCESS", { ip }, req);
    writeDb(db);
    setSessionCookie(res, token);
    sendJson(res, 200, { ok: true, user: sanitizeUser(user) });
    return;
  }

  if (req.method === "POST" && pathname === "/api/logout") {
    const db = readDb();
    const token = parseCookies(req).attendance_session;
    if (token) db.sessions = db.sessions.filter((item) => item.tokenHash !== sha256(token));
    writeDb(db);
    clearSessionCookie(res);
    sendJson(res, 200, { ok: true });
    return;
  }

  const ctx = requireAuth(req, res);
  if (!ctx) return;

  if (req.method === "GET" && pathname === "/api/me") {
    writeDb(ctx.db);
    sendJson(res, 200, { ok: true, user: sanitizeUser(ctx.user), team: ctx.db.teams.find((team) => team.id === ctx.user.teamId) || null, currentIp: ctx.ip });
    return;
  }

  if (req.method === "PATCH" && pathname === "/api/me/password") {
    const body = await readJsonBody(req);
    if (!verifyPassword(String(body.currentPassword || ""), ctx.user.passwordHash)) return sendError(res, 400, "현재 비밀번호가 일치하지 않습니다.", "PASSWORD_MISMATCH");
    if (String(body.newPassword || "").length < 8) return sendError(res, 400, "새 비밀번호는 8자 이상이어야 합니다.", "WEAK_PASSWORD");
    ctx.user.passwordHash = hashPassword(String(body.newPassword));
    ctx.user.mustChangePassword = false;
    ctx.user.updatedAt = nowIso();
    audit(ctx.db, ctx.user.id, "PASSWORD_CHANGED", {}, req);
    writeDb(ctx.db);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET" && pathname === "/api/teams") {
    writeDb(ctx.db);
    sendJson(res, 200, { ok: true, teams: ctx.db.teams });
    return;
  }

  if (req.method === "POST" && pathname === "/api/teams") {
    if (!requireExecutive(ctx, res)) return;
    const body = await readJsonBody(req);
    const name = String(body.name || "").trim();
    if (!name) return sendError(res, 400, "팀명을 입력하세요.", "TEAM_NAME_REQUIRED");
    if (ctx.db.teams.some((team) => team.name === name)) return sendError(res, 409, "이미 등록된 팀명입니다.", "DUPLICATE_TEAM_NAME");
    const team = { id: newId("team"), name, createdAt: nowIso(), updatedAt: nowIso() };
    ctx.db.teams.push(team);
    audit(ctx.db, ctx.user.id, "TEAM_CREATED", { teamId: team.id, name }, req);
    writeDb(ctx.db);
    sendJson(res, 201, { ok: true, team });
    return;
  }

  const teamMatch = routeMatch(pathname, /^\/api\/teams\/([^/]+)$/);
  if (req.method === "PUT" && teamMatch) {
    if (!requireExecutive(ctx, res)) return;
    const [teamId] = teamMatch;
    const team = ctx.db.teams.find((item) => item.id === teamId);
    if (!team) return sendError(res, 404, "팀을 찾을 수 없습니다.", "NOT_FOUND");
    const body = await readJsonBody(req);
    const name = String(body.name || "").trim();
    if (!name) return sendError(res, 400, "팀명을 입력하세요.", "TEAM_NAME_REQUIRED");
    if (ctx.db.teams.some((item) => item.id !== teamId && item.name === name)) return sendError(res, 409, "이미 등록된 팀명입니다.", "DUPLICATE_TEAM_NAME");
    const before = team.name;
    team.name = name;
    team.updatedAt = nowIso();
    audit(ctx.db, ctx.user.id, "TEAM_UPDATED", { teamId, before, after: name }, req);
    writeDb(ctx.db);
    sendJson(res, 200, { ok: true, team });
    return;
  }

  if (req.method === "DELETE" && teamMatch) {
    if (!requireExecutive(ctx, res)) return;
    const [teamId] = teamMatch;
    const team = ctx.db.teams.find((item) => item.id === teamId);
    if (!team) return sendError(res, 404, "팀을 찾을 수 없습니다.", "NOT_FOUND");
    const assignedCount = ctx.db.users.filter((user) => user.teamId === teamId).length;
    if (assignedCount > 0) return sendError(res, 400, "소속 직원이 있는 팀은 삭제할 수 없습니다. 직원의 팀을 먼저 변경하세요.", "TEAM_HAS_USERS");
    if (ctx.db.teams.length <= 1) return sendError(res, 400, "최소 1개의 팀이 필요합니다.", "LAST_TEAM");
    ctx.db.teams = ctx.db.teams.filter((item) => item.id !== teamId);
    audit(ctx.db, ctx.user.id, "TEAM_DELETED", { teamId, name: team.name }, req);
    writeDb(ctx.db);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET" && pathname === "/api/users") {
    const users = scopedUsers(ctx.db, ctx.user).map(sanitizeUser);
    writeDb(ctx.db);
    sendJson(res, 200, { ok: true, users });
    return;
  }

  if (req.method === "POST" && pathname === "/api/users") {
    if (!requireExecutive(ctx, res)) return;
    const body = await readJsonBody(req);
    const loginId = normalizeLogin(body.loginId);
    if (!body.name || !loginId || !body.password) return sendError(res, 400, "이름, 로그인 ID, 초기 비밀번호를 입력하세요.", "USER_REQUIRED_FIELDS");
    if (ctx.db.users.some((item) => item.loginId === loginId)) return sendError(res, 409, "이미 사용 중인 로그인 ID입니다.", "DUPLICATE_LOGIN_ID");
    if (!ROLES.includes(body.role)) return sendError(res, 400, "권한 값이 올바르지 않습니다.", "INVALID_ROLE");
    let teamId;
    try {
      teamId = resolveUserTeamId(ctx.db, body.role, body.teamId);
    } catch (error) {
      return sendError(res, 400, error.message === "TEAM_REQUIRED" ? "팀장/일반직원은 팀 선택이 필요합니다." : "선택한 팀을 찾을 수 없습니다.", error.message);
    }
    const user = {
      id: newId("user"),
      name: String(body.name).trim(),
      loginId,
      passwordHash: hashPassword(String(body.password)),
      role: body.role,
      teamId,
      status: STATUSES.includes(body.status) ? body.status : "ACTIVE",
      hireDate: body.hireDate ? validateDate(body.hireDate) : localDate(),
      baseAnnualLeaveDays: normalizeLeaveDays(body.baseAnnualLeaveDays ?? body.annualLeaveDays),
      workStart: validateTime(body.workStart, DEFAULT_WORK_START),
      workEnd: validateTime(body.workEnd, DEFAULT_WORK_END),
      breakStart: validateTime(body.breakStart, DEFAULT_BREAK_START),
      breakEnd: validateTime(body.breakEnd, DEFAULT_BREAK_END),
      mustChangePassword: true,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    user.annualLeaveDays = annualLeaveEntitlement(user).annualLeaveDays;
    ctx.db.users.push(user);
    audit(ctx.db, ctx.user.id, "USER_CREATED", { userId: user.id, loginId: user.loginId, role: user.role }, req);
    writeDb(ctx.db);
    sendJson(res, 201, { ok: true, user: sanitizeUser(user) });
    return;
  }

  const userPutMatch = routeMatch(pathname, /^\/api\/users\/([^/]+)$/);
  if (req.method === "PUT" && userPutMatch) {
    if (!requireExecutive(ctx, res)) return;
    const [userId] = userPutMatch;
    const target = ctx.db.users.find((item) => item.id === userId);
    if (!target) return sendError(res, 404, "직원을 찾을 수 없습니다.", "NOT_FOUND");
    const body = await readJsonBody(req);
    const nextRole = body.role || target.role;
    const nextStatus = body.status || target.status;
    if (!ROLES.includes(nextRole)) return sendError(res, 400, "권한 값이 올바르지 않습니다.", "INVALID_ROLE");
    if (!STATUSES.includes(nextStatus)) return sendError(res, 400, "상태 값이 올바르지 않습니다.", "INVALID_STATUS");
    let nextTeamId;
    try {
      nextTeamId = resolveUserTeamId(ctx.db, nextRole, body.teamId ?? target.teamId);
    } catch (error) {
      return sendError(res, 400, error.message === "TEAM_REQUIRED" ? "팀장/일반직원은 팀 선택이 필요합니다." : "선택한 팀을 찾을 수 없습니다.", error.message);
    }
    const activeExecutiveCount = ctx.db.users.filter((item) => item.id !== userId && item.role === "EXECUTIVE" && item.status === "ACTIVE").length;
    if (target.id === ctx.user.id && (nextRole !== "EXECUTIVE" || nextStatus !== "ACTIVE") && activeExecutiveCount === 0) return sendError(res, 400, "마지막 활성 관리자 계정은 변경할 수 없습니다.", "LAST_EXECUTIVE");
    target.name = String(body.name || target.name).trim();
    target.loginId = normalizeLogin(target.loginId);
    target.role = nextRole;
    target.teamId = nextTeamId;
    target.status = nextStatus;
    target.hireDate = body.hireDate ? validateDate(body.hireDate) : target.hireDate;
    target.baseAnnualLeaveDays = normalizeLeaveDays(body.baseAnnualLeaveDays ?? body.annualLeaveDays ?? target.baseAnnualLeaveDays);
    target.annualLeaveDays = annualLeaveEntitlement(target).annualLeaveDays;
    target.workStart = validateTime(body.workStart, target.workStart);
    target.workEnd = validateTime(body.workEnd, target.workEnd);
    target.breakStart = validateTime(body.breakStart, target.breakStart);
    target.breakEnd = validateTime(body.breakEnd, target.breakEnd);
    if (body.password) {
      target.passwordHash = hashPassword(String(body.password));
      target.mustChangePassword = true;
    }
    target.updatedAt = nowIso();
    audit(ctx.db, ctx.user.id, "USER_UPDATED", { userId: target.id, loginId: target.loginId, role: target.role, status: target.status }, req);
    writeDb(ctx.db);
    sendJson(res, 200, { ok: true, user: sanitizeUser(target) });
    return;
  }

  if (req.method === "GET" && pathname === "/api/allowed-ips") {
    if (!requireExecutive(ctx, res)) return;
    writeDb(ctx.db);
    sendJson(res, 200, { ok: true, allowedIps: ctx.db.allowedIps, ipRestrictionEnabled: isIpRestrictionEnabled(ctx.db) });
    return;
  }

  if (req.method === "PUT" && pathname === "/api/ip-restriction") {
    if (!requireExecutive(ctx, res)) return;
    const body = await readJsonBody(req);
    const enabled = body.enabled === true || body.enabled === "true" || body.enabled === "on";
    ctx.db.settings.ipRestrictionEnabled = enabled;
    audit(ctx.db, ctx.user.id, enabled ? "IP_RESTRICTION_ENABLED" : "IP_RESTRICTION_DISABLED", { enabled }, req);
    writeDb(ctx.db);
    sendJson(res, 200, { ok: true, ipRestrictionEnabled: enabled });
    return;
  }

  if (req.method === "POST" && pathname === "/api/allowed-ips") {
    if (!requireExecutive(ctx, res)) return;
    const body = await readJsonBody(req);
    const ip = normalizeIp(body.ip);
    if (!ip) return sendError(res, 400, "IP를 입력하세요.", "IP_REQUIRED");
    if (ctx.db.allowedIps.some((entry) => normalizeIp(entry.ip) === ip)) return sendError(res, 409, "이미 등록된 IP입니다.", "DUPLICATE_IP");
    const entry = { id: newId("ip"), ip, label: String(body.label || "").trim() || ip, createdAt: nowIso(), updatedAt: nowIso() };
    ctx.db.allowedIps.push(entry);
    audit(ctx.db, ctx.user.id, "ALLOWED_IP_CREATED", { ip, label: entry.label }, req);
    writeDb(ctx.db);
    sendJson(res, 201, { ok: true, allowedIp: entry });
    return;
  }

  const ipDeleteMatch = routeMatch(pathname, /^\/api\/allowed-ips\/([^/]+)$/);
  if (req.method === "DELETE" && ipDeleteMatch) {
    if (!requireExecutive(ctx, res)) return;
    const [ipId] = ipDeleteMatch;
    const entry = ctx.db.allowedIps.find((item) => item.id === ipId);
    if (!entry) return sendError(res, 404, "IP를 찾을 수 없습니다.", "NOT_FOUND");
    if (normalizeIp(entry.ip) === ctx.ip) return sendError(res, 400, "현재 접속 중인 IP는 삭제할 수 없습니다.", "CURRENT_IP_DELETE");
    if (ctx.db.allowedIps.length <= 1) return sendError(res, 400, "최소 1개의 허용 IP가 필요합니다.", "LAST_IP");
    ctx.db.allowedIps = ctx.db.allowedIps.filter((item) => item.id !== ipId);
    audit(ctx.db, ctx.user.id, "ALLOWED_IP_DELETED", { ip: entry.ip, label: entry.label }, req);
    writeDb(ctx.db);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && pathname === "/api/attendance/check-in") {
    const body = await readJsonBody(req);
    const date = localDate();
    let record = ctx.db.attendanceRecords.find((item) => item.userId === ctx.user.id && item.date === date);
    if (record && record.checkInAt) return sendError(res, 409, "이미 출근 체크가 되어 있습니다.", "ALREADY_CHECKED_IN");
    if (!record) {
      record = { id: newId("att"), userId: ctx.user.id, date, checkInAt: null, checkOutAt: null, checkInIp: null, checkOutIp: null, source: "SELF", note: "", checkInNote: "", checkOutNote: "", createdAt: nowIso(), updatedAt: nowIso() };
      ctx.db.attendanceRecords.push(record);
    }
    record.checkInAt = nowIso();
    record.checkInIp = ctx.ip;
    record.checkInNote = String(body.note || "").trim();
    record.updatedAt = nowIso();
    audit(ctx.db, ctx.user.id, "ATTENDANCE_CHECK_IN", { recordId: record.id, date, note: record.checkInNote }, req);
    writeDb(ctx.db);
    sendJson(res, 200, { ok: true, record: decorateAttendance(ctx.db, record) });
    return;
  }

  if (req.method === "POST" && pathname === "/api/attendance/check-out") {
    const body = await readJsonBody(req);
    const date = localDate();
    const record = ctx.db.attendanceRecords.find((item) => item.userId === ctx.user.id && item.date === date);
    if (!record || !record.checkInAt) return sendError(res, 400, "출근 체크가 먼저 필요합니다.", "CHECK_IN_REQUIRED");
    if (record.checkOutAt) return sendError(res, 409, "이미 퇴근 체크가 되어 있습니다.", "ALREADY_CHECKED_OUT");
    record.checkOutAt = nowIso();
    record.checkOutIp = ctx.ip;
    record.checkOutNote = String(body.note || "").trim();
    record.updatedAt = nowIso();
    audit(ctx.db, ctx.user.id, "ATTENDANCE_CHECK_OUT", { recordId: record.id, date, note: record.checkOutNote }, req);
    writeDb(ctx.db);
    sendJson(res, 200, { ok: true, record: decorateAttendance(ctx.db, record) });
    return;
  }

  if (req.method === "GET" && pathname === "/api/attendance") {
    const from = searchParams.get("from") || `${localDate().slice(0, 8)}01`;
    const to = searchParams.get("to") || localDate();
    const requestedUserId = searchParams.get("userId");
    let allowedUserIds = scopedUsers(ctx.db, ctx.user).map((item) => item.id);
    if (requestedUserId) {
      const target = ctx.db.users.find((item) => item.id === requestedUserId);
      if (!canAccessUser(ctx.user, target)) return sendError(res, 403, "해당 직원의 근태를 볼 수 없습니다.", "FORBIDDEN");
      allowedUserIds = [requestedUserId];
    }
    const records = ctx.db.attendanceRecords
      .filter((record) => allowedUserIds.includes(record.userId) && record.date >= from && record.date <= to)
      .sort((a, b) => `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`))
      .map((record) => decorateAttendance(ctx.db, record));
    writeDb(ctx.db);
    sendJson(res, 200, { ok: true, records });
    return;
  }

  if (req.method === "POST" && pathname === "/api/attendance/direct-adjust") {
    if (!requireExecutive(ctx, res)) return;
    const body = await readJsonBody(req);
    const target = ctx.db.users.find((item) => item.id === body.userId);
    if (!target) return sendError(res, 404, "직원을 찾을 수 없습니다.", "NOT_FOUND");
    const date = validateDate(body.date);
    const reason = String(body.reason || "").trim();
    if (!reason) return sendError(res, 400, "수정 사유를 입력하세요.", "REASON_REQUIRED");
    const checkInAt = body.checkInTime ? isoFromLocalDateTime(date, body.checkInTime) : null;
    const checkOutAt = body.checkOutTime ? isoFromLocalDateTime(date, body.checkOutTime) : null;
    let record = ctx.db.attendanceRecords.find((item) => item.userId === target.id && item.date === date);
    if (!record) {
      record = { id: newId("att"), userId: target.id, date, checkInAt: null, checkOutAt: null, checkInIp: null, checkOutIp: null, source: "ADMIN", note: "", checkInNote: "", checkOutNote: "", createdAt: nowIso(), updatedAt: nowIso() };
      ctx.db.attendanceRecords.push(record);
    }
    const before = { checkInAt: record.checkInAt, checkOutAt: record.checkOutAt };
    record.checkInAt = checkInAt;
    record.checkOutAt = checkOutAt;
    record.source = "ADMIN";
    record.note = reason;
    record.updatedAt = nowIso();
    ctx.db.attendanceAdjustmentLogs.push({ id: newId("attlog"), recordId: record.id, userId: target.id, changedBy: ctx.user.id, method: "DIRECT_ADMIN", before, after: { checkInAt, checkOutAt }, reason, createdAt: nowIso() });
    audit(ctx.db, ctx.user.id, "ATTENDANCE_DIRECT_ADJUSTED", { recordId: record.id, targetUserId: target.id, date }, req);
    writeDb(ctx.db);
    sendJson(res, 200, { ok: true, record: decorateAttendance(ctx.db, record) });
    return;
  }

  if (req.method === "GET" && pathname === "/api/attendance-adjustment-logs") {
    const recordId = searchParams.get("recordId");
    const requestId = searchParams.get("requestId");
    let logs = isExecutive(ctx.user)
      ? ctx.db.attendanceAdjustmentLogs
      : ctx.db.attendanceAdjustmentLogs.filter((log) => log.userId === ctx.user.id);
    if (recordId) logs = logs.filter((log) => log.recordId === recordId);
    if (requestId) logs = logs.filter((log) => log.requestId === requestId);
    logs = logs
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((log) => ({ ...log, user: userSummary(ctx.db, log.userId), changedByUser: userSummary(ctx.db, log.changedBy) }));
    writeDb(ctx.db);
    sendJson(res, 200, { ok: true, logs });
    return;
  }

  if (req.method === "GET" && pathname === "/api/attendance-change-requests") {
    const status = searchParams.get("status");
    let requests = isExecutive(ctx.user)
      ? ctx.db.attendanceChangeRequests
      : ctx.db.attendanceChangeRequests.filter((request) => request.userId === ctx.user.id);
    if (status) requests = requests.filter((request) => request.status === status);
    requests = requests.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((request) => ({ ...request, user: userSummary(ctx.db, request.userId) }));
    writeDb(ctx.db);
    sendJson(res, 200, { ok: true, requests });
    return;
  }

  if (req.method === "POST" && pathname === "/api/attendance-change-requests") {
    const body = await readJsonBody(req);
    const date = validateDate(body.date);
    const reason = String(body.reason || "").trim();
    if (!reason) return sendError(res, 400, "수정 요청 사유를 입력하세요.", "REASON_REQUIRED");
    const original = ctx.db.attendanceRecords.find((item) => item.userId === ctx.user.id && item.date === date) || null;
    const proposedCheckInAt = body.proposedCheckInTime ? isoFromLocalDateTime(date, body.proposedCheckInTime) : null;
    const proposedCheckOutAt = body.proposedCheckOutTime ? isoFromLocalDateTime(date, body.proposedCheckOutTime) : null;
    if (!proposedCheckInAt && !proposedCheckOutAt) return sendError(res, 400, "변경할 출근 또는 퇴근 시간을 입력하세요.", "PROPOSED_TIME_REQUIRED");
    const request = {
      id: newId("attreq"),
      userId: ctx.user.id,
      attendanceRecordId: original ? original.id : null,
      date,
      originalCheckInAt: original ? original.checkInAt : null,
      originalCheckOutAt: original ? original.checkOutAt : null,
      proposedCheckInAt,
      proposedCheckOutAt,
      reason,
      status: "PENDING_EXECUTIVE",
      teamLeadId: null,
      executiveId: null,
      teamLeadComment: "",
      executiveComment: "",
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    if (ctx.user.role === "EXECUTIVE") {
      request.status = "APPROVED";
      request.executiveId = ctx.user.id;
      applyAttendanceChange(ctx.db, request, ctx.user, "REQUEST_APPROVED");
    }
    ctx.db.attendanceChangeRequests.push(request);
    audit(ctx.db, ctx.user.id, "ATTENDANCE_CHANGE_REQUESTED", { requestId: request.id, date }, req);
    writeDb(ctx.db);
    sendJson(res, 201, { ok: true, request });
    return;
  }

  const attendanceRequestActionMatch = routeMatch(pathname, /^\/api\/attendance-change-requests\/([^/]+)\/(approve|reject)$/);
  if (req.method === "POST" && attendanceRequestActionMatch) {
    if (!requireExecutive(ctx, res)) return;
    const [requestId, action] = attendanceRequestActionMatch;
    const body = await readJsonBody(req);
    const request = ctx.db.attendanceChangeRequests.find((item) => item.id === requestId);
    if (!request) return sendError(res, 404, "근태 수정 요청을 찾을 수 없습니다.", "NOT_FOUND");
    const target = ctx.db.users.find((item) => item.id === request.userId);
    if (!target) return sendError(res, 404, "직원을 찾을 수 없습니다.", "NOT_FOUND");
    if (!PENDING.includes(request.status)) return sendError(res, 400, "이미 처리된 요청입니다.", "ALREADY_PROCESSED");
    if (action === "approve") {
      request.status = "APPROVED";
      request.executiveId = ctx.user.id;
      request.executiveComment = String(body.comment || "").trim();
      request.updatedAt = nowIso();
      applyAttendanceChange(ctx.db, request, ctx.user, "REQUEST_APPROVED");
      audit(ctx.db, ctx.user.id, "ATTENDANCE_CHANGE_EXECUTIVE_APPROVED", { requestId }, req);
    } else {
      request.status = "REJECTED";
      request.executiveId = ctx.user.id;
      request.executiveComment = String(body.comment || "").trim();
      request.updatedAt = nowIso();
      audit(ctx.db, ctx.user.id, "ATTENDANCE_CHANGE_REJECTED", { requestId }, req);
    }
    writeDb(ctx.db);
    sendJson(res, 200, { ok: true, request });
    return;
  }

  if (req.method === "GET" && pathname === "/api/leave-balances") {
    const year = Number(searchParams.get("year") || localDate().slice(0, 4));
    const requestedUserId = searchParams.get("userId");
    let users = scopedUsers(ctx.db, ctx.user);
    if (requestedUserId) {
      const target = ctx.db.users.find((item) => item.id === requestedUserId);
      if (!canAccessUser(ctx.user, target)) return sendError(res, 403, "해당 직원의 휴가를 볼 수 없습니다.", "FORBIDDEN");
      users = [target];
    }
    const balances = users.map((user) => ({ ...getLeaveBalance(ctx.db, user.id, year), user: userSummary(ctx.db, user.id) }));
    writeDb(ctx.db);
    sendJson(res, 200, { ok: true, balances });
    return;
  }

  if (req.method === "GET" && pathname === "/api/leave-adjustments") {
    if (!requireExecutive(ctx, res)) return;
    const adjustments = ctx.db.leaveAdjustments
      .slice()
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
      .map((adjustment) => ({
        ...adjustment,
        user: userSummary(ctx.db, adjustment.userId),
        createdByUser: userSummary(ctx.db, adjustment.createdBy)
      }));
    writeDb(ctx.db);
    sendJson(res, 200, { ok: true, adjustments });
    return;
  }

  if (req.method === "POST" && pathname === "/api/leave-adjustments") {
    if (!requireExecutive(ctx, res)) return;
    const body = await readJsonBody(req);
    const target = ctx.db.users.find((item) => item.id === body.userId);
    if (!target) return sendError(res, 404, "직원을 찾을 수 없습니다.", "NOT_FOUND");
    const days = Number(body.days);
    const year = Number(body.year || localDate().slice(0, 4));
    const kind = body.kind === "COMPENSATORY" ? "COMPENSATORY" : "ANNUAL";
    const reason = String(body.reason || "").trim();
    if (!Number.isFinite(days) || days === 0) return sendError(res, 400, "조정 일수를 입력하세요.", "INVALID_DAYS");
    if (!reason) return sendError(res, 400, "조정 사유를 입력하세요.", "REASON_REQUIRED");
    const adjustment = { id: newId("leaveadj"), userId: target.id, year, days, kind, reason, createdBy: ctx.user.id, createdAt: nowIso() };
    ctx.db.leaveAdjustments.push(adjustment);
    audit(ctx.db, ctx.user.id, kind === "COMPENSATORY" ? "COMPENSATORY_LEAVE_GRANTED" : "LEAVE_BALANCE_ADJUSTED", { targetUserId: target.id, year, days, kind, reason }, req);
    writeDb(ctx.db);
    sendJson(res, 201, { ok: true, adjustment });
    return;
  }

  if (req.method === "GET" && pathname === "/api/leave-requests") {
    const status = searchParams.get("status");
    const scopedIds = scopedUsers(ctx.db, ctx.user).map((item) => item.id);
    let requests = ctx.db.leaveRequests.filter((request) => scopedIds.includes(request.userId));
    if (ctx.user.role === "EMPLOYEE") requests = requests.filter((request) => request.userId === ctx.user.id);
    if (status) requests = requests.filter((request) => request.status === status);
    requests = requests.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((request) => ({ ...request, user: userSummary(ctx.db, request.userId) }));
    writeDb(ctx.db);
    sendJson(res, 200, { ok: true, requests });
    return;
  }

  if (req.method === "POST" && pathname === "/api/leave-requests") {
    const body = await readJsonBody(req);
    const type = String(body.type || "");
    if (!LEAVE_TYPES.includes(type)) return sendError(res, 400, "휴가 유형이 올바르지 않습니다.", "INVALID_LEAVE_TYPE");
    const startDate = validateDate(body.startDate);
    const endDate = validateDate(body.endDate);
    const reason = String(body.reason || "").trim();
    if (!reason) return sendError(res, 400, "휴가 사유를 입력하세요.", "REASON_REQUIRED");
    if (endDate < startDate) return sendError(res, 400, "종료일이 시작일보다 빠릅니다.", "INVALID_RANGE");
    if (leaveOverlaps(ctx.db, ctx.user.id, startDate, endDate)) return sendError(res, 400, "이미 신청 또는 승인된 휴가 기간과 겹칩니다.", "LEAVE_OVERLAP");
    let days;
    try {
      days = calculateLeaveDays(type, startDate, endDate);
    } catch {
      return sendError(res, 400, "반차는 하루 날짜로만 신청할 수 있습니다.", "HALF_DAY_RANGE");
    }
    if (days <= 0) return sendError(res, 400, "휴가 일수가 0일입니다. 주말만 선택했는지 확인하세요.", "NO_LEAVE_DAYS");
    const year = Number(startDate.slice(0, 4));
    const balance = getLeaveBalance(ctx.db, ctx.user.id, year, { includePending: true });
    const remaining = leaveBalanceKind(type) === "COMPENSATORY" ? balance.compensatoryRemaining : balance.annualRemaining;
    if (remaining < days) return sendError(res, 400, "잔여 휴가가 부족합니다.", "INSUFFICIENT_BALANCE");
    const request = {
      id: newId("leave"),
      userId: ctx.user.id,
      type,
      startDate,
      endDate,
      days,
      reason,
      status: ctx.user.role === "TEAM_LEAD" ? "PENDING_EXECUTIVE" : "PENDING_TEAM_LEAD",
      teamLeadId: null,
      executiveId: null,
      teamLeadComment: "",
      executiveComment: "",
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    if (ctx.user.role === "EXECUTIVE") {
      request.status = "APPROVED";
      request.executiveId = ctx.user.id;
    }
    ctx.db.leaveRequests.push(request);
    ctx.db.leaveApprovalLogs.push({ id: newId("leavelog"), leaveRequestId: request.id, actorId: ctx.user.id, action: request.status === "APPROVED" ? "AUTO_APPROVED" : "REQUESTED", comment: "", createdAt: nowIso() });
    audit(ctx.db, ctx.user.id, "LEAVE_REQUESTED", { requestId: request.id, type, startDate, endDate, days }, req);
    writeDb(ctx.db);
    sendJson(res, 201, { ok: true, request });
    return;
  }

  const leaveActionMatch = routeMatch(pathname, /^\/api\/leave-requests\/([^/]+)\/(approve|reject|cancel)$/);
  if (req.method === "POST" && leaveActionMatch) {
    const [requestId, action] = leaveActionMatch;
    const body = await readJsonBody(req);
    const request = ctx.db.leaveRequests.find((item) => item.id === requestId);
    if (!request) return sendError(res, 404, "휴가 신청을 찾을 수 없습니다.", "NOT_FOUND");
    const target = ctx.db.users.find((item) => item.id === request.userId);
    if (!target) return sendError(res, 404, "직원을 찾을 수 없습니다.", "NOT_FOUND");

    if (action === "cancel") {
      const canCancelOwnPending = request.userId === ctx.user.id && PENDING.includes(request.status);
      if (!canCancelOwnPending && !isExecutive(ctx.user)) return sendError(res, 403, "취소 권한이 없습니다.", "FORBIDDEN");
      if (["CANCELED", "REJECTED"].includes(request.status)) return sendError(res, 400, "이미 종료된 신청입니다.", "ALREADY_PROCESSED");
      request.status = "CANCELED";
      request.updatedAt = nowIso();
      ctx.db.leaveApprovalLogs.push({ id: newId("leavelog"), leaveRequestId: request.id, actorId: ctx.user.id, action: "CANCELED", comment: String(body.comment || "").trim(), createdAt: nowIso() });
      audit(ctx.db, ctx.user.id, "LEAVE_CANCELED", { requestId }, req);
      writeDb(ctx.db);
      sendJson(res, 200, { ok: true, request });
      return;
    }

    if (!PENDING.includes(request.status)) return sendError(res, 400, "이미 처리된 신청입니다.", "ALREADY_PROCESSED");
    if (action === "approve") {
      if (request.status === "PENDING_TEAM_LEAD" && isTeamLead(ctx.user) && ctx.user.teamId === target.teamId) {
        request.status = "PENDING_EXECUTIVE";
        request.teamLeadId = ctx.user.id;
        request.teamLeadComment = String(body.comment || "").trim();
        request.updatedAt = nowIso();
        ctx.db.leaveApprovalLogs.push({ id: newId("leavelog"), leaveRequestId: request.id, actorId: ctx.user.id, action: "TEAM_APPROVED", comment: request.teamLeadComment, createdAt: nowIso() });
        audit(ctx.db, ctx.user.id, "LEAVE_TEAM_APPROVED", { requestId }, req);
      } else if (isExecutive(ctx.user)) {
        const year = Number(request.startDate.slice(0, 4));
        const balance = getLeaveBalance(ctx.db, request.userId, year, { includePending: true, excludeRequestId: request.id });
        const remaining = leaveBalanceKind(request.type) === "COMPENSATORY" ? balance.compensatoryRemaining : balance.annualRemaining;
        if (remaining < Number(request.days)) return sendError(res, 400, "잔여 휴가가 부족하여 승인할 수 없습니다.", "INSUFFICIENT_BALANCE");
        request.status = "APPROVED";
        request.executiveId = ctx.user.id;
        request.executiveComment = String(body.comment || "").trim();
        request.updatedAt = nowIso();
        ctx.db.leaveApprovalLogs.push({ id: newId("leavelog"), leaveRequestId: request.id, actorId: ctx.user.id, action: "EXECUTIVE_APPROVED", comment: request.executiveComment, createdAt: nowIso() });
        audit(ctx.db, ctx.user.id, "LEAVE_EXECUTIVE_APPROVED", { requestId }, req);
      } else {
        return sendError(res, 403, "승인 권한이 없습니다.", "FORBIDDEN");
      }
    } else if ((request.status === "PENDING_TEAM_LEAD" && isTeamLead(ctx.user) && ctx.user.teamId === target.teamId) || isExecutive(ctx.user)) {
      const comment = String(body.comment || "").trim();
      request.status = "REJECTED";
      if (isExecutive(ctx.user)) {
        request.executiveId = ctx.user.id;
        request.executiveComment = comment;
      } else {
        request.teamLeadId = ctx.user.id;
        request.teamLeadComment = comment;
      }
      request.updatedAt = nowIso();
      ctx.db.leaveApprovalLogs.push({ id: newId("leavelog"), leaveRequestId: request.id, actorId: ctx.user.id, action: "REJECTED", comment, createdAt: nowIso() });
      audit(ctx.db, ctx.user.id, "LEAVE_REJECTED", { requestId }, req);
    } else {
      return sendError(res, 403, "반려 권한이 없습니다.", "FORBIDDEN");
    }
    writeDb(ctx.db);
    sendJson(res, 200, { ok: true, request });
    return;
  }

  if (req.method === "GET" && pathname === "/api/audit-logs") {
    if (!requireExecutive(ctx, res)) return;
    const logs = ctx.db.auditLogs.slice(-300).reverse().map((log) => ({ ...log, actor: userSummary(ctx.db, log.actorId) }));
    writeDb(ctx.db);
    sendJson(res, 200, { ok: true, logs });
    return;
  }

  sendError(res, 404, "API를 찾을 수 없습니다.", "NOT_FOUND");
}

function serveStatic(req, res, pathname) {
  const filePath = pathname === "/" ? path.join(PUBLIC_DIR, "index.html") : path.join(PUBLIC_DIR, decodeURIComponent(pathname));
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(PUBLIC_DIR))) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(resolved, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(resolved).toLowerCase();
    const types = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".svg": "image/svg+xml"
    };
    const cacheControl = [".html", ".css", ".js"].includes(ext) ? "no-store" : "public, max-age=300";
    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream", "Cache-Control": cacheControl });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url.pathname, url.searchParams);
      return;
    }
    serveStatic(req, res, url.pathname);
  } catch (error) {
    if (error.message === "INVALID_JSON") return sendError(res, 400, "요청 JSON이 올바르지 않습니다.", "INVALID_JSON");
    if (error.message === "BODY_TOO_LARGE") return sendError(res, 413, "요청 본문이 너무 큽니다.", "BODY_TOO_LARGE");
    if (error.message === "INVALID_TIME") return sendError(res, 400, "시간 형식은 HH:mm 이어야 합니다.", "INVALID_TIME");
    if (error.message === "INVALID_DATE") return sendError(res, 400, "날짜 형식은 YYYY-MM-DD 이어야 합니다.", "INVALID_DATE");
    console.error(error);
    sendError(res, 500, "서버 오류가 발생했습니다.", "SERVER_ERROR");
  }
});

ensureDataStore();
server.listen(PORT, "0.0.0.0", () => {
  console.log(`사내 근태관리 서버가 실행 중입니다. 포트: ${PORT}`);
  console.log("접속 주소:");
  localUrls().forEach((url) => console.log(`- ${url}`));
});
