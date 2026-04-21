



/* ================= DIARY HELPERS (GLOBAL) ======================= */


window.hasDiaryNote = function (isoDate) {
  let diary = {};
  try {
    diary = JSON.parse(localStorage.getItem("diaryNotes")) || {};
  } catch (e) {
    console.error("Invalid diaryNotes JSON", e);
    
    return false;
  }
  return !!diary[isoDate];
};


document.addEventListener("DOMContentLoaded", () => {

  
/* ================= STORAGE ================= */
const STORAGE_KEY = "budget";
let categories = JSON.parse(localStorage.getItem("categories")) || [];
let transactions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; 
let startDate = localStorage.getItem("startDate") || "";
let openingBalance = parseFloat(localStorage.getItem("openingBalance")) || 0;
let editingIndex = null;
let nudges = JSON.parse(localStorage.getItem("nudges")) || {};
let scrollBeforeHelp = 0;
let transactionSortAscending = true;
let transactionSortMode = "date"; // "date" or "category"
let inlineEditIndex = null;
let transactionFilterMode = null; 
// null | "monthly" | "4-weekly" | "targeted"
  
/* ================= DOM ================ */

const txCategorySelect = document.getElementById("tx-category");
const newCategoryInput = document.getElementById("new-category");
const addCategoryButton = document.getElementById("add-category");

const txDesc = document.getElementById("tx-desc");
const txAmount = document.getElementById("tx-amount");
const txType = document.getElementById("tx-type");
const txFrequency = document.getElementById("tx-frequency");
const txDate = document.getElementById("tx-date");
const addTxButton = document.getElementById("add-transaction");

const startDateInput = document.getElementById("start-date");
const openingBalanceInput = document.getElementById("opening-balance");
const saveConfigButton = document.getElementById("save-config");

const transactionTableBody = document.querySelector("#transaction-table tbody");
const projectionTbody = document.querySelector("#projection-table tbody");

const editCategorySelect = document.getElementById("edit-category-select");
const editCategoryInput = document.getElementById("edit-category-name");
const renameCategoryButton = document.getElementById("rename-category");
const MAX_PAST_NUDGE_DAYS = 7;
const txEndDate = document.getElementById("tx-end-date");


  const CACHE_VERSION = "v1.5.5";
const CACHE_NAME = `budget-app-${CACHE_VERSION}`;
const APP_VERSION = `budget-app-${CACHE_VERSION}`;

  const versionEl = document.getElementById("app-version");
if (versionEl) {
  versionEl.textContent = `Version: ${APP_VERSION}`;
}

/* ========= APP VERSION FOR CONSOLE ========== */
  console.info(
  `Home Budget App v${APP_VERSION} (${new Date().toISOString()})`
);
/* ===================== */
document.querySelectorAll(".tx-filter").forEach(el => {
  el.addEventListener("click", () => {
    const mode = el.dataset.filter;

    if (mode === "all") {
      transactionFilterMode = null;
    } else {
      transactionFilterMode =
        transactionFilterMode === mode ? null : mode;
    }

    renderTransactionTable();
    updateFilterUI();
  });
});
/* ================ */
function updateFilterUI() {
  document.querySelectorAll(".tx-filter").forEach(el => {
    const mode = el.dataset.filter;

    const isActive =
      (mode === "all" && transactionFilterMode === null) ||
      mode === transactionFilterMode;

    el.classList.toggle("active", isActive);
  });
}
  /* ======icon helper=== */
 function frequencyIcon(tx) {
  // 🎯 Targeted ALWAYS wins
  if (tx.endDate) return "🎯︎ ";

  const freq = (tx.frequency || "").toLowerCase();

  if (freq === "monthly")    return "🔁︎ ";
  if (freq === "4-weekly")   return "📆︎ ";
  if (freq === "irregular")  return "⚡️ ";

  return "";
}
  /* ========== */
function updateFilterBadge() {
  const badge = document.getElementById("tx-filter-badge");
  if (!badge) return;

  if (!transactionFilterMode) {
    badge.classList.add("hidden");
    badge.textContent = "";
    return;
  }

  const label =
    transactionFilterMode === "monthly"
      ? "Monthly"
      : transactionFilterMode === "4-weekly"
        ? "4-Weekly"
      : transactionFilterMode === "Irregular"
        ? "Irregular"
        : "Targeted";

  badge.textContent = `Filter: ${label}`;
  badge.classList.remove("hidden");
}
  /* ============= */


if (localStorage.getItem("dismissedVersion") === APP_VERSION) {
  document
    .getElementById("update-banner")
    ?.classList.add("hidden");
}

/* ===================================================== */
function scrollWithOffset(targetId, offset = 0) {
  const el = document.getElementById(targetId);
  if (!el) return;

  const y =
    el.getBoundingClientRect().top +
    window.pageYOffset +
    offset;

  window.scrollTo({
    top: y,
    behavior: "smooth"
  });

  // ✨ subtle visual confirmation
  el.classList.add("jump-highlight");
  setTimeout(() => el.classList.remove("jump-highlight"), 800);
}
   
/*==========--EVENT LISTENER FOR END TARGETED ===========*/
document.addEventListener("click", e => {
  // 🚫 Ignore Refresh button clicks completely
  if (e.target.closest("[data-ignore-global-click]")) return;
  const el = e.target.closest(".tx-ends");
  if (!el) return;

  const endIso = el.dataset.end;
  const name = el.dataset.name || "Transaction";

  if (!endIso) return;

  const popup = document.getElementById("tx-end-popup");
  const text = document.getElementById("tx-end-popup-text");

  const formatted = new Date(endIso + "T12:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  text.innerHTML = `<strong>${name}</strong><br>Ends on ${formatted}`;

  popup.classList.remove("hidden");
  document.body.classList.add("modal-open");
});
  /* ============ FINAL FIX? ========= */
  const banner = document.getElementById("update-banner");
const dismissed = localStorage.getItem("dismissedVersion");

// SHOW banner only if version changed
if (dismissed !== APP_VERSION) {
  banner?.classList.remove("hidden");
} else {
  banner?.classList.add("hidden");
}
  /* ============= */
document
  .getElementById("refresh-app-btn")
  ?.addEventListener("click", async e => {
    e.preventDefault();

    // Remember dismissal for this version
    localStorage.setItem("dismissedVersion", APP_VERSION);

    // Hide banner immediately
    document
      .getElementById("update-banner")
      ?.classList.add("hidden");

    // Activate waiting SW if present
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
    }

    // Reload cleanly
    setTimeout(() => {
      window.location.reload();
    }, 300);
  });
/* ========================*/
  /* ========= TX END MODAL CLOSE HANDLERS ========= */
document.addEventListener("click", e => {
  // 🚫 Ignore Refresh button clicks completely
  if (e.target.closest("[data-ignore-global-click]")) return;
  // Close button
  if (e.target.matches("#tx-end-popup-close")) {
    const popup = document.getElementById("tx-end-popup");
    popup.classList.add("hidden");
    document.body.classList.remove("modal-open");
    return;
  }

  // Click on backdrop (outside modal content)
  if (e.target.matches("#tx-end-popup")) {
    e.target.classList.add("hidden");
    document.body.classList.remove("modal-open");
  }
});
/* -------- helper funcfion for popups salary -1 and negative balances -------- */
  function getTransactionsSortedByDate() {
  return [...transactions].sort((a, b) => {
    const dA = new Date(a.date);
    const dB = new Date(b.date);
    return dA - dB;
  });
}
/* ----------Diary button ----------------------- */
const diaryBtn = document.getElementById("diary-popup-btn");

diaryBtn.onclick = () => {
  openDiaryForDate();
};

  function openDiaryForDate(date) {
  if (!date) {
    date = new Date().toISOString().slice(0, 10);
  }

  window.location.href = `notes.html?date=${date}`;
}
/* target date end helper */
  function isFinalOccurrence(tx, iso) {
  if (!tx.endDate) return false;

  // If it occurs on this date, but NOT on the next valid occurrence,
  // then this is the final one.
  const next = new Date(iso);

  if (tx.frequency === "monthly") {
    next.setMonth(next.getMonth() + 1);
  } else if (tx.frequency === "4-weekly") {
    next.setDate(next.getDate() + 28);
  } else {
    return false; // irregular handled elsewhere
  }

  const nextIso = toISO(next);

  return occursOn(tx, iso) && !occursOn(tx, nextIso);
}
 
  
/* ============================================== */
/* added edit category code*/
  renameCategoryButton.onclick = () => {
  const oldName = editCategorySelect.value;
  const newName = editCategoryInput.value.trim();

  if (!oldName) return alert("Select a category to rename");
  if (!newName) return alert("Enter a new category name");
  if (categories.includes(newName)) return alert("Category already exists");

  // Update category list
  categories = categories.map(c => c === oldName ? newName : c);
  localStorage.setItem("categories", JSON.stringify(categories));

  // Update all transactions using that category
  transactions.forEach(tx => {
    if (tx.category === oldName) {
      tx.category = newName;
    }
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));

  editCategoryInput.value = "";

  updateCategoryDropdown();
  updateEditCategoryDropdown();
  renderTransactionTable();
  renderProjectionTable();

  alert(`Category "${oldName}" renamed to "${newName}"`);
};
/* ================= UTILS ================= */
function txId(tx) {
  return `${tx.date}|${tx.frequency}|${tx.description}|${tx.amount}|${tx.type}`;
}
/* =================================================== */
function nudgeKey(id, iso) {
  return `${id}|${iso}`;
}
/* =================================================== */
function getDisplayedTransactionDate(tx) {
  if (!tx.date) return "";

  // Monthly or irregular → show original day
  if (tx.frequency !== "4-weekly") {
    return formatDayOnly(tx.date);
  }

  // 4-weekly → roll forward to next occurrence ≥ TODAY
  let d = new Date(tx.date);
  d.setHours(12, 0, 0, 0);

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  while (d < today) {
    d.setDate(d.getDate() + 28);
  }

  return d.getDate() + getOrdinalSuffix(d.getDate());
}
/* =================================================== */
function getEffectiveDayOfMonth(tx) {
  if (!tx.date) return 0;

  // Monthly / irregular
  if (tx.frequency !== "4-weekly") {
    return new Date(tx.date).getDate();
  }

  // 4-weekly → roll forward to >= today
  let d = new Date(tx.date);
  d.setHours(12, 0, 0, 0);

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  while (d < today) {
    d.setDate(d.getDate() + 28);
  }

  return d.getDate();
}
  
/* =================================================== */
function saveNudges() {
  localStorage.setItem("nudges", JSON.stringify(nudges));
}
/* =================================================== */
  function toISO(d) {
  if (!d) return "";
  const x = new Date(d);
  x.setHours(12,0,0,0);
  return x.toISOString().slice(0,10);
}
/* =================================================== */
function formatDayOnly(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.getDate() + getOrdinalSuffix(d.getDate());
}
/* =================================================== */
function getOrdinalSuffix(n) {
  if (n > 3 && n < 21) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}
/* ===================================================*/
function jumpToProjectionDate(iso) {
  const rows = document.querySelectorAll("#projection-table tbody tr");

  for (const row of rows) {
    const cell = row.querySelector("td");
    if (!cell) continue;

    const text = cell.textContent.trim();
    if (normalizeSearch(text).includes(normalizeSearch(formatDate(iso)))) {
      row.classList.add("projection-jump-highlight");
      row.scrollIntoView({ behavior: "smooth", block: "center" });

      // Remove highlight after a moment
      setTimeout(() => {
        row.classList.remove("projection-jump-highlight");
      }, 1500);

      break;
    }
  }
}
/* ====== NEW DATE FORMAT =======*/
function formatDate(iso) {
  const options = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
  return new Date(iso).toLocaleDateString("en-GB", options).replace(',', '');
}

/* ==============================*/

function normalizeSearch(str) {
  return str
    .toLowerCase()
    // normalise all dash types
    .replace(/[\u2010-\u2015\u2212\-]/g, "")
    // remove slashes
    .replace(/[\/]/g, "")
    // collapse whitespace
    .replace(/\s+/g, "");
}
/* ===================================================*/
function hasNudgedAwayTransaction(iso) {
  return Object.keys(nudges).some(key => key.endsWith("|" + iso));
}
/* ===================================================*/
  function saveNudges() {
  localStorage.setItem("nudges", JSON.stringify(nudges));
}
/* ================= CATEGORIES ================= */
function updateCategoryDropdown() {
  txCategorySelect.innerHTML = '<option value="">Select</option>';
  categories.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    txCategorySelect.appendChild(opt);
  });
}
/* ===================================================*/
function updateEditCategoryDropdown() {
  if (!editCategorySelect) return;

  editCategorySelect.innerHTML = '<option value="">Select</option>';
  categories.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    editCategorySelect.appendChild(opt);
  });
}

