// Данные приложения
const appData = {
  defaultBookmarks: [
    { id: "1", name: "YouTube", url: "https://youtube.com" },
    { id: "2", name: "VK", url: "https://vk.com" },
    { id: "3", name: "Mail.ru", url: "https://mail.ru" },
    { id: "4", name: "GitHub", url: "https://github.com" },
    { id: "5", name: "Wikipedia", url: "https://ru.wikipedia.org" }
  ],
  yandexServices: [
    { name: "Карты", url: "https://maps.yandex.ru", icon: "🗺️" },
    { name: "Почта", url: "https://mail.yandex.ru", icon: "✉️" },
    { name: "Погода", url: "https://yandex.ru/pogoda", icon: "🌤️" },
    { name: "Музыка", url: "https://music.yandex.ru", icon: "🎵" },
    { name: "Диск", url: "https://disk.yandex.ru", icon: "💾" }
  ],
  googleServices: [
    { name: "Gmail", url: "https://mail.google.com", icon: "✉️" },
    { name: "Контакты", url: "https://contacts.google.com", icon: "👤" },
    { name: "Переводчик", url: "https://translate.google.com", icon: "🔤" },
    { name: "Фото", url: "https://photos.google.com", icon: "📷" },
    { name: "Диск", url: "https://drive.google.com", icon: "💾" },
    { name: "Keep", url: "https://keep.google.com", icon: "📝" },
    { name: "Play Маркет", url: "https://play.google.com", icon: "📱" },
    { name: "YouTube", url: "https://youtube.com", icon: "▶️" }
  ]
};

// Текущее состояние
let editingBookmarkIndex = -1;

// Инициализация
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

function initializeApp() {
  loadCurrencyRates();
  renderYandexServices();
  initializeBookmarks();
  setupEventListeners();
  setupGoogleServices();
}

