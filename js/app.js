(function () {
  let products = [];
  let activeFilter = "all";
  let activeProduct = null;
  let selectedOptions = {};

  async function loadProducts() {
    const res = await fetch("data/products.json");
    products = await res.json();
    renderGrid();
  }

  function formatMoney(amount) {
    const symbol = (window.STORE_CONFIG && window.STORE_CONFIG.currencySymbol) || "$";
    return `${symbol}${amount.toFixed(2)}`;
  }

  function setFilter(filter) {
    activeFilter = filter;
    document.querySelectorAll("[data-swatch]").forEach((el) => {
      el.classList.toggle("is-active", el.getAttribute("data-swatch") === filter);
    });
    renderGrid();
  }

  function renderGrid() {
    const grid = document.querySelector("[data-product-grid]");
    if (!grid) return;
    const lang = (window.i18n && window.i18n.getLang()) || "en";
    const list = activeFilter === "all" ? products : products.filter((p) => p.category === activeFilter);

    grid.innerHTML = list
      .map((product) => {
        const name = product.name[lang] || product.name.en;
        return `
        <article class="product-card" data-product-id="${product.id}">
          <button class="product-card__imgwrap" data-open-product="${product.id}" aria-label="${name}">
            <img src="${product.image}" alt="${name}" loading="lazy">
          </button>
          <div class="product-card__body">
            <p class="product-card__name">${name}</p>
            <p class="product-card__price">${formatMoney(product.price)}</p>
            <button class="btn btn--outline product-card__cta" data-open-product="${product.id}" data-i18n="product.viewDetails"></button>
          </div>
        </article>`;
      })
      .join("");

    const viewDetailsLabel = (window.i18n && window.i18n.t("product.viewDetails")) || "View details";
    grid.querySelectorAll('[data-i18n="product.viewDetails"]').forEach((el) => {
      el.textContent = viewDetailsLabel;
    });

    grid.querySelectorAll("[data-open-product]").forEach((el) => {
      el.addEventListener("click", () => openProductModal(el.getAttribute("data-open-product")));
    });
  }

  function openProductModal(id) {
    activeProduct = products.find((p) => p.id === id);
    if (!activeProduct) return;
    selectedOptions = {};
    (activeProduct.options || []).forEach((opt) => {
      selectedOptions[opt.type] = opt.values[0];
    });
    renderModal();
    document.querySelector("[data-product-modal]").classList.add("is-open");
    document.querySelector("[data-modal-overlay]").classList.add("is-open");
  }

  function closeProductModal() {
    document.querySelector("[data-product-modal]").classList.remove("is-open");
    document.querySelector("[data-modal-overlay]").classList.remove("is-open");
    activeProduct = null;
  }

  function renderModal() {
    if (!activeProduct) return;
    const lang = (window.i18n && window.i18n.getLang()) || "en";
    const t = window.i18n ? window.i18n.t : () => null;
    const modal = document.querySelector("[data-product-modal]");
    const name = activeProduct.name[lang] || activeProduct.name.en;
    const desc = activeProduct.description ? (activeProduct.description[lang] || activeProduct.description.en) : "";

    const optionsHtml = (activeProduct.options || [])
      .map((opt) => {
        const label = opt.label ? (opt.label[lang] || opt.label.en) : opt.type;
        const buttons = opt.values
          .map(
            (val) => `<button type="button" class="option-pill ${selectedOptions[opt.type] === val ? "is-active" : ""}" data-option-type="${opt.type}" data-option-value="${val}">${val}</button>`
          )
          .join("");
        return `<div class="option-group"><p class="option-group__label">${label}</p><div class="option-group__values">${buttons}</div></div>`;
      })
      .join("");

    modal.querySelector("[data-modal-body]").innerHTML = `
      <img class="modal-product__img" src="${activeProduct.image}" alt="${name}">
      <div class="modal-product__info">
        <p class="modal-product__name">${name}</p>
        <p class="modal-product__price">${formatMoney(activeProduct.price)}</p>
        <p class="modal-product__desc">${desc}</p>
        ${optionsHtml}
        <div class="modal-product__qtyrow">
          <input type="number" min="1" value="1" class="modal-product__qty" data-modal-qty>
          <button type="button" class="btn btn--primary" data-modal-add data-i18n="product.addToCart"></button>
        </div>
      </div>
    `;

    modal.querySelectorAll("[data-option-type]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedOptions[btn.getAttribute("data-option-type")] = btn.getAttribute("data-option-value");
        renderModal();
      });
    });

    modal.querySelector("[data-modal-add]").addEventListener("click", () => {
      const qty = Number(modal.querySelector("[data-modal-qty]").value) || 1;
      window.cart.addToCart(activeProduct, selectedOptions, qty);
      closeProductModal();
    });

    const addToCartLabel = (window.i18n && window.i18n.t("product.addToCart")) || "Add to cart";
    const addBtn = modal.querySelector("[data-modal-add]");
    if (addBtn) addBtn.textContent = addToCartLabel;
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
    document.querySelectorAll("[data-swatch]").forEach((el) => {
      el.addEventListener("click", () => setFilter(el.getAttribute("data-swatch")));
    });
    document.querySelectorAll("[data-modal-close]").forEach((el) => el.addEventListener("click", closeProductModal));
    const overlay = document.querySelector("[data-modal-overlay]");
    if (overlay) overlay.addEventListener("click", closeProductModal);
  });

  window.addEventListener("i18nchanged", () => {
    renderGrid();
    if (activeProduct) renderModal();
  });
})();