addCategoryButton.onclick = () => {
  const c = newCategoryInput.value.trim();
  if (!c) return;
  if (!categories.includes(c)) {
    categories.push(c);
    localStorage.setItem("categories", JSON.stringify(categories));
  }
  newCategoryInput.value = "";
  updateCategoryDropdown();
};
/* ===================================================*/
function ensureStartConfig() {
  if (!startDate) {
    document.body.classList.remove("modal-open");
    alert("Start date not set");
    return false;
  }
  return true;
}

/* ================= CONFIG ================= */
saveConfigButton.onclick = () => {
  startDate = startDateInput.value;
  openingBalance = parseFloat(openingBalanceInput.value) || 0;
  localStorage.setItem("startDate", startDate);
  localStorage.setItem("openingBalance", openingBalance);
  /*alert("Saving config");*/
  renderProjectionTable();
};

startDateInput.value = startDate;
openingBalanceInput.value = openingBalance || "";

/* ==============HELP============ */
const helpButton = document.getElementById("help");
const helpModal = document.getElementById("help-modal");
const helpClose = document.getElementById("help-close");

const frame = document.querySelector(".modal-frame");

if (frame && frame.contentWindow) {
  frame.contentWindow.location.hash = "";
  frame.contentWindow.scrollTo(0, 0);
}
  


