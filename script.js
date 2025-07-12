// Cache DOM elements
const searchInput = document.getElementById("searchInput");
const container = document.querySelector(".container");
const rows = () => Array.from(container.querySelectorAll(".documents-row"));
const sortBtn = document.getElementById("sortBtn");
const sortMenu = document.getElementById("sortMenu");

// 1) Search filter
searchInput.addEventListener("keyup", function () {
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
