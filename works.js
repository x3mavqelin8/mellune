(async function () {
  await KnittingImageStore.migrateLegacyWorks();

// 作品一覧：毛糸一覧と同じ検索・カラー・並び替え
const worksGrid = document.getElementById("works-grid");
const searchInput = document.getElementById("work-search-input");
const sortFilter = document.getElementById("sort-works");

const works = JSON.parse(localStorage.getItem("knittingWorks") || "[]");
const yarns = JSON.parse(localStorage.getItem("knittingYarns") || "[]");
const yarnById = new Map(yarns.map((yarn) => [String(yarn.id), yarn]));


function getWorkYarn(work) {
  return yarnById.get(String(work.yarnId || "")) || null;
}

async function renderWorks(list) {
  worksGrid.innerHTML = "";

  if (list.length === 0) {
    worksGrid.innerHTML = `
      <p class="empty-message">
        ${works.length === 0 ? "まだ作品がありません🧶" : "該当する作品がありません🧶"}
      </p>
    `;
    return;
  }

  for (const work of list) {
    const hydratedWork = await KnittingImageStore.hydrateWork(work);
    const card = document.createElement("article");
    card.className = "work-card";
    card.addEventListener("click", () => {
      location.href = `work-detail.html?id=${encodeURIComponent(work.id)}`;
    });

    const image = document.createElement("div");
    image.className = "work-image";

    const images = Array.isArray(hydratedWork.images) ? hydratedWork.images : [];
    if (images.length > 0) {
      const img = document.createElement("img");
      img.src = images[0];
      img.alt = work.name || "作品画像";
      image.appendChild(img);
    } else {
      image.textContent = "🧶";
    }

    const title = document.createElement("h2");
    title.appendChild(document.createTextNode(work.name || "名前未設定"));

    card.appendChild(image);
    card.appendChild(title);
    worksGrid.appendChild(card);
  }
}

async function filterWorks() {
  const keyword = searchInput.value.trim().toLocaleLowerCase("ja");

  const filtered = works.filter((work) => {
    const yarn = getWorkYarn(work);
    const searchableValues = [
      work.name,
      work.material,
      work.gauge,
      work.needle,
      work.reference,
      work.comment,
      work.memo,
      yarn?.maker,
      yarn?.name,
      yarn?.color,
      yarn?.colorNumber,
      yarn?.material,
    ];

    const matchesKeyword =
      !keyword ||
      searchableValues.some((value) =>
        String(value || "").toLocaleLowerCase("ja").includes(keyword),
      );

    return matchesKeyword;
  });

  const sorted = filtered.map((item, index) => ({ item, index }));
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
  await renderWorks(sorted.map(entry => entry.item));
}

searchInput.addEventListener("input", filterWorks);
sortFilter.addEventListener("change", filterWorks);

filterWorks();

})();
