

function getEditModeFromUrl() {
  const match = window.location.pathname.match(/^\/edit\/([^/]+)$/);
  return match ? { documentId: match[1] } : null;
}
const EDIT_MODE = getEditModeFromUrl();

const SCHEMA_VERSION = 5;
const ROUTE_CACHE_DB_NAME = "fieldworkSchedulerDB";
const ROUTE_CACHE_DB_VERSION = 2;
const ROUTE_CACHE_STORE = "routeCache";

const SESSION_ID = getSessionIdFromUrl();

const state = loadState();
initializeStateProxies(state);
const uiState = {
  schoolSort: { key: "name", dir: "asc" },
  schoolsListExpanded: false,
  researcherEditId: "",
  dayPlanEditId: "",
  mainView: "main-setup",
  selectedDayId: "",
  selectedVerificationDayId: "",
  selectedDayIdsByCity: {},
  selectedVerificationDayIdsByCity: {},
  plannerDraft: null,
  plannerDraftCache: {},
  plannerDirty: false,
  lastValidation: null,
  noteEditorAssignmentId: "",
  routeInsights: null,
  progressMode: "scheduled",
  progressExpanded: false,
  schoolEditId: "",
  schoolEditLocalWarnings: [],
  schoolsImportStatus: {
    message: "",
    tone: ""
  },
  routeBuilder: {
    schools: [],
    entries: [],
    running: false
  },
  verificationDraft: {}
};

const syncState = {
  hasUnsyncedChanges: false,
  hasUploadedDocument: false,
  hasUserChanges: false,
  uploadState: "idle",
  lastError: ""
};

const el = {
  mainSetupButton: document.getElementById("main-setup-button"),
  cityWorkspaceBar: document.getElementById("city-workspace-bar"),
  cityTabs: document.getElementById("city-tabs"),
  cityAdd: document.getElementById("city-add"),
  cityRename: document.getElementById("city-rename"),
  cityDelete: document.getElementById("city-delete"),
  cityCreateForm: document.getElementById("city-create-form"),
  cityCreateName: document.getElementById("city-create-name"),
  cityCreateFile: document.getElementById("city-create-file"),
  schoolsListToggle: document.getElementById("schools-list-toggle"),
  schoolsTableWrap: document.getElementById("schools-table-wrap"),
  mainViewTabs: document.getElementById("main-view-tabs"),

  schoolsBody: document.getElementById("schools-body"),
  schoolsFileInput: document.getElementById("schools-file-input"),
  schoolsImportTools: document.getElementById("schools-import-tools"),
  schoolsImportCopy: document.getElementById("schools-import-copy"),
  schoolsImportStatus: document.getElementById("schools-import-status"),
  schoolEditModal: document.getElementById("school-edit-modal"),
  schoolEditTitle: document.getElementById("school-edit-title"),
  schoolEditWarningPanel: document.getElementById("school-edit-warning-panel"),
  schoolEditForm: document.getElementById("school-edit-form"),
  schoolEditId: document.getElementById("school-edit-id"),
  schoolEditName: document.getElementById("school-edit-name"),
  schoolEditDistrict: document.getElementById("school-edit-district"),
  schoolEditType: document.getElementById("school-edit-type"),
  schoolEditStatus: document.getElementById("school-edit-status"),
  schoolEditDuration: document.getElementById("school-edit-duration"),
  schoolEditWorkingHours: document.getElementById("school-edit-working-hours"),
  schoolEditLunchBreak: document.getElementById("school-edit-lunch-break"),
  schoolEditClassroomCount: document.getElementById("school-edit-classroom-count"),
  schoolEditMaxClassSize: document.getElementById("school-edit-max-class-size"),
  schoolEditSchoolCode: document.getElementById("school-edit-school-code"),
  schoolEditSurvey: document.getElementById("school-edit-survey"),
  schoolEditClassroomList: document.getElementById("school-edit-classroom-list"),
  schoolEditNotes: document.getElementById("school-edit-notes"),
  schoolEditAddress: document.getElementById("school-edit-address"),
  schoolEditLatitude: document.getElementById("school-edit-latitude"),
  schoolEditLongitude: document.getElementById("school-edit-longitude"),
  schoolEditCity: document.getElementById("school-edit-city"),
  schoolEditCountry: document.getElementById("school-edit-country"),
  schoolEditCancel: document.getElementById("school-edit-cancel"),
  citySetupProgress: document.getElementById("city-setup-progress"),
  citySetupWarningPanel: document.getElementById("city-setup-warning-panel"),
  operationsWarningPanel: document.getElementById("operations-warning-panel"),
  districtProgressBody: document.getElementById("district-progress-body"),
  progressTableWrap: document.getElementById("progress-table-wrap"),
  progressVisibilityToggle: document.getElementById("progress-visibility-toggle"),
  progressModeToggle: document.getElementById("progress-mode-toggle"),
  progressSchoolsHeader: document.getElementById("progress-schools-header"),
  progressClassroomsHeader: document.getElementById("progress-classrooms-header"),

  researcherForm: document.getElementById("researcher-form"),
  researcherId: document.getElementById("researcher-id"),
  researcherName: document.getElementById("researcher-name"),
  researcherActive: document.getElementById("researcher-active"),
  researcherAvailabilityMode: document.getElementById("researcher-availability-mode"),
  researcherAvailabilityDays: document.getElementById("researcher-availability-days"),
  researcherNotes: document.getElementById("researcher-notes"),
  researcherSubmit: document.getElementById("researcher-submit"),
  researcherCancel: document.getElementById("researcher-cancel"),
  researchersBody: document.getElementById("researchers-body"),

  dayPlanForm: document.getElementById("day-plan-form"),
  dayPlanStartDate: document.getElementById("day-plan-start-date"),
  dayPlanEndDate: document.getElementById("day-plan-end-date"),
  dayPlanWeekdays: document.getElementById("day-plan-weekdays"),
  dayPlanNotes: document.getElementById("day-plan-notes"),
  dayPlanSubmit: document.getElementById("day-plan-submit"),
  dayPlansBody: document.getElementById("day-plans-body"),

  plannerDayTabs: document.getElementById("planner-day-tabs"),
  plannerSave: document.getElementById("planner-save"),
  plannerEdit: document.getElementById("planner-edit"),
  plannerPrint: document.getElementById("planner-print"),
  plannerSummary: document.getElementById("planner-summary"),
  plannerValidation: document.getElementById("planner-validation"),
  plannerRowsBody: document.getElementById("planner-rows-body"),
  plannerNoteModal: document.getElementById("planner-note-modal"),
  plannerNoteTitle: document.getElementById("planner-note-title"),
  plannerNoteInput: document.getElementById("planner-note-input"),
  plannerNoteSave: document.getElementById("planner-note-save"),
  plannerNoteCancel: document.getElementById("planner-note-cancel"),
  printReport: document.getElementById("print-report"),
  routeCacheStatus: document.getElementById("route-cache-status"),
  importRouteCacheInput: document.getElementById("import-route-cache-input"),
  routeBuilderApiKey: document.getElementById("route-builder-api-key"),
  routeBuilderCalc: document.getElementById("route-builder-calc"),
  routeBuilderExportCsv: document.getElementById("route-builder-export-csv"),
  routeBuilderExportJson: document.getElementById("route-builder-export-json"),
  routeBuilderUseSession: document.getElementById("route-builder-use-session"),
  routeBuilderStatus: document.getElementById("route-builder-status"),
  accommodationLat: document.getElementById("accommodation-lat"),
  accommodationLng: document.getElementById("accommodation-lng"),
  accommodationSave: document.getElementById("accommodation-save"),
  accommodationClear: document.getElementById("accommodation-clear"),
  accommodationStatus: document.getElementById("accommodation-status"),
  dayVerificationPanel: document.getElementById("day-verification-panel"),
  dayVerificationTabs: document.getElementById("day-verification-tabs"),
  dayVerificationBody: document.getElementById("day-verification-body"),
  dayVerificationStatus: document.getElementById("day-verification-status"),
  dayVerificationSave: document.getElementById("day-verification-save"),
  dayVerificationEdit: document.getElementById("day-verification-edit"),

  exportJson: document.getElementById("export-json"),
  uploadToApi: document.getElementById("upload-to-api"),
  syncStatusBadge: document.getElementById("sync-status-badge"),
  syncStatusMessage: document.getElementById("sync-status-message"),
  floatingSyncWarning: document.getElementById("floating-sync-warning"),
  floatingSyncWarningTitle: document.getElementById("floating-sync-warning-title"),
  floatingSyncWarningMessage: document.getElementById("floating-sync-warning-message"),
  apiJwtToken: document.getElementById("api-jwt-token"),
  importJsonInput: document.getElementById("import-json-input")
};

let googleMapsSdkPromise = null;
let googleMapsSdkLoadedKey = "";
const ROUTE_BUILDER_MAX_CONCURRENCY = 4;
let routeCacheDbPromise = null;

bindEvents();
initializeSyncState();
renderRouteCacheStatus();
renderRouteBuilderStatus();
uiState.mainView = "city-setup";
renderAll();
bootstrapRouteCachePersistence();
if (EDIT_MODE) {
  loadEditDocumentIfNeeded();
} else {
  tryAutoLoadDocument();
}

function bindEvents() {
  if (el.cityTabs) {
    el.cityTabs.addEventListener("click", onCityTabClick);
  }
  if (el.mainSetupButton) {
    el.mainSetupButton.addEventListener("click", onMainViewTabClick);
  }
  if (el.cityAdd) {
    el.cityAdd.addEventListener("click", onAddCity);
  }
  if (el.cityRename) {
    el.cityRename.addEventListener("click", onRenameCity);
  }
  if (el.cityDelete) {
    el.cityDelete.addEventListener("click", onDeleteCity);
  }
  if (el.cityCreateForm) {
    el.cityCreateForm.addEventListener("submit", onCreateFirstCity);
  }
  if (el.citySetupProgress) {
    el.citySetupProgress.addEventListener("click", onCitySetupProgressClick);
  }
  el.schoolsFileInput.addEventListener("change", onSchoolsFileImport);
  if (el.schoolEditForm) {
    el.schoolEditForm.addEventListener("submit", onSchoolEditSubmit);
  }
  if (el.schoolEditCancel) {
    el.schoolEditCancel.addEventListener("click", closeSchoolEditor);
  }
  el.schoolsListToggle.addEventListener("click", onSchoolsListToggle);
  el.mainViewTabs.addEventListener("click", onMainViewTabClick);

  document.querySelectorAll(".sort-btn").forEach((button) => {
    button.dataset.label = button.textContent;
    button.addEventListener("click", onSchoolSortClick);
  });

  el.researcherForm.addEventListener("submit", onResearcherSubmit);
  el.researcherCancel.addEventListener("click", resetResearcherForm);
  el.researcherAvailabilityMode.addEventListener("change", onResearcherAvailabilityModeChange);
  el.researcherAvailabilityDays.addEventListener("change", onResearcherAvailabilityDaysChange);

  el.dayPlanForm.addEventListener("submit", onDayPlanSubmit);

  el.plannerDayTabs.addEventListener("click", onPlannerDayTabClick);
  el.plannerSave.addEventListener("click", onPlannerSave);
  el.plannerEdit.addEventListener("click", onPlannerEdit);
  el.plannerPrint.addEventListener("click", onPlannerPrint);

  el.plannerRowsBody.addEventListener("input", onPlannerRowFieldChange);
  el.plannerRowsBody.addEventListener("change", onPlannerRowFieldChange);
  el.plannerRowsBody.addEventListener("click", onPlannerRowClick);
  el.plannerNoteSave.addEventListener("click", onPlannerNoteSave);
  el.plannerNoteCancel.addEventListener("click", closePlannerNoteEditor);

  el.importRouteCacheInput.addEventListener("change", onImportRouteCache);
  el.routeBuilderCalc.addEventListener("click", onRouteBuilderCalculate);
  el.accommodationSave.addEventListener("click", onAccommodationSave);
  el.accommodationClear.addEventListener("click", onAccommodationClear);
  el.routeBuilderExportCsv.addEventListener("click", onRouteBuilderExportCsv);
  el.routeBuilderExportJson.addEventListener("click", onRouteBuilderExportJson);
  el.routeBuilderUseSession.addEventListener("click", onRouteBuilderUseInSession);
  el.dayVerificationSave.addEventListener("click", onDayVerificationSave);
  el.dayVerificationEdit.addEventListener("click", onDayVerificationEdit);
  el.dayVerificationTabs.addEventListener("click", onDayVerificationTabClick);
  el.dayVerificationBody.addEventListener("change", onDayVerificationChange);
  el.exportJson.addEventListener("click", onExportJson);
  el.uploadToApi.addEventListener("click", onUploadToApi);
  if (el.apiJwtToken) {
    el.apiJwtToken.value = localStorage.getItem("api_jwt_token") || "";
    el.apiJwtToken.addEventListener("change", () => localStorage.setItem("api_jwt_token", el.apiJwtToken.value.trim()));
  }
  el.importJsonInput.addEventListener("change", onImportJson);
  if (el.progressModeToggle) {
    el.progressModeToggle.addEventListener("click", onProgressModeToggle);
  }
  if (el.progressVisibilityToggle) {
    el.progressVisibilityToggle.addEventListener("click", onProgressVisibilityToggle);
  }
  window.addEventListener("beforeunload", onBeforeUnload);
  window.onbeforeunload = onBeforeUnload;
}

function getSessionIdFromUrl() {
  const editMatch = window.location.pathname.match(/^\/edit\/([^/]+)$/);
  if (editMatch) {
    return `edit_${editMatch[1]}`;
  }
  return `session_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 8)}`;
}

function resolveApiBaseUrl() {
  const location = window.location;
  if (!location) {
    return "http://localhost:5000";
  }

  const protocol = String(location.protocol || "").toLowerCase();
  if (protocol === "file:") {
    return "http://localhost:5000";
  }

  const hostname = location.hostname || "localhost";
  const port = String(location.port || "");
  const derivedPort = port === "8080" ? "5000" : port;
  const isDefaultPort = (location.protocol === "http:" && derivedPort === "80")
    || (location.protocol === "https:" && derivedPort === "443");
  const hostWithPort = isDefaultPort || !derivedPort
    ? hostname
    : `${hostname}:${derivedPort}`;

  return `${location.protocol}//${hostWithPort}`;
}

function initializeSyncState() {
  syncState.hasUnsyncedChanges = false;
  syncState.hasUploadedDocument = false;
  syncState.hasUserChanges = false;
  syncState.uploadState = "idle";
  syncState.lastError = "";
}

function buildUploadPayload() {
  return {
    schemaVersion: state.schemaVersion,
    selectedCityId: state.selectedCityId,
    cities: state.cities
  };
}

function noteDocumentMutation() {
  if (syncState.uploadState !== "uploading") {
    syncState.uploadState = "idle";
  }
  syncState.lastError = "";
  syncState.hasUserChanges = true;
  syncState.hasUnsyncedChanges = true;
  renderSyncStatus();
}

function markCurrentStateAsUploaded() {
  syncState.uploadState = "synced";
  syncState.lastError = "";
  syncState.hasUnsyncedChanges = false;
  syncState.hasUploadedDocument = true;
  syncState.hasUserChanges = false;
  renderSyncStatus();
}

function setCurrentStateAsBaseline() {
  syncState.hasUnsyncedChanges = false;
  syncState.hasUserChanges = false;
  if (syncState.uploadState !== "failed") {
    syncState.uploadState = "idle";
  }
  renderSyncStatus();
}

function renderSyncStatus() {
  if (!el.syncStatusBadge || !el.syncStatusMessage || !el.uploadToApi) {
    return;
  }

  const badge = el.syncStatusBadge;
  const message = el.syncStatusMessage;
  const floatingWarning = el.floatingSyncWarning;
  const floatingTitle = el.floatingSyncWarningTitle;
  badge.classList.remove("is-synced", "is-unsynced", "is-uploading", "is-failed");

  if (floatingWarning) {
    floatingWarning.hidden = true;
  }

  if (syncState.uploadState === "uploading") {
    badge.textContent = "Uploading";
    badge.classList.add("is-uploading");
    message.textContent = EDIT_MODE
      ? "Updating the shared document..."
      : "Uploading the current document to the API...";
    el.uploadToApi.disabled = true;
    return;
  }

  el.uploadToApi.disabled = false;

  if (syncState.uploadState === "failed") {
    badge.textContent = "Upload Failed";
    badge.classList.add("is-failed");
    message.textContent = syncState.lastError || (syncState.hasUnsyncedChanges
      ? "Upload failed. Your local changes are still not uploaded."
      : "Upload failed.");
    if (floatingWarning && floatingTitle) {
      floatingWarning.hidden = false;
      floatingTitle.textContent = "Unsynced changes";
    }
    return;
  }

  if (syncState.hasUserChanges && syncState.hasUnsyncedChanges) {
    badge.textContent = "Unsynced";
    badge.classList.add("is-unsynced");
    message.textContent = syncState.hasUploadedDocument
      ? "You have changes that are not uploaded to the API."
      : "You have local changes that are not uploaded yet.";
    if (floatingWarning && floatingTitle) {
      floatingWarning.hidden = false;
      floatingTitle.textContent = "Unsynced changes";
    }
    return;
  }

  if (syncState.hasUploadedDocument) {
    badge.textContent = "Synced";
    badge.classList.add("is-synced");
    message.textContent = "All changes are uploaded to the API.";
    return;
  }

  badge.textContent = "Local";
  message.textContent = "No upload yet.";
}

function onBeforeUnload(event) {
  if (!(syncState.hasUserChanges && syncState.hasUnsyncedChanges)) {
    return undefined;
  }
  const warning = "You have unsynced changes.";
  event.preventDefault();
  event.returnValue = warning;
  return warning;
}

function createEmptyCity(name) {
  return {
    id: generateId("city"),
    name: String(name || "").trim(),
    createdAt: new Date().toISOString(),
    schools: [],
    researchers: [],
    dayPlans: [],
    researcherAssignments: [],
    dayVerifications: [],
    routeCache: [],
    manualFollowUpWarnings: [],
    accommodationLatitude: null,
    accommodationLongitude: null
  };
}

function ensureSelectedCity() {
  if (!Array.isArray(state.cities) || !state.cities.length) {
    state.selectedCityId = "";
    return null;
  }
  const existing = state.cities.find((city) => city.id === state.selectedCityId);
  if (existing) {
    return existing;
  }
  state.selectedCityId = state.cities[0].id;
  return state.cities[0];
}

function getCurrentCity() {
  return ensureSelectedCity();
}

function requireCurrentCity() {
  const city = getCurrentCity();
  if (!city) {
    throw new Error("No city selected.");
  }
  return city;
}

function updateCurrentCity(mutator) {
  const city = requireCurrentCity();
  mutator(city);
  return city;
}

function getPlannerDraftCacheKey(dayId, cityId = "") {
  const resolvedCityId = cityId || getCurrentCity()?.id || "no-city";
  return `${resolvedCityId}::${dayId}`;
}

function initializeStateProxies(target) {
  const proxiedKeys = ["schools", "researchers", "dayPlans", "researcherAssignments", "routeCache", "dayVerifications", "manualFollowUpWarnings"];
  proxiedKeys.forEach((key) => {
    if (Object.getOwnPropertyDescriptor(target, key)) {
      return;
    }
    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: false,
      get() {
        const city = getCurrentCity();
        return city ? city[key] : [];
      },
      set(value) {
        const city = getCurrentCity();
        if (!city) {
          return;
        }
        city[key] = Array.isArray(value) ? value : [];
      }
    });
  });
}

function createFollowUpWarning(kind, title, message, location, resolutionKey, relatedEntityType = "", relatedEntityId = "") {
  return {
    id: generateId("warning"),
    kind: String(kind || "").trim(),
    title: String(title || "").trim(),
    message: String(message || "").trim(),
    location: String(location || "").trim(),
    relatedEntityType: String(relatedEntityType || "").trim(),
    relatedEntityId: String(relatedEntityId || "").trim(),
    resolutionKey: String(resolutionKey || "").trim(),
    createdAt: new Date().toISOString()
  };
}

function getActiveFollowUpWarnings() {
  return Array.isArray(state.manualFollowUpWarnings) ? state.manualFollowUpWarnings : [];
}

function upsertFollowUpWarning(warning) {
  if (!warning || !warning.resolutionKey) {
    return null;
  }
  const list = getActiveFollowUpWarnings();
  const existingIndex = list.findIndex((item) => item.resolutionKey === warning.resolutionKey && item.location === warning.location);
  const next = {
    id: existingIndex >= 0 ? list[existingIndex].id : (warning.id || generateId("warning")),
    kind: String(warning.kind || "").trim(),
    title: String(warning.title || "").trim(),
    message: String(warning.message || "").trim(),
    location: String(warning.location || "").trim(),
    relatedEntityType: String(warning.relatedEntityType || "").trim(),
    relatedEntityId: String(warning.relatedEntityId || "").trim(),
    resolutionKey: String(warning.resolutionKey || "").trim(),
    createdAt: existingIndex >= 0 ? list[existingIndex].createdAt : (warning.createdAt || new Date().toISOString())
  };
  if (existingIndex >= 0) {
    list[existingIndex] = next;
  } else {
    list.push(next);
  }
  state.manualFollowUpWarnings = [...list];
  return next;
}

function getFollowUpWarningsForLocation(location) {
  return getActiveFollowUpWarnings().filter((item) => item.location === location);
}

function hasRouteCoverageForSchool(schoolId) {
  if (!schoolId) {
    return false;
  }
  return state.routeCache.some((item) => item.fromSchoolId === schoolId || item.toSchoolId === schoolId);
}

function hasOrphanedSchoolReferences(schoolId) {
  if (!schoolId) {
    return false;
  }
  const assignmentRefs = state.researcherAssignments.some((item) => {
    const extraPrimaryRows = Array.isArray(item.extraPrimaryRows) ? item.extraPrimaryRows : [];
    const extraSecondaryRows = Array.isArray(item.extraSecondaryRows) ? item.extraSecondaryRows : [];
    return (
      item.primarySchoolId === schoolId ||
      item.secondarySchoolId === schoolId ||
      extraPrimaryRows.some((row) => row.schoolId === schoolId) ||
      extraSecondaryRows.some((row) => row.schoolId === schoolId)
    );
  });
  if (assignmentRefs) {
    return true;
  }
  return state.dayVerifications.some((item) => item.schoolId === schoolId);
}

function isFollowUpWarningResolved(warning) {
  if (!warning) {
    return true;
  }
  if (warning.kind === "route-cache-stale-school") {
    return hasRouteCoverageForSchool(warning.relatedEntityId);
  }
  if (warning.kind === "manual-status-school") {
    const school = state.schools.find((item) => item.id === warning.relatedEntityId);
    return !school || !normalizeManualSchoolStatus(school.manualStatus || "");
  }
  if (warning.kind === "deleted-school-review") {
    return !hasOrphanedSchoolReferences(warning.relatedEntityId);
  }
  if (warning.kind === "day-verification-pending") {
    const dayPlan = state.dayPlans.find((item) => item.id === warning.relatedEntityId);
    return !dayPlan || !dayPlan.locked || Boolean(dayPlan.verificationLocked);
  }
  return false;
}

function resolveFollowUpWarnings() {
  const current = getActiveFollowUpWarnings();
  state.dayPlans.forEach((dayPlan) => {
    if (dayPlan?.locked && !dayPlan?.verificationLocked) {
      upsertFollowUpWarning(createFollowUpWarning(
        "day-verification-pending",
        "Day Verification Pending",
        `The locked day ${formatDate(dayPlan.date)} still needs end-of-day verification.`,
        "operations",
        `day-verification-needed:day:${dayPlan.id}`,
        "dayPlan",
        dayPlan.id
      ));
    }
  });
  const refreshed = getActiveFollowUpWarnings();
  const next = refreshed.filter((warning) => !isFollowUpWarningResolved(warning));
  if (next.length !== refreshed.length || next.length !== current.length) {
    state.manualFollowUpWarnings = next;
  }
}

function renderFollowUpPanel(location, node, localWarnings = []) {
  if (!node) {
    return;
  }
  const persistent = getFollowUpWarningsForLocation(location);
  const rows = [...persistent, ...(Array.isArray(localWarnings) ? localWarnings : [])];
  if (!rows.length) {
    node.hidden = true;
    node.innerHTML = "";
    return;
  }
  node.hidden = false;
  node.innerHTML = rows.map((item) => `
    <div class="follow-up-warning">
      <div class="follow-up-warning-title">${escapeHtml(item.title || "Manual Follow-Up")}</div>
      <div class="follow-up-warning-message">${escapeHtml(item.message || "")}</div>
    </div>
  `).join("");
}

function openRouteCacheDb() {
  if (routeCacheDbPromise) {
    return routeCacheDbPromise;
  }

  routeCacheDbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(ROUTE_CACHE_DB_NAME, ROUTE_CACHE_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ROUTE_CACHE_STORE)) {
        const store = db.createObjectStore(ROUTE_CACHE_STORE, { keyPath: "id" });
        store.createIndex("sessionId", "sessionId", { unique: false });
        store.createIndex("sessionCityId", "sessionCityId", { unique: false });
      } else {
        const tx = request.transaction;
        const store = tx.objectStore(ROUTE_CACHE_STORE);
        if (!store.indexNames.contains("sessionId")) {
          store.createIndex("sessionId", "sessionId", { unique: false });
        }
        if (!store.indexNames.contains("sessionCityId")) {
          store.createIndex("sessionCityId", "sessionCityId", { unique: false });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open route cache database."));
  });

  return routeCacheDbPromise;
}

function runStoreRequest(mode, executor) {
  return openRouteCacheDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(ROUTE_CACHE_STORE, mode);
    const store = tx.objectStore(ROUTE_CACHE_STORE);
    let request;
    try {
      request = executor(store);
    } catch (error) {
      reject(error);
      return;
    }
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed."));
  }));
}

function getRouteCacheEntryId(cityId, fromSchoolId, toSchoolId) {
  return `${SESSION_ID}::${cityId}::${fromSchoolId}::${toSchoolId}`;
}

async function getRouteCacheForCityFromDb(cityId) {
  if (!cityId) {
    return [];
  }
  const db = await openRouteCacheDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ROUTE_CACHE_STORE, "readonly");
    const store = tx.objectStore(ROUTE_CACHE_STORE);
    const index = store.index("sessionCityId");
    const request = index.getAll(IDBKeyRange.only(`${SESSION_ID}::${cityId}`));
    request.onsuccess = () => {
      const rows = Array.isArray(request.result) ? request.result : [];
      resolve(rows.map((row) => ({
        id: row.id || generateId("route"),
        fromSchoolId: row.fromSchoolId,
        toSchoolId: row.toSchoolId,
        mode: "driving",
        trafficModel: "best_guess",
        durationMinutes: row.durationMinutes ?? null,
        distanceKm: row.distanceKm ?? null,
        status: row.status || "ok",
        fetchedAt: row.fetchedAt || "",
        provider: row.provider || "google"
      })));
    };
    request.onerror = () => reject(request.error || new Error("Could not read route cache from database."));
  });
}

async function getLegacyRouteCacheForSessionFromDb() {
  const db = await openRouteCacheDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ROUTE_CACHE_STORE, "readonly");
    const store = tx.objectStore(ROUTE_CACHE_STORE);
    const index = store.index("sessionId");
    const request = index.getAll(IDBKeyRange.only(SESSION_ID));
    request.onsuccess = () => {
      const rows = Array.isArray(request.result) ? request.result : [];
      resolve(rows
        .filter((row) => !row.cityId)
        .map((row) => ({
          id: row.id || generateId("route"),
          fromSchoolId: row.fromSchoolId,
          toSchoolId: row.toSchoolId,
          mode: "driving",
          trafficModel: "best_guess",
          durationMinutes: row.durationMinutes ?? null,
          distanceKm: row.distanceKm ?? null,
          status: row.status || "ok",
          fetchedAt: row.fetchedAt || "",
          provider: row.provider || "google"
        })));
    };
    request.onerror = () => reject(request.error || new Error("Could not read legacy route cache from database."));
  });
}

