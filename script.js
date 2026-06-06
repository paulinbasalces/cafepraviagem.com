const state = {
  dados: [],
  parceiros: [],
  tagsConfig: {},
  termo: "",
  filtro: "all",
  fonteAlternativa: false,
  theme: "light",
  activeModalId: null
};

const elements = {
  root: document.documentElement,
  searchForm: document.querySelector(".search-bar"),
  searchInput: document.querySelector("#searchInput"),
  clearButton: document.querySelector("[data-clear-search]"),
  googleFallbackButton: document.querySelector("[data-google-fallback]"),
  cardsGrid: document.querySelector("#cardsGrid"),
  emptyState: document.querySelector("#emptyState"),
  bentoButtons: Array.from(document.querySelectorAll(".bento-card")),
  activeTags: document.querySelector("#activeTags"),
  resultsCount: document.querySelector("[data-results-count]"),
  resultsLabel: document.querySelector("[data-results-label]"),
  partnersContainer: document.querySelector("#partnersContainer"),
  totalStat: document.querySelector("[data-stat-total]"),
  categoryStat: document.querySelector("[data-stat-categories]"),
  tagsStat: document.querySelector("[data-stat-tags]"),
  modal: document.querySelector("#detailModal"),
  modalContent: document.querySelector("#modalContent"),
  closeModalButton: document.querySelector("[data-close-modal]"),
  themeToggle: document.querySelector("[data-theme-toggle]"),
  fontToggle: document.querySelector("[data-font-toggle]")
};

async function loadPortalData() {
  try {
    elements.cardsGrid.setAttribute("aria-busy", "true");

    const [dadosResponse, parceirosResponse, tagsResponse] = await Promise.all([
      fetch("./dados.json"),
      fetch("./parceiros.json"),
      fetch("./tags.json")
    ]);

    if (!dadosResponse.ok || !parceirosResponse.ok || !tagsResponse.ok) {
      throw new Error("Falha ao carregar os arquivos de dados.");
    }

    const [dados, parceiros, tagsConfig] = await Promise.all([
      dadosResponse.json(),
      parceirosResponse.json(),
      tagsResponse.json()
    ]);

    state.dados = Array.isArray(dados) ? dados : [];
    state.parceiros = Array.isArray(parceiros) ? parceiros : [];
    state.tagsConfig = tagsConfig && typeof tagsConfig === "object" ? tagsConfig : {};

    updateStats();
    renderPartners();
    syncFromURL();
    renderAll();
  } catch (error) {
    elements.cardsGrid.innerHTML = `
      <article class="empty-state glass-panel">
        <div class="empty-icon" aria-hidden="true">⚠️</div>
        <h3>Não foi possível carregar a curadoria</h3>
        <p>Verifique os arquivos dados.json, parceiros.json e tags.json para concluir o portal.</p>
      </article>
    `;
    elements.emptyState.hidden = true;
    elements.resultsCount.textContent = "0 resultados";
    elements.resultsLabel.textContent = "dados indisponíveis no momento";
  } finally {
    elements.cardsGrid.setAttribute("aria-busy", "false");
  }
}

function updateStats() {
  const categorias = new Set(state.dados.map((item) => normalizeText(item.categoria || "")));
  const tags = new Set(
    state.dados.flatMap((item) => extractTags(item.nome || "")).map((tag) => normalizeText(tag))
  );

  animateNumber(elements.totalStat, state.dados.length);
  animateNumber(elements.categoryStat, categorias.size);
  animateNumber(elements.tagsStat, tags.size);
}

