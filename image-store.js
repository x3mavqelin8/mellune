/* 作品画像をIndexedDBに保存し、localStorageの容量を節約します。 */
const KnittingImageStore = (() => {
  const DB_NAME = "knitting-note-images";
  const STORE_NAME = "images";
  let dbPromise;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("画像保存用データベースを開けませんでした。"));
    });
    return dbPromise;
  }

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("画像データの処理に失敗しました。"));
    });
  }

  async function put(dataUrl, id = `img-${Date.now()}-${Math.random().toString(36).slice(2)}`) {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ id, data: dataUrl });
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error("画像を保存できませんでした。"));
      tx.onabort = () => reject(tx.error || new Error("画像の保存が中断されました。"));
    });
    return `idb:${id}`;
  }

  async function get(ref) {
    if (typeof ref !== "string" || !ref.startsWith("idb:")) return ref;
    const db = await openDB();
    const record = await requestResult(db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(ref.slice(4)));
    if (!record) throw new Error("作品画像が見つかりません。バックアップからの復元が必要な可能性があります。");
    return record.data;
  }

  async function saveImages(dataUrls) {
    const refs = [];
    for (const item of (Array.isArray(dataUrls) ? dataUrls : [])) {
      refs.push(typeof item === "string" && item.startsWith("idb:") ? item : await put(item));
    }
    return refs;
  }

  async function hydrateWork(work) {
    return { ...work, images: await Promise.all((Array.isArray(work.images) ? work.images : []).map(get)) };
  }

  async function migrateLegacyWorks() {
    const works = JSON.parse(localStorage.getItem("knittingWorks") || "[]");
    let changed = false;
    const migrated = [];
    for (const work of works) {
      const images = Array.isArray(work.images) ? work.images : [];
      if (images.some((image) => typeof image === "string" && image.startsWith("data:"))) {
        const refs = await saveImages(images);
        migrated.push({ ...work, images: refs });
        changed = true;
      } else migrated.push(work);
    }
    if (changed) localStorage.setItem("knittingWorks", JSON.stringify(migrated));
  }

  async function exportWorks() {
    const works = JSON.parse(localStorage.getItem("knittingWorks") || "[]");
    return Promise.all(works.map(hydrateWork));
  }

  async function importWorks(works) {
    const prepared = [];
    for (const work of works) prepared.push({ ...work, images: await saveImages(work.images || []) });
    localStorage.setItem("knittingWorks", JSON.stringify(prepared));
  }

  async function clearImages() {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error("画像データを削除できませんでした。"));
    });
  }

  return { migrateLegacyWorks, saveImages, hydrateWork, exportWorks, importWorks, clearImages };
})();