async function replaceRouteCacheForCityInDb(cityId, entries) {
  if (!cityId) {
    return;
  }
  const db = await openRouteCacheDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(ROUTE_CACHE_STORE, "readwrite");
    const store = tx.objectStore(ROUTE_CACHE_STORE);
    const index = store.index("sessionCityId");
    const getRequest = index.getAllKeys(IDBKeyRange.only(`${SESSION_ID}::${cityId}`));
    getRequest.onsuccess = () => {
      const keys = Array.isArray(getRequest.result) ? getRequest.result : [];
      keys.forEach((key) => store.delete(key));
      (Array.isArray(entries) ? entries : []).forEach((entry) => {
        if (!entry.fromSchoolId || !entry.toSchoolId) {
          return;
        }
        store.put({
          id: getRouteCacheEntryId(cityId, entry.fromSchoolId, entry.toSchoolId),
          sessionId: SESSION_ID,
          cityId,
          sessionCityId: `${SESSION_ID}::${cityId}`,
          fromSchoolId: entry.fromSchoolId,
          toSchoolId: entry.toSchoolId,
          durationMinutes: entry.durationMinutes ?? null,
          distanceKm: entry.distanceKm ?? null,
          status: entry.status || "ok",
          fetchedAt: entry.fetchedAt || "",
          provider: entry.provider || "google"
        });
      });
    };
    getRequest.onerror = () => reject(getRequest.error || new Error("Could not clear route cache for city."));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Could not replace route cache entries."));
    tx.onabort = () => reject(tx.error || new Error("Route cache transaction aborted."));
  });
}

async function removeSchoolRouteCacheForCurrentCity(schoolId) {
  const cityId = getCurrentCity()?.id || "";
  if (!schoolId || !cityId) {
    return;
  }
  const db = await openRouteCacheDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(ROUTE_CACHE_STORE, "readwrite");
    const store = tx.objectStore(ROUTE_CACHE_STORE);
    const index = store.index("sessionCityId");
    const request = index.getAllKeys(IDBKeyRange.only(`${SESSION_ID}::${cityId}`));
    request.onsuccess = () => {
      const keys = Array.isArray(request.result) ? request.result : [];
      keys.forEach((key) => {
        const parts = String(key).split("::");
        const fromId = parts[2] || "";
        const toId = parts[3] || "";
        if (fromId === schoolId || toId === schoolId) {
          store.delete(key);
        }
      });
    };
    request.onerror = () => reject(request.error || new Error("Could not query route cache keys."));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Could not delete school routes."));
    tx.onabort = () => reject(tx.error || new Error("Delete school routes transaction aborted."));
  });
}

async function removeRouteCacheForCityFromDb(cityId) {
  if (!cityId) {
    return;
  }
  const db = await openRouteCacheDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(ROUTE_CACHE_STORE, "readwrite");
    const store = tx.objectStore(ROUTE_CACHE_STORE);
    const index = store.index("sessionCityId");
    const request = index.getAllKeys(IDBKeyRange.only(`${SESSION_ID}::${cityId}`));
    request.onsuccess = () => {
      const keys = Array.isArray(request.result) ? request.result : [];
      keys.forEach((key) => store.delete(key));
    };
    request.onerror = () => reject(request.error || new Error("Could not query route cache keys."));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Could not delete city routes."));
    tx.onabort = () => reject(tx.error || new Error("Delete city routes transaction aborted."));
  });
}

async function removeAllRouteCacheForSessionFromDb() {
  const db = await openRouteCacheDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(ROUTE_CACHE_STORE, "readwrite");
    const store = tx.objectStore(ROUTE_CACHE_STORE);
    const index = store.index("sessionId");
    const request = index.getAllKeys(IDBKeyRange.only(SESSION_ID));
    request.onsuccess = () => {
      const keys = Array.isArray(request.result) ? request.result : [];
      keys.forEach((key) => store.delete(key));
    };
    request.onerror = () => reject(request.error || new Error("Could not query route cache keys."));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Could not delete session routes."));
    tx.onabort = () => reject(tx.error || new Error("Delete session routes transaction aborted."));
  });
}

async function bootstrapRouteCachePersistence() {
  try {
    for (const city of state.cities || []) {
      const persistedRows = await getRouteCacheForCityFromDb(city.id);
      if (persistedRows.length) {
        city.routeCache = persistedRows;
        continue;
      }
      if ((state.cities || []).length === 1) {
        const legacyRows = await getLegacyRouteCacheForSessionFromDb();
        if (legacyRows.length) {
          city.routeCache = legacyRows;
          await replaceRouteCacheForCityInDb(city.id, legacyRows);
          continue;
        }
      }
      if (Array.isArray(city.routeCache) && city.routeCache.length) {
        await replaceRouteCacheForCityInDb(city.id, city.routeCache);
      }
    }
    setCurrentStateAsBaseline();
    renderRouteCacheStatus();
  } catch (error) {
    console.error("Route cache database bootstrap failed", error);
  }
}

function renderRouteCacheStatus(message = "") {
  if (!el.routeCacheStatus) {
    return;
  }
  if (message) {
    el.routeCacheStatus.textContent = message;
    return;
  }
  const count = Array.isArray(state.routeCache) ? state.routeCache.length : 0;
  el.routeCacheStatus.textContent = count > 0
    ? `Route cache loaded: ${count} school pair(s).`
    : "No route cache imported yet for this session.";
}

function renderRouteBuilderStatus(message = "", tone = "") {
  if (!el.routeBuilderStatus) {
    return;
  }
  const builder = uiState.routeBuilder;
  const loadedSchools = getRouteBuilderSchoolsFromState();
  const schoolsWithCoordinates = loadedSchools.filter((school) => hasValidCoordinates(school));
  const fallback = builder.entries.length
    ? `Route build ready. ${builder.entries.length} pair(s) available for export.`
    : loadedSchools.length
      ? `${schoolsWithCoordinates.length}/${loadedSchools.length} school(s) have coordinates. Add latitude/longitude, then click "Calculate Distances".`
      : "Load schools in the Schools section first, then calculate distances.";
  el.routeBuilderStatus.textContent = message || fallback;
  el.routeBuilderStatus.classList.remove("is-running", "is-error", "is-success");
  if (tone === "running") {
    el.routeBuilderStatus.classList.add("is-running");
  } else if (tone === "error") {
    el.routeBuilderStatus.classList.add("is-error");
  } else if (tone === "success") {
    el.routeBuilderStatus.classList.add("is-success");
  }
  const hasEntries = builder.entries.length > 0;
  const disabled = builder.running;
  el.routeBuilderCalc.disabled = disabled || loadedSchools.length < 2;
  el.routeBuilderExportCsv.disabled = disabled || !hasEntries;
  el.routeBuilderExportJson.disabled = disabled || !hasEntries;
  el.routeBuilderUseSession.disabled = disabled || !hasEntries;
}

function renderSchoolsImportStatus(message = "", tone = "") {
  if (!el.schoolsImportStatus) {
    return;
  }
  const hasCity = Boolean(getCurrentCity());
  const fallback = hasCity
    ? "No school import yet for this city."
    : "Create or select a city, then import schools.";
  el.schoolsImportStatus.textContent = message || uiState.schoolsImportStatus.message || fallback;
  el.schoolsImportStatus.classList.remove("is-error", "is-success");
  const nextTone = tone || uiState.schoolsImportStatus.tone || "";
  if (nextTone === "error") {
    el.schoolsImportStatus.classList.add("is-error");
  } else if (nextTone === "success") {
    el.schoolsImportStatus.classList.add("is-success");
  }
}

function renderCitySetupProgress() {
  if (!el.citySetupProgress) {
    return;
  }
  const city = getCurrentCity();
  if (!city) {
    el.citySetupProgress.innerHTML = "";
    return;
  }

  const routeCacheCount = Array.isArray(city.routeCache) ? city.routeCache.length : 0;
  const steps = [
    {
      label: "Schools Imported",
      targetId: "setup-schools",
      done: city.schools.length > 0,
      pendingText: "Not yet done",
      doneText: `${city.schools.length} school(s)`
    },
    {
      label: "Accommodation",
      targetId: "setup-accommodation",
      done: Number.isFinite(parseOptionalNumber(city.accommodationLatitude)) && Number.isFinite(parseOptionalNumber(city.accommodationLongitude)),
      pendingText: "Not yet set",
      doneText: "Coordinates set"
    },
    {
      label: "Distance Cache",
      targetId: "panel-distance",
      done: routeCacheCount > 0,
      pendingText: "Not yet done",
      doneText: `${routeCacheCount} route(s)`
    },
    {
      label: "Working Days",
      targetId: "setup-days",
      done: city.dayPlans.length > 0,
      pendingText: "Not yet done",
      doneText: `${city.dayPlans.length} day(s)`
    },
    {
      label: "Researchers",
      targetId: "setup-researchers",
      done: city.researchers.length > 0,
      pendingText: "Not yet done",
      doneText: `${city.researchers.length} researcher(s)`
    }
  ];
  const firstPendingIndex = steps.findIndex((step) => !step.done);
  const activeIndex = firstPendingIndex >= 0 ? firstPendingIndex : Math.max(steps.length - 1, 0);

  el.citySetupProgress.innerHTML = steps
    .map((step, index) => {
      const statusClass = step.done ? "is-done" : "is-pending";
      const meta = step.done ? step.doneText : step.pendingText;
      const activeClass = index === activeIndex
        ? " is-active"
        : "";
      return `
        <div class="setup-progress-step ${statusClass}${activeClass}">
          <button
            type="button"
            class="setup-progress-step-button"
            data-target-id="${escapeHtml(step.targetId)}"
            title="Jump to ${escapeHtml(step.label)}"
          >
            <span class="setup-progress-icon" aria-hidden="true"></span>
            <span class="setup-progress-label">${escapeHtml(step.label)}</span>
            <span class="setup-progress-meta">${escapeHtml(meta)}</span>
          </button>
        </div>
      `;
    })
    .join("");
}