/* ===== ADDITION ======*/
  helpButton.addEventListener("click", () => {
  scrollBeforeHelp = window.scrollY;

  helpModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
});
  /* ==============*/
if (helpButton) {
  helpButton.addEventListener("click", () => {
    document.body.classList.add("modal-open");
    helpModal.classList.remove("hidden");
  });
}

helpClose.addEventListener("click", () => {
  helpModal.classList.add("hidden");
  document.body.classList.remove("modal-open");

  window.scrollTo({
    top: scrollBeforeHelp,
    behavior: "auto"
  });
});

// Click outside to close
helpModal.addEventListener("click", e => {
  if (e.target === helpModal) {
    helpModal.classList.add("hidden");
    document.body.classList.remove("modal-open");

    window.scrollTo({
      top: scrollBeforeHelp,
      behavior: "auto"
    });
  }
});


/* ================= TRANSACTIONS ================= */
function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

addTxButton.onclick = () => {
  const tx = {
    description: txDesc.value.trim(),
    amount: parseFloat(txAmount.value) || 0,
    type: txType.value,
    frequency: txFrequency.value,
    date: txDate.value,
    endDate: txEndDate.value || null, // ← NEW
    category: txCategorySelect.value
  };

  if (!tx.description) return alert("Description required");
  if (!tx.category) return alert("Category required");
  if ((tx.frequency !== "irregular") && !tx.date)
    return alert("Start date required");

  if (editingIndex !== null) {
    transactions[editingIndex] = tx;
    editingIndex = null;
    addTxButton.textContent = "Add Transaction";
  } else {
    transactions.push(tx);
  }

  saveTransactions();
  renderTransactionTable();
  renderProjectionTable();

  txDesc.value = txAmount.value = txDate.value = "";
  txEndDate.value = "";   // ← ADD THIS
  txCategorySelect.value = "";
};
/* =========== inline edit helper ======== */
  function buildCategoryOptions(selected) {
  return categories
    .map(
      c =>
        `<option value="${c}" ${c === selected ? "selected" : ""}>${c}</option>`
    )
    .join("");
}
/* =====- helper ====== */
  function attachInlineEditKeys(index) {
  document.addEventListener("keydown", function handler(e) {

    if (inlineEditIndex !== index) {
      document.removeEventListener("keydown", handler);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      document.querySelector(".save-btn")?.click();
    }

    if (e.key === "Escape") {
      e.preventDefault();
      document.querySelector(".cancel-btn")?.click();
    }
  });
}
/* ================ Render Transacfions ============= */
/* ================ Render Transactions ============= */
function renderTransactionTable() {

  /* ---------- SORT HEADER BINDINGS ---------- */

  const dateSortHeader = document.getElementById("date-sort-header");
  const dateSortIndicator = document.getElementById("date-sort-indicator");
  const categorySortHeader = document.getElementById("category-sort-header");
  const categorySortIndicator = document.getElementById("category-sort-indicator");
  const descriptionSortHeader =
    document.getElementById("description-sort-header");
  const descriptionSortIndicator =
    document.getElementById("description-sort-indicator");

  // ---- Date sort
  if (dateSortHeader && !dateSortHeader.dataset.bound) {
    dateSortHeader.dataset.bound = "true";
    dateSortHeader.onclick = () => {
      transactionSortMode = "date";
      transactionSortAscending = !transactionSortAscending;
      dateSortIndicator.textContent =
        transactionSortAscending ? "▲" : "▼";
      if (categorySortIndicator) categorySortIndicator.textContent = "";
      if (descriptionSortIndicator) descriptionSortIndicator.textContent = "";
      renderTransactionTable();
    };
  }

  // ---- Description sort
  if (descriptionSortHeader && !descriptionSortHeader.dataset.bound) {
    descriptionSortHeader.dataset.bound = "true";
    descriptionSortHeader.onclick = () => {
      transactionSortMode = "description";
      transactionSortAscending = !transactionSortAscending;
      descriptionSortIndicator.textContent =
        transactionSortAscending ? "▲" : "▼";
      if (dateSortIndicator) dateSortIndicator.textContent = "";
      if (categorySortIndicator) categorySortIndicator.textContent = "";
      renderTransactionTable();
    };
  }

  // ---- Category sort
  if (categorySortHeader && !categorySortHeader.dataset.bound) {
    categorySortHeader.dataset.bound = "true";
    categorySortHeader.onclick = () => {
      transactionSortMode = "category";
      transactionSortAscending = !transactionSortAscending;
      categorySortIndicator.textContent =
        transactionSortAscending ? "▲" : "▼";
      if (dateSortIndicator) dateSortIndicator.textContent = "";
      if (descriptionSortIndicator) descriptionSortIndicator.textContent = "";
      renderTransactionTable();
    };
  }

  /* ---------- TABLE BODY ---------- */

  transactionTableBody.innerHTML = "";

  /* ---------- BUILD SORTED VIEW (Safari-safe) ---------- */

  const filtered = transactions.filter(tx => {
  if (!transactionFilterMode) return true;

  if (transactionFilterMode === "targeted") {
    return !!tx.endDate;
  }

  if (transactionFilterMode === "monthly") {
    return tx.frequency === "monthly" && !tx.endDate;
  }

  return tx.frequency === transactionFilterMode;
});

const indexed = filtered
  .map(tx => ({ tx, index: transactions.indexOf(tx) }))
  .sort((a, b) => {
    // existing sort logic unchanged

      // Description
      if (transactionSortMode === "description") {
        const dA = (a.tx.description || "").toLowerCase();
        const dB = (b.tx.description || "").toLowerCase();
        const diff = dA.localeCompare(dB);
        return transactionSortAscending ? diff : -diff;
      }

      // Category
      if (transactionSortMode === "category") {
        const cA = (a.tx.category || "").toLowerCase();
        const cB = (b.tx.category || "").toLowerCase();
        const diff = cA.localeCompare(cB);
        return transactionSortAscending ? diff : -diff;
      }

      // Date (effective day-of-month logic)
      const dayA = getEffectiveDayOfMonth(a.tx);
      const dayB = getEffectiveDayOfMonth(b.tx);

      if (dayA !== dayB) {
        return transactionSortAscending ? dayA - dayB : dayB - dayA;
      }

      // Tie-breaker
      const cA = (a.tx.category || "").toLowerCase();
      const cB = (b.tx.category || "").toLowerCase();
      return cA.localeCompare(cB);
    });

  /* ---------- RENDER ROWS ---------- */

  indexed.forEach(({ tx, index }) => {

    const tr = document.createElement("tr");
    // Frequency class for styling
if (tx.frequency === "Monthly") tr.classList.add("freq-monthly");
if (tx.frequency === "4-weekly") tr.classList.add("freq-4weekly");
if (tx.frequency === "Targeted") tr.classList.add("freq-targeted");

    /* ===== INLINE EDIT MODE ===== */
    if (inlineEditIndex === index) {

      tr.classList.add("inline-editing");

      tr.innerHTML = `
   <td>
  <input type="date" id="ie-date-${index}" value="${tx.date}">
  ${
    tx.endDate
      ? `<input
           type="date"
           id="ie-enddate-${index}"
           value="${tx.endDate}"
           title="End date"
           style="margin-top:4px;"
         >`
      : ""
  }
</td>

        <td>
          <input id="ie-desc-${index}" value="${tx.description}">
        </td>

        <td>
          <select id="ie-type-${index}">
            <option value="expense" ${tx.type === "expense" ? "selected" : ""}>expense</option>
            <option value="income" ${tx.type === "income" ? "selected" : ""}>income</option>
          </select>
        </td>

        <td>
          <input type="number" step="0.01" id="ie-amount-${index}" value="${tx.amount}">
        </td>

        <td>
          <select id="ie-category-${index}">
            ${buildCategoryOptions(tx.category)}
          </select>
        </td>

        <td>
          <button class="save-btn">Save</button>
          <button class="cancel-btn">Cancel</button>
        </td>
      `;

      tr.querySelector(".save-btn").onclick = () => {
        tx.date =
          document.getElementById(`ie-date-${index}`).value;
        tx.endDate =
          document.getElementById(`ie-enddate-${index}`)?.value || null;
        tx.description =
          document.getElementById(`ie-desc-${index}`).value;
        tx.type =
          document.getElementById(`ie-type-${index}`).value;
        tx.amount =
          parseFloat(
            document.getElementById(`ie-amount-${index}`).value
          ) || 0;
        tx.category =
          document.getElementById(`ie-category-${index}`).value;

        saveTransactions();
        inlineEditIndex = null;
        renderTransactionTable();
        renderProjectionTable();
      };

      tr.querySelector(".cancel-btn").onclick = () => {
        inlineEditIndex = null;
        renderTransactionTable();
      };

    } else {

      /* ===== NORMAL VIEW MODE ===== */

      tr.innerHTML = `
        <td>
  <div class="tx-date-cell">
    <span class="tx-date-text">
      ${getDisplayedTransactionDate(tx)}
    </span>
    <span class="tx-date-icon">
      ${frequencyIcon(tx)}
    </span>
  </div>
</td>

        <td>${tx.description}</td>
        <td>${tx.type}</td>
        <td>${tx.amount.toFixed(2)}</td>
        <td>${tx.category}</td>

        <td>
          <button class="edit-btn">Edit</button>
          <button class="delete-btn">Delete</button>
        </td>
      `;

      tr.querySelector(".edit-btn").onclick = () => {
        inlineEditIndex = index;
        renderTransactionTable();
        attachInlineEditKeys(index);
      };

      tr.querySelector(".delete-btn").onclick = () => {
        if (!confirm(`Delete "${tx.description}"?`)) return;
        transactions.splice(index, 1);
        saveTransactions();
        renderTransactionTable();
        renderProjectionTable();
      };
    }

    if (tx.type === "expense") tr.classList.add("expense-row");
    if (tx.frequency === "4-weekly") tr.classList.add("freq-4weekly");

    transactionTableBody.appendChild(tr);
  });
  updateFilterBadge();
}
/* ================= RECURRENCE ================= */
function occursOn(tx, iso) {
  // Irregular transactions = one-off, unchanged
  if (tx.frequency === "irregular") {
    return tx.date === iso;
  }

  // START DATE check (existing behaviour)
  if (iso < tx.date) return false;

  // 🔴 END DATE check (NEW)
  if (tx.endDate && iso > tx.endDate) return false;

  const start = new Date(tx.date);
  const current = new Date(iso);

  if (tx.frequency === "monthly") {
    return (
      start.getDate() === current.getDate()
    );
  }

  if (tx.frequency === "4-weekly") {
    const diffDays =
      Math.floor((current - start) / 86400000);
    return diffDays >= 0 && diffDays % 28 === 0;
  }

  return false;
}
/* ================= NUDGE HELPERS ================= */

