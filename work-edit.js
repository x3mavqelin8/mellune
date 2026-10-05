(async function () {
  await KnittingImageStore.migrateLegacyWorks();

const params = new URLSearchParams(location.search);
const workId = params.get("id");

const registerForm = document.querySelector(".register-form");

const cameraButton = document.getElementById("camera-button");
const galleryButton = document.getElementById("gallery-button");

const cameraInput = document.getElementById("camera-input");
const galleryInput = document.getElementById("gallery-input");

const imagePreview = document.getElementById("image-preview");
const yarnList = document.getElementById("work-yarn-list");

function addYarnSelect(selectedId = "", quantity = "") {
  const row = document.createElement("div");
  row.className = "work-yarn-row";
  const select = document.createElement("select");
  select.className = "work-yarn-select";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "使用糸を選択";
  select.appendChild(placeholder);
  yarns.forEach((yarn) => {
    const option = document.createElement("option");
    option.value = yarn.id;
    option.textContent = [yarn.maker, yarn.name, yarn.colorNumber].filter(Boolean).join(" ");
    select.appendChild(option);
  });
  select.value = selectedId;
  const quantityInput = document.createElement("input");
  quantityInput.type = "number";
  quantityInput.min = "0";
  quantityInput.step = "any";
  quantityInput.inputMode = "decimal";
  quantityInput.className = "work-yarn-quantity";
  quantityInput.placeholder = "玉数";
  quantityInput.setAttribute("aria-label", "使用玉数");
  quantityInput.value = quantity;
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "image-button remove-yarn-button";
  remove.textContent = "削除";
  remove.addEventListener("click", () => {
    if (yarnList.children.length > 1) row.remove();
    else select.value = "";
  });
  row.append(select, quantityInput, remove);
  yarnList.appendChild(row);
}

document.getElementById("add-work-yarn").addEventListener("click", () => addYarnSelect());

// ====================
// データ取得
// ====================

const works = JSON.parse(localStorage.getItem("knittingWorks") || "[]");

const yarns = JSON.parse(localStorage.getItem("knittingYarns") || "[]");

const work = works.find((item) => item.id === workId);

// ====================
// 画像
// ====================

let selectedImages = [];

// ====================
// 作品が見つからない場合
// ====================

if (!work) {
  alert("作品が見つかりませんでした。");
  history.back();
} else {
  await loadWork();
}

// ====================
// 作品データをフォームに表示
// ====================

async function loadWork() {
  document.getElementById("work-name").value = work.name || "";
  document.getElementById("work-completed-at").value = work.completedAt || "";

  yarnList.innerHTML = "";
  const savedYarnUsages = work.yarnUsages && work.yarnUsages.length
    ? work.yarnUsages
    : ((work.yarnIds && work.yarnIds.length) ? work.yarnIds : [work.yarnId || ""]).map((id) => ({ yarnId: id, quantity: "" }));
  savedYarnUsages.forEach((item) => addYarnSelect(item.yarnId, item.quantity ?? ""));
  if (!savedYarnUsages.length) addYarnSelect();

  document.getElementById("work-needle").value = work.needle || "";

  document.getElementById("work-material").value = work.material || "";

  document.getElementById("work-gauge").value = work.gauge || "";

  document.getElementById("work-reference").value = work.reference || "";

  document.getElementById("work-comment").value = work.comment || "";

  document.getElementById("work-memo").value = work.memo || "";

  const hydratedWork = await KnittingImageStore.hydrateWork(work);
  selectedImages = [...(hydratedWork.images || [])];

  showPreview();
}

// カメラ
cameraButton.addEventListener("click", () => {
  cameraInput.click();
});

// ギャラリー
galleryButton.addEventListener("click", () => {
  galleryInput.click();
});

// カメラで撮影
cameraInput.addEventListener("change", async () => {
  await addFiles(cameraInput.files);
  cameraInput.value = "";
});

// ギャラリーから選択
galleryInput.addEventListener("change", async () => {
  await addFiles(galleryInput.files);
  galleryInput.value = "";
});

// ====================
// 画像を追加
// ====================

async function addFiles(files) {
  try {
    const newFiles = Array.from(files);
    const remaining = Math.max(0, 3 - selectedImages.length);
    const accepted = newFiles.slice(0, remaining);
    for (const file of accepted) {
      const imageData = await resizeImage(file);
      selectedImages.push(imageData);
    }
    showPreview();
    if (newFiles.length > accepted.length) {
      alert("作品画像はメイン・サブ合わせて3枚まで登録できます。不要な画像を削除してから追加してください。");
    }
  } catch (error) {
    console.error("作品画像の追加に失敗しました:", error);
    const detail = error && (error.name || error.message)
      ? `${error.name || "Error"}${error.message ? `: ${error.message}` : ""}`
      : String(error);
    alert(`画像を追加できませんでした。別の画像を試してください。\n\n原因：${detail}`);
  }
}

// ====================
// プレビュー表示
// ====================

function showPreview() {
  imagePreview.innerHTML = "";

  selectedImages.forEach((image, index) => {
    const wrapper = document.createElement("div");

    wrapper.className = "preview-item";

    const img = document.createElement("img");

    img.src = image;

    const deleteButton = document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className = "delete-image";
    deleteButton.textContent = "×";

    deleteButton.addEventListener("click", () => {
      selectedImages.splice(index, 1);

      showPreview();
    });

    wrapper.appendChild(img);
    wrapper.appendChild(deleteButton);

    imagePreview.appendChild(wrapper);
  });
}

// ====================
// 変更を保存
// ====================

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {

  const name = document.getElementById("work-name").value.trim();
  const completedAt = document.getElementById("work-completed-at").value;
  const yarnRows = [...document.querySelectorAll(".work-yarn-row")];
  const yarnUsages = yarnRows.map((row) => ({ yarnId: row.querySelector(".work-yarn-select").value, quantity: row.querySelector(".work-yarn-quantity").value }))
    .filter((item) => item.yarnId)
    .filter((item, index, arr) => arr.findIndex((entry) => entry.yarnId === item.yarnId) === index);
  const yarnIds = yarnUsages.map((item) => item.yarnId);
  const needle = document.getElementById("work-needle").value.trim();
  const material = document.getElementById("work-material").value.trim();
  const gauge = document.getElementById("work-gauge").value.trim();
  const reference = document.getElementById("work-reference").value.trim();
  const comment = document.getElementById("work-comment").value.trim();
  const memo = document.getElementById("work-memo").value.trim();

  if (!name) {
    alert("作品名を入力してください");
    return;
  }

  // 作品を更新
  work.name = name;
  work.completedAt = completedAt;
  work.yarnId = yarnIds[0] || "";
  work.yarnIds = yarnIds;
  work.yarnUsages = yarnUsages;
  work.needle = needle;
  work.material = material;
  work.gauge = gauge;
  work.reference = reference;
  work.comment = comment;
  work.memo = memo;
  work.images = await KnittingImageStore.saveImages(selectedImages);

  // 保存
  localStorage.setItem("knittingWorks", JSON.stringify(works));
// 作品詳細へ戻る
  location.href = `work-detail.html?id=${work.id}`;
  } catch (error) {
    console.error("作品の保存に失敗しました:", error);
    const detail = error && (error.name || error.message)
      ? `${error.name || "Error"}${error.message ? `: ${error.message}` : ""}`
      : String(error);
    alert(`作品を保存できませんでした。変更は保存されていません。\n\n原因：${detail}`);
  }
});

// ====================
// 画像を軽量化
// ====================

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const maxSize = 1200;

        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = height * (maxSize / width);
            width = maxSize;
          } else {
            width = width * (maxSize / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        ctx.drawImage(img, 0, 0, width, height);

        // 画像の長辺は最大1200pxにし、画質を段階的に調整して容量を抑える
        let quality = 0.82;
        let compressed = canvas.toDataURL("image/jpeg", quality);
        while (compressed.length > 700_000 && quality > 0.58) {
          quality -= 0.08;
          compressed = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(compressed);
      };

      img.onerror = reject;

      img.src = event.target.result;
    };

    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

})();