function animateNumber(element, target) {
  if (!element) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    element.textContent = String(target);
    return;
  }

  const duration = 600;
  const start = performance.now();
  const initial = Number(element.textContent) || 0;

  function step(timestamp) {
    const progress = Math.min((timestamp - start) / duration, 1);
    const value = Math.round(initial + (target - initial) * (1 - Math.pow(1 - progress, 3)));
    element.textContent = String(value);
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

function normalizeText(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function extractTags(name) {
  const matches = String(name).match(/\[(.*?)\]/g) || [];
  return matches.map((match) => match.replace(/[\[\]]/g, "").trim()).filter(Boolean);
}

function cleanName(name) {
  return String(name).replace(/\s*\[(.*?)\]/g, "").trim();
}

function resolveFilterAlias(filter) {
  const aliases = {
    cafeterias: ["cafeteria", "cafeterias", "airport", "aeroporto", "cidade", "cidades"],
    equipamentos: ["equipamento", "equipamentos", "gear", "setup", "acessorios", "acessórios"],
    dicas: ["dica", "dicas", "guia", "guias", "logistica", "logística", "preparo"],
    nomades: ["nomade", "nômade", "nomades", "nômades", "coworking", "trabalho"],
    camping: ["camping", "outdoor", "acampamento", "estrada", "trail"]
  };

  return aliases[filter] || [];
}

function itemMatchesFilter(item) {
  if (state.filtro === "all") return true;

  const categoria = normalizeText(item.categoria || "");
  const dor = normalizeText(item.dor_resolvida || "");
  const nome = normalizeText(cleanName(item.nome || ""));
  const aliases = resolveFilterAlias(state.filtro);

  return aliases.some((alias) =>
    categoria.includes(alias) || dor.includes(alias) || nome.includes(alias)
  );
}

function itemMatchesSearch(item) {
  if (!state.termo) return true;

  const tags = extractTags(item.nome || "").join(" ");
  const combined = normalizeText([
    item.nome,
    item.categoria,
    item.dor_resolvida,
    item.descricao,
    tags
  ].join(" "));

  return combined.includes(normalizeText(state.termo));
}

function getFilteredItems() {
  return state.dados.filter((item) => itemMatchesFilter(item) && itemMatchesSearch(item));
}

function renderAll() {
  const items = getFilteredItems();
  renderCards(items);
  renderActiveTags(items);
  updateResultsHeader(items);
  updateBentoState();
  syncURL();
}

function renderCards(items) {
  if (!items.length) {
    elements.cardsGrid.innerHTML = "";
    elements.emptyState.hidden = false;
    return;
  }

  elements.emptyState.hidden = true;
  elements.cardsGrid.innerHTML = items.map(createCardMarkup).join("");

  elements.cardsGrid.querySelectorAll("[data-open-modal]").forEach((button) => {
    button.addEventListener("click", () => openModal(button.dataset.openModal));
  });

  elements.cardsGrid.querySelectorAll("[data-share]").forEach((button) => {
    button.addEventListener("click", () => shareItem(button.dataset.share));
  });
}

function createCardMarkup(item) {
  const itemTags = extractTags(item.nome || "");
  const cleanedTitle = cleanName(item.nome || "");
  const badgesMarkup = itemTags.map((tag) => createBadgeMarkup(tag)).join("");

  return `
    <article class="card" id="item-${item.id}">
      <div class="card-top">
        <div>
          <span class="card-category">${escapeHTML(item.categoria || "Curadoria")}</span>
        </div>
        <div class="card-emoji" aria-hidden="true">${escapeHTML(item.emoji || "☕")}</div>
      </div>
      <div>
        <h3 class="card-title">${escapeHTML(cleanedTitle)}</h3>
        <p class="card-problem">${escapeHTML(item.dor_resolvida || "")}</p>
      </div>
      <p class="card-description">${escapeHTML(item.descricao || "")}</p>
      <div class="card-actions">
        <a class="card-link" href="${escapeAttribute(item.url || "#")}" target="_blank" rel="noopener noreferrer">Acessar</a>
        <button class="card-detail" type="button" data-open-modal="${escapeAttribute(String(item.id))}">Detalhes</button>
        <button class="share-button" type="button" data-share="${escapeAttribute(String(item.id))}">Compartilhar</button>
      </div>
      <footer class="card-tags">${badgesMarkup}</footer>
    </article>
  `;
}

function createBadgeMarkup(tag) {
  const config = state.tagsConfig[tag] || state.tagsConfig[normalizeText(tag)] || {};
  const textColor = config.cor_texto || "var(--color-text)";
  const bgColor = config.fundo || "var(--color-primary-highlight)";
  const borderColor = config.borda || "transparent";

  return `
    <span class="card-badge" style="color:${escapeAttribute(textColor)};background:${escapeAttribute(bgColor)};border-color:${escapeAttribute(borderColor)};">
      ${escapeHTML(tag)}
    </span>
  `;
}

function renderActiveTags(items) {
  const visibleTags = new Set();
  items.forEach((item) => {
    extractTags(item.nome || "").forEach((tag) => visibleTags.add(tag));
  });

  const blocks = [];

  if (state.filtro !== "all") {
    blocks.push(`<span class="active-tag">Filtro: ${escapeHTML(state.filtro)}</span>`);
  }

  if (state.termo) {
    blocks.push(`<span class="active-tag">Busca: ${escapeHTML(state.termo)}</span>`);
  }

  Array.from(visibleTags).slice(0, 5).forEach((tag) => {
    blocks.push(`<span class="active-tag">${escapeHTML(tag)}</span>`);
  });

  elements.activeTags.innerHTML = blocks.join("");
}

function updateResultsHeader(items) {
  const total = items.length;
  const plural = total === 1 ? "resultado" : "resultados";
  const filtroLabel = state.filtro === "all" ? "toda a curadoria" : `filtro ${state.filtro}`;
  elements.resultsCount.textContent = `${total} ${plural}`;
  elements.resultsLabel.textContent = state.termo
    ? `busca local por "${state.termo}" em ${filtroLabel}`
    : `exibindo ${filtroLabel}`;
}

function updateBentoState() {
  elements.bentoButtons.forEach((button) => {
    const isActive = button.dataset.filter === state.filtro;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function renderPartners() {
  if (!state.parceiros.length) {
    elements.partnersContainer.innerHTML = `
      <article class="partner-item">
        <p>Adicione projetos em parceiros.json para compor o ecossistema da rede.</p>
      </article>
    `;
    return;
  }

  elements.partnersContainer.innerHTML = state.parceiros.map((partner) => `
    <article class="partner-item">
      <a href="${escapeAttribute(partner.url || "#")}" target="_blank" rel="noopener noreferrer">${escapeHTML(partner.nome || "Parceiro")}</a>
      <p>${escapeHTML(partner.descricao || "")}</p>
    </article>
  `).join("");
}

function openModal(id) {
  const item = state.dados.find((entry) => String(entry.id) === String(id));
  if (!item) return;

  state.activeModalId = String(id);
  const tags = extractTags(item.nome || "");
  const cleanedTitle = cleanName(item.nome || "");
  const metaTags = [
    `<span>${escapeHTML(item.categoria || "Curadoria")}</span>`,
    ...tags.map((tag) => `<span>${escapeHTML(tag)}</span>`)
  ].join("");

  elements.modalContent.innerHTML = `
    <div class="modal-body">
      <h2 id="modalTitle">${escapeHTML(cleanedTitle)}</h2>
      <div class="modal-meta">${metaTags}</div>
      <p><strong>Dor que resolve:</strong> ${escapeHTML(item.dor_resolvida || "")}</p>
      <p>${escapeHTML(item.descricao || "")}</p>
      <div class="modal-actions">
        <a class="btn btn-primary" href="${escapeAttribute(item.url || "#")}" target="_blank" rel="noopener noreferrer">Abrir recurso</a>
        <button class="btn btn-secondary" type="button" data-share="${escapeAttribute(String(item.id))}">Compartilhar</button>
      </div>
    </div>
  `;

  const modalShareButton = elements.modalContent.querySelector("[data-share]");
  if (modalShareButton) {
    modalShareButton.addEventListener("click", () => shareItem(modalShareButton.dataset.share));
  }

  if (!elements.modal.open) {
    elements.modal.showModal();
  }

  history.pushState({ modal: String(id) }, "", buildURL({ modal: String(id) }));
}

function closeModal(fromHistory = false) {
  if (elements.modal.open) {
    elements.modal.close();
  }
  state.activeModalId = null;

  if (!fromHistory) {
    const url = new URL(window.location.href);
    url.searchParams.delete("modal");
    history.pushState({}, "", url);
  }
}

function shareItem(id) {
  const item = state.dados.find((entry) => String(entry.id) === String(id));
  if (!item) return;

  const cleanTitle = cleanName(item.nome || "");
  const shareData = {
    title: `${cleanTitle} | Café Pra Viagem`,
    text: `${cleanTitle} — ${item.descricao || ""}`,
    url: item.url || window.location.href
  };

  if (navigator.share) {
    navigator.share(shareData).catch(() => null);
    return;
  }

  const fallbackText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
  navigator.clipboard.writeText(fallbackText).then(() => {
    alert("Link copiado para a área de transferência.");
  }).catch(() => {
    alert("Não foi possível compartilhar agora.");
  });
}

function buildURL(extra = {}) {
  const url = new URL(window.location.href);
  if (state.termo) {
    url.searchParams.set("q", state.termo);
  } else {
    url.searchParams.delete("q");
  }

  if (state.filtro && state.filtro !== "all") {
    url.searchParams.set("filtro", state.filtro);
  } else {
    url.searchParams.delete("filtro");
  }

  if (extra.modal) {
    url.searchParams.set("modal", extra.modal);
  } else {
    url.searchParams.delete("modal");
  }

  return url.toString();
}

function syncURL() {
  const currentModal = state.activeModalId;
  history.replaceState({ modal: currentModal }, "", buildURL({ modal: currentModal }));
}

function syncFromURL() {
  const params = new URLSearchParams(window.location.search);
  const termo = params.get("q");
  const filtro = params.get("filtro");
  const modal = params.get("modal");

  if (termo) {
    state.termo = termo;
    elements.searchInput.value = termo;
  }

  if (filtro) {
    state.filtro = filtro;
  }

  if (modal) {
    requestAnimationFrame(() => openModal(modal));
  }
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHTML(value);
}

function initThemeToggle() {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  state.theme = prefersDark ? "dark" : "light";
  elements.root.setAttribute("data-theme", state.theme);
  updateThemeButton();

  elements.themeToggle?.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    elements.root.setAttribute("data-theme", state.theme);
    updateThemeButton();
  });
}

function updateThemeButton() {
  const isDark = state.theme === "dark";
  elements.themeToggle.setAttribute("aria-label", isDark ? "Ativar modo claro" : "Ativar modo escuro");
  elements.themeToggle.innerHTML = isDark
    ? '<span class="theme-icon theme-icon-moon" aria-hidden="true">☾</span>'
    : '<span class="theme-icon theme-icon-sun" aria-hidden="true">☼</span>';
}

function initFontToggle() {
  elements.fontToggle?.addEventListener("click", () => {
    state.fonteAlternativa = !state.fonteAlternativa;
    document.body.classList.toggle("font-alt", state.fonteAlternativa);
    elements.fontToggle.setAttribute(
      "aria-label",
      state.fonteAlternativa ? "Voltar para tipografia editorial" : "Ativar tipografia moderna"
    );
  });
}

function bindEvents() {
  elements.searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    state.termo = elements.searchInput.value.trim();
    renderAll();
  });

  elements.searchInput?.addEventListener("input", (event) => {
    state.termo = event.target.value.trim();
    renderAll();
  });

  elements.clearButton?.addEventListener("click", () => {
    state.termo = "";
    elements.searchInput.value = "";
    renderAll();
    elements.searchInput.focus();
  });

  elements.googleFallbackButton?.addEventListener("click", () => {
    const query = state.termo || "cafeterias specialty coffee aeroporto gear portátil café viagem";
    const url = `https://www.google.com/search?q=${encodeURIComponent(query + " site:cafepraviagem.com")}`;
    window.open(url, "_blank", "noopener,noreferrer");
  });

  elements.bentoButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.filtro = button.dataset.filter || "all";
      renderAll();
    });
  });

  elements.closeModalButton?.addEventListener("click", () => closeModal());

  elements.modal?.addEventListener("click", (event) => {
    const rect = elements.modalContent.getBoundingClientRect();
    const clickedOutside = (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    );

    if (clickedOutside) {
      closeModal();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && elements.modal.open) {
      closeModal();
    }
  });

  window.addEventListener("popstate", () => {
    const params = new URLSearchParams(window.location.search);
    const modal = params.get("modal");

    if (modal) {
      openModal(modal);
    } else if (elements.modal.open) {
      closeModal(true);
    }

    const termo = params.get("q") || "";
    const filtro = params.get("filtro") || "all";
    state.termo = termo;
    state.filtro = filtro;
    if (elements.searchInput.value !== termo) {
      elements.searchInput.value = termo;
    }
    renderAll();
  });
}

initThemeToggle();
initFontToggle();
bindEvents();
loadPortalData();