// A stable unique ID for each transaction occurrence
function txId(tx) {
  return `${tx.date}|${tx.frequency}|${tx.description}|${tx.amount}|${tx.type}`;
}

// Was this transaction nudged away from THIS date?
function isNudgedAway(tx, iso) {
  return nudges.hasOwnProperty(nudgeKey(tx, iso));
}

function isNudgedHere(tx, iso) {
  return Object.values(nudges).includes(iso) &&
    Object.keys(nudges).some(k =>
      k.startsWith(txId(tx) + "|") && nudges[k] === iso
    );
}
/* ============Click icon handler =============== */
  projectionTbody.addEventListener("click", e => {
  const icon = e.target.closest(".diary-icon");
  if (!icon) return;

  e.stopPropagation(); // prevent row selection / other handlers

    /* ========== DIARY ICON CLICK ========== */
projectionTbody.addEventListener("click", e => {
  const icon = e.target.closest(".diary-icon");
  if (!icon) return;

  e.stopPropagation(); // prevents row select / nudge interference

  const iso = icon.dataset.iso;
  window.location.href = `notes.html?date=${iso}&from=projection`;
});

  const iso = icon.dataset.iso;
  window.location.href = `notes.html?date=${iso}`;
});
/* ================= PROJECTION ================= */
/* ================= PROJECTION ================= */

