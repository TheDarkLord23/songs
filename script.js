const searchInput = document.getElementById("searchInput");
const tableBody = document.querySelector("#documentsTable tbody");
const sortBtn = document.getElementById("sortBtn");
const sortMenu = document.getElementById("sortMenu");

searchInput.addEventListener("keyup", function () {
  const filter = this.value.toLowerCase();
  Array.from(tableBody.rows).forEach((row) => {
    const num = row.cells[0].textContent.toLowerCase();
    const title = row.cells[1].textContent.toLowerCase();
    row.style.display =
      num.includes(filter) || title.includes(filter) ? "" : "none";
  });
});

sortBtn.addEventListener("click", () => {
  sortMenu.classList.toggle("hidden");
});

sortMenu.querySelectorAll("li").forEach((item) => {
  item.addEventListener("click", () => {
    const colIndex = parseInt(item.dataset.col, 10);
    const asc = item.dataset.order === "asc";
    const rows = Array.from(tableBody.rows);

    rows.sort((a, b) => {
      let aVal = a.cells[colIndex].textContent.trim();
      let bVal = b.cells[colIndex].textContent.trim();

      if (colIndex === 0) {
        aVal = parseInt(aVal, 10);
        bVal = parseInt(bVal, 10);
        return asc ? aVal - bVal : bVal - aVal;
      } else {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
        return asc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
    });

    rows.forEach((r) => tableBody.appendChild(r));
    sortMenu.classList.add("hidden");
  });
});

document.addEventListener("click", (e) => {
  if (!sortBtn.contains(e.target) && !sortMenu.contains(e.target)) {
    sortMenu.classList.add("hidden");
  }
});