/* Вспомогательные */
function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?sz=32&domain_url=${domain}`;
  } catch {
    return "data:image/svg+xml,";
  }
}

/* Курсы валют (демо) */
async function loadCurrencyRates() {
  try {
    setTimeout(() => {
      document.getElementById("usd-rate").textContent = "95.50";
      document.getElementById("eur-rate").textContent = "103.20";
    }, 1000);
  } catch (e) {
    document.getElementById("usd-rate").textContent = "н/д";
    document.getElementById("eur-rate").textContent = "н/д";
  }
}

/* Яндекс-сервисы: ссылки в той же вкладке */
function renderYandexServices() {
  const grid = document.getElementById("yandex-services-grid");
  if (!grid) return;
  grid.innerHTML = "";

  appData.yandexServices.forEach(s => {
    const a = document.createElement("a");
    a.className = "service-item";
    a.href = s.url; // без target — откроется в текущей вкладке
    a.innerHTML = `
      <div class="service-icon">${s.icon}</div>
      <div class="service-name">${s.name}</div>
    `;
    // Нормальная ссылка уже поддерживает среднюю кнопку мыши нативно,
    // дополнительных обработчиков не требуется.
    grid.appendChild(a);
  });
}

/* Закладки */
function initializeBookmarks() {
  const stored = JSON.parse(localStorage.getItem("bookmarks") || "[]");
  if (!stored.length) {
    localStorage.setItem("bookmarks", JSON.stringify(appData.defaultBookmarks));
  }
  renderBookmarks();
}

function renderBookmarks() {
  const grid = document.getElementById("bookmarks-grid");
  if (!grid) return;

  const data = JSON.parse(localStorage.getItem("bookmarks") || "[]");
  grid.innerHTML = "";

  data.forEach((b, idx) => {
    const item = document.createElement("div");
    item.className = "bookmark-item";
    item.draggable = true;
    item.dataset.index = idx;

    item.innerHTML = `
      <img class="bookmark-icon" alt="" src="${getFaviconUrl(b.url)}"/>
      <div class="bookmark-name">${b.name}</div>
      <div class="bookmark-actions">
        <button class="bookmark-edit" title="Редактировать">✎</button>
        <button class="bookmark-delete" title="Удалить">✕</button>
      </div>
    `;

    // ЛКМ по карточке — навигация в этой же вкладке
    item.addEventListener("click", (e) => {
      if (e.target.closest(".bookmark-actions")) return; // не навигируем при клике по кнопкам
      // Если клик средней кнопкой — этот обработчик не сработает (он для click/LKM),
      // отдельный обработчик для MMB ниже.
      location.href = b.url;
    });

    // Средняя кнопка мыши (MMB) — открыть в новой вкладке
    // Используем mousedown, потому что у div нет нативного поведения ссылки.
    item.addEventListener("mousedown", (e) => {
      if (e.button === 1) { // 1 — средняя кнопка
        e.preventDefault(); // чтобы не прокручивало страницу
        window.open(b.url, "_blank", "noopener");
      }
    });

    // Кнопки управления
    item.querySelector(".bookmark-edit").addEventListener("click", (e) => {
      e.stopPropagation();
      openEditBookmark(idx);
    });
    item.querySelector(".bookmark-delete").addEventListener("click", (e) => {
      e.stopPropagation();
      deleteBookmark(idx);
    });

    // Drag & drop
    item.addEventListener("dragstart", dragStart);
    item.addEventListener("dragover", dragOver);
    item.addEventListener("drop", drop);
    item.addEventListener("dragend", dragEnd);

    grid.appendChild(item);
  });
}

function setupEventListeners() {
  const addBtn = document.getElementById("add-bookmark-btn");
  const addModal = document.getElementById("addBookmarkModal");
  const editModal = document.getElementById("editBookmarkModal");

  addBtn?.addEventListener("click", () => {
    addModal.classList.remove("hidden");
    addModal.setAttribute("aria-hidden", "false");
    document.getElementById("bookmarkName").focus();
  });

  document.querySelectorAll("[data-close]").forEach(b => {
    b.addEventListener("click", closeModals);
  });

  document.getElementById("saveBookmarkBtn")?.addEventListener("click", saveBookmark);
  document.getElementById("updateBookmarkBtn")?.addEventListener("click", updateBookmark);

  [addModal, editModal].forEach(m => {
    m?.addEventListener("click", (e) => {
      if (e.target === m) closeModals();
    });
  });
}

function closeModals() {
  document.querySelectorAll(".modal").forEach(m => {
    m.classList.add("hidden");
    m.setAttribute("aria-hidden", "true");
  });
  editingBookmarkIndex = -1;
}

function saveBookmark() {
  const name = document.getElementById("bookmarkName").value.trim();
  const url = document.getElementById("bookmarkUrl").value.trim();
  if (!name || !url) return;

  const data = JSON.parse(localStorage.getItem("bookmarks") || "[]");
  data.push({ id: String(Date.now()), name, url });
  localStorage.setItem("bookmarks", JSON.stringify(data));
  closeModals();
  renderBookmarks();
}

function openEditBookmark(index) {
  editingBookmarkIndex = index;
  const data = JSON.parse(localStorage.getItem("bookmarks") || "[]");
  const b = data[index];
  if (!b) return;
  document.getElementById("editBookmarkName").value = b.name;
  document.getElementById("editBookmarkUrl").value = b.url;
  const modal = document.getElementById("editBookmarkModal");
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.getElementById("editBookmarkName").focus();
}

function updateBookmark() {
  if (editingBookmarkIndex < 0) return;
  const name = document.getElementById("editBookmarkName").value.trim();
  const url = document.getElementById("editBookmarkUrl").value.trim();
  const data = JSON.parse(localStorage.getItem("bookmarks") || "[]");
  data[editingBookmarkIndex] = { ...data[editingBookmarkIndex], name, url };
  localStorage.setItem("bookmarks", JSON.stringify(data));
  closeModals();
  renderBookmarks();
}

function deleteBookmark(index) {
  const data = JSON.parse(localStorage.getItem("bookmarks") || "[]");
  data.splice(index, 1);
  localStorage.setItem("bookmarks", JSON.stringify(data));
  renderBookmarks();
}

/* Drag & drop */
let dragSrcIndex = -1;
function dragStart(e){ dragSrcIndex = Number(e.currentTarget.dataset.index); e.dataTransfer.effectAllowed = "move"; }
function dragOver(e){ e.preventDefault(); e.dataTransfer.dropEffect = "move"; }
function drop(e){
  e.stopPropagation();
  const targetIndex = Number(e.currentTarget.dataset.index);
  if (dragSrcIndex === targetIndex) return;
  const data = JSON.parse(localStorage.getItem("bookmarks") || "[]");
  const [moved] = data.splice(dragSrcIndex, 1);
  data.splice(targetIndex, 0, moved);
  localStorage.setItem("bookmarks", JSON.stringify(data));
  renderBookmarks();
}
function dragEnd(){ dragSrcIndex = -1; }

/* Заглушка на будущее — если потребуется динамика сайдбара Google */
function setupGoogleServices(){ /* статический список в index.html */ }