window.renderProjectionTable = function () {
  projectionTbody.innerHTML = "";

  if (!startDate) {
    document.body.classList.remove("modal-open");
    alert("Start date not set");
    return;
  }

  let balance = openingBalance;

  const start = new Date(startDate);
  start.setHours(12, 0, 0, 0);

  const todayIso = toISO(new Date());

  const end = new Date(start);
  end.setMonth(end.getMonth() + 24);

  /* ---------- Build day map ---------- */
  const dayMap = {};
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dayMap[toISO(d)] = [];
  }

  /* ---------- Place transactions ---------- */
  transactions.forEach(tx => {
    for (let iso in dayMap) {
      if (!occursOn(tx, iso)) continue;

      const id = txId(tx);
      const nudgeKey = `${id}|${iso}`;

      if (nudges[nudgeKey]) {
        const targetIso = nudges[nudgeKey];
        if (dayMap[targetIso]) {
          dayMap[targetIso].push(tx);
        }
      } else {
        dayMap[iso].push(tx);
      }
    }
  });

  /* ---------- Render day by day ---------- */
  Object.keys(dayMap).forEach(iso => {
    const todaysTx = dayMap[iso];
    let dateRendered = false;

    /* ===== NO TRANSACTIONS ===== */
    if (todaysTx.length === 0) {
      const tr = document.createElement("tr");

      if (iso === todayIso) tr.classList.add("today-row");
      if ([0, 6].includes(new Date(iso).getDay())) tr.classList.add("weekend-row");

      tr.innerHTML = `
        <td>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span>${formatDate(iso)}</span>
            ${
              hasDiaryNote(iso)
                ? `<span class="diary-icon" data-iso="${iso}">📅</span>`
                : ""
            }
          </div>
        </td>
        <td></td><td></td><td></td>
        <td><strong>${balance.toFixed(2)}</strong></td>
      `;

      projectionTbody.appendChild(tr);
      return;
    }

    /* ---------- Income first ---------- */
    todaysTx.sort((a, b) =>
      a.type === b.type ? 0 : a.type === "income" ? -1 : 1
    );

    /* ===== TRANSACTIONS ===== */
    todaysTx.forEach((tx, index) => {
      const isIncome = tx.type === "income";
      balance += isIncome ? tx.amount : -tx.amount;

      const tr = document.createElement("tr");

      if (iso === todayIso) tr.classList.add("today-row");
      if ([0, 6].includes(new Date(iso).getDay())) tr.classList.add("weekend-row");
      if (balance < 0) tr.classList.add("negative");

      const today = new Date(toISO(new Date()));
      const diffDays = Math.round((new Date(iso) - today) / 86400000);

      const showNudge =
        (diffDays >= 0 && diffDays <= 7) ||
        (diffDays < 0 && diffDays >= -MAX_PAST_NUDGE_DAYS);

      /* ========== ADDED PENSION HIGHLIGHT ============ */
      // Pension highlight
      if (tx.description.toLowerCase().includes("pension") ||
        tx.description.toLowerCase().includes("salary")) {
        tr.classList.add("highlight-pension");
      }
      /* ========== ADDED SAVINGS HIGHLIGHT ============ */
           // Savings highlight
      if (tx.description.toLowerCase().includes("savings")) {
        tr.classList.add("highlight-savings");
      }

      /* =============================================== */

      tr.innerHTML = `
        <td>
          ${
            !dateRendered
              ? (() => {
                  dateRendered = true;
                  return `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span>${formatDate(iso)}</span>
                      ${
                        hasDiaryNote(iso)
                          ? `<span class="diary-icon" data-iso="${iso}">📅</span>`
                          : ""
                      }
                    </div>
                  `;
                })()
              : ""
          }
        </td>

        <td>
          <div class="projection-item ${tx.type}">
            <span class="desc">
  ${frequencyIcon(tx)}${tx.description}
              ${
                isFinalOccurrence(tx, iso) && tx.endDate
                  ? `<span
                       class="tx-ends"
                       data-end="${tx.endDate}"
                       data-name="${tx.description}"
                     > 🎯 ends</span>`
                  : ""
              }
            </span>
            <span class="cat">${tx.category || ""}</span>
            ${
              showNudge
                ? `<button class="nudge-btn"
                     data-id="${txId(tx)}"
                     data-iso="${iso}">+1</button>`
                : ""
            }
          </div>
        </td>

        <td>${isIncome ? tx.amount.toFixed(2) : ""}</td>
        <td>${!isIncome ? tx.amount.toFixed(2) : ""}</td>
        <td>${
          index === todaysTx.length - 1
            ? `<strong>${balance.toFixed(2)}</strong>`
            : balance.toFixed(2)
        }</td>
      `;

      projectionTbody.appendChild(tr);

      projectionTbody
  .querySelectorAll("tr.auto-highlight")
  .forEach(row => row.classList.remove("auto-highlight"));

// Highlight last transaction for today
const todayRows = projectionTbody.querySelectorAll("tr.today-row");

if (todayRows.length > 0) {
  const lastRow = todayRows[todayRows.length - 1];
  lastRow.classList.add("auto-highlight");
}
      
    });
  });
};
/* ================= STICKY FIND CUMULATIVE TOTAL HELPER ======== */
  function extractRowAmount(row) {
  const tds = row.querySelectorAll("td");
  if (tds.length < 4) return null;

  const incomeText = tds[2]?.textContent.trim();
  const expenseText = tds[3]?.textContent.trim();

  const income = incomeText ? parseFloat(incomeText) : 0;
  const expense = expenseText ? parseFloat(expenseText) : 0;

  // 🚫 Ignore rows with no financial impact
  if (!income && !expense) return null;

  return income - expense;
}
  
/* ================= STICKY FIND ================= */
const findInput=document.getElementById("projection-find-input");
const findNext=document.getElementById("projection-find-next");
const findPrev=document.getElementById("projection-find-prev");
const findCounter=document.getElementById("find-counter");
const findClear = document.getElementById("projection-find-clear");
  findClear.onclick = () => {
  findInput.value = "";
  matches = [];
  findIdx = -1;

  // remove highlights
  document
    .querySelectorAll(".projection-match-highlight")
    .forEach(r => r.classList.remove("projection-match-highlight"));

  updateCounter();
};

let matches=[], findIdx=-1;
let matchTotals = [];
function collectMatches(){
  matches = [];
  matchTotals = [];
  findIdx = -1;

  const q = normalizeSearch(findInput.value);
  if (!q) {
    updateCounter();
    return;
  }

  let runningTotal = 0;

document
  .querySelectorAll("#projection-table tbody tr")
  .forEach(r => {
    if (normalizeSearch(r.textContent).includes(q)) {
      matches.push(r);

      const amt = extractRowAmount(r);

      if (amt !== null) {
        runningTotal += amt;
      }

      matchTotals.push(runningTotal);
    }
  });

  updateCounter();
}