function onCitySetupProgressClick(event) {
  const button = event.target.closest("button[data-target-id]");
  if (!button) {
    return;
  }
  const targetId = String(button.dataset.targetId || "").trim();
  if (!targetId) {
    return;
  }
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function loadState() {
  return normalizeState({});
}

function normalizeState(parsed) {
  const safe = parsed && typeof parsed === "object" ? parsed : {};
  function normalizeCityWorkspace(rawCity, fallbackName = "City 1") {
    const citySafe = rawCity && typeof rawCity === "object" ? rawCity : {};
    const schools = Array.isArray(citySafe.schools) ? citySafe.schools : [];
    const researchers = Array.isArray(citySafe.researchers) ? citySafe.researchers : [];
    const legacyDays = Array.isArray(citySafe.days) ? citySafe.days : [];
    const dayPlans = Array.isArray(citySafe.dayPlans)
      ? citySafe.dayPlans
      : legacyDays.map((day) => ({
          id: day.id || generateId("day"),
          date: day.date || "",
          notes: day.notes || "",
          locked: false,
          verificationLocked: false
        }));
    const routeCache = Array.isArray(citySafe.routeCache) ? citySafe.routeCache : [];
    const dayVerifications = Array.isArray(citySafe.dayVerifications) ? citySafe.dayVerifications : [];
    const researcherAssignments = Array.isArray(citySafe.researcherAssignments) ? citySafe.researcherAssignments : [];
    const manualFollowUpWarnings = Array.isArray(citySafe.manualFollowUpWarnings) ? citySafe.manualFollowUpWarnings : [];
    const validDayIds = new Set(dayPlans.map((item) => String(item.id || "").trim()).filter(Boolean));

    return {
      id: citySafe.id || generateId("city"),
      name: String(citySafe.name || fallbackName).trim() || fallbackName,
      createdAt: String(citySafe.createdAt || "").trim() || new Date().toISOString(),
      schools: schools.map((school) => ({
        id: school.id || generateId("school"),
        name: String(school.name || "").trim(),
        district: String(school.district || "").trim(),
        schoolCode: String(school.schoolCode || school.school_id || school.kod || "").trim(),
        survey: String(school.survey || school.anket || "").trim(),
        manualStatus: normalizeManualSchoolStatus(school.manualStatus || school.statusOverride || ""),
        schoolType: String(school.schoolType || "").trim(),
        lectureDuration: String(school.lectureDuration || "").trim(),
        workingHours: String(school.workingHours || "").trim(),
        lunchBreak: String(school.lunchBreak || "").trim(),
        classroomCount: Number(school.classroomCount || 0),
        maxClassroomSize: school.maxClassroomSize === null || typeof school.maxClassroomSize === "undefined" || school.maxClassroomSize === ""
          ? null
          : Number(school.maxClassroomSize),
        classroomList: String(school.classroomList || "").trim(),
        notes: String(school.notes || "").trim(),
        addressLine: String(school.addressLine || "").trim(),
        latitude: parseOptionalNumber(school.latitude ?? school.lat ?? school.enlem),
        longitude: parseOptionalNumber(school.longitude ?? school.lng ?? school.lon ?? school.boylam),
        city: String(school.city || "").trim(),
        country: String(school.country || "").trim() || "TR"
      })),
      researchers: researchers.map((item) => ({
        id: item.id || generateId("researcher"),
        fullName: String(item.fullName || item.name || "").trim(),
        active: typeof item.active === "boolean" ? item.active : true,
        availabilityMode: item.availabilityMode === "custom" ? "custom" : "all",
        availableDayIds: Array.isArray(item.availableDayIds)
          ? [...new Set(item.availableDayIds.map((id) => String(id).trim()).filter((id) => validDayIds.has(id)))]
          : [],
        notes: String(item.notes || "").trim()
      })),
      dayPlans: dayPlans.map((item) => ({
        id: item.id || generateId("day"),
        date: String(item.date || "").trim(),
        notes: String(item.notes || "").trim(),
        locked: Boolean(item.locked),
        verificationLocked: Boolean(item.verificationLocked)
      })),
      researcherAssignments: researcherAssignments.map((item) => ({
        id: item.id || generateId("assignment"),
        dayId: String(item.dayId || "").trim(),
        researcherId: String(item.researcherId || "").trim(),
        primaryDistrict: String(item.primaryDistrict || "").trim(),
        primarySchoolId: item.primarySchoolId ? String(item.primarySchoolId).trim() : "",
        primaryClassrooms: Number(item.primaryClassrooms ?? 3),
        primarySarmal: typeof item.primarySarmal === "boolean" ? item.primarySarmal : Boolean(item.sarmal),
        secondaryDistrict: String(item.secondaryDistrict || "").trim(),
        secondarySchoolId: item.secondarySchoolId ? String(item.secondarySchoolId).trim() : "",
        secondaryClassrooms: Number(item.secondaryClassrooms ?? 1),
        secondarySarmal: typeof item.secondarySarmal === "boolean" ? item.secondarySarmal : Boolean(item.sarmal),
        extraPrimaryRows: Array.isArray(item.extraPrimaryRows)
          ? item.extraPrimaryRows.map((row) => ({
              id: row.id || generateId("slot"),
              district: String(row.district || "").trim(),
              schoolId: row.schoolId ? String(row.schoolId).trim() : "",
              classrooms: Number(row.classrooms ?? 1),
              sarmal: typeof row.sarmal === "boolean" ? row.sarmal : Boolean(item.sarmal)
            }))
          : (item.extraPrimarySchoolId
              ? [{
                  id: generateId("slot"),
                  district: String(item.extraPrimaryDistrict || "").trim(),
                  schoolId: String(item.extraPrimarySchoolId || "").trim(),
                  classrooms: Number(item.extraPrimaryClassrooms ?? 1),
                  sarmal: Boolean(item.sarmal)
                }]
              : []),
        extraSecondaryRows: Array.isArray(item.extraSecondaryRows)
          ? item.extraSecondaryRows.map((row) => ({
              id: row.id || generateId("slot"),
              district: String(row.district || "").trim(),
              schoolId: row.schoolId ? String(row.schoolId).trim() : "",
              classrooms: Number(row.classrooms ?? 1),
              sarmal: typeof row.sarmal === "boolean" ? row.sarmal : Boolean(item.sarmal)
            }))
          : (item.extraSecondarySchoolId
              ? [{
                  id: generateId("slot"),
                  district: String(item.extraSecondaryDistrict || "").trim(),
                  schoolId: String(item.extraSecondarySchoolId || "").trim(),
                  classrooms: Number(item.extraSecondaryClassrooms ?? 1),
                  sarmal: Boolean(item.sarmal)
                }]
              : []),
        overrideEnabled: Boolean(item.overrideEnabled),
        overrideReason: String(item.overrideReason || "").trim(),
        notes: String(item.notes || "").trim()
      })),
      routeCache: routeCache.map((item) => ({
        id: item.id || generateId("route"),
        fromSchoolId: String(item.fromSchoolId || "").trim(),
        toSchoolId: String(item.toSchoolId || "").trim(),
        mode: "driving",
        trafficModel: "best_guess",
        durationMinutes: item.durationMinutes === null || typeof item.durationMinutes === "undefined" ? null : Number(item.durationMinutes),
        distanceKm: item.distanceKm === null || typeof item.distanceKm === "undefined" ? null : Number(item.distanceKm),
        status: item.status === "ok" || item.status === "not_found" ? item.status : "error",
        fetchedAt: String(item.fetchedAt || ""),
        provider: "google"
      })).filter((item) => item.fromSchoolId && item.toSchoolId),
      dayVerifications: dayVerifications.map((item) => ({
        id: item.id || generateId("verify"),
        dayId: String(item.dayId || "").trim(),
        schoolId: String(item.schoolId || "").trim(),
        outcome: String(item.outcome || "").trim() === "incomplete" ? "incomplete" : "completed",
        remainingClassrooms: Number.isFinite(Number(item.remainingClassrooms))
          ? Number(item.remainingClassrooms)
          : null,
        remainingClassroomLabels: Array.isArray(item.remainingClassroomLabels)
          ? [...new Set(item.remainingClassroomLabels.map((value) => String(value || "").trim()).filter(Boolean))]
          : [],
        remainingNote: String(item.remainingNote || "").trim(),
        updatedAt: String(item.updatedAt || "").trim() || new Date().toISOString()
      })).filter((item) => item.dayId && item.schoolId),
      manualFollowUpWarnings: manualFollowUpWarnings
        .map((item) => ({
          id: item.id || generateId("warning"),
          kind: String(item.kind || "").trim(),
          title: String(item.title || "").trim(),
          message: String(item.message || "").trim(),
          location: String(item.location || "").trim(),
          relatedEntityType: String(item.relatedEntityType || "").trim(),
          relatedEntityId: String(item.relatedEntityId || "").trim(),
          resolutionKey: String(item.resolutionKey || "").trim(),
          createdAt: String(item.createdAt || "").trim() || new Date().toISOString()
        }))
        .filter((item) => item.title && item.message && item.location && item.resolutionKey),
      accommodationLatitude: parseOptionalNumber(citySafe.accommodationLatitude),
      accommodationLongitude: parseOptionalNumber(citySafe.accommodationLongitude)
    };
  }

  const hasCities = Array.isArray(safe.cities);
  const cities = hasCities
    ? safe.cities.map((city, index) => normalizeCityWorkspace(city, `City ${index + 1}`))
    : [normalizeCityWorkspace(safe, "City 1")].filter((city) => {
        return city.schools.length || city.researchers.length || city.dayPlans.length || city.researcherAssignments.length || city.dayVerifications.length || city.routeCache.length || city.manualFollowUpWarnings.length;
      });

  const selectedCityId = String(safe.selectedCityId || "").trim();
  const validSelectedCityId = cities.some((city) => city.id === selectedCityId)
    ? selectedCityId
    : (cities[0]?.id || "");

  return {
    schemaVersion: SCHEMA_VERSION,
    selectedCityId: validSelectedCityId,
    cities
  };
}

function replaceState(nextState) {
  state.schemaVersion = nextState.schemaVersion;
  state.selectedCityId = nextState.selectedCityId || "";
  state.cities = Array.isArray(nextState.cities) ? nextState.cities : [];
}

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function renderAll() {
  ensureSelectedCity();
  resolveFollowUpWarnings();
  ensureOperationsLayoutOrder();
  renderCityWorkspaceBar();
  renderSyncStatus();
  applyMainViewVisibility();
  renderProgressVisibility();
  renderSchoolsListVisibility();
  renderSchoolsImportStatus();
  renderCitySetupProgress();
  renderFollowUpPanel("city-setup", el.citySetupWarningPanel);
  renderFollowUpPanel("operations", el.operationsWarningPanel);
  renderFollowUpPanel("school-edit", el.schoolEditWarningPanel, uiState.schoolEditLocalWarnings);
  renderRouteCacheStatus();
  renderRouteBuilderStatus();
  renderAccommodationStatus();
  renderSchools();
  renderDistrictProgress();
  renderResearcherAvailabilityOptions();
  renderResearchers();
  renderDayPlans();
  ensureSelectedDay();
  renderPlannerDayTabs();
  renderPlanner();
}

function renderCityWorkspaceBar() {
  const hasCities = Array.isArray(state.cities) && state.cities.length > 0;
  if (el.mainViewTabs) {
    el.mainViewTabs.hidden = !hasCities;
  }
  if (el.cityWorkspaceBar) {
    el.cityWorkspaceBar.hidden = !hasCities;
  }
  if (!el.cityTabs) {
    return;
  }
  if (!hasCities) {
    el.cityTabs.innerHTML = "";
    if (el.cityRename) {
      el.cityRename.disabled = true;
    }
    if (el.cityDelete) {
      el.cityDelete.disabled = true;
    }
    return;
  }

  el.cityTabs.innerHTML = state.cities
    .map((city) => {
      const activeClass = city.id === state.selectedCityId ? "sheet-tab active" : "sheet-tab";
      return `<button class="${activeClass}" type="button" data-city-id="${city.id}">${escapeHtml(city.name)}</button>`;
    })
    .join("");

  if (el.cityRename) {
    el.cityRename.disabled = false;
  }
  if (el.cityDelete) {
    el.cityDelete.disabled = false;
  }
}

function resetCityScopedUiForSwitch() {
  closePlannerNoteEditor();
  uiState.selectedDayId = "";
  uiState.selectedVerificationDayId = "";
  uiState.verificationDraft = {};
  uiState.plannerDraft = null;
  uiState.plannerDirty = false;
  uiState.lastValidation = null;
  uiState.routeInsights = null;
}

function onCityTabClick(event) {
  const button = event.target.closest("button[data-city-id]");
  if (!button) {
    return;
  }
  const cityId = String(button.dataset.cityId || "").trim();
  if (!cityId) {
    return;
  }
  if (cityId === state.selectedCityId && uiState.mainView === "city-setup") {
    return;
  }
  persistCurrentPlannerDraft();
  state.selectedCityId = cityId;
  uiState.mainView = "city-setup";
  resetCityScopedUiForSwitch();
  renderAll();
}

function onAddCity() {
  const rawName = prompt("Enter city name:");
  if (rawName === null) {
    return;
  }
  const name = String(rawName || "").trim();
  if (!name) {
    alert("City name is required.");
    return;
  }
  const city = createEmptyCity(name);
  state.cities.push(city);
  state.selectedCityId = city.id;
  uiState.mainView = "city-setup";
  resetCityScopedUiForSwitch();
  noteDocumentMutation();
  renderAll();
}

function onRenameCity(){
  const city = getCurrentCity();
  if (!city) {
    return;
  }
  const rawName = prompt("Rename city:", city.name);
  if (rawName === null) {
    return;
  }
  const name = String(rawName || "").trim();
  if (!name) {
    alert("City name is required.");
    return;
  }
  city.name = name;
  noteDocumentMutation();
  renderAll();
}

async function onDeleteCity(){
  const city = getCurrentCity();
  if (!city) {
    return;
  }
  if (!confirm(`Delete city "${city.name}" and all its data?`)) {
    return;
  }
  await removeRouteCacheForCityFromDb(city.id);
  const currentIndex = state.cities.findIndex((item) => item.id === city.id);
  state.cities = state.cities.filter((item) => item.id !== city.id);
  if (!state.cities.length) {
    state.selectedCityId = "";
    uiState.mainView = "main-setup";
  } else {
    const fallbackCity = state.cities[currentIndex] || state.cities[currentIndex - 1] || state.cities[0];
    state.selectedCityId = fallbackCity.id;
    if (uiState.mainView === "operations" && !fallbackCity.schools.length) {
      uiState.mainView = "city-setup";
    }
  }
  resetCityScopedUiForSwitch();
  noteDocumentMutation();
  renderAll();
}

async function onCreateFirstCity(event) {
  event.preventDefault();
  const name = String(el.cityCreateName?.value || "").trim();
  if (!name) {
    alert("City name is required.");
    return;
  }
  const duplicateExists = (state.cities || []).some((city) => normalizeLookup(city.name) === normalizeLookup(name));
  if (duplicateExists) {
    alert("A city with this name already exists.");
    return;
  }
  const city = createEmptyCity(name);
  state.cities = [...(state.cities || []), city];
  state.selectedCityId = city.id;
  uiState.mainView = "city-setup";
  try {
    const file = el.cityCreateFile?.files?.[0];
    if (file) {
      const rows = await readRowsFromImportFile(file);
      const result = importSchoolsFromRows(rows);
      if (result) {
        uiState.schoolsImportStatus = {
          message: buildSchoolImportSummary(result, getCurrentCity()?.name || "current city"),
          tone: "success"
        };
        renderSchoolsImportStatus();
      }
    } else {
      renderAll();
    }
    if (el.cityCreateName) {
      el.cityCreateName.value = "";
    }
    if (el.cityCreateFile) {
      el.cityCreateFile.value = "";
    }
    resetCityScopedUiForSwitch();
    noteDocumentMutation();
    renderAll();
  } catch (error) {
    console.error(error);
    uiState.schoolsImportStatus = {
      message: error.message || "Could not create city.",
      tone: "error"
    };
    noteDocumentMutation();
    renderAll();
    renderSchoolsImportStatus();
    alert(error.message || "Could not create city.");
  }
}

function onProgressVisibilityToggle() {
  uiState.progressExpanded = !uiState.progressExpanded;
  renderProgressVisibility();
}

function renderProgressVisibility() {
  if (el.progressTableWrap) {
    el.progressTableWrap.hidden = !uiState.progressExpanded;
  }
  if (el.progressVisibilityToggle) {
    el.progressVisibilityToggle.textContent = uiState.progressExpanded ? "Hide Statistics" : "Show Statistics";
  }
  if (el.progressModeToggle) {
    el.progressModeToggle.disabled = !uiState.progressExpanded;
  }
}

function ensureOperationsLayoutOrder() {
  const progressPanel = document.getElementById("panel-progress");
  const schoolsPanel = document.getElementById("panel-schools");
  if (!progressPanel || !schoolsPanel || !schoolsPanel.parentNode) {
    return;
  }
  if (progressPanel.nextElementSibling !== schoolsPanel) {
    schoolsPanel.parentNode.insertBefore(progressPanel, schoolsPanel);
  }
}

function onMainViewTabClick(event) {
  const button = event.target.closest("button[data-view]");
  if (!button) {
    return;
  }
  const requested = String(button.dataset.view || "").trim();
  if (!requested) {
    return;
  }
  const hasCity = Boolean(getCurrentCity());
  if (!hasCity && requested !== "main-setup") {
    return;
  }
  if (requested === "operations" && !state.schools.length) {
    return;
  }
  if (requested === "operations") {
    uiState.mainView = "operations";
  } else if (requested === "city-setup") {
    uiState.mainView = "city-setup";
  } else {
    uiState.mainView = "main-setup";
  }
  applyMainViewVisibility();
  if (uiState.mainView === "operations") {
    renderPlanner();
  } else {
    renderRouteBuilderStatus();
  }
}

function applyMainViewVisibility() {
  const hasCity = Boolean(getCurrentCity());
  const hasSchools = hasCity && state.schools.length > 0;
  if (!hasCity && uiState.mainView !== "main-setup") {
    uiState.mainView = "main-setup";
  }
  if (uiState.mainView === "operations" && !hasSchools) {
    uiState.mainView = hasCity ? "city-setup" : "main-setup";
  }

  const globalSetupPanelIds = [
    "panel-restore",
    "panel-city-data"
  ];
  const citySetupPanelIds = ["panel-dayplans"];
  const operationPanelIds = ["panel-progress", "panel-planner", "day-verification-panel"];
  const schoolsPanel = document.getElementById("panel-schools");

  [...globalSetupPanelIds, ...citySetupPanelIds, ...operationPanelIds].forEach((id) => {
    const node = document.getElementById(id);
    if (!node) {
      return;
    }
    if (globalSetupPanelIds.includes(id)) {
      node.hidden = uiState.mainView !== "main-setup";
      return;
    }
    if (citySetupPanelIds.includes(id)) {
      node.hidden = !hasCity || uiState.mainView !== "city-setup";
      return;
    }
    node.hidden = !hasSchools || uiState.mainView !== "operations";
  });

  if (schoolsPanel) {
    schoolsPanel.hidden = !hasSchools || uiState.mainView !== "operations";
  }

  if (el.schoolsImportTools && el.schoolsFileInput) {
    const showImportTools = hasCity && uiState.mainView === "city-setup";
    el.schoolsImportTools.hidden = !showImportTools;
    el.schoolsFileInput.disabled = !showImportTools;
  }
  if (el.schoolsImportCopy) {
    el.schoolsImportCopy.hidden = !(hasCity && uiState.mainView === "city-setup");
  }
  if (schoolsPanel) {
    schoolsPanel.classList.toggle("schools-ops-view", uiState.mainView === "operations");
  }

  const mainSetupBtn = el.mainSetupButton;
  const citySetupBtn = el.mainViewTabs.querySelector("button[data-view='city-setup']");
  const operationsBtn = el.mainViewTabs.querySelector("button[data-view='operations']");
  if (mainSetupBtn) {
    mainSetupBtn.classList.toggle("active", uiState.mainView === "main-setup");
    mainSetupBtn.disabled = false;
  }
  if (citySetupBtn) {
    citySetupBtn.classList.toggle("active", uiState.mainView === "city-setup");
    citySetupBtn.disabled = !hasCity;
    citySetupBtn.title = hasCity ? "" : "Create a city first";
  }
  if (operationsBtn) {
    operationsBtn.classList.toggle("active", uiState.mainView === "operations");
    operationsBtn.disabled = !hasSchools;
    operationsBtn.title = !hasCity ? "Create a city first" : (hasSchools ? "" : "Import schools first");
  }
}

function onSchoolsListToggle() {
  uiState.schoolsListExpanded = !uiState.schoolsListExpanded;
  renderSchoolsListVisibility();
}

function renderSchoolsListVisibility() {
  if (!el.schoolsTableWrap || !el.schoolsListToggle) {
    return;
  }
  const hasSchools = state.schools.length > 0;
  const expanded = uiState.schoolsListExpanded && hasSchools;
  el.schoolsTableWrap.hidden = !expanded;
  if (!hasSchools) {
    el.schoolsListToggle.textContent = "Show School List";
    el.schoolsListToggle.disabled = true;
    return;
  }
  el.schoolsListToggle.disabled = false;
  el.schoolsListToggle.textContent = expanded ? "Hide School List" : "Show School List";
}

function ensureSelectedDay() {
  const cityId = getCurrentCity()?.id || "";
  const sorted = getSortedDayPlans();
  if (!sorted.length) {
    uiState.selectedDayId = "";
    uiState.selectedVerificationDayId = "";
    if (cityId) {
      delete uiState.selectedDayIdsByCity[cityId];
      delete uiState.selectedVerificationDayIdsByCity[cityId];
    }
    uiState.plannerDraft = null;
    uiState.plannerDirty = false;
    return;
  }

  const preferredDayId = cityId ? uiState.selectedDayIdsByCity[cityId] : "";
  if (!preferredDayId || !state.dayPlans.some((item) => item.id === preferredDayId)) {
    uiState.selectedDayId = sorted[0].id;
  } else {
    uiState.selectedDayId = preferredDayId;
  }
  if (cityId) {
    uiState.selectedDayIdsByCity[cityId] = uiState.selectedDayId;
  }

  loadPlannerDraft(uiState.selectedDayId);
  ensureSelectedVerificationDay(uiState.selectedDayId);
}

function ensureSelectedVerificationDay(preferredDayId = "") {
  const cityId = getCurrentCity()?.id || "";
  const sorted = getSortedDayPlans();
  if (!sorted.length) {
    uiState.selectedVerificationDayId = "";
    if (cityId) {
      delete uiState.selectedVerificationDayIdsByCity[cityId];
    }
    return "";
  }
  const preferredVerificationDayId = cityId ? uiState.selectedVerificationDayIdsByCity[cityId] : uiState.selectedVerificationDayId;
  const selectedExists = sorted.some((item) => item.id === preferredVerificationDayId);
  if (selectedExists) {
    uiState.selectedVerificationDayId = preferredVerificationDayId;
    return uiState.selectedVerificationDayId;
  }
  const preferredExists = preferredDayId && sorted.some((item) => item.id === preferredDayId);
  if (preferredExists) {
    uiState.selectedVerificationDayId = preferredDayId;
    return uiState.selectedVerificationDayId;
  }
  const plannerExists = uiState.selectedDayId && sorted.some((item) => item.id === uiState.selectedDayId);
  if (plannerExists) {
    uiState.selectedVerificationDayId = uiState.selectedDayId;
    return uiState.selectedVerificationDayId;
  }
  uiState.selectedVerificationDayId = sorted[0].id;
  if (cityId) {
    uiState.selectedVerificationDayIdsByCity[cityId] = uiState.selectedVerificationDayId;
  }
  return uiState.selectedVerificationDayId;
}

function getSortedDayPlans() {
  return [...state.dayPlans].sort((a, b) => a.date.localeCompare(b.date));
}

function renderSchools() {
  updateSchoolSortButtons();

  const sorted = sortSchools([...state.schools]);
  const usageMap = getCommittedSchoolUsageMap();
  if (!sorted.length) {
    el.schoolsBody.innerHTML = `<tr><td class="empty" colspan="11">No schools yet.</td></tr>`;
    return;
  }

  el.schoolsBody.innerHTML = sorted
    .map((school) => {
      const status = getSchoolStatus(school.id);
      const remaining = getSchoolRemainingClassrooms(school, usageMap);
      const isFullyScheduled = remaining <= 0;
      let rowClass = "";
      if (status === "completed") {
        rowClass = "school-row-completed";
      } else if (status === "incomplete") {
        rowClass = "school-row-incomplete";
      } else if (isFullyScheduled && status !== "scheduled") {
        rowClass = "school-row-attention";
      }
      return `
        <tr class="${rowClass}">
          <td>${escapeHtml(school.name)}</td>
          <td>${escapeHtml(school.district)}</td>
          <td>${escapeHtml(school.schoolType || "")}</td>
          <td>${escapeHtml(school.lectureDuration || "")}</td>
          <td>${escapeHtml(school.workingHours || "")}</td>
          <td>${Number(school.classroomCount || 0)}</td>
          <td>${formatOptionalNumber(school.maxClassroomSize)}</td>
          <td>${getSchoolClassroomProgressDisplay(school)}</td>
          <td>${escapeHtml(status)}</td>
          <td>${escapeHtml(school.notes || "")}</td>
          <td>
            <button type="button" class="ghost" data-action="edit-school" data-id="${school.id}">Edit</button>
            <button type="button" class="danger" data-action="delete-school" data-id="${school.id}">Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");

  el.schoolsBody.querySelectorAll("button[data-action='edit-school']").forEach((button) => {
    button.addEventListener("click", onEditSchool);
  });
  el.schoolsBody.querySelectorAll("button[data-action='delete-school']").forEach((button) => {
    button.addEventListener("click", onDeleteSchool);
  });
}

function onEditSchool(event) {
  const id = String(event.currentTarget.dataset.id || "").trim();
  const school = state.schools.find((item) => item.id === id);
  if (!school || !el.schoolEditModal || !el.schoolEditForm) {
    return;
  }
  uiState.schoolEditId = school.id;
  if (el.schoolEditTitle) {
    el.schoolEditTitle.textContent = `Edit School: ${school.name}`;
  }
  el.schoolEditId.value = school.id;
  el.schoolEditName.value = school.name || "";
  el.schoolEditDistrict.value = school.district || "";
  el.schoolEditType.value = school.schoolType || "";
  el.schoolEditStatus.value = normalizeManualSchoolStatus(school.manualStatus || "");
  el.schoolEditDuration.value = school.lectureDuration || "";
  el.schoolEditWorkingHours.value = school.workingHours || "";
  el.schoolEditLunchBreak.value = school.lunchBreak || "";
  el.schoolEditClassroomCount.value = Number(school.classroomCount || 0) || "";
  el.schoolEditMaxClassSize.value = school.maxClassroomSize ?? "";
  el.schoolEditSchoolCode.value = school.schoolCode || "";
  el.schoolEditSurvey.value = school.survey || "";
  el.schoolEditClassroomList.value = school.classroomList || "";
  el.schoolEditNotes.value = school.notes || "";
  el.schoolEditAddress.value = school.addressLine || "";
  el.schoolEditLatitude.value = school.latitude ?? "";
  el.schoolEditLongitude.value = school.longitude ?? "";
  el.schoolEditCity.value = school.city || "";
  el.schoolEditCountry.value = school.country || "";
  uiState.schoolEditLocalWarnings = [];
  el.schoolEditModal.hidden = false;
  renderFollowUpPanel("school-edit", el.schoolEditWarningPanel, uiState.schoolEditLocalWarnings);
}

function closeSchoolEditor() {
  uiState.schoolEditId = "";
  uiState.schoolEditLocalWarnings = [];
  if (el.schoolEditForm) {
    el.schoolEditForm.reset();
  }
  if (el.schoolEditModal) {
    el.schoolEditModal.hidden = true;
  }
}

async function onSchoolEditSubmit(event) {
  event.preventDefault();
  const id = String(el.schoolEditId?.value || uiState.schoolEditId || "").trim();
  const school = state.schools.find((item) => item.id === id);
  if (!school) {
    return;
  }

  const nextName = String(el.schoolEditName.value || "").trim();
  const nextDistrict = String(el.schoolEditDistrict.value || "").trim();
  const nextSchoolType = normalizeSchoolType(el.schoolEditType.value);
  const nextManualStatus = normalizeManualSchoolStatus(el.schoolEditStatus.value);
  const nextLectureDuration = normalizeLectureDuration(el.schoolEditDuration.value);
  const nextClassroomCount = parseClassroomCount(el.schoolEditClassroomCount.value);
  const nextMaxClassSize = parseOptionalNumber(el.schoolEditMaxClassSize.value);
  const nextLatitude = parseOptionalNumber(el.schoolEditLatitude.value);
  const nextLongitude = parseOptionalNumber(el.schoolEditLongitude.value);

  if (!nextName || !nextDistrict || !nextSchoolType || !nextLectureDuration || Number.isNaN(nextClassroomCount) || nextClassroomCount <= 0) {
    alert("Name, district, school type, lecture duration, and classroom count are required.");
    return;
  }

  const duplicateExists = state.schools.some((item) => {
    if (item.id === school.id) {
      return false;
    }
    return getSchoolDuplicateKey(item.name, item.district) === getSchoolDuplicateKey(nextName, nextDistrict);
  });
  if (duplicateExists) {
    alert("Another school with the same name and district already exists.");
    return;
  }

  const coordinatesChanged = school.latitude !== nextLatitude || school.longitude !== nextLongitude;
  school.name = nextName;
  school.district = nextDistrict;
  school.schoolType = nextSchoolType;
  school.manualStatus = nextManualStatus;
  school.lectureDuration = nextLectureDuration;
  school.workingHours = String(el.schoolEditWorkingHours.value || "").trim();
  school.lunchBreak = String(el.schoolEditLunchBreak.value || "").trim();
  school.classroomCount = Number(nextClassroomCount);
  school.maxClassroomSize = nextMaxClassSize;
  school.schoolCode = String(el.schoolEditSchoolCode.value || "").trim();
  school.survey = String(el.schoolEditSurvey.value || "").trim();
  school.classroomList = String(el.schoolEditClassroomList.value || "").trim();
  school.notes = String(el.schoolEditNotes.value || "").trim();
  school.addressLine = String(el.schoolEditAddress.value || "").trim();
  school.latitude = nextLatitude;
  school.longitude = nextLongitude;
  school.city = String(el.schoolEditCity.value || "").trim();
  school.country = String(el.schoolEditCountry.value || "").trim() || "TR";

  if (coordinatesChanged) {
    state.routeCache = state.routeCache.filter((item) => item.fromSchoolId !== school.id && item.toSchoolId !== school.id);
    try {
      await removeSchoolRouteCacheForCurrentCity(school.id);
    } catch (error) {
      console.error("Could not clear school route cache after coordinate edit", error);
    }
    const routeWarning = createFollowUpWarning(
      "route-cache-stale-school",
      "Route Cache Needs Update",
      `Drive-time data for ${school.name} was cleared after a coordinate change. Rebuild or re-import the route cache in City Setup.`,
      "city-setup",
      `route-cache-stale:school:${school.id}`,
      "school",
      school.id
    );
    upsertFollowUpWarning(routeWarning);
    uiState.schoolEditLocalWarnings.push(routeWarning);
  }

  if (nextManualStatus) {
    upsertFollowUpWarning(createFollowUpWarning(
      "manual-status-school",
      "Manual School Status Active",
      `${school.name} is using a manual status override. It will not follow automatic assignment and verification status until you switch it back to Automatic.`,
      "operations",
      `manual-status-review:school:${school.id}`,
      "school",
      school.id
    ));
  }

  closeSchoolEditor();
  noteDocumentMutation();
  renderAll();
}

async function onDeleteSchool(event) {
  const id = event.currentTarget.dataset.id;
  const school = state.schools.find((item) => item.id === id);
  if (!school) {
    return;
  }
  const hadDependentReferences = hasOrphanedSchoolReferences(id);

  if (!confirm(`Delete school "${school.name}"? Existing assignments will need manual fixes.`)) {
    return;
  }

  state.schools = state.schools.filter((item) => item.id !== id);
  state.routeCache = state.routeCache.filter((item) => item.fromSchoolId !== id && item.toSchoolId !== id);
  try {
    await removeSchoolRouteCacheForCurrentCity(id);
  } catch (error) {
    console.error("Could not delete school routes from database", error);
  }
  if (hadDependentReferences) {
    upsertFollowUpWarning(createFollowUpWarning(
      "deleted-school-review",
      "Deleted School Needs Review",
      `${school.name} was deleted. Check planning and verification data for anything that still needs manual review.`,
      "operations",
      `deleted-school-review:school:${id}`,
      "school",
      id
    ));
  }
  noteDocumentMutation();
  renderAll();
}

function onSchoolSortClick(event) {
  const key = event.currentTarget.dataset.sortKey;
  if (!key) {
    return;
  }

  if (uiState.schoolSort.key === key) {
    uiState.schoolSort.dir = uiState.schoolSort.dir === "asc" ? "desc" : "asc";
  } else {
    uiState.schoolSort.key = key;
    uiState.schoolSort.dir = "asc";
  }

  renderSchools();
}

function updateSchoolSortButtons() {
  document.querySelectorAll(".sort-btn").forEach((button) => {
    const baseLabel = button.dataset.label || button.textContent;
    if (button.dataset.sortKey === uiState.schoolSort.key) {
      const arrow = uiState.schoolSort.dir === "asc" ? " ↑" : " ↓";
      button.textContent = `${baseLabel}${arrow}`;
    } else {
      button.textContent = baseLabel;
    }
  });
}

function sortSchools(schools) {
  const { key, dir } = uiState.schoolSort;
  const factor = dir === "asc" ? 1 : -1;

  return schools.sort((a, b) => {
    if (key === "classroomCount" || key === "maxClassroomSize") {
      const left = key === "classroomCount" ? Number(a.classroomCount) : getComparableNumber(a.maxClassroomSize);
      const right = key === "classroomCount" ? Number(b.classroomCount) : getComparableNumber(b.maxClassroomSize);
      return (left - right) * factor;
    }

    if (key === "lectureDuration") {
      return (parseDurationMinutes(a.lectureDuration) - parseDurationMinutes(b.lectureDuration)) * factor;
    }

    if (key === "status") {
      return getSchoolStatus(a.id).localeCompare(getSchoolStatus(b.id), undefined, { sensitivity: "base" }) * factor;
    }

    return String(a[key] || "").localeCompare(String(b[key] || ""), undefined, { sensitivity: "base" }) * factor;
  });
}

function getSchoolStatus(schoolId) {
  const school = state.schools.find((item) => item.id === schoolId);
  const manualStatus = normalizeManualSchoolStatus(school?.manualStatus || "");
  if (manualStatus) {
    return manualStatus;
  }

  const latestVerification = getLatestSchoolVerificationRecord(schoolId);
  if (latestVerification) {
    return latestVerification.outcome === "incomplete" ? "incomplete" : "completed";
  }

  const assignments = state.researcherAssignments.filter((item) => {
    const extraPrimaryRows = Array.isArray(item.extraPrimaryRows) ? item.extraPrimaryRows : [];
    const extraSecondaryRows = Array.isArray(item.extraSecondaryRows) ? item.extraSecondaryRows : [];
    return (
      item.primarySchoolId === schoolId ||
      item.secondarySchoolId === schoolId ||
      extraPrimaryRows.some((row) => row.schoolId === schoolId) ||
      extraSecondaryRows.some((row) => row.schoolId === schoolId) ||
      item.extraPrimarySchoolId === schoolId ||
      item.extraSecondarySchoolId === schoolId
    );
  });
  if (!assignments.length) {
    return "not scheduled";
  }

  return "scheduled";
}

function getPastAssignedClassroomsForSchool(schoolId) {
  if (!schoolId) {
    return 0;
  }
  const dayMap = new Map(state.dayPlans.map((item) => [item.id, item.date || ""]));
  const today = getTodayDateString();
  let total = 0;

  state.researcherAssignments.forEach((assignment) => {
    const dayDate = dayMap.get(assignment.dayId) || "";
    if (!dayDate || dayDate >= today) {
      return;
    }
    if (assignment.primarySchoolId === schoolId) {
      total += Number(assignment.primaryClassrooms || 0);
    }
    if (assignment.secondarySchoolId === schoolId) {
      total += Number(assignment.secondaryClassrooms || 0);
    }
    (Array.isArray(assignment.extraPrimaryRows) ? assignment.extraPrimaryRows : []).forEach((row) => {
      if (row.schoolId === schoolId) {
        total += Number(row.classrooms || 0);
      }
    });
    (Array.isArray(assignment.extraSecondaryRows) ? assignment.extraSecondaryRows : []).forEach((row) => {
      if (row.schoolId === schoolId) {
        total += Number(row.classrooms || 0);
      }
    });
  });

  return total;
}

function getScheduledClassroomsForSchool(school) {
  if (!school) {
    return 0;
  }
  const total = Number(school.classroomCount || 0);
  if (!Number.isFinite(total) || total <= 0) {
    return 0;
  }
  const manualStatus = normalizeManualSchoolStatus(school.manualStatus || "");
  if (manualStatus === "completed") {
    return total;
  }
  if (manualStatus === "not scheduled") {
    return 0;
  }
  let assigned = 0;
  state.researcherAssignments.forEach((assignment) => {
    if (assignment.primarySchoolId === school.id) {
      assigned += Number(assignment.primaryClassrooms || 0);
    }
    if (assignment.secondarySchoolId === school.id) {
      assigned += Number(assignment.secondaryClassrooms || 0);
    }
    (Array.isArray(assignment.extraPrimaryRows) ? assignment.extraPrimaryRows : []).forEach((row) => {
      if (row.schoolId === school.id) {
        assigned += Number(row.classrooms || 0);
      }
    });
    (Array.isArray(assignment.extraSecondaryRows) ? assignment.extraSecondaryRows : []).forEach((row) => {
      if (row.schoolId === school.id) {
        assigned += Number(row.classrooms || 0);
      }
    });
  });
  return Math.max(0, Math.min(total, assigned));
}

function getCompletedClassroomsForSchool(school) {
  if (!school) {
    return 0;
  }
  const total = Number(school.classroomCount || 0);
  if (!Number.isFinite(total) || total <= 0) {
    return 0;
  }
  const manualStatus = normalizeManualSchoolStatus(school.manualStatus || "");
  if (manualStatus === "completed") {
    return total;
  }
  if (manualStatus === "incomplete" || manualStatus === "scheduled" || manualStatus === "not scheduled") {
    return 0;
  }
  const latest = getLatestSchoolVerificationRecord(school.id);
  if (latest) {
    if (latest.outcome === "completed") {
      return total;
    }
    const labelCount = getVerificationRemainingLabels(latest, school).length;
    const remaining = labelCount > 0
      ? labelCount
      : Number.isFinite(Number(latest.remainingClassrooms))
        ? Number(latest.remainingClassrooms)
        : total;
    return Math.max(0, Math.min(total, total - remaining));
  }
  return 0;
}

function onProgressModeToggle() {
  uiState.progressMode = uiState.progressMode === "scheduled" ? "completed" : "scheduled";
  renderDistrictProgress();
}

function getProgressSchoolTypeLabel(value) {
  const normalized = String(value || "").trim();
  return normalized || "(No type)";
}

function getProgressSchoolTypeSortKey(schoolType) {
  const value = String(schoolType || "").trim().toLowerCase();
  if (value === "sabahci") {
    return 0;
  }
  if (value === "tam gun") {
    return 1;
  }
  if (value === "oglenci") {
    return 2;
  }
  return 3;
}

function renderDistrictProgress() {
  if (!el.districtProgressBody) {
    return;
  }
  const isCompletedMode = uiState.progressMode === "completed";
  if (el.progressModeToggle) {
    el.progressModeToggle.textContent = isCompletedMode ? "Show Scheduled Stats" : "Show Completed Stats";
  }
  if (el.progressSchoolsHeader) {
    el.progressSchoolsHeader.textContent = isCompletedMode ? "Schools (Completed/Total)" : "Schools (Scheduled/Total)";
  }
  if (el.progressClassroomsHeader) {
    el.progressClassroomsHeader.textContent = isCompletedMode ? "Classrooms (Completed/Total)" : "Classrooms (Scheduled/Total)";
  }
  if (!state.schools.length) {
    el.districtProgressBody.innerHTML = `<tr><td class="empty" colspan="4">No schools yet.</td></tr>`;
    return;
  }

  const rowsByKey = new Map();
  state.schools.forEach((school) => {
    const district = String(school.district || "").trim() || "(No district)";
    const schoolType = getProgressSchoolTypeLabel(school.schoolType);
    const rowKey = `${district}::${schoolType}`;
    if (!rowsByKey.has(rowKey)) {
      rowsByKey.set(rowKey, {
        district,
        schoolType,
        totalSchools: 0,
        trackedSchools: 0,
        totalClassrooms: 0,
        trackedClassrooms: 0
      });
    }
    const row = rowsByKey.get(rowKey);
    row.totalSchools += 1;
    const totalClassrooms = Number(school.classroomCount || 0);
    const boundedTotalClassrooms = Number.isFinite(totalClassrooms) ? Math.max(0, totalClassrooms) : 0;
    row.totalClassrooms += boundedTotalClassrooms;

    if (isCompletedMode) {
      const completedClassrooms = getCompletedClassroomsForSchool(school);
      row.trackedClassrooms += completedClassrooms;
      if (getSchoolStatus(school.id) === "completed") {
        row.trackedSchools += 1;
      }
    } else {
      const scheduledClassrooms = getScheduledClassroomsForSchool(school);
      row.trackedClassrooms += scheduledClassrooms;
      if (scheduledClassrooms > 0 || getSchoolStatus(school.id) === "completed" || getSchoolStatus(school.id) === "incomplete") {
        row.trackedSchools += 1;
      }
    }
  });

  const rows = [...rowsByKey.values()].sort((a, b) => {
    const districtCmp = a.district.localeCompare(b.district, undefined, { sensitivity: "base" });
    if (districtCmp !== 0) {
      return districtCmp;
    }
    const typeOrderCmp = getProgressSchoolTypeSortKey(a.schoolType) - getProgressSchoolTypeSortKey(b.schoolType);
    if (typeOrderCmp !== 0) {
      return typeOrderCmp;
    }
    return a.schoolType.localeCompare(b.schoolType, undefined, { sensitivity: "base" });
  });
  const totalRow = rows.reduce((acc, row) => {
    acc.totalSchools += row.totalSchools;
    acc.trackedSchools += row.trackedSchools;
    acc.totalClassrooms += row.totalClassrooms;
    acc.trackedClassrooms += row.trackedClassrooms;
    return acc;
  }, {
    totalSchools: 0,
    trackedSchools: 0,
    totalClassrooms: 0,
    trackedClassrooms: 0
  });

  const districtCounts = rows.reduce((map, row) => {
    map.set(row.district, (map.get(row.district) || 0) + 1);
    return map;
  }, new Map());
  const districtSeen = new Set();

  el.districtProgressBody.innerHTML = [
    ...rows.map((row) => {
      const showDistrict = !districtSeen.has(row.district);
      if (showDistrict) {
        districtSeen.add(row.district);
      }
      const districtCell = showDistrict
        ? `<td class="district-progress-district-cell" rowspan="${districtCounts.get(row.district) || 1}">${escapeHtml(row.district)}</td>`
        : "";
      return `
      <tr>
        ${districtCell}
        <td>${escapeHtml(row.schoolType)}</td>
        <td>${row.trackedSchools}/${row.totalSchools}</td>
        <td>${row.trackedClassrooms}/${row.totalClassrooms}</td>
      </tr>
    `;
    }),
    `
      <tr class="district-progress-total">
        <td><strong>All Districts</strong></td>
        <td><strong>All Types</strong></td>
        <td><strong>${totalRow.trackedSchools}/${totalRow.totalSchools}</strong></td>
        <td><strong>${totalRow.trackedClassrooms}/${totalRow.totalClassrooms}</strong></td>
      </tr>
    `
  ].join("");
}

function parseDelimitedLabels(value) {
  return [...new Set(
    String(value || "")
      .split(/[,;\n|]/)
      .map((item) => item.trim())
      .filter(Boolean)
  )];
}

function getSchoolClassroomLabels(school) {
  if (!school) {
    return [];
  }
  const explicit = parseDelimitedLabels(school.classroomList || "");
  if (explicit.length) {
    return explicit;
  }
  const count = Number(school.classroomCount || 0);
  if (!Number.isInteger(count) || count < 1) {
    return [];
  }
  return Array.from({ length: count }, (_, idx) => `Class ${idx + 1}`);
}

function getLatestSchoolVerificationRecord(schoolId, excludeDayId = "") {
  const rows = state.dayVerifications.filter((item) => {
    if (item.schoolId !== schoolId) {
      return false;
    }
    if (excludeDayId && item.dayId === excludeDayId) {
      return false;
    }
    return true;
  });
  if (!rows.length) {
    return null;
  }
  const dayMap = new Map(state.dayPlans.map((item) => [item.id, item]));
  rows.sort((a, b) => {
    const dayA = dayMap.get(a.dayId)?.date || "";
    const dayB = dayMap.get(b.dayId)?.date || "";
    const dayCmp = dayB.localeCompare(dayA);
    if (dayCmp !== 0) {
      return dayCmp;
    }
    return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
  });
  return rows[0];
}

function getVerificationRemainingLabels(record, school) {
  if (!record) {
    return [];
  }
  const labels = Array.isArray(record.remainingClassroomLabels)
    ? record.remainingClassroomLabels.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  if (labels.length) {
    return [...new Set(labels)];
  }
  const fromNote = parseDelimitedLabels(record.remainingNote || "");
  if (fromNote.length) {
    return fromNote;
  }
  if (record.outcome !== "incomplete") {
    return [];
  }
  const fallback = getSchoolClassroomLabels(school);
  const remainingCount = Number(record.remainingClassrooms || 0);
  if (!remainingCount || !fallback.length) {
    return [];
  }
  return fallback.slice(0, Math.max(0, Math.min(remainingCount, fallback.length)));
}

function getSchoolClassroomProgressDisplay(school) {
  const labels = getSchoolClassroomLabels(school);
  if (!labels.length) {
    return escapeHtml(school.classroomList || "");
  }
  const manualStatus = normalizeManualSchoolStatus(school.manualStatus || "");
  const latest = getLatestSchoolVerificationRecord(school.id);
  const remainingSet = new Set(getVerificationRemainingLabels(latest, school).map((item) => normalizeLookup(item)));
  const isCompleted = manualStatus
    ? manualStatus === "completed"
    : latest?.outcome === "completed";
  const isIncomplete = manualStatus
    ? manualStatus === "incomplete"
    : latest?.outcome === "incomplete";
  return labels
    .map((label) => {
      const normalized = normalizeLookup(label);
      const done = isCompleted || (isIncomplete && remainingSet.size > 0 && !remainingSet.has(normalized));
      const chipClass = done ? "school-classroom-chip done" : "school-classroom-chip";
      return `<span class="${chipClass}">${escapeHtml(label)}</span>`;
    })
    .join(", ");
}

function getSchoolRemainingClassroomLabelText(school, usageMap = null) {
  if (!school) {
    return "";
  }
  const manualStatus = normalizeManualSchoolStatus(school.manualStatus || "");
  if (manualStatus === "completed") {
    return "-";
  }
  const latest = getLatestSchoolVerificationRecord(school.id);
  if (!manualStatus && latest) {
    if (latest.outcome === "completed") {
      return "-";
    }
    const labels = getVerificationRemainingLabels(latest, school);
    if (labels.length) {
      return labels.join(", ");
    }
    const count = Number(latest.remainingClassrooms || 0);
    return count > 0 ? `${count}` : "-";
  }

  const map = usageMap || getCommittedSchoolUsageMap();
  const remainingCount = getSchoolRemainingClassrooms(school, map);
  if (remainingCount <= 0) {
    return "-";
  }
  const labels = getSchoolClassroomLabels(school);
  if (labels.length) {
    return labels.slice(0, remainingCount).join(", ");
  }
  return String(remainingCount);
}

function getLatestSchoolVerificationBeforeDate(schoolId, targetDate) {
  if (!schoolId || !targetDate) {
    return null;
  }
  const dayMap = new Map(state.dayPlans.map((item) => [item.id, item.date || ""]));
  const rows = state.dayVerifications.filter((item) => {
    if (item.schoolId !== schoolId) {
      return false;
    }
    const dayDate = dayMap.get(item.dayId) || "";
    return Boolean(dayDate) && dayDate < targetDate;
  });
  if (!rows.length) {
    return null;
  }
  rows.sort((a, b) => {
    const dayA = dayMap.get(a.dayId) || "";
    const dayB = dayMap.get(b.dayId) || "";
    const dayCmp = dayB.localeCompare(dayA);
    if (dayCmp !== 0) {
      return dayCmp;
    }
    return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
  });
  return rows[0];
}

function getAssignableClassroomLabelsForPrintDay(school, dayDate) {
  if (!school) {
    return [];
  }
  const baseLabels = getSchoolClassroomLabels(school);
  const priorVerification = getLatestSchoolVerificationBeforeDate(school.id, dayDate);
  if (!priorVerification) {
    return baseLabels;
  }
  if (priorVerification.outcome === "completed") {
    return [];
  }
  const remainingLabels = getVerificationRemainingLabels(priorVerification, school);
  if (remainingLabels.length) {
    return remainingLabels;
  }
  const remainingCount = Number(priorVerification.remainingClassrooms || 0);
  if (!Number.isFinite(remainingCount) || remainingCount <= 0) {
    return [];
  }
  if (baseLabels.length) {
    return baseLabels.slice(0, remainingCount);
  }
  return Array.from({ length: remainingCount }, (_, idx) => `Class ${idx + 1}`);
}

function getDaySchoolVerificationOutcome(dayId, schoolId) {
  if (!dayId || !schoolId) {
    return "";
  }
  const rows = state.dayVerifications.filter((item) => item.dayId === dayId && item.schoolId === schoolId);
  if (!rows.length) {
    return "";
  }
  rows.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  return rows[0].outcome || "";
}

function getDaySchoolVerificationRecord(dayId, schoolId) {
  if (!dayId || !schoolId) {
    return null;
  }
  const rows = state.dayVerifications.filter((item) => item.dayId === dayId && item.schoolId === schoolId);
  if (!rows.length) {
    return null;
  }
  rows.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  return rows[0];
}

function getDaySchoolPlannedMap(excludeDayId = "") {
  const planned = new Map();
  const add = (dayId, schoolId, classrooms) => {
    if (!schoolId || !dayId || !Number.isFinite(classrooms) || classrooms <= 0) {
      return;
    }
    const key = `${dayId}::${schoolId}`;
    planned.set(key, (planned.get(key) || 0) + classrooms);
  };

  state.researcherAssignments.forEach((assignment) => {
    if (excludeDayId && assignment.dayId === excludeDayId) {
      return;
    }
    add(assignment.dayId, assignment.primarySchoolId, Number(assignment.primaryClassrooms || 0));
    (Array.isArray(assignment.extraPrimaryRows) ? assignment.extraPrimaryRows : []).forEach((row) => {
      add(assignment.dayId, row.schoolId, Number(row.classrooms || 0));
    });
    add(assignment.dayId, assignment.secondarySchoolId, Number(assignment.secondaryClassrooms || 0));
    (Array.isArray(assignment.extraSecondaryRows) ? assignment.extraSecondaryRows : []).forEach((row) => {
      add(assignment.dayId, row.schoolId, Number(row.classrooms || 0));
    });
  });

  return planned;
}

function renderResearchers() {
  const sorted = [...state.researchers].sort((a, b) => a.fullName.localeCompare(b.fullName));
  if (!sorted.length) {
    el.researchersBody.innerHTML = `<tr><td class="empty" colspan="5">No researchers yet.</td></tr>`;
    return;
  }

  el.researchersBody.innerHTML = sorted
    .map((researcher) => {
      const statusLabel = researcher.active ? "Active" : "Inactive";
      const toggleLabel = researcher.active ? "Deactivate" : "Activate";
      const availabilityLabel = researcher.availabilityMode === "custom"
        ? `${researcher.availableDayIds.length} selected day(s)`
        : "All days";
      return `
        <tr>
          <td>${escapeHtml(researcher.fullName)}</td>
          <td><span class="status-pill ${researcher.active ? "status-ok" : "status-muted"}">${statusLabel}</span></td>
          <td>${escapeHtml(availabilityLabel)}</td>
          <td>${escapeHtml(researcher.notes || "")}</td>
          <td>
            <button type="button" data-action="edit-researcher" data-id="${researcher.id}">Edit</button>
            <button type="button" class="ghost" data-action="toggle-researcher" data-id="${researcher.id}">${toggleLabel}</button>
            <button type="button" class="danger" data-action="delete-researcher" data-id="${researcher.id}">Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");

  el.researchersBody.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", onResearcherTableAction);
  });
}

function onResearcherSubmit(event) {
  event.preventDefault();

  const fullName = el.researcherName.value.trim();
  if (!fullName) {
    return;
  }

  const availabilityMode = el.researcherAvailabilityMode.value === "custom" ? "custom" : "all";
  const payload = {
    fullName,
    active: el.researcherActive.checked,
    availabilityMode,
    availableDayIds: availabilityMode === "custom" ? getSelectedResearcherAvailabilityDays() : [],
    notes: el.researcherNotes.value.trim()
  };

  const id = el.researcherId.value.trim();
  if (id) {
    const item = state.researchers.find((researcher) => researcher.id === id);
    if (item) {
      Object.assign(item, payload);
    }
  } else {
    state.researchers.push({ id: generateId("researcher"), ...payload });
  }

  resetResearcherForm();
  noteDocumentMutation();
  renderAll();
}

function onResearcherTableAction(event) {
  const action = event.currentTarget.dataset.action;
  const id = event.currentTarget.dataset.id;
  const researcher = state.researchers.find((item) => item.id === id);

  if (!researcher) {
    return;
  }

  if (action === "edit-researcher") {
    el.researcherId.value = researcher.id;
    el.researcherName.value = researcher.fullName;
    el.researcherActive.checked = Boolean(researcher.active);
    el.researcherAvailabilityMode.value = researcher.availabilityMode === "custom" ? "custom" : "all";
    renderResearcherAvailabilityOptions(researcher.availableDayIds || []);
    el.researcherNotes.value = researcher.notes || "";
    el.researcherSubmit.textContent = "Update Researcher";
    el.researcherCancel.hidden = false;
    return;
  }

  if (action === "toggle-researcher") {
    researcher.active = !researcher.active;
    noteDocumentMutation();
    renderAll();
    return;
  }

  if (action === "delete-researcher") {
    if (!confirm(`Delete researcher "${researcher.fullName}"? Existing assignments will require fixes.`)) {
      return;
    }
    state.researchers = state.researchers.filter((item) => item.id !== id);
    noteDocumentMutation();
    renderAll();
  }
}

function resetResearcherForm() {
  el.researcherForm.reset();
  el.researcherId.value = "";
  el.researcherActive.checked = true;
  el.researcherAvailabilityMode.value = "all";
  renderResearcherAvailabilityOptions([]);
  el.researcherSubmit.textContent = "Add Researcher";
  el.researcherCancel.hidden = true;
}

function renderResearcherAvailabilityOptions(selectedDayIds = null) {
  const sortedDays = getSortedDayPlans();
  const selected = new Set(
    Array.isArray(selectedDayIds)
      ? selectedDayIds.map((id) => String(id))
      : getSelectedResearcherAvailabilityDays()
  );

  if (!sortedDays.length) {
    el.researcherAvailabilityDays.innerHTML = `<div class="empty">Add day plans first.</div>`;
    return;
  }

  el.researcherAvailabilityDays.innerHTML = sortedDays
    .map((dayPlan) => {
      const checked = selected.has(dayPlan.id) ? "checked" : "";
      return `<label><input type="checkbox" value="${dayPlan.id}" ${checked}> ${escapeHtml(formatDate(dayPlan.date))}</label>`;
    })
    .join("");

  onResearcherAvailabilityModeChange();
}

function onResearcherAvailabilityModeChange() {
  const isCustom = el.researcherAvailabilityMode.value === "custom";
  const checkboxes = el.researcherAvailabilityDays.querySelectorAll("input[type='checkbox']");
  checkboxes.forEach((checkbox) => {
    checkbox.disabled = !isCustom;
  });
  el.researcherAvailabilityDays.classList.toggle("disabled-block", !isCustom);
}

function onResearcherAvailabilityDaysChange() {
  if (el.researcherAvailabilityMode.value !== "custom") {
    return;
  }
}

function getSelectedResearcherAvailabilityDays() {
  const checkboxes = [...el.researcherAvailabilityDays.querySelectorAll("input[type='checkbox']")];
  return checkboxes.filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value);
}

