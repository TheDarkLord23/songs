// Cache DOM elements
const searchInput = document.getElementById("searchInput");
const container = document.querySelector(".container");
const rows = () => Array.from(container.querySelectorAll(".documents-row"));
const sortBtn = document.getElementById("sortBtn");
const sortMenu = document.getElementById("sortMenu");

// Filter state
let activeQueryWords = [];
let activeMainCategory = null;
let activeSubCategory = null;

// desired order of MAIN categories:
const mainOrder = [
  "Поклонение",
  "Бог Отец",
  "Исус Христос",
  "Светият Дух",
  "Божието слово",
  "Молитва и посвещение",
  "Християнски живот",
  "Копнеж за небесната родина",
  "Мисия и служене",
  "Специални поводи",
];

// desired order of SUB categories per main:
const subOrder = {
  Поклонение: [
    "Хваление и благодарност",
    "Откриване на богослуженията",
    "Закриване на богослуженията",
    "Господният ден и съботно училище",
  ],
  "Бог Отец": [
    "Божията любов",
    "Божието водителство и закрила",
    "Божията благодат и милост",
    "Божието величие и творческа сила",
  ],
  "Исус Христос": [
    "Рождение на Христос",
    "Живот и служене",
    "Страдания, смърт и възкресение",
    "Второ Пришествие и вечен живот",
    "Възхвала на Христос",
  ],
  "Християнски живот": [
    "Спасение – покана и опитност",
    "Покаяние и обръщане",
    "Вяра и упование в Бога",
    "Радост и мир в Бога",
    "Духовна борба и победа",
    "Християнски характер",
    "Братство и единство",
  ],
  "Специални поводи": ["Кръщение", "Господна вечеря"],
};

// Shared normalize helper
const normalize = (str) =>
  (str || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

function sortRowsByNewestFirstOnLoad() {
  const sorted = rows().sort((a, b) => {
    const aDate = (a.dataset.date || "").trim();
    const bDate = (b.dataset.date || "").trim();

    // newest first
    if (aDate !== bDate) return bDate.localeCompare(aDate);

    // tie-breaker: smaller number first (optional, nice)
    const aNum = parseInt(a.querySelector(".cell.number").textContent, 10);
    const bNum = parseInt(b.querySelector(".cell.number").textContent, 10);
    return aNum - bNum;
  });

  sorted.forEach((r) => container.appendChild(r));
}

// 1) Search filter
searchInput.addEventListener("input", function () {
  activeQueryWords = normalize(this.value);
  applyFilters();
});

// 2) Dropdown toggle
sortBtn.addEventListener("click", () => {
  sortMenu.classList.toggle("hidden");
});

// 3) Sort on menu selection
sortMenu.querySelectorAll("li").forEach((item) => {
  item.addEventListener("click", () => {
    const colIndex = parseInt(item.dataset.col, 10);
    const asc = item.dataset.order === "asc";
    const sorted = rows().sort((a, b) => {
      let aVal, bVal;
      if (colIndex === 0) {
        // number column
        aVal = parseInt(a.querySelector(".cell.number").textContent, 10);
        bVal = parseInt(b.querySelector(".cell.number").textContent, 10);
        return asc ? aVal - bVal : bVal - aVal;
      } else if (colIndex === 1) {
        // title column
        aVal = a.querySelector(".cell.title").textContent.toLowerCase();
        bVal = b.querySelector(".cell.title").textContent.toLowerCase();
        return asc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else if (colIndex === 2) {
        // date column (YYYY-MM-DD)
        aVal = a.dataset.date || "";
        bVal = b.dataset.date || "";
        // ISO strings compare lexicographically; newest first = desc
        return asc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
    });

    // re-append in new order
    sorted.forEach((r) => container.appendChild(r));
    sortMenu.classList.add("hidden");

    // recompute UI states
    updateRoundedRow();
    if (typeof updateRowBackgrounds === "function") updateRowBackgrounds();
    if (typeof updateNewBadges === "function") updateNewBadges();
  });
});

// 4) Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (!sortBtn.contains(e.target) && !sortMenu.contains(e.target)) {
    sortMenu.classList.add("hidden");
  }
});

// 5) Update CSS when searching
function updateRoundedRow() {
  const rowEls = container.querySelectorAll(".documents-row");
  rowEls.forEach((r) => r.classList.remove("last-visible"));

  const visibleRows = Array.from(rowEls).filter(
    (r) => window.getComputedStyle(r).display !== "none",
  );

  const lastVisible = visibleRows[visibleRows.length - 1];
  if (lastVisible) lastVisible.classList.add("last-visible");
}