function updateCounter(){
  if (!matches.length) {
    findCounter.textContent = "0/0";
    return;
  }

  const base = `${findIdx + 1}/${matches.length}`;

  if (findIdx >= 0) {
    const total = matchTotals[findIdx] || 0;
    findCounter.textContent = `${base} · £${total.toFixed(2)}`;
  } else {
    findCounter.textContent = base;
  }
}

function showMatch(){
  matches.forEach(r=>r.classList.remove("projection-match-highlight"));
  if(findIdx<0||findIdx>=matches.length)return;
  matches[findIdx].classList.add("projection-match-highlight");
  matches[findIdx].scrollIntoView({behavior:"smooth",block:"center"});
}

findInput.oninput=collectMatches;
findNext.onclick=()=>{if(matches.length){findIdx=(findIdx+1)%matches.length;showMatch();updateCounter();}};
findPrev.onclick=()=>{if(matches.length){findIdx=(findIdx-1+matches.length)%matches.length;showMatch();updateCounter();}};

/* ========== 24 MONTH PROJECTION (TOP) ========== */
document.getElementById("back-to-top")?.addEventListener("click", () => {
  scrollWithOffset("app-top", -80);
});
/*. ------ */
  
  
/* ============== VIEW TRANSACTIONS =========== */
document.getElementById("TopofApp")?.addEventListener("click", () => {
  scrollWithOffset("tohere", -80);
});
  
//* ================== MENU BUTTON =========== */
document.getElementById("menucategory")?.addEventListener("click", () => {
  scrollWithOffset("jump-here", -80);
});

  
  const floatingFind = document.getElementById("floating-find");

function lockFindBar() {
  if (!floatingFind) return;

  const y =
    window.visualViewport
      ? window.visualViewport.pageTop
      : window.scrollY;

  floatingFind.style.top = y + "px";
}

// iOS-safe listeners
window.addEventListener("scroll", lockFindBar, { passive: true });
window.addEventListener("resize", lockFindBar);
if (window.visualViewport) {
  window.visualViewport.addEventListener("scroll", lockFindBar);
  window.visualViewport.addEventListener("resize", lockFindBar);
}

// initial position
lockFindBar();
/* ================= CSV IMPORT (AUTO CATEGORY) ================= */
const csvInput = document.getElementById("csv-import");
document.getElementById("import-btn").onclick = () => {
  if (!csvInput.files.length) return alert("Choose CSV");

  const rows = csvInput.files[0];
  const reader = new FileReader();

  reader.onload = () => {
    const lines = reader.result.trim().split(/\r?\n/);
    if (lines.shift().trim() !== "Date,Amount,Income/Expense,Category,Description,Frequency") {
      return alert("Invalid CSV header");
    }

    categories = [...new Set(categories)];
    transactions = [];

    lines.forEach(line=>{
      const [date,amount,typeRaw,cat,desc,freq] = line.split(",");
      if (!categories.includes(cat)) categories.push(cat);
      const normalizedType = typeRaw.trim().toLowerCase();

if (normalizedType !== "income" && normalizedType !== "expense") {
  throw new Error(`Invalid Income/Expense value: "${typeRaw}"`);
}

transactions.push({
  date: date.trim(),
  description: desc.trim(),
  category: cat.trim(),
  amount: parseFloat(amount),
  type: normalizedType,
  frequency: freq.trim().toLowerCase()
});
    });

   


    localStorage.setItem("categories", JSON.stringify(categories));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    updateCategoryDropdown();
    updateEditCategoryDropdown();
    renderTransactionTable();
    renderProjectionTable();
    alert("CSV import successful");
    /* try this!!!*/
    
  };

  reader.readAsText(rows);
  
};

/* ================= EXPORT 24-MONTH PROJECTION ================= */

document.getElementById("export-projection-btn").onclick = () => {
if (!startDate) {
  document.body.classList.remove("modal-open");
  alert("Start date not set");
  return;
}

  let csv = "Date,Description,Category,Income,Expense,Balance\n";

  let balance = openingBalance;
  const start = new Date(startDate);
  start.setHours(12, 0, 0, 0);

  const end = new Date(start);
  end.setMonth(end.getMonth() + 24);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = toISO(d);

    let inc = 0;
    let exp = 0;
    const descs = [];
    const cats = [];

    transactions.forEach(tx => {
      if (occursOn(tx, iso)) {
        if (tx.type === "income") inc += tx.amount;
        else exp += tx.amount;

        descs.push(tx.description);
        cats.push(tx.category);
      }
    });

    balance += inc - exp;

    csv += [
      iso,
      `"${descs.join(" | ")}"`,
      `"${cats.join(" | ")}"`,
      inc ? inc.toFixed(2) : "",
      exp ? exp.toFixed(2) : "",
      balance.toFixed(2)
    ].join(",") + "\n";
  }

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "24-month-projection.csv";
  a.click();

  URL.revokeObjectURL(url);
};
/* ================= NEGATIVE BALANCES POPUP ================= */

const negativeBtn = document.getElementById("negative-popup-btn");
const negativePopup = document.getElementById("negative-popup");
const negativePopupBody = document.getElementById("negative-popup-body");
const negativeClose = document.getElementById("negative-popup-close");

negativeBtn.onclick = () => {
  negativePopupBody.innerHTML = "";
  document.body.classList.add("modal-open");

  if (!startDate) {
    document.body.classList.remove("modal-open");
    alert("Start date not set");
    return;
  }

  let foundAny = false;
  let balance = openingBalance;

  const start = new Date(startDate);
  start.setHours(12, 0, 0, 0);

  const end = new Date(start);
  end.setMonth(end.getMonth() + 24);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = toISO(d);

    getTransactionsSortedByDate().forEach(tx => {
  const id = txId(tx);
  const natural = occursOn(tx, iso);
  const nudgedAway = nudges[`${id}|${iso}`];
  const nudgedHere = Object.entries(nudges).some(
    ([key, target]) => key.startsWith(id + "|") && target === iso
  );

  if ((natural && !nudgedAway) || (!natural && nudgedHere)) {
    balance += tx.type === "income" ? tx.amount : -tx.amount;
  }
});

    if (balance < 0) {
      foundAny = true;

      const tr = document.createElement("tr");
      tr.classList.add("negative");
      tr.style.cursor = "pointer";

      tr.innerHTML = `
        <td class="salary-date">
          <span class="salary-date-text">${formatDate(iso)}</span>
          <span class="salary-jump-icon">🔍</span>
        </td>
        <td style="text-align:right">
          <strong>${balance.toFixed(2)}</strong>
        </td>
      `;

      tr.onclick = () => {
        negativePopup.classList.add("hidden");
        document.body.classList.remove("modal-open");
        setTimeout(() => jumpToProjectionDate(iso), 200);
      };

      negativePopupBody.appendChild(tr);
    }
  }

  if (!foundAny) {
    document.body.classList.remove("modal-open");
    alert("No negative balances in the next 24 months");
    return;
  }

  negativePopup.classList.remove("hidden");
};