function renderDayPlans() {
  const sorted = getSortedDayPlans();
  if (!sorted.length) {
    el.dayPlansBody.innerHTML = `<tr><td class="empty" colspan="3">No day plans yet.</td></tr>`;
    return;
  }

  el.dayPlansBody.innerHTML = sorted
    .map((dayPlan) => {
      const selectedClass = dayPlan.id === uiState.selectedDayId ? "row-selected" : "";
      const lockMark = dayPlan.locked ? " [Locked]" : "";
      return `
        <tr class="${selectedClass}">
          <td>${formatDate(dayPlan.date)}</td>
          <td>${escapeHtml((dayPlan.notes || "") + lockMark)}</td>
          <td>
            <button type="button" data-action="open-day" data-id="${dayPlan.id}">Open</button>
            <button type="button" class="danger" data-action="delete-day" data-id="${dayPlan.id}">Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");

  el.dayPlansBody.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", onDayPlanTableAction);
  });
}

function onDayPlanSubmit(event) {
  event.preventDefault();

  const startDate = el.dayPlanStartDate.value;
  const endDate = el.dayPlanEndDate.value || startDate;
  const notes = el.dayPlanNotes.value.trim();
  const selectedWeekdays = [...el.dayPlanWeekdays.querySelectorAll("input[type='checkbox']")]
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => Number(checkbox.value));

  if (!startDate || !endDate || !selectedWeekdays.length) {
    alert("Set start/end dates and pick at least one weekday.");
    return;
  }

  if (startDate > endDate) {
    alert("Start date must be before or equal to end date.");
    return;
  }

  const existingDates = new Set(state.dayPlans.map((item) => item.date));
  const addedIds = [];

  const cursor = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  while (cursor <= end) {
    const weekday = cursor.getDay();
    if (selectedWeekdays.includes(weekday)) {
      const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
      if (!existingDates.has(iso)) {
        const newDay = {
          id: generateId("day"),
          date: iso,
          notes,
          locked: false,
          verificationLocked: false
        };
        state.dayPlans.push(newDay);
        addedIds.push(newDay.id);
        existingDates.add(iso);
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  if (!addedIds.length) {
    alert("No new days added (dates may already exist).");
    return;
  }

  uiState.selectedDayId = addedIds[0];
  const cityId = getCurrentCity()?.id || "";
  if (cityId) {
    uiState.selectedDayIdsByCity[cityId] = addedIds[0];
    uiState.selectedVerificationDayIdsByCity[cityId] = addedIds[0];
  }
  resetDayPlanForm();
  noteDocumentMutation();
  renderAll();
}

function onDayPlanTableAction(event) {
  const action = event.currentTarget.dataset.action;
  const id = event.currentTarget.dataset.id;
  const dayPlan = state.dayPlans.find((item) => item.id === id);

  if (!dayPlan) {
    return;
  }

  if (action === "open-day") {
    persistCurrentPlannerDraft();
    uiState.selectedDayId = dayPlan.id;
    const cityId = getCurrentCity()?.id || "";
    if (cityId) {
      uiState.selectedDayIdsByCity[cityId] = dayPlan.id;
    }
    loadPlannerDraft(dayPlan.id);
    renderDayPlans();
    renderPlannerDayTabs();
    renderPlanner();
    return;
  }

  if (action === "delete-day") {
    if (!confirm(`Delete day plan "${formatDate(dayPlan.date)}" and its assignments?`)) {
      return;
    }

    state.dayPlans = state.dayPlans.filter((item) => item.id !== id);
    state.researcherAssignments = state.researcherAssignments.filter((item) => item.dayId !== id);
    state.dayVerifications = state.dayVerifications.filter((item) => item.dayId !== id);
    state.researchers.forEach((researcher) => {
      if (researcher.availabilityMode === "custom" && Array.isArray(researcher.availableDayIds)) {
        researcher.availableDayIds = researcher.availableDayIds.filter((dayId) => dayId !== id);
      }
    });
    delete uiState.plannerDraftCache[getPlannerDraftCacheKey(id)];

    if (uiState.selectedDayId === id) {
      uiState.selectedDayId = "";
      uiState.plannerDraft = null;
    }
    if (uiState.selectedVerificationDayId === id) {
      uiState.selectedVerificationDayId = "";
    }
    const cityId = getCurrentCity()?.id || "";
    if (cityId) {
      if (uiState.selectedDayIdsByCity[cityId] === id) {
        delete uiState.selectedDayIdsByCity[cityId];
      }
      if (uiState.selectedVerificationDayIdsByCity[cityId] === id) {
        delete uiState.selectedVerificationDayIdsByCity[cityId];
      }
    }

    noteDocumentMutation();
    renderAll();
  }
}

function resetDayPlanForm(){
  el.dayPlanForm.reset();
  const weekdayBoxes = el.dayPlanWeekdays.querySelectorAll("input[type='checkbox']");
  weekdayBoxes.forEach((box) => {
    box.checked = ["1", "2", "3", "4", "5"].includes(box.value);
  });
}

function renderPlannerDayTabs() {
  const sorted = getSortedDayPlans();
  if (!sorted.length) {
    el.plannerDayTabs.innerHTML = "";
    return;
  }

  el.plannerDayTabs.innerHTML = sorted
    .map((dayPlan) => {
      const activeClass = dayPlan.id === uiState.selectedDayId ? "sheet-tab active" : "sheet-tab";
      return `<button type="button" class="${activeClass}" data-day-id="${dayPlan.id}">${escapeHtml(formatDate(dayPlan.date))}</button>`;
    })
    .join("");
}

function onPlannerDayTabClick(event) {
  const button = event.target.closest(".sheet-tab");
  if (!button) {
    return;
  }

  const dayId = button.dataset.dayId;
  if (!dayId) {
    return;
  }

  persistCurrentPlannerDraft();
  uiState.selectedDayId = dayId;
  const cityId = getCurrentCity()?.id || "";
  if (cityId) {
    uiState.selectedDayIdsByCity[cityId] = dayId;
  }
  loadPlannerDraft(dayId);
  renderDayPlans();
  renderPlannerDayTabs();
  renderPlanner();
}

function renderDayVerificationTabs() {
  if (!el.dayVerificationTabs) {
    return;
  }
  const sorted = getSortedDayPlans();
  if (!sorted.length) {
    el.dayVerificationTabs.innerHTML = "";
    return;
  }
  const selectedVerificationDayId = ensureSelectedVerificationDay(uiState.selectedDayId);
  el.dayVerificationTabs.innerHTML = sorted
    .map((dayPlan) => {
      const activeClass = dayPlan.id === selectedVerificationDayId ? "sheet-tab active" : "sheet-tab";
      return `<button type="button" class="${activeClass}" data-verification-day-id="${dayPlan.id}">${escapeHtml(formatDate(dayPlan.date))}</button>`;
    })
    .join("");
}

function onDayVerificationTabClick(event) {
  const button = event.target.closest(".sheet-tab");
  if (!button) {
    return;
  }
  const dayId = String(button.dataset.verificationDayId || "").trim();
  if (!dayId) {
    return;
  }
  if (!state.dayPlans.some((item) => item.id === dayId)) {
    return;
  }
  uiState.selectedVerificationDayId = dayId;
  const cityId = getCurrentCity()?.id || "";
  if (cityId) {
    uiState.selectedVerificationDayIdsByCity[cityId] = dayId;
  }
  renderDayVerificationTabs();
  renderDayVerificationPanel(uiState.selectedDayId);
}

function loadPlannerDraft(dayId) {
  closePlannerNoteEditor();

  const dayPlan = state.dayPlans.find((item) => item.id === dayId);
  if (!dayPlan) {
    uiState.plannerDraft = null;
    uiState.lastValidation = null;
    uiState.plannerDirty = false;
    return;
  }

  const cached = uiState.plannerDraftCache[getPlannerDraftCacheKey(dayId)];
  if (cached?.draft) {
    uiState.plannerDraft = clonePlannerDraft(cached.draft);
    uiState.plannerDirty = Boolean(cached.dirty);
  } else {
    const dayAssignments = state.researcherAssignments
      .filter((item) => item.dayId === dayId)
      .map((item) => {
        const next = { ...item };
        const primarySchool = next.primarySchoolId ? state.schools.find((school) => school.id === next.primarySchoolId) : null;
        const secondarySchool = next.secondarySchoolId ? state.schools.find((school) => school.id === next.secondarySchoolId) : null;
        const extraPrimaryRows = Array.isArray(next.extraPrimaryRows) ? next.extraPrimaryRows : [];
        const extraSecondaryRows = Array.isArray(next.extraSecondaryRows) ? next.extraSecondaryRows : [];
        if (!next.primaryDistrict && primarySchool) {
          next.primaryDistrict = primarySchool.district || "";
        }
        if (!next.secondaryDistrict && secondarySchool) {
          next.secondaryDistrict = secondarySchool.district || "";
        }
        next.extraPrimaryRows = extraPrimaryRows.map((row) => {
          const school = row.schoolId ? state.schools.find((schoolItem) => schoolItem.id === row.schoolId) : null;
          return {
            id: row.id || generateId("slot"),
            district: row.district || school?.district || "",
            schoolId: row.schoolId || "",
            classrooms: Number(row.classrooms ?? 1),
            sarmal: Boolean(row.sarmal)
          };
        });
        next.extraSecondaryRows = extraSecondaryRows.map((row) => {
          const school = row.schoolId ? state.schools.find((schoolItem) => schoolItem.id === row.schoolId) : null;
          return {
            id: row.id || generateId("slot"),
            district: row.district || school?.district || "",
            schoolId: row.schoolId || "",
            classrooms: Number(row.classrooms ?? 1),
            sarmal: Boolean(row.sarmal)
          };
        });
        next.primarySarmal = Boolean(next.primarySarmal);
        next.secondarySarmal = Boolean(next.secondarySarmal);
        return next;
      });

    uiState.plannerDraft = {
      dayId,
      availableResearcherIds: [],
      assignments: dayAssignments
    };
    uiState.plannerDirty = false;
  }

  const availableResearcherIds = getAvailableResearcherIdsForDay(dayId);
  uiState.plannerDraft.availableResearcherIds = availableResearcherIds;

  availableResearcherIds.forEach((researcherId) => {
    if (!uiState.plannerDraft.assignments.some((item) => item.researcherId === researcherId)) {
      uiState.plannerDraft.assignments.push(createDefaultAssignment(dayId, researcherId));
    }
  });

  uiState.lastValidation = validatePlannerDraft(uiState.plannerDraft);
}

function createDefaultAssignment(dayId, researcherId) {
  return {
    id: generateId("assignment"),
    dayId,
    researcherId,
    primaryDistrict: "",
    primarySchoolId: "",
    primaryClassrooms: 3,
    primarySarmal: false,
    secondaryDistrict: "",
    secondarySchoolId: "",
    secondaryClassrooms: 1,
    secondarySarmal: false,
    extraPrimaryRows: [],
    extraSecondaryRows: [],
    overrideEnabled: false,
    overrideReason: "",
    notes: ""
  };
}

function renderPlanner() {
  const draft = uiState.plannerDraft;
  if (!draft) {
    uiState.routeInsights = null;
    renderDayVerificationPanel("");
    el.plannerSummary.textContent = "No day selected.";
    el.plannerRowsBody.innerHTML = `<tr><td class="empty" colspan="13">No day selected.</td></tr>`;
    el.plannerValidation.innerHTML = "";
    el.plannerValidation.className = "validation-box";
    el.plannerSave.disabled = true;
    el.plannerEdit.disabled = true;
    el.plannerPrint.disabled = true;
    return;
  }

  const dayPlan = state.dayPlans.find((item) => item.id === draft.dayId);
  if (!dayPlan) {
    renderDayVerificationPanel("");
    el.plannerSummary.textContent = "No day selected.";
    el.plannerSave.disabled = true;
    el.plannerEdit.disabled = true;
    el.plannerPrint.disabled = true;
    return;
  }

  const summaryMetrics = getPlannerSummaryMetrics(draft);
  uiState.routeInsights = getPlannerRouteInsights(draft);
  const capacityDetailsHtml = summaryMetrics.schoolRows.length
    ? `<div class="planner-capacity-list">${summaryMetrics.schoolRows
        .map((row) => {
          const itemClass = row.isOver
            ? "planner-capacity-item over"
            : row.remaining <= 0
              ? "planner-capacity-item full"
              : "planner-capacity-item";
          const overLabel = row.isOver ? ` (over by ${row.overBy})` : "";
          return `<span class="${itemClass}">${escapeHtml(row.schoolName)}: ${row.used}/${row.capacity} used (${row.remaining} left)${overLabel}</span>`;
        })
        .join("")}</div>`
    : `<div class="planner-capacity-list"><span class="planner-capacity-item">No schools selected yet.</span></div>`;
  const overCapacityWarnings = summaryMetrics.schoolRows.filter((row) => row.isOver);
  const warningHtml = overCapacityWarnings.length
    ? `<div class="planner-capacity-warning">Warning: ${overCapacityWarnings
        .map((row) => `${escapeHtml(row.schoolName)} over by ${row.overBy}`)
        .join(" | ")}</div>`
    : "";
  const routeWarningsHtml = uiState.routeInsights.warnings.length
    ? `<div class="planner-route-warning">Route warnings: ${uiState.routeInsights.warnings.map((item) => escapeHtml(item)).join(" | ")}</div>`
    : "";

  el.plannerSummary.innerHTML = `
    <div class="planner-summary-metrics">
      <strong>Capacity Summary (Live)</strong> |
      Planned Today: <strong>${summaryMetrics.plannedToday}</strong> |
      Fully Scheduled (selected): <strong>${summaryMetrics.fullyScheduledSelected}</strong> |
      Required tablets: <strong>${summaryMetrics.requiredTablets}/480</strong>
    </div>
    ${capacityDetailsHtml}
    ${warningHtml}
    ${routeWarningsHtml}
  `;
  el.plannerSave.disabled = Boolean(dayPlan.locked);
  el.plannerSave.title = dayPlan.locked ? "This day plan is locked after save." : "";
  el.plannerEdit.disabled = !dayPlan.locked;
  el.plannerEdit.title = dayPlan.locked ? "Unlock this day plan for changes." : "Day plan is already editable.";
  el.plannerPrint.disabled = false;

  renderPlannerRows();
  renderDayVerificationPanel(draft.dayId);

  uiState.lastValidation = validatePlannerDraft(draft, uiState.routeInsights);
  renderPlannerValidation(uiState.lastValidation);
}

function hideDayVerificationPanel() {
  if (!el.dayVerificationPanel) {
    return;
  }
  el.dayVerificationPanel.hidden = true;
  if (el.dayVerificationTabs) {
    el.dayVerificationTabs.innerHTML = "";
  }
  el.dayVerificationBody.innerHTML = "";
  el.dayVerificationStatus.textContent = "";
}

function renderDayVerificationPanel(preferredDayId = "") {
  if (!el.dayVerificationPanel) {
    return;
  }
  if (uiState.mainView !== "operations" && state.schools.length) {
    return;
  }
  if (!state.schools.length) {
    el.dayVerificationPanel.hidden = true;
    return;
  }
  const selectedVerificationDayId = ensureSelectedVerificationDay(preferredDayId);
  renderDayVerificationTabs();
  const dayPlan = state.dayPlans.find((item) => item.id === selectedVerificationDayId);
  const dayId = dayPlan?.id || "";
  const isLocked = Boolean(dayPlan?.locked);
  const verificationLocked = Boolean(dayPlan?.verificationLocked);
  if (!dayId) {
    el.dayVerificationPanel.hidden = false;
    el.dayVerificationBody.innerHTML = `<tr><td class="empty" colspan="5">Select a day to verify.</td></tr>`;
    el.dayVerificationStatus.textContent = "Day verification will be available after you lock a day plan.";
    el.dayVerificationSave.disabled = true;
    el.dayVerificationEdit.disabled = true;
    return;
  }
  if (!isLocked) {
    el.dayVerificationPanel.hidden = false;
    el.dayVerificationBody.innerHTML = `<tr><td class="empty" colspan="5">Lock this day plan first to start verification.</td></tr>`;
    el.dayVerificationStatus.textContent = "Verification is shown here continuously, but editing starts after day lock.";
    el.dayVerificationSave.disabled = true;
    el.dayVerificationEdit.disabled = true;
    return;
  }

  const rows = getDayVerificationSchools(dayId);
  if (!rows.length) {
    el.dayVerificationPanel.hidden = false;
    el.dayVerificationBody.innerHTML = `<tr><td class="empty" colspan="5">No schools in this locked day.</td></tr>`;
    el.dayVerificationStatus.textContent = "No verification needed for this day.";
    el.dayVerificationSave.disabled = true;
    el.dayVerificationEdit.disabled = true;
    return;
  }

  const verifMap = new Map(
    state.dayVerifications
      .filter((item) => item.dayId === dayId)
      .map((item) => [item.schoolId, item])
  );

  const dayDraft = uiState.verificationDraft[dayId] || {};

  el.dayVerificationBody.innerHTML = rows
    .map((row) => {
      const existing = verifMap.get(row.schoolId);
      const draft = dayDraft[row.schoolId];
      const outcome = draft ? draft.outcome : (existing?.outcome || "");
      const school = state.schools.find((item) => item.id === row.schoolId) || null;
      const labels = getSchoolClassroomLabels(school);
      const selectedLabels = draft ? draft.remainingLabels : getVerificationRemainingLabels(existing, school);
      const selectedSet = new Set(selectedLabels.map((item) => normalizeLookup(item)));
      const remainingClassrooms = outcome === "incomplete" ? selectedLabels.length : 0;
      const checkboxesHtml = labels.length
        ? `<div class="remaining-classrooms-list">${labels
            .map((label) => {
              const checked = selectedSet.has(normalizeLookup(label)) ? "checked" : "";
              const disabled = verificationLocked || outcome !== "incomplete" ? "disabled" : "";
              return `
                <label class="verification-class-chip">
                  <input type="checkbox" data-field="remainingLabel" value="${escapeHtmlAttr(label)}" ${checked} ${disabled}>
                  <span>${escapeHtml(label)}</span>
                </label>
              `;
            })
            .join("")}</div>`
        : `<span class="small-note">No classroom list available for this school.</span>`;
      return `
        <tr data-school-id="${row.schoolId}">
          <td>${escapeHtml(row.schoolName)}</td>
          <td>${escapeHtml(row.district)}</td>
          <td>
            <select data-field="outcome" ${verificationLocked ? "disabled" : ""}>
              <option value="" ${outcome ? "" : "selected"}>Select</option>
              <option value="completed" ${outcome === "completed" ? "selected" : ""}>Completed</option>
              <option value="incomplete" ${outcome === "incomplete" ? "selected" : ""}>Incomplete</option>
            </select>
          </td>
          <td><span data-field="remainingCount">${remainingClassrooms}</span></td>
          <td>${checkboxesHtml}</td>
        </tr>
      `;
    })
    .join("");

  el.dayVerificationStatus.textContent = verificationLocked
    ? "Verification is locked. Click Edit to make changes."
    : "Complete this after fieldwork and save. School status will update automatically.";
  el.dayVerificationSave.disabled = verificationLocked;
  el.dayVerificationEdit.disabled = !verificationLocked;
  el.dayVerificationPanel.hidden = false;
}

function getDayVerificationSchools(dayId) {
  const assignments = state.researcherAssignments.filter((item) => item.dayId === dayId);
  const schoolMap = getSchoolMap();
  const aggregate = new Map();

  assignments.forEach((assignment) => {
    addSchoolToVerificationAggregate(aggregate, assignment.primarySchoolId, schoolMap);
    (Array.isArray(assignment.extraPrimaryRows) ? assignment.extraPrimaryRows : []).forEach((row) => {
      addSchoolToVerificationAggregate(aggregate, row.schoolId, schoolMap);
    });
    addSchoolToVerificationAggregate(aggregate, assignment.secondarySchoolId, schoolMap);
    (Array.isArray(assignment.extraSecondaryRows) ? assignment.extraSecondaryRows : []).forEach((row) => {
      addSchoolToVerificationAggregate(aggregate, row.schoolId, schoolMap);
    });
  });

  return [...aggregate.values()].sort((a, b) => a.schoolName.localeCompare(b.schoolName));
}

function addSchoolToVerificationAggregate(aggregate, schoolId, schoolMap) {
  if (!schoolId) {
    return;
  }
  const school = schoolMap.get(schoolId);
  if (!school) {
    return;
  }
  const existing = aggregate.get(schoolId);
  if (existing) {
    return;
  }
  aggregate.set(schoolId, {
    schoolId,
    schoolName: school.name,
    district: school.district || ""
  });
}

function onDayVerificationChange(event) {
  const selectedVerificationDayId = ensureSelectedVerificationDay(uiState.selectedDayId);
  const dayPlan = state.dayPlans.find((item) => item.id === selectedVerificationDayId);
  if (dayPlan?.verificationLocked) {
    return;
  }

  const row = event.target.closest("tr[data-school-id]");
  if (!row) {
    return;
  }
  const select = row.querySelector("select[data-field='outcome']");
  const isIncomplete = String(select?.value || "") === "incomplete";
  const checkboxes = [...row.querySelectorAll("input[data-field='remainingLabel']")];
  checkboxes.forEach((checkbox) => {
    checkbox.disabled = dayPlan?.verificationLocked || !isIncomplete;
    if (!isIncomplete) {
      checkbox.checked = false;
    }
  });
  const count = checkboxes.filter((checkbox) => checkbox.checked).length;
  const countNode = row.querySelector("[data-field='remainingCount']");
  if (countNode) {
    countNode.textContent = String(isIncomplete ? count : 0);
  }

  const schoolId = String(row.dataset.schoolId || "").trim();
  const outcome = String(select?.value || "").trim();
  const checkedLabels = checkboxes
    .filter((cb) => cb.checked)
    .map((cb) => String(cb.value || "").trim())
    .filter(Boolean);
  if (selectedVerificationDayId && schoolId) {
    if (!uiState.verificationDraft[selectedVerificationDayId]) {
      uiState.verificationDraft[selectedVerificationDayId] = {};
    }
    uiState.verificationDraft[selectedVerificationDayId][schoolId] = {
      outcome,
      remainingLabels: checkedLabels
    };
  }
}

function onDayVerificationSave() {
  const selectedVerificationDayId = ensureSelectedVerificationDay(uiState.selectedDayId);
  if (!selectedVerificationDayId) {
    alert("Select a day first.");
    return;
  }
  const dayPlan = state.dayPlans.find((item) => item.id === selectedVerificationDayId);
  if (!dayPlan || !dayPlan.locked) {
    alert("Day verification is available only for locked day plans.");
    return;
  }
  if (dayPlan.verificationLocked) {
    alert("Verification is locked. Click Edit to modify.");
    return;
  }

  const rows = [...el.dayVerificationBody.querySelectorAll("tr[data-school-id]")];
  if (!rows.length) {
    alert("No schools to verify for this day.");
    return;
  }

  const nextRows = [];
  const errors = [];
  rows.forEach((row) => {
    const schoolId = String(row.dataset.schoolId || "").trim();
    const outcome = String(row.querySelector("select[data-field='outcome']")?.value || "").trim();
    const remainingLabels = [...row.querySelectorAll("input[data-field='remainingLabel']:checked")]
      .map((input) => String(input.value || "").trim())
      .filter(Boolean);
    const remainingClassrooms = remainingLabels.length;
    const remainingNote = remainingLabels.join(", ");
    const schoolName = state.schools.find((item) => item.id === schoolId)?.name || schoolId;

    if (!outcome) {
      errors.push(`${schoolName}: select completed or incomplete.`);
      return;
    }
    if (outcome === "incomplete") {
      if (!remainingClassrooms) {
        errors.push(`${schoolName}: select remaining classroom(s).`);
        return;
      }
    }

    nextRows.push({
      id: generateId("verify"),
      dayId: selectedVerificationDayId,
      schoolId,
      outcome: outcome === "incomplete" ? "incomplete" : "completed",
      remainingClassrooms: outcome === "incomplete" ? remainingClassrooms : 0,
      remainingClassroomLabels: outcome === "incomplete" ? remainingLabels : [],
      remainingNote: outcome === "incomplete" ? remainingNote : "",
      updatedAt: new Date().toISOString()
    });
  });

  if (errors.length) {
    alert(`Cannot save verification. ${errors[0]}`);
    return;
  }

  state.dayVerifications = state.dayVerifications
    .filter((item) => item.dayId !== selectedVerificationDayId)
    .concat(nextRows);
  dayPlan.verificationLocked = true;
  delete uiState.verificationDraft[selectedVerificationDayId];
  noteDocumentMutation();
  renderAll();
  alert("Day verification saved. School statuses updated.");
}

function onDayVerificationEdit() {
  const selectedVerificationDayId = ensureSelectedVerificationDay(uiState.selectedDayId);
  if (!selectedVerificationDayId) {
    alert("Select a day first.");
    return;
  }
  const dayPlan = state.dayPlans.find((item) => item.id === selectedVerificationDayId);
  if (!dayPlan || !dayPlan.locked) {
    alert("Lock the day plan first.");
    return;
  }
  if (!dayPlan.verificationLocked) {
    alert("Verification is already editable.");
    return;
  }
  dayPlan.verificationLocked = false;
  noteDocumentMutation();
  renderAll();
  alert("Verification unlocked. You can edit and save again.");
}

function onPlannerEdit() {
  const draft = uiState.plannerDraft;
  if (!draft) {
    alert("Select a day first.");
    return;
  }

  const dayPlan = state.dayPlans.find((item) => item.id === draft.dayId);
  if (!dayPlan) {
    alert("Selected day no longer exists.");
    return;
  }

  if (!dayPlan.locked) {
    alert("This day plan is already editable.");
    return;
  }

  dayPlan.locked = false;
  noteDocumentMutation();
  renderAll();
  alert("Day plan unlocked. You can now adjust assignments and save again.");
}

function getPlannerSummaryMetrics(draft) {
  if (!draft) {
    return {
      plannedToday: 0,
      fullyScheduledSelected: 0,
      requiredTablets: 0,
      schoolRows: []
    };
  }

  const availableSet = new Set(draft.availableResearcherIds || []);
  const selectedIds = new Set();
  let plannedToday = 0;

  draft.assignments.forEach((assignment) => {
    if (!availableSet.has(assignment.researcherId)) {
      return;
    }
    assignment.extraPrimaryRows = Array.isArray(assignment.extraPrimaryRows) ? assignment.extraPrimaryRows : [];
    assignment.extraSecondaryRows = Array.isArray(assignment.extraSecondaryRows) ? assignment.extraSecondaryRows : [];

    if (assignment.primarySchoolId) {
      selectedIds.add(assignment.primarySchoolId);
      plannedToday += Number(assignment.primaryClassrooms || 0);
    }
    assignment.extraPrimaryRows.forEach((row) => {
      if (row.schoolId) {
        selectedIds.add(row.schoolId);
        plannedToday += Number(row.classrooms || 0);
      }
    });
    if (assignment.secondarySchoolId) {
      selectedIds.add(assignment.secondarySchoolId);
      plannedToday += Number(assignment.secondaryClassrooms || 0);
    }
    assignment.extraSecondaryRows.forEach((row) => {
      if (row.schoolId) {
        selectedIds.add(row.schoolId);
        plannedToday += Number(row.classrooms || 0);
      }
    });
  });

  const liveUsage = getLiveUsageMapForCurrentDay();
  const schoolRows = [...selectedIds]
    .map((schoolId) => {
      const school = state.schools.find((item) => item.id === schoolId);
      if (!school) {
        return null;
      }
      const used = Number(liveUsage.get(school.id) || 0);
      const capacity = Number(school.classroomCount || 0);
      const maxClassSize = Number(school.maxClassroomSize || 0);
      const remainingRaw = capacity - used;
      const overBy = Math.max(0, used - capacity);
      return {
        schoolId: school.id,
        schoolName: school.name,
        used,
        capacity,
        remaining: Math.max(0, remainingRaw),
        overBy,
        isOver: overBy > 0,
        maxClassSize: Number.isFinite(maxClassSize) ? maxClassSize : 0
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.schoolName.localeCompare(b.schoolName));

  const fullyScheduledSelected = schoolRows.filter((row) => !row.isOver && row.remaining <= 0).length;
  const perResearcher = new Map();
  draft.assignments.forEach((assignment) => {
    if (!availableSet.has(assignment.researcherId) || !assignment.researcherId) {
      return;
    }
    assignment.extraPrimaryRows = Array.isArray(assignment.extraPrimaryRows) ? assignment.extraPrimaryRows : [];
    assignment.extraSecondaryRows = Array.isArray(assignment.extraSecondaryRows) ? assignment.extraSecondaryRows : [];

    const weightedValues = [];
    if (assignment.primarySchoolId) {
      const school = state.schools.find((item) => item.id === assignment.primarySchoolId);
      const size = Number(school?.maxClassroomSize || 0);
      weightedValues.push((Number.isFinite(size) ? size : 0) * (assignment.primarySarmal ? 2 : 1));
    }
    if (assignment.secondarySchoolId) {
      const school = state.schools.find((item) => item.id === assignment.secondarySchoolId);
      const size = Number(school?.maxClassroomSize || 0);
      weightedValues.push((Number.isFinite(size) ? size : 0) * (assignment.secondarySarmal ? 2 : 1));
    }
    assignment.extraPrimaryRows.forEach((row) => {
      if (!row.schoolId) return;
      const school = state.schools.find((item) => item.id === row.schoolId);
      const size = Number(school?.maxClassroomSize || 0);
      weightedValues.push((Number.isFinite(size) ? size : 0) * (row.sarmal ? 2 : 1));
    });
    assignment.extraSecondaryRows.forEach((row) => {
      if (!row.schoolId) return;
      const school = state.schools.find((item) => item.id === row.schoolId);
      const size = Number(school?.maxClassroomSize || 0);
      weightedValues.push((Number.isFinite(size) ? size : 0) * (row.sarmal ? 2 : 1));
    });

    const rowMax = weightedValues.length ? Math.max(...weightedValues) : 0;
    const current = perResearcher.get(assignment.researcherId) || 0;
    perResearcher.set(assignment.researcherId, Math.max(current, rowMax));
  });

  const requiredTablets = [...perResearcher.values()].reduce((sum, value) => sum + value, 0);

  return {
    plannedToday,
    fullyScheduledSelected,
    requiredTablets,
    schoolRows
  };
}

function getPlannerRouteInsights(draft) {
  const insights = {
    byAssignment: {},
    researcherTotals: [],
    warnings: []
  };
  if (!draft) {
    return insights;
  }

  const availableSet = new Set(draft.availableResearcherIds || []);
  const researcherMap = getResearcherMap();

  const accommodation = getAccommodationAsPseudoSchool();

  draft.assignments.forEach((assignment) => {
    if (!availableSet.has(assignment.researcherId)) {
      return;
    }
    const orderedRows = getOrderedSchoolRowsForAssignment(assignment);
    const rowHints = {};
    let totalMinutes = 0;
    let hasKnownSegment = false;

    if (accommodation && orderedRows.length > 0) {
      const firstRow = orderedRows[0];
      const accommSegment = getRouteSegmentForSchools(ACCOMMODATION_PSEUDO_ID, firstRow.schoolId);
      if (accommSegment.status === "ok") {
        accommSegment.message = accommSegment.message.replace("Drive:", "From accommodation:");
      } else {
        accommSegment.message = accommSegment.message.replace("Drive:", "From accommodation:");
      }
      rowHints["__accommodation_to_first__"] = accommSegment;
      if (accommSegment.status === "ok" && Number.isFinite(accommSegment.durationMinutes)) {
        totalMinutes += Number(accommSegment.durationMinutes);
        hasKnownSegment = true;
      }
    }

    for (let i = 1; i < orderedRows.length; i += 1) {
      const fromRow = orderedRows[i - 1];
      const toRow = orderedRows[i];
      const segment = getRouteSegmentForSchools(fromRow.schoolId, toRow.schoolId);
      rowHints[fromRow.rowKey] = segment;
      if (segment.status === "ok" && Number.isFinite(segment.durationMinutes)) {
        totalMinutes += Number(segment.durationMinutes);
        hasKnownSegment = true;
      }
      if (segment.status !== "ok") {
        insights.warnings.push(`${fromRow.label} -> ${toRow.label}: ${segment.message}`);
      }
    }

    insights.byAssignment[assignment.id] = rowHints;
    insights.researcherTotals.push({
      researcherId: assignment.researcherId,
      researcherName: researcherMap.get(assignment.researcherId)?.fullName || assignment.researcherId,
      totalMinutes,
      hasKnownSegment
    });
  });

  insights.researcherTotals.sort((a, b) => a.researcherName.localeCompare(b.researcherName));
  return insights;
}

function getOrderedSchoolRowsForAssignment(assignment) {
  const rows = [];
  const schoolMap = getSchoolMap();
  const extraPrimaryRows = Array.isArray(assignment.extraPrimaryRows) ? assignment.extraPrimaryRows : [];
  const extraSecondaryRows = Array.isArray(assignment.extraSecondaryRows) ? assignment.extraSecondaryRows : [];

  if (assignment.primarySchoolId) {
    const school = schoolMap.get(assignment.primarySchoolId);
    rows.push({
      rowKey: "primary",
      schoolId: assignment.primarySchoolId,
      label: school?.name || "Primary school"
    });
  }

  extraPrimaryRows.forEach((row) => {
    if (!row.schoolId) {
      return;
    }
    const school = schoolMap.get(row.schoolId);
    rows.push({
      rowKey: `extraPrimary:${row.id}`,
      schoolId: row.schoolId,
      label: school?.name || "Session 1 extra school"
    });
  });

  if (assignment.secondarySchoolId) {
    const school = schoolMap.get(assignment.secondarySchoolId);
    rows.push({
      rowKey: "secondary",
      schoolId: assignment.secondarySchoolId,
      label: school?.name || "Secondary school"
    });
  }

  extraSecondaryRows.forEach((row) => {
    if (!row.schoolId) {
      return;
    }
    const school = schoolMap.get(row.schoolId);
    rows.push({
      rowKey: `extraSecondary:${row.id}`,
      schoolId: row.schoolId,
      label: school?.name || "Session 2 extra school"
    });
  });

  return rows;
}

function renderRouteHint(assignmentId, rowKey) {
  const routeInsights = uiState.routeInsights;
  if (!routeInsights || !routeInsights.byAssignment || !routeInsights.byAssignment[assignmentId]) {
    return "";
  }
  const info = routeInsights.byAssignment[assignmentId][rowKey];
  if (!info) {
    return "";
  }
  const css = info.status === "ok" ? "route-hint ok" : info.status === "pending" ? "route-hint pending" : "route-hint warn";
  return `<div class="${css}">${escapeHtml(info.message)}</div>`;
}

function getRouteSegmentForSchools(fromSchoolId, toSchoolId) {
  if (!fromSchoolId || !toSchoolId) {
    return { status: "error", message: "route unavailable" };
  }
  if (fromSchoolId === toSchoolId) {
    return { status: "ok", durationMinutes: 0, distanceKm: 0, message: "Drive: 0 min (same school)" };
  }

  const cached = findRouteCacheEntry(fromSchoolId, toSchoolId);
  if (cached && !isRouteCacheStale(cached)) {
    if (cached.status === "ok" && Number.isFinite(cached.durationMinutes)) {
      const distanceText = Number.isFinite(cached.distanceKm) ? ` (${cached.distanceKm.toFixed(1)} km)` : "";
      return {
        status: "ok",
        durationMinutes: cached.durationMinutes,
        distanceKm: cached.distanceKm,
        message: `Drive: ${cached.durationMinutes} min${distanceText}`
      };
    }
    return { status: "error", message: "Drive: unavailable (cached error)" };
  }

  return { status: "error", message: "Drive: unavailable (no cached route)" };
}

function findRouteCacheEntry(fromSchoolId, toSchoolId) {
  return state.routeCache.find((item) => item.fromSchoolId === fromSchoolId && item.toSchoolId === toSchoolId) || null;
}

function isRouteCacheStale(_entry) {
  return false;
}

function upsertRouteCacheEntry(entry) {
  const idx = state.routeCache.findIndex((item) => item.fromSchoolId === entry.fromSchoolId && item.toSchoolId === entry.toSchoolId);
  const normalized = {
    id: idx >= 0 ? state.routeCache[idx].id : generateId("route"),
    fromSchoolId: entry.fromSchoolId,
    toSchoolId: entry.toSchoolId,
    mode: "driving",
    trafficModel: "best_guess",
    durationMinutes: entry.durationMinutes,
    distanceKm: entry.distanceKm,
    status: entry.status,
    fetchedAt: String(entry.fetchedAt || "").trim() || new Date().toISOString(),
    provider: String(entry.provider || "").trim() || "google"
  };
  if (idx >= 0) {
    state.routeCache[idx] = normalized;
  } else {
    state.routeCache.push(normalized);
  }
}

function renderPlannerRows() {
  const draft = uiState.plannerDraft;
  const dayPlan = state.dayPlans.find((item) => item.id === draft.dayId);
  const isLocked = Boolean(dayPlan?.locked);

  if (!draft.availableResearcherIds.length) {
    el.plannerRowsBody.innerHTML = `<tr><td class="empty" colspan="13">No available researchers for this day. Set availability in Researchers.</td></tr>`;
    return;
  }

  const map = getResearcherMap();
  const rowAssignments = draft.assignments.length
    ? draft.assignments
    : draft.availableResearcherIds.map((researcherId) => createDefaultAssignment(draft.dayId, researcherId));

  el.plannerRowsBody.innerHTML = rowAssignments
    .map((assignment) => {
      assignment.extraPrimaryRows = Array.isArray(assignment.extraPrimaryRows) ? assignment.extraPrimaryRows : [];
      assignment.extraSecondaryRows = Array.isArray(assignment.extraSecondaryRows) ? assignment.extraSecondaryRows : [];
      const researcherOptions = buildResearcherOptions(draft, assignment.researcherId);

      const primaryDistrictOptions = buildDistrictOptions("primary", assignment.primaryDistrict, assignment.primarySchoolId, assignment.id, "primary");
      const secondaryDistrictOptions = buildDistrictOptions("secondary", assignment.secondaryDistrict, assignment.secondarySchoolId, assignment.id, "secondary");
      const primaryOptions = buildSchoolOptions("primary", assignment.primaryDistrict, assignment.primarySchoolId, assignment.id, "primary");
      const secondaryOptions = buildSchoolOptions("secondary", assignment.secondaryDistrict, assignment.secondarySchoolId, assignment.id, "secondary");
      const primarySchool = assignment.primarySchoolId ? state.schools.find((item) => item.id === assignment.primarySchoolId) : null;
      const secondarySchool = assignment.secondarySchoolId ? state.schools.find((item) => item.id === assignment.secondarySchoolId) : null;
      const overrideChecked = assignment.overrideEnabled ? "checked" : "";
      const rowSpan = 2 + assignment.extraPrimaryRows.length + assignment.extraSecondaryRows.length;
      const secondaryDisabled = assignment.secondarySchoolId ? "" : "disabled";
      const lockedDisabled = isLocked ? "disabled" : "";
      const primarySarmalChecked = assignment.primarySarmal ? "checked" : "";
      const secondarySarmalChecked = assignment.secondarySarmal ? "checked" : "";
      const accommodationRouteHint = renderRouteHint(assignment.id, "__accommodation_to_first__");
      const primaryRouteHint = renderRouteHint(assignment.id, "primary");
      const secondaryRouteHint = renderRouteHint(assignment.id, "secondary");

      const extraPrimaryRowsHtml = assignment.extraPrimaryRows
        .map((row) => {
          const districtOptions = buildDistrictOptions("primary", row.district, row.schoolId, assignment.id, "extraPrimary");
          const schoolOptions = buildSchoolOptions("primary", row.district, row.schoolId, assignment.id, "extraPrimary");
          const school = row.schoolId ? state.schools.find((item) => item.id === row.schoolId) : null;
          const routeHint = renderRouteHint(assignment.id, `extraPrimary:${row.id}`);
          return `
            <tr class="planner-row planner-row-extra-primary" data-assignment-id="${assignment.id}">
              <td class="planner-session-cell session-secondary">1</td>
              <td>
                <select data-slot-kind="extraPrimary" data-slot-id="${row.id}" data-field="district" ${lockedDisabled}>
                  <option value="">Select district</option>
                  ${districtOptions}
                </select>
              </td>
              <td>
                <select data-slot-kind="extraPrimary" data-slot-id="${row.id}" data-field="schoolId" ${lockedDisabled}>
                  <option value="">Select school</option>
                  ${schoolOptions}
                </select>
                ${routeHint}
              </td>
              <td class="planner-classrooms-cell"><input type="number" min="1" step="1" data-slot-kind="extraPrimary" data-slot-id="${row.id}" data-field="classrooms" value="${Number(row.classrooms || 0)}" ${lockedDisabled}></td>
              <td>${escapeHtml(school?.workingHours || "")}</td>
              <td>${escapeHtml(school?.lunchBreak || "")}</td>
              <td>${escapeHtml(formatDurationCompact(school?.lectureDuration || ""))}</td>
              <td>${escapeHtml(school?.maxClassroomSize ?? "")}</td>
              <td><input type="checkbox" data-slot-kind="extraPrimary" data-slot-id="${row.id}" data-field="sarmal" ${row.sarmal ? "checked" : ""} ${lockedDisabled}></td>
              <td class="planner-extra-cell">
                <button type="button" class="ghost planner-inline-btn" data-action="remove-extra-primary" data-assignment-id="${assignment.id}" data-slot-id="${row.id}" ${lockedDisabled}>-</button>
                <button type="button" class="ghost planner-inline-btn" data-action="add-extra-primary" data-assignment-id="${assignment.id}" ${lockedDisabled}>+</button>
              </td>
            </tr>
          `;
        })
        .join("");

      const extraSecondaryRowsHtml = assignment.extraSecondaryRows
        .map((row) => {
          const districtOptions = buildDistrictOptions("secondary", row.district, row.schoolId, assignment.id, "extraSecondary");
          const schoolOptions = buildSchoolOptions("secondary", row.district, row.schoolId, assignment.id, "extraSecondary");
          const school = row.schoolId ? state.schools.find((item) => item.id === row.schoolId) : null;
          const routeHint = renderRouteHint(assignment.id, `extraSecondary:${row.id}`);
          return `
            <tr class="planner-row planner-row-extra-secondary" data-assignment-id="${assignment.id}">
              <td class="planner-session-cell session-secondary">2</td>
              <td>
                <select data-slot-kind="extraSecondary" data-slot-id="${row.id}" data-field="district" ${lockedDisabled}>
                  <option value="">Select district</option>
                  ${districtOptions}
                </select>
              </td>
              <td>
                <select data-slot-kind="extraSecondary" data-slot-id="${row.id}" data-field="schoolId" ${lockedDisabled}>
                  <option value="">Select school</option>
                  ${schoolOptions}
                </select>
                ${routeHint}
              </td>
              <td class="planner-classrooms-cell"><input type="number" min="1" step="1" data-slot-kind="extraSecondary" data-slot-id="${row.id}" data-field="classrooms" value="${Number(row.classrooms || 0)}" ${lockedDisabled}></td>
              <td>${escapeHtml(school?.workingHours || "")}</td>
              <td>${escapeHtml(school?.lunchBreak || "")}</td>
              <td>${escapeHtml(formatDurationCompact(school?.lectureDuration || ""))}</td>
              <td>${escapeHtml(school?.maxClassroomSize ?? "")}</td>
              <td><input type="checkbox" data-slot-kind="extraSecondary" data-slot-id="${row.id}" data-field="sarmal" ${row.sarmal ? "checked" : ""} ${lockedDisabled}></td>
              <td class="planner-extra-cell">
                <button type="button" class="ghost planner-inline-btn" data-action="remove-extra-secondary" data-assignment-id="${assignment.id}" data-slot-id="${row.id}" ${lockedDisabled}>-</button>
                <button type="button" class="ghost planner-inline-btn" data-action="add-extra-secondary" data-assignment-id="${assignment.id}" ${lockedDisabled}>+</button>
              </td>
            </tr>
          `;
        })
        .join("");

      return `
        <tr class="planner-row planner-row-primary" data-assignment-id="${assignment.id}">
          <td rowspan="${rowSpan}">
            <select data-field="researcherId" ${lockedDisabled}>
              ${researcherOptions}
            </select>
          </td>
          <td class="planner-session-cell">1</td>
          <td>
            <select data-field="primaryDistrict" ${lockedDisabled}>
              <option value="">Select district</option>
              ${primaryDistrictOptions}
            </select>
          </td>
          <td>
            <select data-field="primarySchoolId" ${lockedDisabled}>
              <option value="">Select primary school</option>
              ${primaryOptions}
            </select>
            ${accommodationRouteHint}
            ${primaryRouteHint}
          </td>
          <td class="planner-classrooms-cell"><input type="number" min="1" step="1" data-field="primaryClassrooms" value="${Number(assignment.primaryClassrooms || 0)}" ${lockedDisabled}></td>
          <td>${escapeHtml(primarySchool?.workingHours || "")}</td>
          <td>${escapeHtml(primarySchool?.lunchBreak || "")}</td>
          <td>${escapeHtml(formatDurationCompact(primarySchool?.lectureDuration || ""))}</td>
          <td>${escapeHtml(primarySchool?.maxClassroomSize ?? "")}</td>
          <td><input type="checkbox" data-field="primarySarmal" ${primarySarmalChecked} ${lockedDisabled}></td>
          <td rowspan="${rowSpan}" class="planner-notes-cell">
            <button
              type="button"
              class="ghost planner-note-btn ${assignment.notes ? "has-note" : ""}"
              data-action="edit-note"
              data-assignment-id="${assignment.id}"
              title="${assignment.notes ? "Edit existing note" : "Add note"}"
              ${lockedDisabled}
            >
              Note
            </button>
          </td>
          <td rowspan="${rowSpan}"><input type="checkbox" data-field="overrideEnabled" ${overrideChecked} ${lockedDisabled}></td>
          <td class="planner-extra-cell"><button type="button" class="ghost planner-inline-btn" data-action="add-extra-primary" data-assignment-id="${assignment.id}" ${lockedDisabled}>+</button></td>
        </tr>
        ${extraPrimaryRowsHtml}
        <tr class="planner-row planner-row-secondary" data-assignment-id="${assignment.id}">
          <td class="planner-session-cell session-secondary">2</td>
          <td>
            <select data-field="secondaryDistrict" ${lockedDisabled}>
              <option value="">Select district</option>
              ${secondaryDistrictOptions}
            </select>
          </td>
          <td>
            <select data-field="secondarySchoolId" ${lockedDisabled}>
              <option value="">None</option>
              ${secondaryOptions}
            </select>
            ${secondaryRouteHint}
          </td>
          <td class="planner-classrooms-cell"><input type="number" min="0" step="1" data-field="secondaryClassrooms" value="${Number(assignment.secondaryClassrooms || 0)}" ${secondaryDisabled} ${lockedDisabled}></td>
          <td>${escapeHtml(secondarySchool?.workingHours || "")}</td>
          <td>${escapeHtml(secondarySchool?.lunchBreak || "")}</td>
          <td>${escapeHtml(formatDurationCompact(secondarySchool?.lectureDuration || ""))}</td>
          <td>${escapeHtml(secondarySchool?.maxClassroomSize ?? "")}</td>
          <td><input type="checkbox" data-field="secondarySarmal" ${secondarySarmalChecked} ${lockedDisabled}></td>
          <td class="planner-extra-cell"><button type="button" class="ghost planner-inline-btn" data-action="add-extra-secondary" data-assignment-id="${assignment.id}" ${lockedDisabled}>+</button></td>
        </tr>
        ${extraSecondaryRowsHtml}
      `;
    })
    .join("");
}

function buildResearcherOptions(draft, currentResearcherId) {
  const map = getResearcherMap();
  const availableResearchers = [...draft.availableResearcherIds]
    .map((id) => map.get(id))
    .filter(Boolean)
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  const options = availableResearchers.map((researcher) => {
    const selected = researcher.id === currentResearcherId ? "selected" : "";
    return `<option value="${researcher.id}" ${selected}>${escapeHtml(researcher.fullName)}</option>`;
  });

  if (!currentResearcherId) {
    options.unshift(`<option value="" selected>Select researcher</option>`);
  } else if (!availableResearchers.some((item) => item.id === currentResearcherId)) {
    const currentName = map.get(currentResearcherId)?.fullName || "(Unavailable researcher)";
    options.unshift(`<option value="${escapeHtmlAttr(currentResearcherId)}" selected>${escapeHtml(currentName)}</option>`);
  }

  return options.join("");
}

function buildDistrictOptions(mode, currentDistrict, currentSchoolId, assignmentId = "", slot = "") {
  const isPrimaryMode = mode === "primary";
  const usageMap = getLiveUsageMapForCurrentDay();

  const list = state.schools.filter((school) => {
    const remaining = getSchoolRemainingClassrooms(school, usageMap);
    const canStillAssign = remaining > 0 || school.id === currentSchoolId;
    if (isPrimaryMode) {
      return isPrimarySchoolType(school.schoolType) && canStillAssign;
    }
    return isSecondarySchoolType(school.schoolType) && canStillAssign;
  });

  const districtSet = new Set(list.map((school) => school.district).filter(Boolean));
  if (currentDistrict) {
    districtSet.add(currentDistrict);
  }

  return [...districtSet]
    .sort((a, b) => a.localeCompare(b))
    .map((district) => {
      const selected = district === currentDistrict ? "selected" : "";
      return `<option value="${escapeHtmlAttr(district)}" ${selected}>${escapeHtml(district)}</option>`;
    })
    .join("");
}

function buildSchoolOptions(mode, selectedDistrict, currentSchoolId, assignmentId = "", slot = "") {
  const isPrimaryMode = mode === "primary";
  const usageMap = getLiveUsageMapForCurrentDay();
  const list = state.schools.filter((school) => {
    const remaining = getSchoolRemainingClassrooms(school, usageMap);
    const canStillAssign = remaining > 0 || school.id === currentSchoolId;
    const districtMatch = !selectedDistrict || school.district === selectedDistrict;
    if (isPrimaryMode) {
      return isPrimarySchoolType(school.schoolType) && canStillAssign && districtMatch;
    }
    return isSecondarySchoolType(school.schoolType) && canStillAssign && districtMatch;
  });

  const selectedSchool = currentSchoolId ? state.schools.find((item) => item.id === currentSchoolId) : null;
  const isCurrentInFilteredList = Boolean(currentSchoolId) && list.some((item) => item.id === currentSchoolId);
  const needsExtraOption = Boolean(currentSchoolId) && !isCurrentInFilteredList;

  const options = [...list].sort((a, b) => a.name.localeCompare(b.name)).map((school) => {
    const selected = school.id === currentSchoolId ? "selected" : "";
    const remaining = getSchoolRemainingClassrooms(school, usageMap);
    return `<option value="${school.id}" ${selected}>${escapeHtml(school.name)} (${escapeHtml(school.schoolType)}) - ${remaining} left</option>`;
  });

  if (needsExtraOption) {
    if (selectedSchool) {
      const remaining = getSchoolRemainingClassrooms(selectedSchool, usageMap);
      options.unshift(`<option value="${currentSchoolId}" selected>${escapeHtml(selectedSchool.name)} (${escapeHtml(selectedSchool.schoolType)}) - ${remaining} left</option>`);
    } else {
      options.unshift(`<option value="${currentSchoolId}" selected>(Deleted school)</option>`);
    }
  }

  return options.join("");
}

function onPlannerRowFieldChange(event) {
  const row = event.target.closest(".planner-row");
  if (!row || !uiState.plannerDraft) {
    return;
  }

  const dayPlan = state.dayPlans.find((item) => item.id === uiState.plannerDraft.dayId);
  if (dayPlan && dayPlan.locked) {
    return;
  }

  const assignmentId = row.dataset.assignmentId;
  const field = event.target.dataset.field;
  if (!assignmentId || !field) {
    return;
  }

  const assignment = uiState.plannerDraft.assignments.find((item) => item.id === assignmentId);
  if (!assignment) {
    return;
  }

  assignment.extraPrimaryRows = Array.isArray(assignment.extraPrimaryRows) ? assignment.extraPrimaryRows : [];
  assignment.extraSecondaryRows = Array.isArray(assignment.extraSecondaryRows) ? assignment.extraSecondaryRows : [];

  const slotKind = String(event.target.dataset.slotKind || "");
  const slotId = String(event.target.dataset.slotId || "");
  if (
    field === "researcherId" ||
    field === "primarySchoolId" ||
    field === "secondarySchoolId" ||
    field === "primaryDistrict" ||
    field === "secondaryDistrict"
  ) {
    assignment[field] = String(event.target.value || "").trim();
  } else if (field === "primaryClassrooms" || field === "secondaryClassrooms") {
    assignment[field] = Number(event.target.value || 0);
  } else if (field === "overrideEnabled") {
    assignment.overrideEnabled = Boolean(event.target.checked);
  } else if (field === "primarySarmal" || field === "secondarySarmal") {
    assignment[field] = Boolean(event.target.checked);
  }

  if (slotKind && slotId) {
    const slots = slotKind === "extraPrimary" ? assignment.extraPrimaryRows : assignment.extraSecondaryRows;
    const slot = slots.find((item) => item.id === slotId);
    if (slot) {
      if (field === "district" || field === "schoolId") {
        slot[field] = String(event.target.value || "").trim();
      } else if (field === "classrooms") {
        slot.classrooms = Number(event.target.value || 0);
      } else if (field === "sarmal") {
        slot.sarmal = Boolean(event.target.checked);
      }

      if (field === "schoolId") {
        const school = slot.schoolId ? state.schools.find((item) => item.id === slot.schoolId) : null;
        slot.district = school?.district || slot.district || "";
        if (slot.schoolId) {
          if (!slot.classrooms || slot.classrooms < 1) {
            slot.classrooms = 1;
          }
        } else {
          slot.classrooms = 0;
          slot.district = "";
        }
      }

      if (field === "district") {
        const school = slot.schoolId ? state.schools.find((item) => item.id === slot.schoolId) : null;
        if (school && school.district !== slot.district) {
          slot.schoolId = "";
          slot.classrooms = 0;
        }
      }
    }
  }

  if (field === "secondarySchoolId") {
    const secondarySchool = assignment.secondarySchoolId
      ? state.schools.find((item) => item.id === assignment.secondarySchoolId)
      : null;
    assignment.secondaryDistrict = secondarySchool?.district || assignment.secondaryDistrict || "";
    if (assignment.secondarySchoolId) {
      if (!assignment.secondaryClassrooms || assignment.secondaryClassrooms < 1) {
        assignment.secondaryClassrooms = 1;
      }
    } else {
      assignment.secondaryClassrooms = 0;
    }
  }

  if (field === "primarySchoolId") {
    const primarySchool = assignment.primarySchoolId
      ? state.schools.find((item) => item.id === assignment.primarySchoolId)
      : null;
    assignment.primaryDistrict = primarySchool?.district || assignment.primaryDistrict || "";
  }

  if (field === "primaryDistrict") {
    const selectedSchool = assignment.primarySchoolId ? state.schools.find((item) => item.id === assignment.primarySchoolId) : null;
    if (selectedSchool && selectedSchool.district !== assignment.primaryDistrict) {
      assignment.primarySchoolId = "";
    }
  }

  if (field === "secondaryDistrict") {
    const selectedSchool = assignment.secondarySchoolId ? state.schools.find((item) => item.id === assignment.secondarySchoolId) : null;
    if (selectedSchool && selectedSchool.district !== assignment.secondaryDistrict) {
      assignment.secondarySchoolId = "";
      assignment.secondaryClassrooms = 0;
    }
  }

  uiState.plannerDirty = true;
  persistCurrentPlannerDraft();
  renderPlanner();
}

function onPlannerRowClick(event) {
  const addRemoveBtn = event.target.closest(
    "[data-action='add-extra-primary'], [data-action='remove-extra-primary'], [data-action='add-extra-secondary'], [data-action='remove-extra-secondary']"
  );
  if (addRemoveBtn) {
    const assignmentId = String(addRemoveBtn.dataset.assignmentId || "");
    const slotId = String(addRemoveBtn.dataset.slotId || "");
    const draft = uiState.plannerDraft;
    if (!assignmentId || !draft) {
      return;
    }

    const dayPlan = state.dayPlans.find((item) => item.id === draft.dayId);
    if (dayPlan?.locked) {
      return;
    }

    const assignment = draft.assignments.find((item) => item.id === assignmentId);
    if (!assignment) {
      return;
    }

    assignment.extraPrimaryRows = Array.isArray(assignment.extraPrimaryRows) ? assignment.extraPrimaryRows : [];
    assignment.extraSecondaryRows = Array.isArray(assignment.extraSecondaryRows) ? assignment.extraSecondaryRows : [];

    if (addRemoveBtn.dataset.action === "add-extra-primary") {
      assignment.extraPrimaryRows.push({
        id: generateId("slot"),
        district: "",
        schoolId: "",
        classrooms: 1,
        sarmal: false
      });
    } else if (addRemoveBtn.dataset.action === "remove-extra-primary") {
      assignment.extraPrimaryRows = assignment.extraPrimaryRows.filter((item) => item.id !== slotId);
    } else if (addRemoveBtn.dataset.action === "add-extra-secondary") {
      assignment.extraSecondaryRows.push({
        id: generateId("slot"),
        district: "",
        schoolId: "",
        classrooms: 1,
        sarmal: false
      });
    } else if (addRemoveBtn.dataset.action === "remove-extra-secondary") {
      assignment.extraSecondaryRows = assignment.extraSecondaryRows.filter((item) => item.id !== slotId);
    }

    uiState.plannerDirty = true;
    persistCurrentPlannerDraft();
    renderPlanner();
    return;
  }

  const button = event.target.closest("[data-action='edit-note']");
  if (!button) {
    return;
  }
  const assignmentId = String(button.dataset.assignmentId || "");
  if (!assignmentId) {
    return;
  }
  openPlannerNoteEditor(assignmentId);
}


function openPlannerNoteEditor(assignmentId) {
  const draft = uiState.plannerDraft;
  if (!draft) {
    return;
  }

  const dayPlan = state.dayPlans.find((item) => item.id === draft.dayId);
  if (dayPlan?.locked) {
    return;
  }

  const assignment = draft.assignments.find((item) => item.id === assignmentId);
  if (!assignment) {
    return;
  }

  const researcher = state.researchers.find((item) => item.id === assignment.researcherId);
  const researcherName = researcher?.fullName || "Researcher";
  uiState.noteEditorAssignmentId = assignmentId;
  el.plannerNoteTitle.textContent = `${researcherName} - Notes`;
  el.plannerNoteInput.value = assignment.notes || "";
  el.plannerNoteModal.hidden = false;
  el.plannerNoteInput.focus();
}

function closePlannerNoteEditor() {
  uiState.noteEditorAssignmentId = "";
  el.plannerNoteModal.hidden = true;
  el.plannerNoteInput.value = "";
}

function onPlannerNoteSave() {
  const draft = uiState.plannerDraft;
  if (!draft || !uiState.noteEditorAssignmentId) {
    closePlannerNoteEditor();
    return;
  }

  const dayPlan = state.dayPlans.find((item) => item.id === draft.dayId);
  if (dayPlan?.locked) {
    closePlannerNoteEditor();
    return;
  }

  const assignment = draft.assignments.find((item) => item.id === uiState.noteEditorAssignmentId);
  if (!assignment) {
    closePlannerNoteEditor();
    return;
  }

  assignment.notes = String(el.plannerNoteInput.value || "").trim();
  uiState.plannerDirty = true;
  persistCurrentPlannerDraft();
  closePlannerNoteEditor();
  renderPlanner();
}

function clonePlannerDraft(draft) {
  return JSON.parse(JSON.stringify(draft));
}

function persistCurrentPlannerDraft() {
  const draft = uiState.plannerDraft;
  if (!draft || !draft.dayId) {
    return;
  }
  uiState.plannerDraftCache[getPlannerDraftCacheKey(draft.dayId)] = {
    draft: clonePlannerDraft(draft),
    dirty: Boolean(uiState.plannerDirty)
  };
}

function validatePlannerDraft(draft, routeInsights = null) {
  const errors = [];
  const warnings = [];
  const cleanupAssignmentIds = [];
  const capacityUsage = new Map();

  if (!draft) {
    return { errors, warnings, cleanupAssignmentIds, capacityRows: [] };
  }

  const researcherMap = getResearcherMap();
  const schoolMap = getSchoolMap();
  const liveUsage = getLiveUsageMapForCurrentDay();
  const availableSet = new Set(draft.availableResearcherIds);
  const committedOtherDaysUsage = getCommittedSchoolUsageMap(draft.dayId);

  draft.assignments.forEach((assignment) => {
    if (!assignment.researcherId) {
      errors.push(`Assignment ${assignment.id}: researcher is required.`);
      return;
    }
    const researcher = researcherMap.get(assignment.researcherId);
    if (!researcher) {
      errors.push(`Assignment ${assignment.id} references a deleted researcher.`);
      return;
    }

    if (!availableSet.has(assignment.researcherId)) {
      cleanupAssignmentIds.push(assignment.id);
      return;
    }

    validateAssignment(assignment, researcher, schoolMap, errors, warnings, capacityUsage);
  });

  const counts = new Map();
  draft.assignments.forEach((assignment) => {
    if (!assignment.researcherId || !availableSet.has(assignment.researcherId)) {
      return;
    }
    counts.set(assignment.researcherId, (counts.get(assignment.researcherId) || 0) + 1);
  });
  draft.availableResearcherIds.forEach((researcherId) => {
    const name = researcherMap.get(researcherId)?.fullName || researcherId;
    const count = counts.get(researcherId) || 0;
    if (count === 0) {
      errors.push(`${name}: missing row assignment for this day.`);
    } else if (count > 1) {
      errors.push(`${name}: appears ${count} times. Each researcher must be entered exactly once per day.`);
    }
  });

  const capacityRows = [];
  capacityUsage.forEach((usedClassrooms, schoolId) => {
    const school = schoolMap.get(schoolId);
    if (!school) {
      errors.push(`Capacity check failed: assignment references deleted school (${schoolId}).`);
      return;
    }

    const capacity = Number(school.classroomCount || 0);
    capacityRows.push({ schoolName: school.name, usedClassrooms, capacity });

    if (usedClassrooms > capacity) {
      errors.push(`${school.name}: planned classrooms ${usedClassrooms} exceeds school capacity ${capacity}.`);
    }
  });

  const globalUsage = new Map(committedOtherDaysUsage);
  capacityUsage.forEach((usedClassrooms, schoolId) => {
    globalUsage.set(schoolId, (globalUsage.get(schoolId) || 0) + usedClassrooms);
  });

  globalUsage.forEach((usedClassrooms, schoolId) => {
    const school = schoolMap.get(schoolId);
    if (!school) {
      return;
    }
    const capacity = Number(school.classroomCount || 0);
    if (usedClassrooms > capacity) {
      errors.push(`${school.name}: total assigned classrooms across all saved day plans would be ${usedClassrooms}/${capacity}.`);
    }
  });

  const selectedSchoolIds = new Set();
  draft.assignments.forEach((assignment) => {
    if (!availableSet.has(assignment.researcherId)) {
      return;
    }
    assignment.extraPrimaryRows = Array.isArray(assignment.extraPrimaryRows) ? assignment.extraPrimaryRows : [];
    assignment.extraSecondaryRows = Array.isArray(assignment.extraSecondaryRows) ? assignment.extraSecondaryRows : [];
    if (assignment.primarySchoolId) {
      selectedSchoolIds.add(assignment.primarySchoolId);
    }
    assignment.extraPrimaryRows.forEach((row) => {
      if (row.schoolId) {
        selectedSchoolIds.add(row.schoolId);
      }
    });
    if (assignment.secondarySchoolId) {
      selectedSchoolIds.add(assignment.secondarySchoolId);
    }
    assignment.extraSecondaryRows.forEach((row) => {
      if (row.schoolId) {
        selectedSchoolIds.add(row.schoolId);
      }
    });
  });

  const perResearcherTablets = new Map();
  draft.assignments.forEach((assignment) => {
    if (!availableSet.has(assignment.researcherId)) {
      return;
    }

    const weightedValues = [];
    if (assignment.primarySchoolId) {
      const school = schoolMap.get(assignment.primarySchoolId);
      const size = Number(school?.maxClassroomSize || 0);
      weightedValues.push((Number.isFinite(size) ? size : 0) * (assignment.primarySarmal ? 2 : 1));
    }
    if (assignment.secondarySchoolId) {
      const school = schoolMap.get(assignment.secondarySchoolId);
      const size = Number(school?.maxClassroomSize || 0);
      weightedValues.push((Number.isFinite(size) ? size : 0) * (assignment.secondarySarmal ? 2 : 1));
    }
    assignment.extraPrimaryRows.forEach((row) => {
      if (!row.schoolId) return;
      const school = schoolMap.get(row.schoolId);
      const size = Number(school?.maxClassroomSize || 0);
      weightedValues.push((Number.isFinite(size) ? size : 0) * (row.sarmal ? 2 : 1));
    });
    assignment.extraSecondaryRows.forEach((row) => {
      if (!row.schoolId) return;
      const school = schoolMap.get(row.schoolId);
      const size = Number(school?.maxClassroomSize || 0);
      weightedValues.push((Number.isFinite(size) ? size : 0) * (row.sarmal ? 2 : 1));
    });

    const researcherMax = weightedValues.length ? Math.max(...weightedValues) : 0;
    perResearcherTablets.set(
      assignment.researcherId,
      Math.max(perResearcherTablets.get(assignment.researcherId) || 0, researcherMax)
    );
  });
  const requiredTablets = [...perResearcherTablets.values()].reduce((sum, value) => sum + value, 0);
  if (requiredTablets > 480) {
    errors.push(`Required tablets ${requiredTablets} exceeds daily limit 480.`);
  }

  const routeWarnings = routeInsights?.warnings || getPlannerRouteInsights(draft).warnings;
  routeWarnings.forEach((warning) => {
    warnings.push(`Route: ${warning}`);
  });

  return { errors, warnings, cleanupAssignmentIds, capacityRows };
}

function validateAssignment(assignment, researcher, schoolMap, errors, warnings, capacityUsage) {
  const label = researcher.fullName;
  assignment.extraPrimaryRows = Array.isArray(assignment.extraPrimaryRows) ? assignment.extraPrimaryRows : [];
  assignment.extraSecondaryRows = Array.isArray(assignment.extraSecondaryRows) ? assignment.extraSecondaryRows : [];
  let session1TotalClassrooms = 0;
  let session1HasSarmal = false;

  if (!assignment.primarySchoolId) {
    errors.push(`${label}: primary school is required.`);
    return;
  }

  const primarySchool = schoolMap.get(assignment.primarySchoolId);
  if (!primarySchool) {
    errors.push(`${label}: primary school was deleted.`);
    return;
  }

  if (!Number.isInteger(assignment.primaryClassrooms) || assignment.primaryClassrooms < 1) {
    errors.push(`${label}: primary classrooms must be 1 or more.`);
  }
  if (Number.isFinite(Number(assignment.primaryClassrooms)) && Number(assignment.primaryClassrooms) > 0) {
    session1TotalClassrooms += Number(assignment.primaryClassrooms);
    if (assignment.primarySarmal) {
      session1HasSarmal = true;
    }
  }

  if (!assignment.overrideEnabled) {
    if (!isPrimarySchoolType(primarySchool.schoolType)) {
      errors.push(`${label}: primary school must be Sabahci or Tam gun when override is off.`);
    }
  }

  addCapacityUsage(capacityUsage, assignment.primarySchoolId, assignment.primaryClassrooms);

  assignment.extraPrimaryRows.forEach((row) => {
    if (!row.schoolId) {
      return;
    }
    const school = schoolMap.get(row.schoolId);
    if (!school) {
      errors.push(`${label}: an extra session-1 school was deleted.`);
    }
    if (!Number.isInteger(row.classrooms) || row.classrooms < 1) {
      errors.push(`${label}: extra session-1 classrooms must be 1 or more.`);
    }
    if (!assignment.overrideEnabled && (!school || !isPrimarySchoolType(school.schoolType))) {
      errors.push(`${label}: extra session-1 schools must be Sabahci or Tam gun when override is off.`);
    }
    if (Number.isFinite(Number(row.classrooms)) && Number(row.classrooms) > 0) {
      session1TotalClassrooms += Number(row.classrooms);
      if (row.sarmal) {
        session1HasSarmal = true;
      }
    }
    addCapacityUsage(capacityUsage, row.schoolId, row.classrooms);
  });

  if (!assignment.overrideEnabled && session1TotalClassrooms > 3 && !session1HasSarmal) {
    errors.push(`${label}: session-1 classrooms exceed 3, so select Sarmal or enable override.`);
  }

  if (assignment.secondarySchoolId) {
    const secondarySchool = schoolMap.get(assignment.secondarySchoolId);
    if (!secondarySchool) {
      errors.push(`${label}: secondary school was deleted.`);
    }

    if (!Number.isInteger(assignment.secondaryClassrooms) || assignment.secondaryClassrooms < 1) {
      errors.push(`${label}: secondary classrooms must be 1 or more when secondary school is selected.`);
    }

    if (!assignment.overrideEnabled) {
      if (!secondarySchool || !isSecondarySchoolType(secondarySchool.schoolType)) {
        errors.push(`${label}: secondary school must be Oglenci when override is off.`);
      }
    }

    if (assignment.primarySchoolId && assignment.primarySchoolId === assignment.secondarySchoolId) {
      if (!assignment.overrideEnabled) {
        errors.push(`${label}: primary and secondary school cannot be the same unless override is enabled.`);
      }
      warnings.push(`${label}: primary and secondary are the same school (override).`);
    }

    if (assignment.extraPrimaryRows.some((row) => row.schoolId && row.schoolId === assignment.secondarySchoolId)) {
      warnings.push(`${label}: extra session-1 and session-2 are the same school.`);
    }

    addCapacityUsage(capacityUsage, assignment.secondarySchoolId, assignment.secondaryClassrooms);
  }

  assignment.extraSecondaryRows.forEach((row) => {
    if (!row.schoolId) {
      return;
    }
    const school = schoolMap.get(row.schoolId);
    if (!school) {
      errors.push(`${label}: an extra session-2 school was deleted.`);
    }
    if (!Number.isInteger(row.classrooms) || row.classrooms < 1) {
      errors.push(`${label}: extra session-2 classrooms must be 1 or more.`);
    }
    if (!assignment.overrideEnabled) {
      if (!school || !isSecondarySchoolType(school.schoolType)) {
        errors.push(`${label}: extra session-2 schools must be Oglenci when override is off.`);
      }
    }
    addCapacityUsage(capacityUsage, row.schoolId, row.classrooms);
  });
}

function addCapacityUsage(capacityUsage, schoolId, classrooms) {
  if (!schoolId || !Number.isFinite(classrooms) || classrooms <= 0) {
    return;
  }

  capacityUsage.set(schoolId, (capacityUsage.get(schoolId) || 0) + classrooms);
}

function subtractCapacityUsage(capacityUsage, schoolId, classrooms) {
  if (!schoolId || !Number.isFinite(classrooms) || classrooms <= 0) {
    return;
  }

  const next = (capacityUsage.get(schoolId) || 0) - classrooms;
  if (next <= 0) {
    capacityUsage.delete(schoolId);
    return;
  }
  capacityUsage.set(schoolId, next);
}

function getCommittedSchoolUsageMap(excludeDayId = "") {
  const usage = new Map();
  state.researcherAssignments.forEach((assignment) => {
    if (excludeDayId && assignment.dayId === excludeDayId) {
      return;
    }
    if (assignment.primarySchoolId) {
      addCapacityUsage(usage, assignment.primarySchoolId, Number(assignment.primaryClassrooms || 0));
    }
    const extraPrimaryRows = Array.isArray(assignment.extraPrimaryRows) ? assignment.extraPrimaryRows : [];
    extraPrimaryRows.forEach((row) => {
      if (row.schoolId) {
        addCapacityUsage(usage, row.schoolId, Number(row.classrooms || 0));
      }
    });
    if (assignment.secondarySchoolId) {
      addCapacityUsage(usage, assignment.secondarySchoolId, Number(assignment.secondaryClassrooms || 0));
    }
    const extraSecondaryRows = Array.isArray(assignment.extraSecondaryRows) ? assignment.extraSecondaryRows : [];
    extraSecondaryRows.forEach((row) => {
      if (row.schoolId) {
        addCapacityUsage(usage, row.schoolId, Number(row.classrooms || 0));
      }
    });
  });

  state.schools.forEach((school) => {
    const manualStatus = normalizeManualSchoolStatus(school.manualStatus || "");
    const latest = getLatestSchoolVerificationRecord(school.id, excludeDayId);
    if (manualStatus === "completed") {
      const total = Number(school.classroomCount || 0);
      if (Number.isFinite(total) && total > 0) {
        usage.set(school.id, total);
      }
      return;
    }
    if (manualStatus) {
      return;
    }
    if (!latest) {
      return;
    }
    const total = Number(school.classroomCount || 0);
    if (!Number.isFinite(total) || total < 1) {
      return;
    }
    if (latest.outcome === "completed") {
      usage.set(school.id, total);
      return;
    }
    const remainingLabels = getVerificationRemainingLabels(latest, school);
    const remainingFromLabels = remainingLabels.length;
    const remainingExplicit = Number(latest.remainingClassrooms || 0);
    const remaining = remainingFromLabels > 0
      ? Math.min(total, remainingFromLabels)
      : Math.max(0, Math.min(total, remainingExplicit));
    usage.set(school.id, Math.max(0, total - remaining));
  });

  return usage;
}

function getLiveUsageMapForCurrentDay(excludeAssignmentId = "", excludeSlot = "") {
  const draft = uiState.plannerDraft;
  if (!draft) {
    return getCommittedSchoolUsageMap();
  }

  const usage = getCommittedSchoolUsageMap(draft.dayId);
  const availableSet = new Set(draft.availableResearcherIds || []);

  draft.assignments.forEach((assignment) => {
    if (!availableSet.has(assignment.researcherId)) {
      return;
    }
    const extraPrimaryRows = Array.isArray(assignment.extraPrimaryRows) ? assignment.extraPrimaryRows : [];
    const extraSecondaryRows = Array.isArray(assignment.extraSecondaryRows) ? assignment.extraSecondaryRows : [];
    if (assignment.primarySchoolId) {
      addCapacityUsage(usage, assignment.primarySchoolId, Number(assignment.primaryClassrooms || 0));
    }
    extraPrimaryRows.forEach((row) => {
      if (row.schoolId) {
        addCapacityUsage(usage, row.schoolId, Number(row.classrooms || 0));
      }
    });
    if (assignment.secondarySchoolId) {
      addCapacityUsage(usage, assignment.secondarySchoolId, Number(assignment.secondaryClassrooms || 0));
    }
    extraSecondaryRows.forEach((row) => {
      if (row.schoolId) {
        addCapacityUsage(usage, row.schoolId, Number(row.classrooms || 0));
      }
    });
  });

  if (excludeAssignmentId && excludeSlot) {
    const assignment = draft.assignments.find((item) => item.id === excludeAssignmentId);
    if (assignment) {
      if (excludeSlot === "primary" && assignment.primarySchoolId) {
        subtractCapacityUsage(usage, assignment.primarySchoolId, Number(assignment.primaryClassrooms || 0));
      }
      if (excludeSlot === "extraPrimary") {
        (assignment.extraPrimaryRows || []).forEach((row) => {
          if (row.schoolId) {
            subtractCapacityUsage(usage, row.schoolId, Number(row.classrooms || 0));
          }
        });
      }
      if (excludeSlot === "secondary" && assignment.secondarySchoolId) {
        subtractCapacityUsage(usage, assignment.secondarySchoolId, Number(assignment.secondaryClassrooms || 0));
      }
      if (excludeSlot === "extraSecondary") {
        (assignment.extraSecondaryRows || []).forEach((row) => {
          if (row.schoolId) {
            subtractCapacityUsage(usage, row.schoolId, Number(row.classrooms || 0));
          }
        });
      }
    }
  }

  return usage;
}

function getSchoolRemainingClassrooms(school, usageMap) {
  const capacity = Number(school.classroomCount || 0);
  const used = Number(usageMap.get(school.id) || 0);
  return Math.max(0, capacity - used);
}

function renderPlannerValidation(validation) {
  const blockClass = validation.errors.length ? "validation-box validation-error" : "validation-box";
  el.plannerValidation.className = blockClass;

  const parts = [];

  if (validation.cleanupAssignmentIds.length) {
    parts.push(`<div class="validation-info">${validation.cleanupAssignmentIds.length} assignment(s) are for unavailable researchers and will be removed on save.</div>`);
  }

  if (validation.errors.length) {
    parts.push(`
      <div class="validation-section">
        <strong>Blocking Issues</strong>
        <ul>${validation.errors.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
    `);
  }

  if (validation.warnings.length) {
    parts.push(`
      <div class="validation-section">
        <strong>Warnings</strong>
        <ul>${validation.warnings.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
    `);
  }

  if (!parts.length) {
    parts.push(`<div class="validation-ok">No validation issues.</div>`);
  }

  el.plannerValidation.innerHTML = parts.join("\n");
}

function onPlannerSave() {
  const draft = uiState.plannerDraft;
  if (!draft) {
    alert("Select a day first.");
    return;
  }

  const researcherMap = getResearcherMap();
  const beforeCount = draft.assignments.length;
  draft.assignments = draft.assignments.filter((assignment) => {
    const researcherExists = researcherMap.has(assignment.researcherId);
    if (!researcherExists) {
      return true;
    }
    return draft.availableResearcherIds.includes(assignment.researcherId);
  });
  const cleanedCount = beforeCount - draft.assignments.length;

  const routeInsights = getPlannerRouteInsights(draft);
  const validation = validatePlannerDraft(draft, routeInsights);
  uiState.routeInsights = routeInsights;
  uiState.lastValidation = validation;
  renderPlannerValidation(validation);

  if (validation.errors.length) {
    alert(`Cannot save day plan. Fix ${validation.errors.length} blocking issue(s).`);
    return;
  }

  const dayPlan = state.dayPlans.find((item) => item.id === draft.dayId);
  if (!dayPlan) {
    alert("Selected day no longer exists.");
    return;
  }
  if (dayPlan.locked) {
    alert("This day plan is locked and cannot be changed.");
    return;
  }

  const assignmentsToSave = draft.assignments
    .filter((item) => draft.availableResearcherIds.includes(item.researcherId))
    .map((item) => ({
      id: item.id,
      dayId: item.dayId,
      researcherId: item.researcherId,
      primaryDistrict: item.primaryDistrict || "",
      primarySchoolId: item.primarySchoolId || "",
      primaryClassrooms: Number(item.primaryClassrooms || 0),
      primarySarmal: Boolean(item.primarySarmal),
      secondaryDistrict: item.secondaryDistrict || "",
      secondarySchoolId: item.secondarySchoolId || "",
      secondaryClassrooms: Number(item.secondaryClassrooms || 0),
      secondarySarmal: Boolean(item.secondarySarmal),
      extraPrimaryRows: (Array.isArray(item.extraPrimaryRows) ? item.extraPrimaryRows : []).map((row) => ({
        id: row.id || generateId("slot"),
        district: row.district || "",
        schoolId: row.schoolId || "",
        classrooms: Number(row.classrooms || 0),
        sarmal: Boolean(row.sarmal)
      })),
      extraSecondaryRows: (Array.isArray(item.extraSecondaryRows) ? item.extraSecondaryRows : []).map((row) => ({
        id: row.id || generateId("slot"),
        district: row.district || "",
        schoolId: row.schoolId || "",
        classrooms: Number(row.classrooms || 0),
        sarmal: Boolean(row.sarmal)
      })),
      overrideEnabled: Boolean(item.overrideEnabled),
      overrideReason: String(item.overrideReason || "").trim(),
      notes: String(item.notes || "").trim()
    }));

  state.researcherAssignments = state.researcherAssignments
    .filter((item) => item.dayId !== draft.dayId)
    .concat(assignmentsToSave);
  dayPlan.locked = true;
  upsertFollowUpWarning(createFollowUpWarning(
    "day-verification-pending",
    "Day Verification Pending",
    `The locked day ${formatDate(dayPlan.date)} still needs end-of-day verification.`,
    "operations",
    `day-verification-needed:day:${dayPlan.id}`,
    "dayPlan",
    dayPlan.id
  ));
  delete uiState.plannerDraftCache[getPlannerDraftCacheKey(draft.dayId)];

  loadPlannerDraft(draft.dayId);
  noteDocumentMutation();
  renderAll();

  if (cleanedCount > 0) {
    alert(`Day plan saved to database. Removed ${cleanedCount} assignment(s) for unavailable researchers.`);
    return;
  }
  alert("Day plan saved to database.");
}

function onPlannerPrint() {
  const draft = uiState.plannerDraft;
  if (!draft) {
    alert("Select a day first.");
    return;
  }

  const routeInsights = getPlannerRouteInsights(draft);
  const validation = validatePlannerDraft(draft, routeInsights);
  uiState.routeInsights = routeInsights;
  uiState.lastValidation = validation;
  renderPlannerValidation(validation);

  if (validation.errors.length) {
    alert("Cannot print while there are blocking validation issues.");
    return;
  }

  const dayPlan = state.dayPlans.find((item) => item.id === draft.dayId);
  if (!dayPlan) {
    alert("Selected day no longer exists.");
    return;
  }

  const researcherMap = getResearcherMap();
  const schoolMap = getSchoolMap();
  const liveUsage = getLiveUsageMapForCurrentDay();
  const schoolLabelPools = new Map();
  const schoolLabelOffsets = new Map();

  const researcherBlocks = [...draft.availableResearcherIds]
    .map((researcherId) => {
      const researcher = researcherMap.get(researcherId);
      const assignment = draft.assignments.find((item) => item.researcherId === researcherId);
      return { researcher, assignment };
    })
    .sort((a, b) => (a.researcher?.fullName || "").localeCompare(b.researcher?.fullName || ""));

  const tableRows = researcherBlocks
    .map(({ researcher, assignment }, blockIndex) => {
      if (!assignment) {
        return `
          <tr class="${blockIndex % 2 === 0 ? "print-row-a" : "print-row-b"}">
            <td>${escapeHtml(researcher?.fullName || "(Deleted researcher)")}</td>
            <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
          </tr>
        `;
      }

      const rows = [];
      const pushRow = (sessionLabel, schoolId, district, classrooms, sarmal, rowKey) => {
        if (!schoolId) {
          return;
        }
        const school = schoolMap.get(schoolId);
        const remainingClassrooms = school ? getSchoolRemainingClassroomLabelText(school, liveUsage) : "";
        const maxClassSize = Number(school?.maxClassroomSize || 0);
        let assignedClassroomLabels = "-";
        if (school) {
          const labelsForDay = getAssignableClassroomLabelsForPrintDay(school, dayPlan.date);
          assignedClassroomLabels = labelsForDay.length ? labelsForDay.join(", ") : "-";
        }
        rows.push({
          sessionLabel,
          district: district || school?.district || "",
          schoolName: school?.name || "(Deleted school)",
          schoolCode: school?.schoolCode || "",
          survey: school?.survey || "",
          schoolTotalClassrooms: Number(school?.classroomCount || 0),
          remainingClassrooms,
          assignedClassroomLabels,
          classrooms: Number(classrooms || 0),
          workingHours: school?.workingHours || "",
          lunchBreak: school?.lunchBreak || "",
          duration: formatDurationCompact(school?.lectureDuration || ""),
          maxClassSize: Number.isFinite(maxClassSize) ? maxClassSize : "",
          tabletLabel: Number.isFinite(maxClassSize) && maxClassSize > 0
            ? (sarmal ? `${maxClassSize}*2` : String(maxClassSize))
            : ""
        });
      };

      pushRow("1", assignment.primarySchoolId, assignment.primaryDistrict, assignment.primaryClassrooms, assignment.primarySarmal, "primary");
      (Array.isArray(assignment.extraPrimaryRows) ? assignment.extraPrimaryRows : []).forEach((row) => {
        pushRow("1", row.schoolId, row.district, row.classrooms, row.sarmal, `extraPrimary:${row.id}`);
      });
      pushRow("2", assignment.secondarySchoolId, assignment.secondaryDistrict, assignment.secondaryClassrooms, assignment.secondarySarmal, "secondary");
      (Array.isArray(assignment.extraSecondaryRows) ? assignment.extraSecondaryRows : []).forEach((row) => {
        pushRow("2", row.schoolId, row.district, row.classrooms, row.sarmal, `extraSecondary:${row.id}`);
      });

      if (!rows.length) {
        rows.push({
          sessionLabel: "",
          district: "",
          schoolName: "",
          schoolCode: "",
          survey: "",
          schoolTotalClassrooms: 0,
          remainingClassrooms: "",
          assignedClassroomLabels: "",
          classrooms: "",
          workingHours: "",
          lunchBreak: "",
          duration: "",
          maxClassSize: "",
          tabletLabel: ""
        });
      }
      const researcherTablet = rows.reduce((maxValue, row) => {
        const value = Number(String(row.tabletLabel || "").replace("*2", ""));
        const weighted = String(row.tabletLabel || "").includes("*2") ? value * 2 : value;
        return Math.max(maxValue, Number.isFinite(weighted) ? weighted : 0);
      }, 0);

      return rows
        .map((row, idx) => `
          <tr class="${blockIndex % 2 === 0 ? "print-row-a" : "print-row-b"}">
            ${idx === 0 ? `<td rowspan="${rows.length}">${escapeHtml(researcher?.fullName || "(Deleted researcher)")}</td>` : ""}
            <td>${escapeHtml(row.district)}</td>
            <td class="print-col-school">${escapeHtml(row.schoolName)}</td>
            <td>${escapeHtml(row.schoolCode)}</td>
            <td>${escapeHtml(row.survey)}</td>
            <td>${(() => {
              const total = Number(row.schoolTotalClassrooms || 0);
              const assigned = Number(row.classrooms || 0);
              return Number.isFinite(total) && total > 0 ? `${total}(${assigned})` : String(assigned || "");
            })()}</td>
            <td>${escapeHtml(String(row.assignedClassroomLabels || "-"))}</td>
            <td>${escapeHtml(row.workingHours)}</td>
            <td>${escapeHtml(row.lunchBreak)}</td>
            <td>${escapeHtml(row.duration)}</td>
            <td>${escapeHtml(String(row.maxClassSize ?? ""))}</td>
            ${idx === 0 ? `<td rowspan="${rows.length}">${researcherTablet > 0 ? escapeHtml(String(researcherTablet)) : ""}</td>` : ""}
          </tr>
        `)
        .join("");
    })
    .join("");

  el.printReport.innerHTML = `
    <div class="print-header">
      <h1>Saha Programı - ${escapeHtml(formatDate(dayPlan.date))}</h1>
    </div>
    <table class="print-sheet-table">
      <thead>
        <tr>
          <th>EKIP</th>
          <th>ILCE</th>
          <th class="print-col-school">OKUL</th>
          <th>KOD</th>
          <th>ANKET</th>
          <th>ŞUBE SAYISI</th>
          <th>ŞUBE</th>
          <th>OKUL SAATI</th>
          <th>ÖĞLE ARASI</th>
          <th>DERS SÜRESİ</th>
          <th>MEVCUT</th>
          <th>TABLET</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows || `<tr><td colspan="12">No assignments.</td></tr>`}
      </tbody>
    </table>
    <div class="print-footer">Generated: ${escapeHtml(new Date().toLocaleString())}</div>
  `;

  window.print();
}

function getResearcherMap() {
  return new Map(state.researchers.map((item) => [item.id, item]));
}

function getAvailableResearcherIdsForDay(dayId) {
  const available = state.researchers.filter((researcher) => {
    if (!researcher.active) {
      return false;
    }
    if (researcher.availabilityMode !== "custom") {
      return true;
    }
    return Array.isArray(researcher.availableDayIds) && researcher.availableDayIds.includes(dayId);
  });

  return available.map((item) => item.id);
}

function getSchoolMap() {
  return new Map(state.schools.map((item) => [item.id, item]));
}

function isPrimarySchoolType(type) {
  const normalized = normalizeLookup(type);
  return normalized === "sabahci" || normalized === "tam gun";
}

function isSecondarySchoolType(type) {
  return normalizeLookup(type) === "oglenci";
}

function getComparableNumber(value) {
  if (value === null || typeof value === "undefined" || value === "") {
    return -1;
  }
  return Number(value);
}

function formatOptionalNumber(value) {
  if (value === null || typeof value === "undefined" || value === "") {
    return "";
  }
  return Number(value);
}

function parseDurationMinutes(value) {
  const match = String(value || "").match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function formatDurationCompact(value) {
  const minutes = parseDurationMinutes(value);
  return minutes > 0 ? String(minutes) : "";
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseCsvLine(line) {
  const parts = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      parts.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  parts.push(current);
  return parts.map((item) => item.trim());
}

function normalizeLookup(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("ı", "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeHeaderKey(value) {
  return normalizeLookup(value).replace(/[^a-z0-9]/g, "");
}

function getColumnIndex(header, aliases) {
  const normalizedHeader = header.map((item) => normalizeHeaderKey(item));
  const normalizedAliases = aliases.map((item) => normalizeHeaderKey(item));
  return normalizedHeader.findIndex((item) => normalizedAliases.includes(item));
}

function parseClassroomCount(value) {
  if (typeof value === "number") {
    return value;
  }
  const normalized = String(value || "").trim().replace(",", ".");
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? NaN : parsed;
}

function parseOptionalNumber(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized.replace(",", "."));
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeManualSchoolStatus(value) {
  const normalized = normalizeLookup(value).replace(/\s+/g, "");
  if (normalized === "notscheduled") {
    return "not scheduled";
  }
  if (normalized === "scheduled") {
    return "scheduled";
  }
  if (normalized === "completed") {
    return "completed";
  }
  if (normalized === "incomplete") {
    return "incomplete";
  }
  return "";
}

function normalizeSchoolType(value) {
  const normalized = normalizeLookup(value);
  const condensed = normalized.replace(/\s+/g, "");

  if (normalized === "sabahci" || condensed === "sabahci") {
    return "Sabahci";
  }
  if (normalized === "oglenci" || condensed === "oglenci") {
    return "Oglenci";
  }
  if (normalized === "tam gun" || condensed === "tamgun") {
    return "Tam gun";
  }
  return "";
}

function normalizeLectureDuration(value) {
  const match = String(value || "").match(/(\d+)/);
  if (!match) {
    return "";
  }
  const minutes = Number(match[1]);
  if (minutes !== 30 && minutes !== 35 && minutes !== 40) {
    return "";
  }
  return `${minutes} mins`;
}

function isEmptyCell(value) {
  return String(value ?? "").trim() === "";
}

function isEffectivelyEmptyRow(row) {
  if (!Array.isArray(row) || row.length === 0) {
    return true;
  }
  return row.every((cell) => isEmptyCell(cell));
}

function getSchoolDuplicateKey(name, district) {
  return `${normalizeLookup(name)}::${normalizeLookup(district)}`;
}

function importSchoolsFromRows(rows) {
  if (!getCurrentCity()) {
    alert("Create or select a city first.");
    return null;
  }
  if (!Array.isArray(rows) || rows.length < 2) {
    alert("File must include a header row and at least one data row.");
    return null;
  }

  const header = rows[0].map((cell) => String(cell || "").trim());
  const nameIdx = getColumnIndex(header, ["name", "school", "schoolName"]);
  const districtIdx = getColumnIndex(header, ["district"]);
  const schoolTypeIdx = getColumnIndex(header, ["schoolType", "type", "okulTuru"]);
  const lectureDurationIdx = getColumnIndex(header, ["lectureDuration", "lessonDuration", "lectureMinutes"]);
  const lectureDurationFallbackIdx = getColumnIndex(header, ["dersSuresi", "ders suresi", "ders süresi"]);
  const workingHoursIdx = getColumnIndex(header, ["workingHours", "hours", "working_hours"]);
  const lunchBreakIdx = getColumnIndex(header, ["lunchBreak", "lunch", "break", "lunch_break"]);
  const classroomCountIdx = getColumnIndex(header, ["classroomCount", "classrooms", "numberOfClassrooms"]);
  const maxClassroomSizeIdx = getColumnIndex(header, ["maxClassroomSize", "maxClassSize", "max_csize", "maxClassroomCount"]);
  const classroomListIdx = getColumnIndex(header, ["classroomList", "classroomsList", "classroomNames", "classroomIds"]);
  const schoolCodeIdx = getColumnIndex(header, ["school_id", "schoolId", "kod", "code"]);
  const surveyIdx = getColumnIndex(header, ["survey", "anket"]);
  const notesIdx = getColumnIndex(header, ["notes", "note", "comments"]);
  const addressLineIdx = getColumnIndex(header, ["addressLine", "address", "adres"]);
  const latitudeIdx = getColumnIndex(header, ["latitude", "lat", "enlem"]);
  const longitudeIdx = getColumnIndex(header, ["longitude", "lng", "lon", "boylam"]);
  const cityIdx = getColumnIndex(header, ["city", "il"]);
  const countryIdx = getColumnIndex(header, ["country", "ulke"]);

  if (
    nameIdx < 0 ||
    districtIdx < 0 ||
    schoolTypeIdx < 0 ||
    (lectureDurationIdx < 0 && lectureDurationFallbackIdx < 0) ||
    classroomCountIdx < 0
  ) {
    alert("Missing required columns. Required headers: name, district, schoolType, lectureDuration, classroomCount");
    return null;
  }

  let imported = 0;
  let duplicates = 0;
  let invalid = 0;
  let skippedEmpty = 0;

  const invalidReasons = {
    missingName: 0,
    missingDistrict: 0,
    missingSchoolType: 0,
    missingLectureDuration: 0,
    invalidClassroomCount: 0
  };

  const existingKeys = new Set(state.schools.map((school) => getSchoolDuplicateKey(school.name, school.district)));

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (isEffectivelyEmptyRow(row)) {
      skippedEmpty += 1;
      continue;
    }

    const name = String(row[nameIdx] || "").trim();
    const district = String(row[districtIdx] || "").trim();
    const schoolType = normalizeSchoolType(row[schoolTypeIdx]);
    const primaryLectureDuration = String(lectureDurationIdx >= 0 ? row[lectureDurationIdx] || "" : "").trim();
    const fallbackLectureDuration = String(lectureDurationFallbackIdx >= 0 ? row[lectureDurationFallbackIdx] || "" : "").trim();
    const lectureDuration = normalizeLectureDuration(primaryLectureDuration || fallbackLectureDuration);
    const classroomCount = parseClassroomCount(row[classroomCountIdx]);

    let reason = "";
    if (!name) {
      reason = "missingName";
    } else if (!district) {
      reason = "missingDistrict";
    } else if (!schoolType) {
      reason = "missingSchoolType";
    } else if (!lectureDuration) {
      reason = "missingLectureDuration";
    } else if (Number.isNaN(classroomCount) || classroomCount <= 0) {
      reason = "invalidClassroomCount";
    }

    if (reason) {
      invalid += 1;
      invalidReasons[reason] += 1;
      continue;
    }

    const duplicateKey = getSchoolDuplicateKey(name, district);
    if (existingKeys.has(duplicateKey)) {
      duplicates += 1;
      continue;
    }

    state.schools.push({
      id: generateId("school"),
      name,
      district,
      schoolCode: schoolCodeIdx >= 0 ? String(row[schoolCodeIdx] || "").trim() : "",
      survey: surveyIdx >= 0 ? String(row[surveyIdx] || "").trim() : "",
      schoolType,
      lectureDuration,
      workingHours: workingHoursIdx >= 0 ? String(row[workingHoursIdx] || "").trim() : "",
      lunchBreak: lunchBreakIdx >= 0 ? String(row[lunchBreakIdx] || "").trim() : "",
      classroomCount,
      maxClassroomSize: maxClassroomSizeIdx >= 0 ? parseOptionalNumber(row[maxClassroomSizeIdx]) : null,
      classroomList: classroomListIdx >= 0 ? String(row[classroomListIdx] || "").trim() : "",
      notes: notesIdx >= 0 ? String(row[notesIdx] || "").trim() : "",
      addressLine: addressLineIdx >= 0 ? String(row[addressLineIdx] || "").trim() : "",
      latitude: latitudeIdx >= 0 ? parseOptionalNumber(row[latitudeIdx]) : null,
      longitude: longitudeIdx >= 0 ? parseOptionalNumber(row[longitudeIdx]) : null,
      city: cityIdx >= 0 ? String(row[cityIdx] || "").trim() : "",
      country: countryIdx >= 0 ? String(row[countryIdx] || "").trim() || "TR" : "TR"
    });

    existingKeys.add(duplicateKey);
    imported += 1;
  }

  if (imported > 0) {
    noteDocumentMutation();
    renderAll();
  }

  return { imported, duplicates, invalid, skippedEmpty, invalidReasons };
}

function parseCsvToRows(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => parseCsvLine(line));
}

function parseXlsxToRows(arrayBuffer) {
  if (typeof XLSX === "undefined") {
    throw new Error("XLSX parser not loaded");
  }

  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return [];
  }

  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });
}

async function readRowsFromImportFile(file) {
  if (!file) {
    return [];
  }
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith(".xlsx")) {
    return parseXlsxToRows(await file.arrayBuffer());
  }
  if (fileName.endsWith(".csv")) {
    return parseCsvToRows(await file.text());
  }
  throw new Error("Unsupported file type. Please use .csv or .xlsx");
}

function buildSchoolImportSummary(result, cityName) {
  if (!result) {
    return "";
  }
  const reasonParts = [];
  if (result.invalidReasons.missingSchoolType > 0) {
    reasonParts.push(`schoolType missing/invalid: ${result.invalidReasons.missingSchoolType}`);
  }
  if (result.invalidReasons.missingLectureDuration > 0) {
    reasonParts.push(`lectureDuration missing/invalid: ${result.invalidReasons.missingLectureDuration}`);
  }
  if (result.invalidReasons.invalidClassroomCount > 0) {
    reasonParts.push(`classroomCount invalid: ${result.invalidReasons.invalidClassroomCount}`);
  }
  if (result.invalidReasons.missingName > 0) {
    reasonParts.push(`name missing: ${result.invalidReasons.missingName}`);
  }
  if (result.invalidReasons.missingDistrict > 0) {
    reasonParts.push(`district missing: ${result.invalidReasons.missingDistrict}`);
  }
  const detail = reasonParts.length ? ` Invalid breakdown -> ${reasonParts.join(", ")}.` : "";
  const emptyInfo = result.skippedEmpty > 0 ? ` Ignored empty row(s): ${result.skippedEmpty}.` : "";
  return `Imported ${result.imported} school(s) into ${cityName}. Skipped ${result.duplicates} duplicate(s), ${result.invalid} invalid row(s).${emptyInfo}${detail}`;
}

async function onSchoolsFileImport(event) {
  const [file] = event.target.files;
  if (!file) {
    return;
  }
  if (!getCurrentCity()) {
    uiState.schoolsImportStatus = {
      message: "Create or select a city first.",
      tone: "error"
    };
    renderSchoolsImportStatus();
    alert("Create or select a city first.");
    event.target.value = "";
    return;
  }

  try {
    const rows = await readRowsFromImportFile(file);
    const result = importSchoolsFromRows(rows);
    if (result !== null) {
      const summary = buildSchoolImportSummary(result, getCurrentCity()?.name || "current city");
      uiState.schoolsImportStatus = {
        message: summary,
        tone: "success"
      };
      renderSchoolsImportStatus();
      alert(summary);
    }
  } catch (error) {
    console.error(error);
    const detail = error && error.message ? ` (${error.message})` : "";
    uiState.schoolsImportStatus = {
      message: `School import failed${detail}.`,
      tone: "error"
    };
    renderSchoolsImportStatus();
    alert(`Could not import file. Check format and try again.${detail}`);
  } finally {
    event.target.value = "";
  }
}

function getRouteBuilderSchoolsFromState() {
  return state.schools.map((school) => ({
    id: school.id,
    name: school.name,
    district: school.district,
    latitude: parseOptionalNumber(school.latitude),
    longitude: parseOptionalNumber(school.longitude),
    addressLine: school.addressLine || "",
    city: school.city || "",
    country: school.country || "TR"
  })).filter((school) => school.name && school.district);
}

function hasValidCoordinates(school) {
  const lat = Number(school?.latitude);
  const lng = Number(school?.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng);
}

const ACCOMMODATION_PSEUDO_ID = "__accommodation__";

function getAccommodationAsPseudoSchool() {
  const city = getCurrentCity();
  if (!city) return null;
  const lat = parseOptionalNumber(city.accommodationLatitude);
  const lng = parseOptionalNumber(city.accommodationLongitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    id: ACCOMMODATION_PSEUDO_ID,
    name: "Accommodation",
    district: "",
    latitude: lat,
    longitude: lng,
    addressLine: "",
    city: "",
    country: ""
  };
}

function onAccommodationSave() {
  const city = getCurrentCity();
  if (!city) {
    alert("Select a city first.");
    return;
  }
  const latStr = String(el.accommodationLat.value || "").trim();
  const lngStr = String(el.accommodationLng.value || "").trim();
  const lat = parseOptionalNumber(latStr);
  const lng = parseOptionalNumber(lngStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    alert("Please enter valid latitude and longitude values.");
    return;
  }
  city.accommodationLatitude = lat;
  city.accommodationLongitude = lng;
  noteDocumentMutation();
  renderAccommodationStatus();
  renderCitySetupProgress();
  const hasAccommodationRoutes = city.routeCache.some((entry) => entry.fromSchoolId === ACCOMMODATION_PSEUDO_ID);
  if (!hasAccommodationRoutes && city.routeCache.length > 0) {
    el.accommodationStatus.textContent += " — Re-run Calculate Distances to include accommodation routes.";
  }
}

function onAccommodationClear() {
  const city = getCurrentCity();
  if (!city) return;
  city.accommodationLatitude = null;
  city.accommodationLongitude = null;
  el.accommodationLat.value = "";
  el.accommodationLng.value = "";
  noteDocumentMutation();
  renderAccommodationStatus();
  renderCitySetupProgress();
  renderPlanner();
}

function renderAccommodationStatus() {
  const city = getCurrentCity();
  if (!city) {
    el.accommodationStatus.textContent = "No city selected.";
    return;
  }
  const lat = parseOptionalNumber(city.accommodationLatitude);
  const lng = parseOptionalNumber(city.accommodationLongitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    el.accommodationLat.value = lat;
    el.accommodationLng.value = lng;
    el.accommodationStatus.textContent = `Accommodation set: ${lat}, ${lng}`;
  } else {
    el.accommodationLat.value = "";
    el.accommodationLng.value = "";
    el.accommodationStatus.textContent = "No accommodation set for this city.";
  }
}

async function onRouteBuilderCalculate() {
  if (uiState.routeBuilder.running) {
    alert("Distance calculation is already running.");
    return;
  }
  const schools = getRouteBuilderSchoolsFromState();
  console.log("[DEBUG-ROUTE] First 3 schools from state:", schools.slice(0, 3).map(s => ({ name: s.name, lat: s.latitude, lng: s.longitude })));
  console.log("[DEBUG-ROUTE] Raw state.schools first 3:", state.schools.slice(0, 3).map(s => ({ name: s.name, lat: s.latitude, lng: s.longitude })));
  const missingCoordinateSchools = schools.filter((school) => !hasValidCoordinates(school));
  const apiKey = String(el.routeBuilderApiKey.value || "").trim();
  if (schools.length < 2) {
    alert(`Need at least 2 schools in this session. Current count: ${schools.length}.`);
    renderRouteBuilderStatus("Need at least 2 schools in the Schools table.", "error");
    return;
  }
  if (missingCoordinateSchools.length > 0) {
    const preview = missingCoordinateSchools
      .slice(0, 5)
      .map((school) => school.name)
      .join(", ");
    const suffix = missingCoordinateSchools.length > 5 ? ", ..." : "";
    alert(`Distance calculation requires latitude and longitude for every school. Missing coordinates for ${missingCoordinateSchools.length} school(s): ${preview}${suffix}`);
    renderRouteBuilderStatus(`Missing latitude/longitude for ${missingCoordinateSchools.length} school(s).`, "error");
    return;
  }
  if (!apiKey) {
    alert("Please enter Google Maps API key.");
    renderRouteBuilderStatus("Please enter Google Maps API key.", "error");
    return;
  }

  uiState.routeBuilder.running = true;
  uiState.routeBuilder.schools = schools;
  uiState.routeBuilder.entries = [];
  renderRouteBuilderStatus("Starting distance calculation...", "running");

  const entries = [];
  let completedPairs = 0;
  const totalPairs = schools.length * Math.max(0, schools.length - 1);

  try {
    renderRouteBuilderStatus("Loading Google Maps service...", "running");
    await loadGoogleMapsSdk(apiKey);
    const jobs = [];
    for (let i = 0; i < schools.length; i += 1) {
      const fromSchool = schools[i];
      const destinations = schools.filter((school) => school.id !== fromSchool.id);
      const chunks = chunkList(destinations, 25);
      chunks.forEach((group) => jobs.push({ fromSchool, group }));
    }

    const workerCount = Math.min(ROUTE_BUILDER_MAX_CONCURRENCY, Math.max(1, jobs.length));
    let nextJobIndex = 0;
    const workers = Array.from({ length: workerCount }, async () => {
      const service = new google.maps.DistanceMatrixService();
      while (nextJobIndex < jobs.length) {
        const jobIndex = nextJobIndex;
        nextJobIndex += 1;
        const job = jobs[jobIndex];
        if (!job) {
          continue;
        }
        const result = await fetchDistanceMatrixForBuilder(service, job.fromSchool, job.group);
        const fetchedAt = new Date().toISOString();
        job.group.forEach((toSchool, idx) => {
          const item = result[idx] || { status: "error", durationMinutes: null, distanceKm: null };
          entries.push({
            fromSchoolId: job.fromSchool.id,
            fromSchoolName: job.fromSchool.name,
            fromDistrict: job.fromSchool.district,
            toSchoolId: toSchool.id,
            toSchoolName: toSchool.name,
            toDistrict: toSchool.district,
            durationMinutes: item.durationMinutes,
            distanceKm: item.distanceKm,
            status: item.status,
            fetchedAt,
            provider: "google"
          });
        });
        completedPairs += job.group.length;
        renderRouteBuilderStatus(`Calculating... ${completedPairs}/${totalPairs} school pairs`, "running");
      }
    });
    await Promise.all(workers);

    const accommodation = getAccommodationAsPseudoSchool();
    if (accommodation) {
      renderRouteBuilderStatus("Calculating accommodation routes...", "running");
      const accommService = new google.maps.DistanceMatrixService();
      const accommChunks = chunkList(schools, 25);
      for (const chunk of accommChunks) {
        const result = await fetchDistanceMatrixForBuilder(accommService, accommodation, chunk);
        const fetchedAt = new Date().toISOString();
        chunk.forEach((toSchool, idx) => {
          const item = result[idx] || { status: "error", durationMinutes: null, distanceKm: null };
          entries.push({
            fromSchoolId: accommodation.id,
            fromSchoolName: accommodation.name,
            fromDistrict: "",
            toSchoolId: toSchool.id,
            toSchoolName: toSchool.name,
            toDistrict: toSchool.district,
            durationMinutes: item.durationMinutes,
            distanceKm: item.distanceKm,
            status: item.status,
            fetchedAt,
            provider: "google"
          });
        });
      }
    }

    uiState.routeBuilder.entries = entries;
    const normalized = normalizeRouteCacheEntries(entries);
    const loadedIntoSession = await mergeRouteCacheEntries(normalized.entries);
    renderRouteCacheStatus();
    renderPlanner();
    const ok = entries.filter((item) => item.status === "ok").length;
    const failed = entries.length - ok;
    const accommNote = getAccommodationAsPseudoSchool() ? ` (incl. accommodation)` : "";
    renderRouteBuilderStatus(
      `Done. ${entries.length} pairs calculated (${ok} ok, ${failed} unresolved)${accommNote}. Loaded ${loadedIntoSession} pairs into this session.`,
      "success"
    );
  } catch (error) {
    console.error(error);
    renderRouteBuilderStatus(`Calculation failed: ${error.message}`, "error");
  } finally {
    uiState.routeBuilder.running = false;
    const tone = el.routeBuilderStatus.classList.contains("is-error")
      ? "error"
      : (uiState.routeBuilder.entries.length ? "success" : "");
    renderRouteBuilderStatus(el.routeBuilderStatus.textContent, tone);
  }
}

async function fetchDistanceMatrixForBuilder(service, fromSchool, destinations) {
  const origin = buildSchoolLocationQuery(fromSchool);
  const destinationQueries = destinations.map((school) => buildSchoolLocationQuery(school));
  if (!origin || destinationQueries.some((item) => !item)) {
    return destinations.map(() => ({ status: "error", durationMinutes: null, distanceKm: null }));
  }

  const response = await requestDistanceMatrix(service, origin, destinationQueries);
  if (response.status !== "OK") {
    return destinations.map(() => ({ status: "error", durationMinutes: null, distanceKm: null }));
  }

  const elements = response.rows?.[0]?.elements || [];
  return destinations.map((_, idx) => normalizeDistanceMatrixElement(elements[idx]));
}

function buildSchoolLocationQuery(school) {
  if (!hasValidCoordinates(school)) {
    return null;
  }
  return {
    lat: Number(school.latitude),
    lng: Number(school.longitude)
  };
}

async function getGoogleDistanceMatrixService(apiKey) {
  await loadGoogleMapsSdk(apiKey);
  return new google.maps.DistanceMatrixService();
}

function loadGoogleMapsSdk(apiKey) {
  if (window.google?.maps?.DistanceMatrixService && googleMapsSdkLoadedKey === apiKey) {
    return Promise.resolve();
  }
  if (window.google?.maps?.DistanceMatrixService && googleMapsSdkLoadedKey && googleMapsSdkLoadedKey !== apiKey) {
    return Promise.reject(new Error("Google Maps SDK is already loaded with a different API key. Refresh the page to use a new key."));
  }
  if (googleMapsSdkPromise) {
    return googleMapsSdkPromise;
  }

  googleMapsSdkPromise = new Promise((resolve, reject) => {
    const callbackName = `__gmaps_ready_${Date.now()}`;
    const timeout = setTimeout(() => {
      cleanup();
      googleMapsSdkPromise = null;
      reject(new Error("Google Maps SDK load timed out."));
    }, 15000);

    function cleanup() {
      clearTimeout(timeout);
      delete window[callbackName];
    }

    window[callbackName] = () => {
      cleanup();
      googleMapsSdkLoadedKey = apiKey;
      resolve();
    };
    window.gm_authFailure = () => {
      cleanup();
      googleMapsSdkPromise = null;
      reject(new Error("Google API key is not authorized for this app URL."));
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      cleanup();
      googleMapsSdkPromise = null;
      reject(new Error("Failed to load Google Maps SDK."));
    };
    document.head.appendChild(script);
  });

  return googleMapsSdkPromise;
}

function requestDistanceMatrix(service, origin, destinationQueries) {
  console.log("[DEBUG-ROUTE] requestDistanceMatrix called", { origin, destinationCount: destinationQueries.length });
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn("[DEBUG-ROUTE] Request timed out");
      resolve({ status: "TIMEOUT", rows: [] });
    }, 20000);
    service.getDistanceMatrix({
      origins: [origin],
      destinations: destinationQueries,
      travelMode: google.maps.TravelMode.DRIVING,
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: google.maps.TrafficModel.BEST_GUESS
      },
      unitSystem: google.maps.UnitSystem.METRIC
    }, (response, status) => {
      clearTimeout(timeout);
      console.log("[DEBUG-ROUTE] API response", { status, hasResponse: !!response, rows: response?.rows?.length, elements: response?.rows?.[0]?.elements?.map(e => ({ status: e.status, duration: e.duration, distance: e.distance })) });
      if (!response) {
        resolve({ status: status || "ERROR", rows: [] });
        return;
      }
      resolve({
        status: status || response.status || "ERROR",
        rows: response.rows || []
      });
    });
  });
}

function normalizeDistanceMatrixElement(element) {
  if (!element || element.status !== "OK") {
    return { status: "not_found", durationMinutes: null, distanceKm: null };
  }
  const durationSec = Number(element.duration_in_traffic?.value ?? element.duration?.value ?? NaN);
  const distanceMeters = Number(element.distance?.value ?? NaN);
  return {
    status: Number.isFinite(durationSec) ? "ok" : "error",
    durationMinutes: Number.isFinite(durationSec) ? Math.max(1, Math.round(durationSec / 60)) : null,
    distanceKm: Number.isFinite(distanceMeters) ? Math.round((distanceMeters / 1000) * 10) / 10 : null
  };
}

function chunkList(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function onRouteBuilderExportCsv() {
  const entries = uiState.routeBuilder.entries || [];
  if (!entries.length) {
    alert("No calculated route entries to export.");
    return;
  }

  const header = [
    "fromSchoolId",
    "fromSchoolName",
    "fromDistrict",
    "toSchoolId",
    "toSchoolName",
    "toDistrict",
    "durationMinutes",
    "distanceKm",
    "status",
    "fetchedAt",
    "provider"
  ];
  const csvLines = [header.map(csvEscape).join(",")]
    .concat(entries.map((row) => header.map((key) => csvEscape(row[key])).join(",")));

  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `route_cache_builder_${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function onRouteBuilderExportJson() {
  const entries = uiState.routeBuilder.entries || [];
  if (!entries.length) {
    alert("No calculated route entries to export.");
    return;
  }
  const payload = {
    generatedAt: new Date().toISOString(),
    schoolCount: (uiState.routeBuilder.schools || []).length,
    routeCache: entries
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `route_cache_builder_${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function onRouteBuilderUseInSession() {
  const entries = uiState.routeBuilder.entries || [];
  if (!entries.length) {
    alert("No calculated route entries available.");
    return;
  }
  const normalized = normalizeRouteCacheEntries(entries);
  const imported = await mergeRouteCacheEntries(normalized.entries);
  resolveFollowUpWarnings();
  renderRouteCacheStatus();
  renderPlanner();
  renderAll();
  alert(`Loaded ${imported} route pair(s) into this session cache.`);
}

function onExportRouteCache() {
  const rows = buildRouteCacheCsvRows();
  if (!rows.length) {
    alert("Route cache is empty.");
    return;
  }

  const header = [
    "fromSchoolId",
    "fromSchoolName",
    "fromDistrict",
    "toSchoolId",
    "toSchoolName",
    "toDistrict",
    "durationMinutes",
    "distanceKm",
    "status",
    "fetchedAt",
    "provider"
  ];

  const csvLines = [header.map(csvEscape).join(",")]
    .concat(rows.map((row) => header.map((key) => csvEscape(row[key])).join(",")));

  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `route_cache_${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildRouteCacheCsvRows() {
  const schoolMap = getSchoolMap();
  return [...state.routeCache]
    .map((entry) => {
      const fromSchool = schoolMap.get(entry.fromSchoolId);
      const toSchool = schoolMap.get(entry.toSchoolId);
      if (!fromSchool || !toSchool) {
        return null;
      }
      return {
        fromSchoolId: entry.fromSchoolId,
        fromSchoolName: fromSchool.name,
        fromDistrict: fromSchool.district,
        toSchoolId: entry.toSchoolId,
        toSchoolName: toSchool.name,
        toDistrict: toSchool.district,
        durationMinutes: entry.durationMinutes ?? "",
        distanceKm: entry.distanceKm ?? "",
        status: entry.status || "ok",
        fetchedAt: entry.fetchedAt || "",
        provider: entry.provider || "google"
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const left = `${a.fromSchoolName}::${a.toSchoolName}`;
      const right = `${b.fromSchoolName}::${b.toSchoolName}`;
      return left.localeCompare(right);
    });
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/["\n,]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

async function onImportRouteCache(event) {
  const [file] = event.target.files;
  if (!file) {
    return;
  }

  try {
    const fileName = file.name.toLowerCase();
    let parsed = null;

    if (fileName.endsWith(".json")) {
      const payload = JSON.parse(await file.text());
      parsed = parseRouteCacheImportPayload(payload);
    } else if (fileName.endsWith(".csv")) {
      const rows = parseCsvToRows(await file.text());
      parsed = parseRouteCacheImportRows(rows);
    } else if (fileName.endsWith(".xlsx")) {
      const rows = parseXlsxToRows(await file.arrayBuffer());
      parsed = parseRouteCacheImportRows(rows);
    } else {
      alert("Unsupported route cache file type. Use .csv, .xlsx, or .json.");
      return;
    }

    const imported = await mergeRouteCacheEntries(parsed.entries);
    resolveFollowUpWarnings();
    renderRouteCacheStatus();
    renderPlanner();
    renderAll();

    alert(
      `Imported ${imported} route pair(s). ` +
      `Unresolved rows: ${parsed.unresolved}. ` +
      `Invalid rows: ${parsed.invalid}. ` +
      `Skipped same-school rows: ${parsed.skippedSameSchool}.`
    );
  } catch (error) {
    console.error(error);
    alert(`Could not import route cache: ${error.message}`);
  } finally {
    event.target.value = "";
  }
}

function parseRouteCacheImportPayload(payload) {
  if (Array.isArray(payload)) {
    return normalizeRouteCacheEntries(payload);
  }
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.routeCache)) {
      return normalizeRouteCacheEntries(payload.routeCache);
    }
    if (Array.isArray(payload.route_cache)) {
      return normalizeRouteCacheEntries(payload.route_cache);
    }
    if (Array.isArray(payload.entries)) {
      return normalizeRouteCacheEntries(payload.entries);
    }
  }
  throw new Error("Route cache JSON must be an array or contain routeCache/entries.");
}

function parseRouteCacheImportRows(rows) {
  if (!Array.isArray(rows) || rows.length < 2) {
    return { entries: [], unresolved: 0, invalid: 0, skippedSameSchool: 0 };
  }

  const header = rows[0].map((cell) => String(cell || "").trim());
  const fromSchoolIdIdx = getColumnIndex(header, ["fromSchoolId", "fromId", "from_school_id", "originSchoolId"]);
  const fromSchoolNameIdx = getColumnIndex(header, ["fromSchoolName", "fromName", "fromSchool", "originSchoolName"]);
  const fromDistrictIdx = getColumnIndex(header, ["fromDistrict", "originDistrict"]);
  const toSchoolIdIdx = getColumnIndex(header, ["toSchoolId", "toId", "to_school_id", "destinationSchoolId"]);
  const toSchoolNameIdx = getColumnIndex(header, ["toSchoolName", "toName", "toSchool", "destinationSchoolName"]);
  const toDistrictIdx = getColumnIndex(header, ["toDistrict", "destinationDistrict"]);
  const durationMinutesIdx = getColumnIndex(header, ["durationMinutes", "durationMin", "minutes", "duration"]);
  const distanceKmIdx = getColumnIndex(header, ["distanceKm", "distance", "distance_km"]);
  const statusIdx = getColumnIndex(header, ["status"]);
  const fetchedAtIdx = getColumnIndex(header, ["fetchedAt", "timestamp", "fetched_at"]);
  const providerIdx = getColumnIndex(header, ["provider"]);

  const looksLikeSchoolList = getColumnIndex(header, ["name", "school", "schoolName"]) >= 0
    && getColumnIndex(header, ["district"]) >= 0
    && getColumnIndex(header, ["classroomCount", "classrooms"]) >= 0;
  if (fromSchoolIdIdx < 0 && fromSchoolNameIdx < 0) {
    if (looksLikeSchoolList) {
      throw new Error("This file looks like a schools file, not route cache. Use the Schools import section for this file.");
    }
    throw new Error("Route cache file is missing from-school columns.");
  }
  if (toSchoolIdIdx < 0 && toSchoolNameIdx < 0) {
    if (looksLikeSchoolList) {
      throw new Error("This file looks like a schools file, not route cache. Use the Schools import section for this file.");
    }
    throw new Error("Route cache file is missing to-school columns.");
  }

  const entries = [];
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (isEffectivelyEmptyRow(row)) {
      continue;
    }
    entries.push({
      fromSchoolId: fromSchoolIdIdx >= 0 ? row[fromSchoolIdIdx] : "",
      fromSchoolName: fromSchoolNameIdx >= 0 ? row[fromSchoolNameIdx] : "",
      fromDistrict: fromDistrictIdx >= 0 ? row[fromDistrictIdx] : "",
      toSchoolId: toSchoolIdIdx >= 0 ? row[toSchoolIdIdx] : "",
      toSchoolName: toSchoolNameIdx >= 0 ? row[toSchoolNameIdx] : "",
      toDistrict: toDistrictIdx >= 0 ? row[toDistrictIdx] : "",
      durationMinutes: durationMinutesIdx >= 0 ? row[durationMinutesIdx] : "",
      distanceKm: distanceKmIdx >= 0 ? row[distanceKmIdx] : "",
      status: statusIdx >= 0 ? row[statusIdx] : "",
      fetchedAt: fetchedAtIdx >= 0 ? row[fetchedAtIdx] : "",
      provider: providerIdx >= 0 ? row[providerIdx] : ""
    });
  }

  return normalizeRouteCacheEntries(entries);
}

function normalizeRouteCacheEntries(rawEntries) {
  const out = [];
  let unresolved = 0;
  let invalid = 0;
  let skippedSameSchool = 0;

  rawEntries.forEach((item) => {
    const fromSchoolId = resolveImportedSchoolId(item.fromSchoolId, item.fromSchoolName, item.fromDistrict);
    const toSchoolId = resolveImportedSchoolId(item.toSchoolId, item.toSchoolName, item.toDistrict);
    if (!fromSchoolId || !toSchoolId) {
      unresolved += 1;
      return;
    }
    if (fromSchoolId === toSchoolId) {
      skippedSameSchool += 1;
      return;
    }

    const durationMinutes = parseRouteNumber(item.durationMinutes);
    const distanceKm = parseRouteNumber(item.distanceKm);
    const status = normalizeRouteStatus(item.status, durationMinutes);
    if (status === "ok" && !Number.isFinite(durationMinutes)) {
      invalid += 1;
      return;
    }

    out.push({
      fromSchoolId,
      toSchoolId,
      durationMinutes: Number.isFinite(durationMinutes) ? Number(durationMinutes) : null,
      distanceKm: Number.isFinite(distanceKm) ? Number(distanceKm) : null,
      status,
      fetchedAt: String(item.fetchedAt || "").trim() || new Date().toISOString(),
      provider: String(item.provider || "google").trim() || "google"
    });
  });

  return { entries: out, unresolved, invalid, skippedSameSchool };
}

function resolveImportedSchoolId(rawId, rawName, rawDistrict) {
  const id = String(rawId || "").trim();
  if (id === ACCOMMODATION_PSEUDO_ID) {
    return ACCOMMODATION_PSEUDO_ID;
  }
  if (id && state.schools.some((school) => school.id === id)) {
    return id;
  }

  const nameKey = normalizeLookup(rawName);
  if (!nameKey) {
    return "";
  }
  const districtKey = normalizeLookup(rawDistrict);

  let matches = state.schools.filter((school) => normalizeLookup(school.name) === nameKey);
  if (districtKey) {
    matches = matches.filter((school) => normalizeLookup(school.district) === districtKey);
  }
  if (matches.length === 1) {
    return matches[0].id;
  }
  return "";
}

function parseRouteNumber(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return null;
  }
  const number = Number(normalized.replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

function normalizeRouteStatus(value, durationMinutes) {
  const key = normalizeLookup(value);
  if (key === "ok") {
    return "ok";
  }
  if (key === "not found" || key === "notfound" || key === "zero results" || key === "zeroresults") {
    return "not_found";
  }
  if (Number.isFinite(durationMinutes)) {
    return "ok";
  }
  return "error";
}

async function mergeRouteCacheEntries(entries) {
  if (!Array.isArray(entries) || !entries.length) {
    return 0;
  }
  entries.forEach((entry) => {
    upsertRouteCacheEntry(entry);
  });
  await replaceRouteCacheForCityInDb(getCurrentCity()?.id || "", state.routeCache);
  noteDocumentMutation();
  return entries.length;
}

function onExportJson() {
  const payload = {
    schemaVersion: state.schemaVersion,
    selectedCityId: state.selectedCityId,
    cities: state.cities
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `fieldwork_scheduler_v5_${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function onUploadToApi() {
  const baseUrl = resolveApiBaseUrl();
  const jwtInput = el.apiJwtToken || document.getElementById("api-jwt-token");
  const token = ((jwtInput && jwtInput.value) || localStorage.getItem("api_jwt_token") || "").trim();

  if (!token) {
    syncState.uploadState = "failed";
    syncState.lastError = "Enter JWT token first.";
    renderSyncStatus();
    return;
  }
  if (EDIT_MODE) {
    if (!confirm("This will update the shared document. Continue?")) return;
  }

  const payload = buildUploadPayload();
  syncState.uploadState = "uploading";
  syncState.lastError = "";
  renderSyncStatus();

  try {
    const fetchUrl = EDIT_MODE ? `${baseUrl}/documents/${EDIT_MODE.documentId}` : `${baseUrl}/documents`;
    const fetchMethod = EDIT_MODE ? "PUT" : "POST";
    const res = await fetch(fetchUrl, {
      method: fetchMethod,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const shareUrl = data.url || "";
      markCurrentStateAsUploaded();
      if (EDIT_MODE) {
        renderSyncStatus();
      } else if (shareUrl) {
        window.location.href = shareUrl;
        return;
      }
    } else {
      const text = await res.text().catch(() => "");
      syncState.uploadState = "failed";
      syncState.lastError = `Error ${res.status}: ${text || res.statusText}`;
      renderSyncStatus();
    }
  } catch (err) {
    syncState.uploadState = "failed";
    syncState.lastError = `Failed: ${err.message}`;
    renderSyncStatus();
  }
}

async function onImportJson(event) {
  const [file] = event.target.files;
  if (!file) {
    return;
  }

  try {
    const parsed = JSON.parse(await file.text());
    const normalized = normalizeState(parsed);
    await removeAllRouteCacheForSessionFromDb();
    replaceState(normalized);
    for (const city of state.cities || []) {
      await replaceRouteCacheForCityInDb(city.id, city.routeCache || []);
    }

    uiState.selectedDayId = "";
    uiState.selectedVerificationDayId = "";
    uiState.selectedDayIdsByCity = {};
    uiState.selectedVerificationDayIdsByCity = {};
    uiState.plannerDraft = null;
    uiState.plannerDraftCache = {};
    uiState.plannerDirty = false;
    uiState.lastValidation = null;
    uiState.routeInsights = null;

    resetResearcherForm();
    resetDayPlanForm();

    noteDocumentMutation();
    renderAll();
    renderRouteCacheStatus();
    alert("JSON imported successfully.");
  } catch (error) {
    console.error(error);
    alert("Could not import JSON. Please check the file format.");
  } finally {
    event.target.value = "";
  }
}

async function tryAutoLoadDocument() {
  const token = (localStorage.getItem("api_jwt_token") || "").trim();
  if (token) {
    const docId = await fetchFirstDocumentId(token);
    if (docId) {
      window.location.href = `${window.location.origin}/edit/${docId}`;
      return;
    }
  }
  showTokenPrompt();
}

async function fetchFirstDocumentId(token) {
  const apiBase = resolveApiBaseUrl();
  try {
    const res = await fetch(`${apiBase}/documents`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const docs = await res.json();
    if (!Array.isArray(docs) || docs.length === 0) return null;
    return docs[0].id || null;
  } catch (err) {
    console.error("Fetch documents failed:", err);
    return null;
  }
}

function showTokenPrompt() {
  const overlay = document.getElementById("token-prompt-overlay");
  const input = document.getElementById("token-prompt-input");
  const connectBtn = document.getElementById("token-prompt-connect");
  const skipBtn = document.getElementById("token-prompt-skip");
  const errorEl = document.getElementById("token-prompt-error");
  if (!overlay) return;

  overlay.hidden = false;
  input.value = "";
  input.focus();

  async function onConnect() {
    const token = input.value.trim();
    if (!token) {
      errorEl.textContent = "Please enter a token.";
      errorEl.hidden = false;
      return;
    }
    errorEl.hidden = true;
    connectBtn.disabled = true;
    connectBtn.textContent = "Connecting...";

    const docId = await fetchFirstDocumentId(token);
    if (docId) {
      localStorage.setItem("api_jwt_token", token);
      if (el.apiJwtToken) el.apiJwtToken.value = token;
      window.location.href = `${window.location.origin}/edit/${docId}`;
      return;
    }

    // No existing document — save token and let user start fresh
    localStorage.setItem("api_jwt_token", token);
    if (el.apiJwtToken) el.apiJwtToken.value = token;
    overlay.hidden = true;
    cleanup();
  }

  function onSkip() {
    overlay.hidden = true;
    cleanup();
  }

  function onKeydown(e) {
    if (e.key === "Enter") onConnect();
  }

  function cleanup() {
    connectBtn.removeEventListener("click", onConnect);
    skipBtn.removeEventListener("click", onSkip);
    input.removeEventListener("keydown", onKeydown);
  }

  connectBtn.addEventListener("click", onConnect);
  skipBtn.addEventListener("click", onSkip);
  input.addEventListener("keydown", onKeydown);
}

async function loadEditDocumentIfNeeded() {
  if (!EDIT_MODE) return;
  const apiBase = resolveApiBaseUrl();
  try {
    const res = await fetch(`${apiBase}/documents/${EDIT_MODE.documentId}`);
    if (!res.ok) {
      alert(`Failed to load shared document (${res.status}). The document may not exist.`);
      return;
    }
    const data = await res.json();
    const normalized = normalizeState(data);
    await removeAllRouteCacheForSessionFromDb();
    replaceState(normalized);
    for (const city of state.cities || []) {
      await replaceRouteCacheForCityInDb(city.id, city.routeCache || []);
    }

    uiState.selectedDayId = "";
    uiState.selectedVerificationDayId = "";
    uiState.selectedDayIdsByCity = {};
    uiState.selectedVerificationDayIdsByCity = {};
    uiState.plannerDraft = null;
    uiState.plannerDraftCache = {};
    uiState.plannerDirty = false;
    uiState.lastValidation = null;
    uiState.routeInsights = null;

    resetResearcherForm();
    resetDayPlanForm();
    uiState.mainView = "city-setup";
    renderAll();
    markCurrentStateAsUploaded();
    renderRouteCacheStatus();
  } catch (err) {
    console.error(err);
    alert("Could not load shared document. Check your connection and try again.");
  }
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeHtmlAttr(value) {
  return escapeHtml(value).replaceAll("\n", " ");
}
