const params = new URLSearchParams(location.search);
const yarnId = params.get("id");

const registerForm = document.querySelector(".register-form");

const cameraButton = document.getElementById("camera-button");
const galleryButton = document.getElementById("gallery-button");

const cameraInput = document.getElementById("camera-input");
const galleryInput = document.getElementById("gallery-input");

const imagePreview = document.getElementById("image-preview");

// ====================
// 画像
// ====================

let selectedImage = "";

// ====================
// カラー
// ====================

let selectedColor = "";

// ====================
// データ取得
// ====================

const yarns = JSON.parse(localStorage.getItem("knittingYarns") || "[]");

const yarn = yarns.find((item) => item.id === yarnId);

// ====================
// 毛糸が見つからない場合
// ====================

if (!yarn) {
  alert("毛糸が見つかりませんでした。");
  history.back();
} else {
  loadYarn();
}

// ====================
// 毛糸データをフォームに表示
// ====================

function loadYarn() {
  selectedImage = yarn.image || "";

  document.getElementById("yarn-maker").value = yarn.maker || "";

  document.getElementById("yarn-name").value = yarn.name || "";

  document.getElementById("yarn-color-number").value = yarn.colorNumber || "";

  selectedColor = yarn.yarnColor || "";

  document.querySelectorAll(".yarn-color-option").forEach((button) => {
    button.classList.toggle("selected", button.dataset.color === selectedColor);
  });

  document.getElementById("yarn-material").value = yarn.material || "";
  document.getElementById("yarn-thickness").value = yarn.thickness || "";
  document.getElementById("yarn-purchase-location").value = yarn.purchaseLocation || "";

  document.getElementById("yarn-weight").value = yarn.weight || "";

  document.getElementById("yarn-length").value = yarn.length || "";
  document.getElementById("yarn-knitting-gauge").value =
    yarn.knittingGauge || "";

  document.getElementById("yarn-crochet-gauge").value = yarn.crochetGauge || "";

  document.getElementById("yarn-recommended-knitting-needle").value =
    yarn.recommendedKnittingNeedle || "";

  document.getElementById("yarn-recommended-crochet-hook").value =
    yarn.recommendedCrochetHook || "";
  document.getElementById("yarn-comment").value = yarn.comment || "";

  showPreview();
}

// ====================
// カラー選択
// ====================

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
// カメラ
// ====================

cameraButton.addEventListener("click", () => {
  cameraInput.click();
});

// ====================
// ギャラリー
// ====================

galleryButton.addEventListener("click", () => {
  galleryInput.click();
});

// ====================
// カメラで撮影
// ====================

cameraInput.addEventListener("change", async () => {
  if (cameraInput.files.length > 0) {
    selectedImage = await resizeImage(cameraInput.files[0]);
    showPreview();
  }

  cameraInput.value = "";
});

// ====================
// ギャラリーから選択
// ====================

galleryInput.addEventListener("change", async () => {
  if (galleryInput.files.length > 0) {
    selectedImage = await resizeImage(galleryInput.files[0]);
    showPreview();
  }

  galleryInput.value = "";
});

// ====================
// プレビュー表示
// ====================

function showPreview() {
  imagePreview.innerHTML = "";

  if (!selectedImage) {
    return;
  }

  const wrapper = document.createElement("div");

  wrapper.className = "preview-item";

  const img = document.createElement("img");

  img.src = selectedImage;

  const deleteButton = document.createElement("button");

  deleteButton.type = "button";
  deleteButton.className = "delete-image";
  deleteButton.textContent = "×";

  deleteButton.addEventListener("click", () => {
    selectedImage = "";

    showPreview();
  });

  wrapper.appendChild(img);
  wrapper.appendChild(deleteButton);

  imagePreview.appendChild(wrapper);
}

// ====================
// 変更を保存
// ====================

registerForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const maker = document.getElementById("yarn-maker").value.trim();

  const name = document.getElementById("yarn-name").value.trim();

  const colorNumber = document.getElementById("yarn-color-number").value.trim();

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

  // 毛糸を更新
  yarn.image = selectedImage;
  yarn.maker = maker;
  yarn.name = name;
  yarn.colorNumber = colorNumber;
  yarn.yarnColor = selectedColor;
  yarn.material = material;
  yarn.thickness = thickness;
  yarn.purchaseLocation = purchaseLocation;
  yarn.weight = normalizeUnit(weight, "g");
  yarn.length = normalizeUnit(length, "m");
  yarn.knittingGauge = knittingGauge;
  yarn.crochetGauge = crochetGauge;
  yarn.recommendedKnittingNeedle = recommendedKnittingNeedle;
  yarn.recommendedCrochetHook = recommendedCrochetHook;
  yarn.comment = comment;

  // 保存
  localStorage.setItem("knittingYarns", JSON.stringify(yarns));
// 毛糸詳細へ戻る
  location.href = `yarn-detail.html?id=${yarn.id}`;
});

function normalizeUnit(value, unit) {
  return String(value || "").trim().replace(new RegExp(`\\s*${unit}$`, "i"), "").trim();
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
