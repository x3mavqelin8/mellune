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

const cameraButton = document.getElementById("yarn-camera-button");
const galleryButton = document.getElementById("yarn-gallery-button");

const cameraInput = document.getElementById("yarn-camera-input");
const galleryInput = document.getElementById("yarn-gallery-input");

const imagePreview = document.getElementById("yarn-image-preview");
const registerForm = document.querySelector(".register-form");

let selectedFile = null;

// ====================
// カラー選択
// ====================

let selectedColor = "";

const colorOptions = document.querySelectorAll(".yarn-color-option");

colorOptions.forEach((button) => {
  button.addEventListener("click", () => {
    colorOptions.forEach((item) => {
      item.classList.remove("selected");
    });

    button.classList.add("selected");

    selectedColor = button.dataset.color;
  });
});

// ====================
// コピー元の毛糸を取得
// ====================

const params = new URLSearchParams(location.search);
const copyId = params.get("copyId");

const yarns = JSON.parse(localStorage.getItem("knittingYarns") || "[]");

const copyYarn = copyId ? yarns.find((item) => item.id === copyId) : null;

// ====================
// コピー内容をフォームに反映
// ====================

if (copyYarn) {
  document.getElementById("yarn-maker").value = copyYarn.maker || "";
  document.getElementById("yarn-name").value = copyYarn.name || "";
  document.getElementById("yarn-color-number").value = "";
  document.getElementById("yarn-material").value = copyYarn.material || "";
  document.getElementById("yarn-thickness").value = copyYarn.thickness || "";
  document.getElementById("yarn-purchase-location").value = copyYarn.purchaseLocation || "";
  document.getElementById("yarn-weight").value = copyYarn.weight || "";
  document.getElementById("yarn-length").value = copyYarn.length || "";
  document.getElementById("yarn-knitting-gauge").value =
    copyYarn.knittingGauge || "";

  document.getElementById("yarn-crochet-gauge").value =
    copyYarn.crochetGauge || "";

  document.getElementById("yarn-recommended-knitting-needle").value =
    copyYarn.recommendedKnittingNeedle || "";

  document.getElementById("yarn-recommended-crochet-hook").value =
    copyYarn.recommendedCrochetHook || "";
  document.getElementById("yarn-comment").value = copyYarn.comment || "";
}

// ====================
// カメラ
// ====================

cameraButton.addEventListener("click", () => {
  cameraInput.click();
});

// ====================
// 写真から選ぶ
// ====================

galleryButton.addEventListener("click", () => {
  galleryInput.click();
});

// ====================
// カメラで撮影
// ====================

cameraInput.addEventListener("change", () => {
  if (cameraInput.files.length > 0) {
    selectedFile = cameraInput.files[0];
    showPreview();
  }

  cameraInput.value = "";
});

// ====================
// ギャラリーから選択
// ====================

galleryInput.addEventListener("change", () => {
  if (galleryInput.files.length > 0) {
    selectedFile = galleryInput.files[0];
    showPreview();
  }

  galleryInput.value = "";
});

// ====================
// プレビュー表示
// ====================

function showPreview() {
  imagePreview.innerHTML = "";

  if (!selectedFile) {
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "preview-item";

  const img = document.createElement("img");
  img.src = URL.createObjectURL(selectedFile);

  const deleteButton = document.createElement("button");

  deleteButton.type = "button";
  deleteButton.className = "delete-image";
  deleteButton.textContent = "×";

  deleteButton.addEventListener("click", () => {
    selectedFile = null;
    showPreview();
  });

  wrapper.appendChild(img);
  wrapper.appendChild(deleteButton);

  imagePreview.appendChild(wrapper);
}

// ====================
// 毛糸登録
// ====================

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const maker = document.getElementById("yarn-maker").value.trim();
  const name = document.getElementById("yarn-name").value.trim();
  const colorNumber = document.getElementById("yarn-color-number").value.trim();
  const yarnColor = selectedColor;
  const material = document.getElementById("yarn-material").value.trim();
  const thickness = document.getElementById("yarn-thickness").value;
  const purchaseLocation = document.getElementById("yarn-purchase-location").value.trim();
  const weight = document.getElementById("yarn-weight").value.trim();
  const length = document.getElementById("yarn-length").value.trim();
  const knittingGauge = document
    .getElementById("yarn-knitting-gauge")
    .value.trim();

  const crochetGauge = document
    .getElementById("yarn-crochet-gauge")
    .value.trim();

  const recommendedKnittingNeedle = document
    .getElementById("yarn-recommended-knitting-needle")
    .value.trim();

  const recommendedCrochetHook = document
    .getElementById("yarn-recommended-crochet-hook")
    .value.trim();
  const comment = document.getElementById("yarn-comment").value.trim();

  // 商品名は必須
  if (!name) {
    alert("商品名を入力してください");
    return;
  }

  // 画像
  let image = "";

  if (selectedFile) {
    image = await resizeImage(selectedFile);
  }

  // 新しい毛糸
  const yarn = {
    id: createId(),
    image: image,
    maker: maker,
    name: name,
    colorNumber: colorNumber,
    yarnColor: yarnColor,
    material: material,
    thickness,
    purchaseLocation,
    weight: normalizeUnit(weight, "g"),
    length: normalizeUnit(length, "m"),
    knittingGauge,
    crochetGauge,
    recommendedKnittingNeedle,
    recommendedCrochetHook,
    comment,
    createdAt: new Date().toISOString(),
  };

  // 既存の毛糸を取得
  const yarns = JSON.parse(localStorage.getItem("knittingYarns") || "[]");

  // 新しい毛糸を追加
  yarns.push(yarn);

  // 保存
  localStorage.setItem("knittingYarns", JSON.stringify(yarns));
// 毛糸一覧へ
  location.href = "yarns.html";
});

function normalizeUnit(value, unit) {
  const cleaned = String(value || "").trim().replace(new RegExp(`\\s*${unit}$`, "i"), "").trim();
  return cleaned;
}

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

        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };

      img.onerror = reject;
      img.src = event.target.result;
    };

    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}
