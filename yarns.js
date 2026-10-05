// 毛糸一覧
const yarnsGrid = document.getElementById("yarns-grid");
const searchInput = document.getElementById("yarn-search-input");
const colorFilters = document.querySelectorAll(".yarn-color-filter");

const yarns = JSON.parse(localStorage.getItem("knittingYarns") || "[]");

let selectedColor = "";
const thicknessFilter = document.getElementById("filter-thickness");
const materialFilter = document.getElementById("filter-material");
const stitchesFilter = document.getElementById("filter-stitches");
const rowsFilter = document.getElementById("filter-rows");
const sortFilter = document.getElementById("sort-yarns");

function gaugeValue(text, unit) {
  const match = String(text || "").match(new RegExp("(\\d+(?:\\.\\d+)?)\\s*" + unit));
  return match ? Number(match[1]) : null;
}

// ====================
// 毛糸一覧を表示
// ====================

function renderYarns(list) {
  yarnsGrid.innerHTML = "";

  if (list.length === 0) {
    yarnsGrid.innerHTML = `
      <p class="empty-message">
        該当する毛糸がありません🧶
      </p>
    `;
    return;
  }

  list.forEach((yarn) => {
    const card = document.createElement("article");
    card.className = "yarn-card";

    card.addEventListener("click", () => {
      location.href = `yarn-detail.html?id=${yarn.id}`;
    });

    const image = document.createElement("div");
    image.className = "yarn-image";

    if (yarn.image) {
      const img = document.createElement("img");

      img.src = yarn.image;
      img.alt = yarn.name;

      image.appendChild(img);
    } else {
      image.textContent = "🧶";
    }

    const title = document.createElement("h2");

    if (yarn.yarnColor) {
      const colorDot = document.createElement("span");
      colorDot.className = `yarn-card-color yarn-card-color-${yarn.yarnColor}`;

      title.appendChild(colorDot);
    }

    const titleText = document.createTextNode(` ${yarn.name}`);
    title.appendChild(titleText);

    card.appendChild(image);
    card.appendChild(title);

    yarnsGrid.appendChild(card);
  });
}

// ====================
// 検索・カラー絞り込み
// ====================

function filterYarns() {
  const keyword = searchInput.value.trim().toLowerCase();

  const filteredYarns = yarns.filter((yarn) => {
    const matchesKeyword =
      !keyword ||
      [yarn.maker, yarn.name, yarn.color, yarn.colorNumber, yarn.material].some(
        (value) =>
          String(value || "")
            .toLowerCase()
            .includes(keyword),
      );

    const matchesColor = !selectedColor || yarn.yarnColor === selectedColor;
    const matchesThickness = !thicknessFilter.value || yarn.thickness === thicknessFilter.value;
    const matchesMaterial = !materialFilter.value || String(yarn.material || "").includes(materialFilter.value);
    const gaugeTexts = [yarn.knittingGauge, yarn.crochetGauge];
    const targetStitches = stitchesFilter.value === "" ? null : Number(stitchesFilter.value);
    const targetRows = rowsFilter.value === "" ? null : Number(rowsFilter.value);
    const matchesStitches = targetStitches === null || gaugeTexts.some((g) => { const v = gaugeValue(g, "目"); return v !== null && Math.abs(v - targetStitches) <= 3; });
    const matchesRows = targetRows === null || gaugeTexts.some((g) => { const v = gaugeValue(g, "段"); return v !== null && Math.abs(v - targetRows) <= 3; });

    return matchesKeyword && matchesColor && matchesThickness && matchesMaterial && matchesStitches && matchesRows;
  });

  const sorted = filteredYarns.map((item, index) => ({ item, index }));
  if (sortFilter.value === "name") {
    sorted.sort((a, b) => String(a.item.name || "").localeCompare(String(b.item.name || ""), "ja"));
  } else {
    sorted.sort((a, b) => {
      const aTime = Date.parse(a.item.createdAt || "") || 0;
      const bTime = Date.parse(b.item.createdAt || "") || 0;
      const diff = aTime - bTime;
      if (diff) return diff * (sortFilter.value === "oldest" ? 1 : -1);
      return (a.index - b.index) * (sortFilter.value === "oldest" ? 1 : -1);
    });
  }
  renderYarns(sorted.map(entry => entry.item));
}

// ====================
// 初期表示
// ====================

filterYarns();

// ====================
// 文字検索
// ====================

searchInput.addEventListener("input", () => {
  filterYarns();
});

// ====================
// カラー選択
// ====================

colorFilters.forEach((button) => {
  button.addEventListener("click", () => {
    const color = button.dataset.color;

    // 同じ色をもう一度押したら解除
    if (selectedColor === color) {
      selectedColor = "";
      button.classList.remove("selected");
    } else {
      selectedColor = color;

      colorFilters.forEach((item) => {
        item.classList.remove("selected");
      });

      button.classList.add("selected");
    }

    filterYarns();
  });
});

[thicknessFilter, materialFilter, stitchesFilter, rowsFilter, sortFilter].forEach((el) => el.addEventListener("input", filterYarns));
