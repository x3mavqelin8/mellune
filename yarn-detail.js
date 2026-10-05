(async function () {
  await KnittingImageStore.migrateLegacyWorks();

const detail = document.getElementById("yarn-detail");

// URLから毛糸IDを取得
const params = new URLSearchParams(location.search);
const yarnId = params.get("id");

// 保存されている毛糸を取得
const yarns = JSON.parse(localStorage.getItem("knittingYarns") || "[]");

// 保存されている作品を取得
const works = await KnittingImageStore.exportWorks();

// 該当する毛糸を探す
const yarn = yarns.find((item) => item.id === yarnId);

// この毛糸を使った作品を探す
const usedWorks = works.filter((work) => work.yarnId === yarnId);

if (!yarn) {
  detail.innerHTML = `
    <p class="empty-message">
      毛糸が見つかりませんでした。
    </p>
  `;
} else {
  renderYarn(yarn);
}

// ====================
// 毛糸詳細
// ====================

function renderYarn(yarn) {
  const imageHtml = yarn.image
    ? `
      <div class="yarn-detail-image">
        <img src="${yarn.image}" alt="${escapeHtml(yarn.name)}">
      </div>
    `
    : `
      <div class="yarn-detail-image no-image">
        🧶
      </div>
    `;

  detail.innerHTML = `
    ${imageHtml}

    <h2>${escapeHtml(yarn.name)}</h2>

    <div class="detail-section">
      <h3>🏷️ メーカー</h3>
      <p>${escapeHtml(yarn.maker) || "未登録"}</p>
    </div>

    <div class="detail-section">
      <h3>🔢 色番</h3>
      <p>${escapeHtml(yarn.colorNumber) || "未登録"}</p>
    </div>

<div class="detail-section">
  <h3>🎨 カラー</h3>
  ${
    yarn.yarnColor
      ? `
        <div class="yarn-detail-color-value">
          <span class="yarn-detail-color yarn-detail-color-${yarn.yarnColor}"></span>
        </div>
      `
      : `
        <p>未登録</p>
      `
  }
</div>

    <div class="detail-section">
      <h3>🧶 太さ</h3>
      <p>${escapeHtml(yarn.thickness) || "未登録"}</p>
    </div>

    <div class="detail-section">
      <h3>🧵 素材</h3>
      <p>${escapeHtml(yarn.material) || "未登録"}</p>
    </div>

    <div class="detail-section">
      <h3>⚖️ 重量</h3>
      <p>${yarn.weight !== undefined && yarn.weight !== "" ? `${escapeHtml(String(yarn.weight).replace(/\s*g$/i, ""))}g` : "未登録"}</p>
    </div>

    <div class="detail-section">
      <h3>📏 長さ</h3>
      <p>${yarn.length !== undefined && yarn.length !== "" ? `${escapeHtml(String(yarn.length).replace(/\s*m$/i, ""))}m` : "未登録"}</p>
    </div>
    
<div class="detail-section">
  <h3>🧶 棒針ゲージ</h3>
  <p>${escapeHtml(yarn.knittingGauge || "未登録")}</p>
</div>

<div class="detail-section">
  <h3>🪝 かぎ針ゲージ</h3>
  <p>${escapeHtml(yarn.crochetGauge || "未登録")}</p>
</div>

<div class="detail-section">
  <h3>🧶 推奨棒針</h3>
  <p>${escapeHtml(yarn.recommendedKnittingNeedle || "未登録")}</p>
</div>

<div class="detail-section">
  <h3>🪝 推奨かぎ針</h3>
  <p>${escapeHtml(yarn.recommendedCrochetHook || "未登録")}</p>
</div>

    <div class="detail-section">
      <h3>🛍️ 購入場所</h3>
      <p>${escapeHtml(yarn.purchaseLocation) || "未登録"}</p>
    </div>

    <div class="detail-section">
      <h3>💬 コメント</h3>
      <p>${escapeHtml(yarn.comment) || "コメントなし"}</p>
    </div>

    <div class="detail-section">
      <h3>🧥 この毛糸を使った作品</h3>

      ${
        usedWorks.length > 0
          ? `
            <div class="used-works">
              ${usedWorks
                .map(
                  (work) => `
                    <div
                      class="used-work-card"
                      onclick="location.href='work-detail.html?id=${work.id}'"
                    >
                      ${
                        work.images && work.images.length > 0
                          ? `
                            <img
                              src="${work.images[0]}"
                              alt="${escapeHtml(work.name)}"
                            >
                          `
                          : `
                            <div class="used-work-no-image">
                              🧶
                            </div>
                          `
                      }

                      <p>${escapeHtml(work.name)}</p>
                    </div>
                  `,
                )
                .join("")}
            </div>
          `
          : `
            <p>この毛糸を使った作品はまだありません。</p>
          `
      }

          </div>

    <button
      type="button"
      class="edit-button"
      id="edit-yarn-button"
    >
      ✏️ 毛糸を編集
    </button>

    <button
  type="button"
  class="copy-button"
  id="copy-button"
>
  📋 コピーして登録
</button>

    <button
  type="button"
  class="delete-button"
  id="delete-yarn-button"
>
  🗑️ 毛糸を削除
</button>

  `;

  document.getElementById("edit-yarn-button").addEventListener("click", () => {
    location.href = `yarn-edit.html?id=${yarn.id}`;
  });

  document.getElementById("copy-button").addEventListener("click", () => {
    location.href = `yarn-register.html?copyId=${yarn.id}`;
  });

  document
    .getElementById("delete-yarn-button")
    .addEventListener("click", () => {
      const confirmed = confirm(
        "この毛糸を削除しますか？\n\nこの毛糸を使用している作品との紐付けもなくなります。",
      );

      if (!confirmed) {
        return;
      }

      const updatedYarns = yarns.filter((item) => item.id !== yarn.id);

      localStorage.setItem("knittingYarns", JSON.stringify(updatedYarns));

      alert("毛糸を削除しました。");

      location.href = "yarns.html";
    });
}

// ====================
// HTMLエスケープ
// ====================

function escapeHtml(value) {
  if (!value) return "";

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

})();