negativeClose.onclick = () => {
  negativePopup.classList.add("hidden");
  document.body.classList.remove("modal-open");
  /* alex spence */
  window.scrollTo({top:1500,behavior:"smooth"});
};

negativePopup.addEventListener("click", e => {
  if (e.target === negativePopup) {
    negativePopup.classList.add("hidden");
    document.body.classList.remove("modal-open");
    /* alex spence */
  window.scrollTo({top:1500,behavior:"smooth"});
  }
});
/* ========== DIARY ALERTS =========== */
  function checkDiaryAlerts() {
  const NOTES_KEY = "diaryNotes";
  const notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {};

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // LOCAL date (not UTC)
  const tomorrowIso =
    tomorrow.getFullYear() + "-" +
    String(tomorrow.getMonth() + 1).padStart(2, "0") + "-" +
    String(tomorrow.getDate()).padStart(2, "0");

  if (notes[tomorrowIso]) {
    const preview = notes[tomorrowIso].slice(0, 80);
    alert(
      `📓 Diary reminder for tomorrow (${tomorrowIso})\n\n` +
      preview +
      (notes[tomorrowIso].length > 80 ? "…" : "")
    );
  }
}

/* =================================== */
/* ================= SALARY -1 DAY POPUP ================= */

const salaryBtn = document.getElementById("salary-popup-btn");
const salaryPopup = document.getElementById("salary-popup");
const salaryPopupBody = document.getElementById("salary-popup-body");
const salaryClose = document.getElementById("salary-popup-close");

let salaryRows = [];
let salarySortKey = "balance"; // "balance" | "date"
let salarySortAsc = true;

salaryBtn.onclick = () => {
  document.body.classList.add("modal-open");
  salaryPopupBody.innerHTML = "";
  salaryRows = [];

  if (!startDate) {
    document.body.classList.remove("modal-open");
    alert("Start date not set");
    return;
  }

  /* ---------- HEADER ROW ---------- */
  const header = document.createElement("tr");
  header.innerHTML = `
    <th style="cursor:pointer">
      Date <span id="salary-date-arrow"></span>
    </th>
    <th style="text-align:right; cursor:pointer">
      Balance <span id="salary-balance-arrow"></span>
    </th>
  `;
  salaryPopupBody.appendChild(header);

  header.children[0].onclick = () => {
    toggleSort("date");
  };

  header.children[1].onclick = () => {
    toggleSort("balance");
  };

  /* ---------- COLLECT SALARY -1 DATES ---------- */
  const salaryMinusOne = new Set();

  const orderedTx = getTransactionsSortedByDate();

orderedTx.forEach(tx => {
  // existing salary -1 logic
    if (tx.type === "income") {
      const start = new Date(tx.date);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 24);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (occursOn(tx, toISO(d))) {
          const prev = new Date(d);
          prev.setDate(prev.getDate() - 1);
          salaryMinusOne.add(toISO(prev));
        }
      }
    }
  });

  /* ---------- CALCULATE BALANCES ---------- */
  let balance = openingBalance;
  const start = new Date(startDate);
  start.setHours(12, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 24);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = toISO(d);

  const orderedTx = getTransactionsSortedByDate();

orderedTx.forEach(tx => {
  // existing salary -1 logic
      const id = txId(tx);
      const natural = occursOn(tx, iso);
      const nudgedAway = nudges[`${id}|${iso}`];
      const nudgedHere = Object.entries(nudges).some(
        ([key, target]) => key.startsWith(id + "|") && target === iso
      );

      if ((natural && !nudgedAway) || (!natural && nudgedHere)) {
        balance += tx.type === "income" ? tx.amount : -tx.amount;
      }
    });

    if (salaryMinusOne.has(iso)) {
      salaryRows.push({
        iso,
        date: new Date(iso),
        balance
      });
    }
  }

  renderSalaryRows();
  salaryPopup.classList.remove("hidden");
};

/* ---------- SORT + RENDER ---------- */

function toggleSort(key) {
  if (salarySortKey === key) {
    salarySortAsc = !salarySortAsc;
  } else {
    salarySortKey = key;
    salarySortAsc = true;
  }
  renderSalaryRows();
}

function renderSalaryRows() {
  salaryPopupBody
    .querySelectorAll("tr:not(:first-child)")
    .forEach(tr => tr.remove());

  salaryRows.sort((a, b) => {
    const val =
      salarySortKey === "balance"
      
        ? a.balance - b.balance
        : a.date - b.date;

    return salarySortAsc ? val : -val;
  });

  document.getElementById("salary-date-arrow").textContent =
    salarySortKey === "date" ? (salarySortAsc ? " ▲" : " ▼") : "";

  document.getElementById("salary-balance-arrow").textContent =
    salarySortKey === "balance" ? (salarySortAsc ? " ▲" : " ▼") : "";

  salaryRows.forEach(({ iso, balance }) => {
    const tr = document.createElement("tr");
    if (balance < 0) tr.classList.add("negative");

    tr.innerHTML = `
      <td class="salary-date">
        ${formatDate(iso)} <span class="salary-jump-icon">🔍</span>
      </td>
      <td style="text-align:right">
        <strong>${balance.toFixed(2)}</strong>
      </td>
    `;

    tr.style.cursor = "pointer";
    tr.onclick = () => {
      salaryPopup.classList.add("hidden");
      document.body.classList.remove("modal-open");
      setTimeout(() => jumpToProjectionDate(iso), 200);
    };

    salaryPopupBody.appendChild(tr);
  });
}

/* ---------- CLOSE ---------- */

salaryClose.onclick = () => {
  salaryPopup.classList.add("hidden");
  document.body.classList.remove("modal-open");

}

