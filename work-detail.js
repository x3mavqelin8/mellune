(async function () {
  await KnittingImageStore.migrateLegacyWorks();

const detail = document.getElementById("work-detail");

// URLから作品IDを取得
const params = new URLSearchParams(location.search);
const workId = params.get("id");

// 保存されている作品を取得
const works = JSON.parse(localStorage.getItem("knittingWorks") || "[]");

// 保存されている毛糸を取得
const yarns = JSON.parse(localStorage.getItem("knittingYarns") || "[]");

// 該当する作品を探す
let work = works.find((item) => item.id === workId);

// 使用糸を探す
const workYarnIds = (work?.yarnIds?.length ? work.yarnIds : [work?.yarnId]).filter(Boolean);
const workYarns = workYarnIds.map((id) => yarns.find((item) => item.id === id)).filter(Boolean);
const yarn = workYarns[0] || null;

// 作品が見つからない場合
if (!work) {
  detail.innerHTML = `
    <p class="empty-message">
      作品が見つかりませんでした。
    </p>
  `;
} else {
  work = await KnittingImageStore.hydrateWork(work);
  renderWork(work);
}

// ====================
// 作品詳細を表示
// ====================

function renderWork(work) {
  const images = work.images || [];

  const imageHtml =
    images.length > 0
      ? `
      <div class="detail-images">
        <div class="detail-main-image-wrap">
          <img class="detail-main-image" src="${images[0]}" alt="${escapeHtml(work.name)}">
        </div>
        ${
          images.length > 1
            ? `<div class="detail-thumbnails" aria-label="サブ画像">
                ${images.map((image, index) => `
                  <button type="button" class="detail-thumbnail${index === 0 ? " is-active" : ""}" data-image-index="${index}" aria-label="画像${index + 1}を表示" aria-pressed="${index === 0 ? "true" : "false"}">
                    <img src="${image}" alt="">
                  </button>
                `).join("")}
              </div>`
            : ""
        }
      </div>
    `
      : `
      <div class="detail-image">
        🧶
      </div>
    `;

  detail.innerHTML = `
    ${imageHtml}

    <h2>${escapeHtml(work.name)}</h2>
    ${work.completedAt ? `<div class="detail-section completion-date-detail"><h3>📅 完成日</h3><p>${escapeHtml(formatDate(work.completedAt))}</p></div>` : ""}

        <div class="detail-section">
      <h3>🔗 参考にしたもの</h3>
      <p>${escapeHtml(work.reference) || "未登録"}</p>
    </div>

<div class="detail-section yarn-section">
  <h3>🧵 使用糸</h3>
  <div class="yarn-value">
    ${
      workYarns.length
        ? workYarns.map((item) => {
          const usage = (work.yarnUsages || []).find((entry) => entry.yarnId === item.id);
          const yarnLabel = [item.maker, item.name, item.colorNumber].filter(Boolean).join(" ");
          const quantityLabel = usage && usage.quantity !== "" && usage.quantity != null ? `${escapeHtml(usage.quantity)}玉` : "玉数未入力";
          return `<a href="yarn-detail.html?id=${encodeURIComponent(item.id)}">${escapeHtml(yarnLabel)}</a> ・・・ ${quantityLabel}`;
        }).join("<br>")
        : "未登録"
    }
  </div>
</div>

<div class="detail-section">
  <h3>🪡 使用針</h3>
  <p>${escapeHtml(work.needle) || "未登録"}</p>
</div>

<div class="detail-section">
  <h3>📐 ゲージ</h3>
  <p>${escapeHtml(work.gauge) || "未登録"}</p>
</div>

<div class="detail-section">
  <h3>🧷 使用素材</h3>
  <p>${escapeHtml(work.material) || "未登録"}</p>
</div>

    <div class="detail-section">
<h3>✏️ 変更点</h3>
<p>${escapeHtml(work.comment) || "変更なし"}</p>
    </div>

    <div class="detail-section">
  <h3>📝 メモ</h3>
  <p>${escapeHtml(work.memo) || "メモなし"}</p>
</div>

    <section class="a5-print-sheet" aria-label="A5印刷用作品記録">
      <header class="a5-print-header">
        <div class="a5-print-heading">
          <div class="a5-print-title-wrap">
            <img class="a5-print-title-branch" src="assets/print/branch-title-left.png" alt="" aria-hidden="true">
            <h1>${escapeHtml(work.name) || "作品名未設定"}</h1>
          </div>
          <div class="a5-print-completion">
            <span>完成日</span>
            <strong>${work.completedAt ? escapeHtml(formatDate(work.completedAt)) : "　　年　 月　 日"}</strong>
          </div>
          <img class="a5-print-title-yarn" src="assets/print/yarn-ball.png" alt="" aria-hidden="true">
        </div>
        <div class="a5-print-heading-rule" aria-hidden="true"><span>✦</span><img class="a5-print-title-branch-right" src="assets/print/branch-title-right.png" alt=""></div>
      </header>
      ${images.length ? `
        <div class="a5-print-gallery ${images.length > 1 ? "has-thumbnails" : ""}">
          <img class="a5-print-gallery-sprig" src="assets/print/branch-corner-left.png" alt="" aria-hidden="true">
          <div class="a5-print-photo"><img src="${images[0]}" alt="${escapeHtml(work.name)}"><img class="a5-print-tape a5-print-tape-main-top" src="assets/print/tape-corner.png" alt=""><img class="a5-print-tape a5-print-tape-main-bottom" src="assets/print/tape-corner.png" alt=""></div>
          ${images.length > 1 ? `<div class="a5-print-thumbnails">${images.slice(1, 3).map((image, index) => `<div class="a5-print-thumbnail"><img src="${image}" alt="${escapeHtml(work.name)} サブ画像${index + 1}"><img class="a5-print-tape a5-print-tape-thumb" src="assets/print/tape-top.png" alt=""></div>`).join("")}</div>` : ""}
        </div>` : ""}
      <div class="a5-print-info">
        <div class="a5-print-row"><span><img src="assets/print/icon-book.png" alt="" aria-hidden="true"><b>参考</b></span><div>${escapeHtml(work.reference) || "未登録"}</div></div>
        <div class="a5-print-row"><span><img src="assets/print/icon-yarn.png" alt="" aria-hidden="true"><b>使用糸</b></span><div>${workYarns.length ? workYarns.map((item) => { const usage = (work.yarnUsages || []).find((entry) => entry.yarnId === item.id); const label = [item.maker, item.name, item.colorNumber].filter(Boolean).join(" "); const quantity = usage && usage.quantity !== "" && usage.quantity != null ? `${escapeHtml(usage.quantity)}玉` : "玉数未入力"; return `${escapeHtml(label)} ・・・ ${quantity}`; }).join("<br>") : "未登録"}</div></div>
        <div class="a5-print-row"><span><img src="assets/print/icon-needle.png" alt="" aria-hidden="true"><b>使用針</b></span><div>${escapeHtml(work.needle) || "未登録"}</div></div>
        ${work.material && String(work.material).trim() ? `<div class="a5-print-row"><span><img src="assets/print/icon-flower.png" alt="" aria-hidden="true"><b>使用素材</b></span><div>${escapeHtml(work.material)}</div></div>` : ""}
        <div class="a5-print-row a5-print-long-row"><span><img src="assets/print/icon-change.png" alt="" aria-hidden="true"><b>変更点</b></span><div>${escapeHtml(work.comment) || "変更なし"}</div></div>
      </div>
      <div class="a5-print-bottom">
        <div class="a5-print-memo">
          <img class="a5-print-tape a5-print-tape-card" src="assets/print/tape-corner.png" alt="">
          <strong><img src="assets/print/icon-memo.png" alt="" aria-hidden="true">メモ</strong>
          <div>${escapeHtml(work.memo) || ""}</div>
        </div>
        <div class="a5-print-yarn-swatch" aria-label="毛糸サンプル">
          <img class="a5-print-tape a5-print-tape-card" src="assets/print/tape-corner.png" alt="">
          <img class="a5-print-corner-branch" src="assets/print/branch-title-right.png" alt="">
          <strong><img src="assets/print/icon-yarn.png" alt="" aria-hidden="true">毛糸サンプル</strong>
          <span aria-hidden="true">✦</span>
        </div>
      </div>
    </section>

    <button
      type="button"
      class="save-image-button"
      id="save-image-button"
    >
      📸 画像として保存
    </button>

    <button
      type="button"
      class="save-image-button print-a5-button"
      id="print-a5-button"
    >
      🖨️ A5サイズで印刷
    </button>

    <button
      type="button"
      class="edit-button"
      id="edit-button"
    >
      ✏️ 作品を編集
    </button>

    <button
  type="button"
  class="delete-button"
  id="delete-work-button"
>
  🗑️ 作品を削除
</button>

  `;

  // Screen gallery: selecting a thumbnail swaps the main image.
  const mainImage = detail.querySelector(".detail-main-image");
  const thumbnailButtons = detail.querySelectorAll(".detail-thumbnail");
  thumbnailButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.imageIndex);
      if (!Number.isInteger(index) || !images[index] || !mainImage) return;

      mainImage.src = images[index];
      thumbnailButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", active ? "true" : "false");
      });
    });
  });

  document.getElementById("save-image-button").addEventListener("click", () => {
    saveWorkImage(work);
  });

  document.getElementById("print-a5-button").addEventListener("click", () => window.print());

  document.getElementById("edit-button").addEventListener("click", () => {
    const editUrl = new URL("work-edit.html", window.location.href);

    editUrl.searchParams.set("id", work.id);

    window.location.href = editUrl.href;
  });

  document
    .getElementById("delete-work-button")
    .addEventListener("click", () => {
      const confirmed = confirm(
        "この作品を削除しますか？\n\n削除した作品は元に戻せません。",
      );

      if (!confirmed) {
        return;
      }

      const updatedWorks = works.filter((item) => item.id !== work.id);

      localStorage.setItem("knittingWorks", JSON.stringify(updatedWorks));

      alert("作品を削除しました。");

      location.href = "works.html";
    });

  // ====================
  // 作品画像を保存
  // ====================

  async function saveWorkImage(work) {
    const images = Array.isArray(work.images) ? work.images : [];
    const width = 900;
    const margin = 70;
    const contentWidth = width - margin * 2;
    const title = String(work.name || "作品名未設定");
    const measureCanvas = document.createElement("canvas");
    const measureCtx = measureCanvas.getContext("2d");
    measureCtx.font = "bold 40px sans-serif";
    const titleLines = wrapText(measureCtx, title, 40, contentWidth - 32).slice(0, 2);
    const titleTop = 88;
    const titleLineHeight = 50;
    const galleryY = titleTop + titleLines.length * titleLineHeight + 34;
    const galleryH = 350;
    const galleryGap = 22;
    const hasSubs = images.length > 1;
    const mainW = hasSubs ? 540 : contentWidth;
    const sideW = hasSubs ? contentWidth - mainW - galleryGap : 0;
    const thumbGap = 14;
    const thumbCount = Math.min(Math.max(images.length - 1, 0), 2);
    const thumbH = thumbCount ? (galleryH - thumbGap * (thumbCount - 1)) / thumbCount : 0;

    const yarnRows = workYarns.length
      ? workYarns.map((item) => {
          const usage = (work.yarnUsages || []).find((entry) => entry.yarnId === item.id);
          const label = [item.maker, item.name, item.colorNumber].filter(Boolean).join(" ");
          const quantity = usage && usage.quantity !== "" && usage.quantity != null ? `${usage.quantity}玉` : "玉数未入力";
          return `${label || "毛糸名未登録"} ・・・ ${quantity}`;
        })
      : ["未登録"];
    const reference = String(work.reference || "未登録").trim() || "未登録";
    const textFont = 22;
    const lineHeight = 32;
    const sectionGap = 34;
    const labelHeight = 38;
    const textCtx = document.createElement("canvas").getContext("2d");
    textCtx.font = `${textFont}px sans-serif`;
    const yarnLines = yarnRows.flatMap((row) => wrapText(textCtx, row, textFont, contentWidth));
    const referenceLines = wrapText(textCtx, reference, textFont, contentWidth);
    const yarnBlockY = galleryY + galleryH + 54;
    const yarnTextY = yarnBlockY + labelHeight;
    const referenceBlockY = yarnTextY + yarnLines.length * lineHeight + sectionGap;
    const referenceTextY = referenceBlockY + labelHeight;
    const bottomY = referenceTextY + referenceLines.length * lineHeight + 54;
    const height = Math.max(900, bottomY + 75);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Warm, understated album-card background.
    ctx.fillStyle = "#faf5e9";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#e4d1b5";
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, width - 48, height - 48);

    // Title only: no decorative English headings.
    ctx.fillStyle = "#4a382c";
    ctx.font = "bold 40px sans-serif";
    ctx.textAlign = "center";
    titleLines.forEach((line, index) => {
      ctx.fillText(line, width / 2, titleTop + index * titleLineHeight);
    });
    ctx.textAlign = "left";

    // Main photo with up to two small secondary photos. Never crop photos.
    if (images.length > 0) {
      const mainImage = await loadImage(images[0]);
      ctx.fillStyle = "#ffffff";
      roundedRect(ctx, margin, galleryY, mainW, galleryH, 22);
      ctx.fill();
      ctx.save();
      roundedRect(ctx, margin + 2, galleryY + 2, mainW - 4, galleryH - 4, 20);
      ctx.clip();
      drawContainImage(ctx, mainImage, margin + 9, galleryY + 9, mainW - 18, galleryH - 18);
      ctx.restore();
      ctx.strokeStyle = "#e2c9a8";
      ctx.lineWidth = 3;
      roundedRect(ctx, margin, galleryY, mainW, galleryH, 22);
      ctx.stroke();

      for (let i = 0; i < thumbCount; i++) {
        const image = await loadImage(images[i + 1]);
        const x = margin + mainW + galleryGap;
        const y = galleryY + i * (thumbH + thumbGap);
        ctx.fillStyle = "#ffffff";
        roundedRect(ctx, x, y, sideW, thumbH, 16);
        ctx.fill();
        ctx.save();
        roundedRect(ctx, x + 2, y + 2, sideW - 4, thumbH - 4, 14);
        ctx.clip();
        drawContainImage(ctx, image, x + 7, y + 7, sideW - 14, thumbH - 14);
        ctx.restore();
        ctx.strokeStyle = "#e2c9a8";
        ctx.lineWidth = 2;
        roundedRect(ctx, x, y, sideW, thumbH, 16);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = "#ffffff";
      roundedRect(ctx, margin, galleryY, contentWidth, galleryH, 22);
      ctx.fill();
      ctx.strokeStyle = "#e2c9a8";
      ctx.lineWidth = 3;
      roundedRect(ctx, margin, galleryY, contentWidth, galleryH, 22);
      ctx.stroke();
      ctx.fillStyle = "#a7784d";
      ctx.font = "42px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🧶", width / 2, galleryY + galleryH / 2 + 14);
      ctx.textAlign = "left";
    }

    // Usage yarns.
    ctx.fillStyle = "#a7784d";
    ctx.font = "bold 30px sans-serif";
    ctx.fillText("使用糸", margin, yarnBlockY);
    ctx.fillStyle = "#554638";
    ctx.font = `${textFont}px sans-serif`;
    yarnLines.forEach((line, index) => {
      ctx.fillText(line, margin, yarnTextY + index * lineHeight);
    });

    // Reference section, with a fine separator line underneath it.
    ctx.fillStyle = "#a7784d";
    ctx.font = "bold 30px sans-serif";
    ctx.fillText("参考", margin, referenceBlockY);
    ctx.fillStyle = "#554638";
    ctx.font = `${textFont}px sans-serif`;
    referenceLines.forEach((line, index) => {
      ctx.fillText(line, margin, referenceTextY + index * lineHeight);
    });

    const filename = `${String(work.name || "knitting-note").replace(/[\\/:*?"<>|]/g, "_")}.png`;
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error("画像を作成できませんでした")), "image/png");
    });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Keep the object URL alive briefly so mobile browsers can begin the download.
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  // ====================
  // 画像読み込み
  // ====================

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => resolve(image);
      image.onerror = reject;

      image.src = src;
    });
  }

  // 画像全体を枠内に収める（トリミングしない）
  function drawContainImage(ctx, image, x, y, width, height) {
    const scale = Math.min(width / image.width, height / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
  }

  // ====================
  // 画像をトリミング表示（サムネイル用）
  // ====================
  function drawCoverImage(ctx, image, x, y, width, height) {
    const scale = Math.max(width / image.width, height / image.height);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    const sourceX = (image.width - sourceWidth) / 2;
    const sourceY = (image.height - sourceHeight) / 2;

    ctx.drawImage(
      image,
      sourceX, sourceY, sourceWidth, sourceHeight,
      x, y, width, height,
    );
  }

  // ====================
  // コメントを折り返す
  // ====================

  function wrapText(ctx, text, fontSize, maxWidth) {
    ctx.font = `${fontSize}px sans-serif`;

    const lines = [];
    let currentLine = "";

    for (const char of text) {
      const testLine = currentLine + char;

      if (ctx.measureText(testLine).width > maxWidth) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }
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


function formatDate(value) {
  if (!value) return "";
  const parts = String(value).split("-");
  if (parts.length !== 3) return value;
  return `${Number(parts[0])}年${Number(parts[1])}月${Number(parts[2])}日`;
}

})();
