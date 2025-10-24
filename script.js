// Cache DOM elements
const searchInput = document.getElementById("searchInput");
const container = document.querySelector(".container");
const rows = () => Array.from(container.querySelectorAll(".documents-row"));
const sortBtn = document.getElementById("sortBtn");
const sortMenu = document.getElementById("sortMenu");

// 1) Search filter
searchInput.addEventListener("input", function () {
  const filter = this.value.toLowerCase();
  rows().forEach((row) => {
    const num = row.querySelector(".cell.number").textContent.toLowerCase();
    const title = row.querySelector(".cell.title").textContent.toLowerCase();
    // match number OR title OR any hidden aliases
    const hidden = (row.dataset.hiddenTitles || "").toLowerCase();
    const match =
      num.includes(filter) || title.includes(filter) || hidden.includes(filter);
    row.style.display = match ? "" : "none";
  });

  updateRoundedRow();
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
      } else {
        // title column
        aVal = a.querySelector(".cell.title").textContent.toLowerCase();
        bVal = b.querySelector(".cell.title").textContent.toLowerCase();
        return asc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
    });

    // re-append in new order
    sorted.forEach((r) => container.appendChild(r));
    sortMenu.classList.add("hidden");
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

fetch("songs.json")
  .then((res) => res.json())
  .then((songsData) => {
    const songsToAppend = songsData;
    const html = songsToAppend.map(buildRowHTML).join("");
    container.insertAdjacentHTML("beforeend", html);
    updateRoundedRow();
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

  return `
    <div class="documents-row"
         data-hidden-titles="${s.alias || ""}">
      <div class="cell number">${s.number}</div>
      <div class="line"></div>
      <div class="cell title">${s.title}</div>
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
// Append after DOM is ready (no reordering of your code needed)
document.addEventListener("DOMContentLoaded", () => {
  if (!songsToAppend.length) return;
  const html = songsToAppend.map(buildRowHTML).join("");
  container.insertAdjacentHTML("beforeend", html);
  updateRoundedRow();
});