function updateRowBackgrounds() {
  const allRows = rows();

  // Remove any old classes
  allRows.forEach((row) => {
    row.classList.remove("row-odd", "row-even");
  });

  // Only consider visible rows for striping
  const visibleRows = allRows.filter(
    (r) => window.getComputedStyle(r).display !== "none",
  );

  visibleRows.forEach((row, index) => {
    if (index % 2 === 0) {
      row.classList.add("row-odd");
    } else {
      row.classList.add("row-even");
    }
  });
}

// Filter
function applyFilters() {
  const allRows = rows();

  allRows.forEach((row) => {
    const num = row.querySelector(".cell.number").textContent;
    const title = row.querySelector(".cell.title").textContent;
    const hidden = row.dataset.hiddenTitles || "";
    const original = row.dataset.originalTitle || "";
    const text = [num, title, original, hidden].join(" ").toLowerCase();
    const songWords = normalize(text);

    // text match
    const matchText = activeQueryWords.every((w) =>
      songWords.some((sw) => sw.startsWith(w)),
    );

    // category match
    const rowMain = row.dataset.main || "";
    const rowSub = row.dataset.sub || "";

    const matchMain = !activeMainCategory || rowMain === activeMainCategory;
    const matchSub = !activeSubCategory || rowSub === activeSubCategory;

    const visible = matchText && matchMain && matchSub;
    row.style.display = visible ? "" : "none";
  });

  updateRoundedRow();
  if (typeof updateRowBackgrounds === "function") updateRowBackgrounds();
  if (typeof updateNewBadges === "function") updateNewBadges();
}

function buildCategorySidebar(songsData) {
  const sidebar = document.getElementById("categorySidebar");
  if (!sidebar) return;

  const categoryMap = {};
  songsData.forEach((s) => {
    if (!s.categoryMain) return;
    if (!categoryMap[s.categoryMain]) {
      categoryMap[s.categoryMain] = new Set();
    }
    if (s.categorySub) {
      categoryMap[s.categoryMain].add(s.categorySub);
    }
  });

  const mainList = document.createElement("ul");
  mainList.className = "category-list";

  // sort MAIN categories
  const orderedMains = Object.entries(categoryMap).sort(([a], [b]) => {
    const ia = mainOrder.indexOf(a);
    const ib = mainOrder.indexOf(b);

    // if both found in mainOrder – use that order
    if (ia !== -1 && ib !== -1) return ia - ib;
    // if only one is found – it comes first
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    // otherwise alphabetical fallback
    return a.localeCompare(b, "bg");
  });

  orderedMains.forEach(([mainName, subSet]) => {
    const wrapper = document.createElement("li");
    wrapper.className = "category-group";

    const mainEl = document.createElement("div");
    mainEl.className = "category-main";
    mainEl.textContent = mainName;
    mainEl.dataset.main = mainName;

    const subList = document.createElement("ul");
    subList.className = "subcategory-list hidden";

    // sort SUB categories for this main
    const subs = Array.from(subSet);
    const thisOrder = subOrder[mainName];

    subs.sort((a, b) => {
      if (thisOrder) {
        const ia = thisOrder.indexOf(a);
        const ib = thisOrder.indexOf(b);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
      }
      return a.localeCompare(b, "bg");
    });

    subs.forEach((subName) => {
      const subLi = document.createElement("li");
      subLi.className = "category-sub";
      subLi.textContent = subName;
      subLi.dataset.main = mainName;
      subLi.dataset.sub = subName;
      subList.appendChild(subLi);
    });

    // --- click handlers stay the same as before ---

    mainEl.addEventListener("click", () => {
      const alreadyActive =
        activeMainCategory === mainName && !activeSubCategory;

      document
        .querySelectorAll(".category-main")
        .forEach((el) => el.classList.remove("active"));
      document
        .querySelectorAll(".subcategory-list")
        .forEach((ul) => ul.classList.add("hidden"));
      document
        .querySelectorAll(".category-sub")
        .forEach((el) => el.classList.remove("active"));

      if (alreadyActive) {
        activeMainCategory = null;
        activeSubCategory = null;
      } else {
        activeMainCategory = mainName;
        activeSubCategory = null;
        mainEl.classList.add("active");
        subList.classList.remove("hidden");
      }

      applyFilters();
      updateClearButton();
    });

    subList.addEventListener("click", (evt) => {
      const target = evt.target.closest(".category-sub");
      if (!target) return;
      evt.stopPropagation();

      const subName = target.dataset.sub;

      activeMainCategory = mainName;

      const isActive = activeSubCategory === subName;
      subList
        .querySelectorAll(".category-sub")
        .forEach((el) => el.classList.remove("active"));

      if (isActive) {
        activeSubCategory = null;
      } else {
        activeSubCategory = subName;
        target.classList.add("active");
      }

      document
        .querySelectorAll(".category-main")
        .forEach((el) => el.classList.remove("active"));
      mainEl.classList.add("active");
      subList.classList.remove("hidden");

      applyFilters();
      updateClearButton();
    });

    wrapper.appendChild(mainEl);
    wrapper.appendChild(subList);
    mainList.appendChild(wrapper);
  });

  sidebar.appendChild(mainList);
}

