(async function () {
  await KnittingImageStore.migrateLegacyWorks();

const exportButton = document.getElementById("export-button");

exportButton.addEventListener("click", async () => {
  const backupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    knittingWorks: await KnittingImageStore.exportWorks(),
    knittingYarns: JSON.parse(localStorage.getItem("knittingYarns") || "[]"),
  };

  const json = JSON.stringify(backupData, null, 2);

  const blob = new Blob([json], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;

  const date = new Date();
  const dateString =
    date.getFullYear() +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0");

  link.download = `knitting-note-backup-${dateString}.json`;

  link.click();

  URL.revokeObjectURL(url);

  alert("バックアップを保存しました！💾🧶");
});

const importButton = document.getElementById("import-button");
const importInput = document.getElementById("import-input");

importButton.addEventListener("click", () => {
  importInput.click();
});

importInput.addEventListener("change", async () => {
  const file = importInput.files[0];

  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const backupData = JSON.parse(text);

    if (
      !Array.isArray(backupData.knittingWorks) ||
      !Array.isArray(backupData.knittingYarns)
    ) {
      throw new Error("バックアップデータの形式が正しくありません。");
    }

    const confirmed = confirm(
      "バックアップを復元しますか？\n\n現在の作品・毛糸データは上書きされます。",
    );

    if (!confirmed) {
      importInput.value = "";
      return;
    }

    await KnittingImageStore.importWorks(backupData.knittingWorks);

    localStorage.setItem(
      "knittingYarns",
      JSON.stringify(backupData.knittingYarns),
    );

    alert("バックアップを復元しました！🧶✨");

    location.reload();
  } catch (error) {
    console.error(error);

    alert(
      "バックアップの読み込みに失敗しました。\n\n正しいKnitting Noteのバックアップファイルを選択してください。",
    );

    importInput.value = "";
  }
});


document.getElementById("delete-all-button").addEventListener("click", () => {
  if (!confirm("作品・毛糸の登録データをすべて削除します。\n\nこの操作は取り消せません。先にバックアップを保存しましたか？")) return;
  if (!confirm("本当にすべて削除しますか？")) return;
  localStorage.removeItem("knittingWorks");
  KnittingImageStore.clearImages().catch((error) => console.error("画像データの削除に失敗しました:", error));
  localStorage.removeItem("knittingYarns");
  alert("作品・毛糸のデータを削除しました。");
  location.reload();
});

})();
