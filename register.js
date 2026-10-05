(async function () {
  await KnittingImageStore.migrateLegacyWorks();

// HTTPでのスマートフォン表示など、createId() が使えない環境向けの代替ID
function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.random() * 16 | 0;
    const value = char === "x" ? random : (random & 0x3 | 0x8);
    return value.toString(16);
  });
}

const cameraButton = document.getElementById("camera-button");
const galleryButton = document.getElementById("gallery-button");

const cameraInput = document.getElementById("camera-input");
const galleryInput = document.getElementById("gallery-input");

const imagePreview = document.getElementById("image-preview");
const registerForm = document.querySelector(".register-form");

// 新規登録時の完成日は今日を初期値にする（入力済みなら上書きしない）
const completedAtInput = document.getElementById("work-completed-at");
if (completedAtInput && !completedAtInput.value) {
  const today = new Date();
  completedAtInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}


const yarnList = document.getElementById("work-yarn-list");
const savedYarns = JSON.parse(localStorage.getItem("knittingYarns") || "[]");
function addYarnSelect(selectedId = "", quantity = "") {
  const row = document.createElement("div");
  row.className = "work-yarn-row";
  const select = document.createElement("select");
  select.className = "work-yarn-select";
  select.innerHTML = '<option value="">使用糸を選択</option>';
  savedYarns.forEach((yarn) => {
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
  });
  row.append(select, quantityInput, remove);
  yarnList.appendChild(row);
}
addYarnSelect();
document.getElementById("add-work-yarn").addEventListener("click", () => addYarnSelect());

let selectedFiles = [];

// カメラ
cameraButton.addEventListener("click", () => {
  cameraInput.click();
});

// 写真から選ぶ
galleryButton.addEventListener("click", () => {
  galleryInput.click();
});

// カメラで撮影
cameraInput.addEventListener("change", () => {
  addFiles(cameraInput.files);
  cameraInput.value = "";
});

// ギャラリーから選択
galleryInput.addEventListener("change", () => {
  addFiles(galleryInput.files);
  galleryInput.value = "";
});

// 画像を追加
function addFiles(files) {
  const newFiles = Array.from(files);
  const remaining = Math.max(0, 3 - selectedFiles.length);
  const accepted = newFiles.slice(0, remaining);
  selectedFiles.push(...accepted);
  showPreview();
  if (newFiles.length > accepted.length) {
    alert("作品画像はメイン・サブ合わせて3枚まで登録できます。不要な画像を削除してから追加してください。");
  }
}

// プレビュー表示
function showPreview() {
  imagePreview.innerHTML = "";

  selectedFiles.forEach((file, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "preview-item";

    const img = document.createElement("img");

    img.src = URL.createObjectURL(file);

    const deleteButton = document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className = "delete-image";
    deleteButton.textContent = "×";

    deleteButton.addEventListener("click", () => {
      selectedFiles.splice(index, 1);
      showPreview();
    });

    wrapper.appendChild(img);
    wrapper.appendChild(deleteButton);

    imagePreview.appendChild(wrapper);
  });
}

// ====================
// 作品登録
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

  // 作品名は必須
  if (!name) {
    alert("作品名を入力してください");
    return;
  }

  // 画像を保存用データに変換
  const images = [];

  for (const file of selectedFiles) {
    const imageData = await resizeImage(file);
    images.push(imageData);
  }

  // 新しい作品
  const work = {
    id: createId(),
    images: await KnittingImageStore.saveImages(images),
    name: name,
    yarnId: yarnIds[0] || "",
    yarnIds: yarnIds,
    yarnUsages: yarnUsages,
    needle: needle,
    material: material,
    gauge: gauge,
    reference: reference,
    comment: comment,
    memo: memo,
    createdAt: new Date().toISOString(),
    completedAt: completedAt,
  };

  // 既存作品を取得
  const works = JSON.parse(localStorage.getItem("knittingWorks") || "[]");

  // 新しい作品を追加
  works.push(work);

  // 保存
  localStorage.setItem("knittingWorks", JSON.stringify(works));
// 作品一覧へ
  location.href = "works.html";
  } catch (error) {
    console.error("作品登録に失敗しました:", error);
    const detail = error && (error.name || error.message)
      ? `${error.name || "Error"}${error.message ? `: ${error.message}` : ""}`
      : String(error);
    alert(`作品を登録できませんでした。入力内容は保存されていません。\n\n原因：${detail}`);
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