const clearBtn = document.getElementById("clearCategories");

function updateClearButton() {
  if (activeMainCategory || activeSubCategory) {
    clearBtn.classList.remove("disabled");
  } else {
    clearBtn.classList.add("disabled");
  }
}

clearBtn.addEventListener("click", () => {
  // reset filter state
  activeMainCategory = null;
  activeSubCategory = null;

  // remove all highlights
  document
    .querySelectorAll(".category-main")
    .forEach((el) => el.classList.remove("active"));
  document
    .querySelectorAll(".category-sub")
    .forEach((el) => el.classList.remove("active"));
  document
    .querySelectorAll(".subcategory-list")
    .forEach((ul) => ul.classList.add("hidden"));

  applyFilters();
  updateClearButton();
});

fetch("songs.json")
  .then((res) => res.json())
  .then((songsData) => {
    const html = songsData.map(buildRowHTML).join("");
    container.insertAdjacentHTML("beforeend", html);

    // ✅ build categories on the left
    buildCategorySidebar(songsData);

    // ✅ initialize clear button state (starts disabled)
    if (typeof updateClearButton === "function") updateClearButton();

    // ✅ move newest songs to top (table only)
    sortRowsByNewestFirstOnLoad();

    // ✅ show NEW badges
    if (typeof updateNewBadges === "function") updateNewBadges();

    updateRoundedRow();
    if (typeof updateRowBackgrounds === "function") updateRowBackgrounds();
  })
  .catch((err) => console.error("Error loading songs:", err));

// Build one row's HTML
function buildRowHTML(s) {
  const musicAnchor = s.music
    ? `<a href="${s.music}" download>
         <img src="music.png" alt=".mp3" class="file-icon">
       </a>`
    : `<a href="#" class="disabled">
         <img src="music.png" alt=".mp3" class="file-icon" title="Очаквайте скоро">
       </a>`;

  const hiddenTitles = [s.alias, s.originalTitle].filter(Boolean).join(" ");

  return `
    <div class="documents-row"
         data-date="${s.date || ""}"
         data-hidden-titles="${hiddenTitles}"
         data-original-title="${s.originalTitle || ""}"
         data-main="${s.categoryMain || ""}"
         data-sub="${s.categorySub || ""}">
         
      <div class="cell number">${s.number}</div>
      <div class="line"></div>

      <div class="cell title">${s.title}</div>
      <div class="cell original-title"></div>
      <div class="line"></div>

      <div class="line-mobile"></div>

      <div class="cell presentation">
        <a href="${s.ppt || "#"}" download>
          <img src="ppt.png" alt=".pptx" class="file-icon">
        </a>
      </div>
      <div class="line"></div>

      <div class="cell text">
        <a href="${s.text || "#"}" download>
          <img src="pdf.png" alt=".txt" class="file-icon">
        </a>
      </div>
      <div class="line"></div>

      <div class="cell notes">
        <a href="${s.notes || "#"}" download>
          <img src="notes.png" alt=".pdf" class="file-icon">
        </a>
      </div>
      <div class="line"></div>

      <div class="cell music">
        ${musicAnchor}
      </div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const dl = document.getElementById("downloadAll");
  if (dl) {
    dl.addEventListener("click", function (e) {
      e.preventDefault();
      window.open(this.href, "noopener,noreferrer");
    });
  }
});

// "new" icon on rows that have the newest date
function updateNewBadges() {
  const all = rows();
  if (!all.length) return;

  let maxDate = "";
  all.forEach((r) => {
    const d = r.dataset.date || "";
    if (d > maxDate) maxDate = d;
  });

  all.forEach((r) => {
    const isNewest = (r.dataset.date || "") === maxDate && maxDate !== "";
    const titleCell = r.querySelector(".cell.title");
    let badge = r.querySelector(".new-badge");

    if (isNewest) {
      if (!badge) {
        titleCell.insertAdjacentHTML(
          "afterbegin",
          '<img src="new.png" alt="Нова песен" class="new-badge" style="margin-right:16px; width:40px">',
        );
      }
    } else {
      if (badge) badge.remove();
    }
  });
}