salaryPopup.addEventListener("click", e => {
  if (e.target === salaryPopup) {
    salaryPopup.classList.add("hidden");
    document.body.classList.remove("modal-open");
    
  }
});
/* ========== NUDGE ========== */
  projectionTbody.addEventListener("click", e => {
  const btn = e.target.closest(".nudge-btn");
  if (!btn) return;

  const id = btn.dataset.id;
  const visibleIso = btn.dataset.iso;

  // Find existing nudge (if any) for this transaction
  let sourceIso = visibleIso;

  for (const [key, target] of Object.entries(nudges)) {
    if (key.startsWith(id + "|") && target === visibleIso) {
      // This transaction was already nudged here
      sourceIso = key.split("|").slice(-1)[0];
      break;
    }
  }

  // Calculate next day
  const next = new Date(visibleIso);
  next.setDate(next.getDate() + 1);
  const toIso = toISO(next);

  // Remove all existing nudges for this transaction
  Object.keys(nudges).forEach(k => {
    if (k.startsWith(id + "|")) delete nudges[k];
  });

  // Add the new nudge using the ORIGINAL source date
  nudges[`${id}|${sourceIso}`] = toIso;

  saveNudges();
  renderProjectionTable();
});
  projectionTbody.addEventListener("click", e => {
  const row = e.target.closest("tr");
  if (!row) return;

  // Clear previous selection
  projectionTbody
    .querySelectorAll(".projection-selected")
    .forEach(r => r.classList.remove("projection-selected"));

  // Highlight clicked row
  row.classList.add("projection-selected");
});
window.addEventListener("storage", e => {
  if (e.key === "diaryUpdated") {
    renderProjectionTable();
  }
});


/* ========== DIARY PREVIEW (FIXED & SAFE) ========== */

const diaryPreview = document.getElementById("diary-preview");
let previewOpenForIso = null;

document.addEventListener("click", e => {
  // 🚫 Ignore Refresh button clicks completely
  if (e.target.closest("[data-ignore-global-click]")) return;
  // Ignore while ANY modal is open
  if (document.body.classList.contains("modal-open")) return;
  if (!diaryPreview) return;

  const icon = e.target.closest(".diary-icon");

  // Click outside → close preview
  if (!icon) {
    diaryPreview.classList.add("hidden");
    previewOpenForIso = null;
    return;
  }

  const iso = icon.dataset.iso;
  const notes = JSON.parse(localStorage.getItem("diaryNotes") || {});
  if (!notes[iso]) return;

  // Second tap → open diary
  if (previewOpenForIso === iso) {
    window.location.href = `notes.html?from=projection&date=${iso}`;
    return;
  }

  // First tap → show preview
  e.preventDefault();
  e.stopPropagation();

  diaryPreview.textContent =
    notes[iso].split("\n")[0].slice(0, 140);

  const rect = icon.getBoundingClientRect();
  diaryPreview.style.left = rect.left + "px";
  diaryPreview.style.top = rect.bottom + 6 + "px";

  diaryPreview.classList.remove("hidden");
  previewOpenForIso = iso;
});

document.addEventListener("mouseout", e => {
  if (e.target.closest(".diary-icon")) {
    diaryPreview.classList.add("hidden");
  }
});

document.addEventListener("mouseout", e => {
  if (e.target.closest(".diary-icon")) {
    diaryPreview.classList.add("hidden");
  }
});
/* =========== EXPORT TRANSACTIONS ============ */
  document.getElementById("export-transactions").onclick = () => {
  const transactions =
    JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  const blob = new Blob(
    [JSON.stringify(transactions, null, 2)],
    { type: "application/json" }
  );

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "transactions-backup.json";
  a.click();

  URL.revokeObjectURL(a.href);
};

/* ============ IMPORT TRANSACTIONS =========== */

document
  .getElementById("import-transactions-btn")
  .addEventListener("click", () => {
    document.getElementById("import-transactions").click();
  });

document
  .getElementById("import-transactions")
  .addEventListener("change", e => {

    const file = e.target.files[0];
    // ✅ Filename guard
  if (!file.name.toLowerCase().startsWith("transaction")) {
    alert(
      `Wrong file selected.\n\nExpected a transaction backup file.\n\nYou selected:\n${file.name}`
    );
    e.target.value = "";
    return;
  }


    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);

        if (!Array.isArray(imported)) {
          alert("Invalid transactions file");
          return;
        }

        // 🔑 CRITICAL FIX: update the live array
        transactions.length = 0;
        transactions.push(...imported);

     // Save transactions
transactions = imported;
localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));

// Rebuild categories from transactions
categories = [
  ...new Set(
    transactions
      .map(tx => tx.category)
      .filter(Boolean)
  )
];

// Save categories
localStorage.setItem("categories", JSON.stringify(categories));

// Refresh UI
updateCategoryDropdown();
updateEditCategoryDropdown();
renderTransactionTable();
renderProjectionTable();

alert("Transactions imported successfully");
      } catch {
        alert("Invalid JSON file");
      }
    };

    reader.readAsText(file);
  });
/* ================================================*/
  document.getElementById("upcoming-diary-btn").addEventListener("click", () => {
  const diary = JSON.parse(localStorage.getItem("diaryNotes") || "{}");
  const list = document.getElementById("upcoming-diary-list");

  list.innerHTML = "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(today);
  end.setDate(end.getDate() + 14);

  let found = false;

  Object.keys(diary)
    .sort()
    .forEach(iso => {
      const d = new Date(iso + "T12:00:00");
      if (d >= today && d <= end) {
        found = true;
        list.innerHTML += `
          <div class="upcoming-diary-item">
            <strong>${d.toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short"
            })}</strong><br>
            ${diary[iso]}
          </div>
        `;
      }
    });

  if (!found) {
    list.innerHTML = `<em>No diary entries in the next 14 days.</em>`;
  }

  document.getElementById("upcoming-diary-popup").classList.remove("hidden");
  document.body.classList.add("modal-open");
});

document.getElementById("close-upcoming-diary").addEventListener("click", () => {
  document.getElementById("upcoming-diary-popup").classList.add("hidden");
  document.body.classList.remove("modal-open");
});
/* ================================================*/  
/* ======== OFFLINE INDICATOR ========= */
  function updateOnlineStatus() {
  const el = document.getElementById("offline-indicator");
  if (!el) return;

  if (navigator.onLine) {
    el.classList.add("hidden");
  } else {
    el.classList.remove("hidden");
  }
}

window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);
updateOnlineStatus();
  
/* ================= INIT ================= */
  const hash = window.location.hash;
if (hash.startsWith("#jump=")) {
  const iso = hash.replace("#jump=", "");
  setTimeout(() => jumpToProjectionDate(iso), 200);
}
updateCategoryDropdown();
updateEditCategoryDropdown();
renderTransactionTable();
renderProjectionTable();

checkDiaryAlerts();
setInterval(checkDiaryAlerts, 10 * 60 * 1000); // every 10 minutes
});

setTimeout(() => {
  const banner = document.getElementById("update-banner");
  console.log("BANNER STATE AFTER LOAD:", banner?.className);
}, 1000);
