// Cache DOM elements
const searchInput = document.getElementById("searchInput");
const container = document.querySelector(".container");
const rows = () => Array.from(container.querySelectorAll(".documents-row"));
const sortBtn = document.getElementById("sortBtn");
const sortMenu = document.getElementById("sortMenu");

// 1) Search filter
searchInput.addEventListener("input", function () {
  const normalize = (str) =>
    str
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ") // keep letters + numbers, normalize separators
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  const queryWords = normalize(this.value);

  rows().forEach((row) => {
    const num = row.querySelector(".cell.number").textContent;
    const title = row.querySelector(".cell.title").textContent;
    const original =
      row.querySelector(".cell.original-title")?.textContent || "";
    const hidden = row.dataset.hiddenTitles || ""; // alias only

    const text = [num, title, original, hidden].join(" ").toLowerCase();

    const songWords = normalize(text);

    const match = queryWords.every((w) =>
      songWords.some((sw) => sw.startsWith(w))
    );

    row.style.display = match ? "" : "none";
  });

  updateRoundedRow();
  if (typeof updateRowBackgrounds === "function") updateRowBackgrounds();
  if (typeof updateNewBadges === "function") updateNewBadges();
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
    (r) => window.getComputedStyle(r).display !== "none"
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
    (r) => window.getComputedStyle(r).display !== "none"
  );

  visibleRows.forEach((row, index) => {
    if (index % 2 === 0) {
      row.classList.add("row-odd");
    } else {
      row.classList.add("row-even");
    }
  });
}

fetch("songs.json")
  .then((res) => res.json())
  .then((songsData) => {
    const songsToAppend = songsData;
    const html = songsToAppend.map(buildRowHTML).join("");
    container.insertAdjacentHTML("beforeend", html);
    updateRoundedRow();
    if (typeof updateRowBackgrounds === "function") updateRowBackgrounds();
    updateNewBadges();
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
    <div class="documents-row" data-date="${
      s.date || ""
    }" data-hidden-titles="${s.alias || ""}">
      <div class="cell number">${s.number}</div>
      <div class="line"></div>
      <div class="cell title">${s.title}</div>
      <div class="cell original-title">${s.originalTitle || ""}</div>
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
/*function updateNewBadges() {
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
          '<img src="new.png" alt="Нова песен" class="new-badge" style="margin-right:16px; width:40px">'
        );
      }
    } else {
      if (badge) badge.remove();
    }
  });
}*/
