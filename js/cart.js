(function () {
  const STORAGE_KEY = "nstore-cart";

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    updateBadge(cart);
  }

  function updateBadge(cart) {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      el.textContent = count;
      el.classList.toggle("is-hidden", count === 0);
    });
  }

  function optionsKey(options) {
    return Object.entries(options || {}).sort().map(([k, v]) => `${k}:${v}`).join("|");
  }

  function addToCart(product, selectedOptions, qty) {
    const cart = getCart();
    const key = optionsKey(selectedOptions);
    const existing = cart.find((item) => item.id === product.id && optionsKey(item.options) === key);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        options: selectedOptions || {},
        qty
      });
    }
    saveCart(cart);
    renderCart();
    openCart();
  }

  function removeFromCart(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    renderCart();
  }

  function setQty(index, qty) {
    const cart = getCart();
    if (!cart[index]) return;
    cart[index].qty = Math.max(1, qty);
    saveCart(cart);
    renderCart();
  }

  function subtotal(cart) {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function formatMoney(amount) {
    const symbol = (window.STORE_CONFIG && window.STORE_CONFIG.currencySymbol) || "$";
    return `${symbol}${amount.toFixed(2)}`;
  }

  function optionsLabel(options) {
    return Object.entries(options || {})
      .map(([type, value]) => `${type}: ${value}`)
      .join(", ");
  }

  function renderCart() {
    const cart = getCart();
    const lang = (window.i18n && window.i18n.getLang()) || "en";
    const t = window.i18n ? window.i18n.t : () => null;
    const list = document.querySelector("[data-cart-list]");
    const emptyEl = document.querySelector("[data-cart-empty]");
    const subtotalEl = document.querySelector("[data-cart-subtotal]");
    if (!list) return;

    list.innerHTML = "";
    if (cart.length === 0) {
      if (emptyEl) emptyEl.classList.remove("is-hidden");
    } else {
      if (emptyEl) emptyEl.classList.add("is-hidden");
      cart.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "cart-row";
        const name = item.name[lang] || item.name.en;
        row.innerHTML = `
          <img class="cart-row__img" src="${item.image}" alt="${name}">
          <div class="cart-row__info">
            <p class="cart-row__name">${name}</p>
            <p class="cart-row__options">${optionsLabel(item.options)}</p>
            <div class="cart-row__controls">
              <input type="number" min="1" value="${item.qty}" class="cart-row__qty" data-qty-input="${index}">
              <button type="button" class="cart-row__remove" data-remove="${index}">${t("cart.remove") || "Remove"}</button>
            </div>
          </div>
          <p class="cart-row__price">${formatMoney(item.price * item.qty)}</p>
        `;
        list.appendChild(row);
      });
    }
    if (subtotalEl) subtotalEl.textContent = formatMoney(subtotal(cart));

    list.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => removeFromCart(Number(btn.getAttribute("data-remove"))));
    });
    list.querySelectorAll("[data-qty-input]").forEach((input) => {
      input.addEventListener("change", () => setQty(Number(input.getAttribute("data-qty-input")), Number(input.value)));
    });
  }

  function buildOrderText() {
    const cart = getCart();
    const lang = (window.i18n && window.i18n.getLang()) || "en";
    const lines = cart.map((item) => {
      const name = item.name[lang] || item.name.en;
      const opts = optionsLabel(item.options);
      return `${item.qty}x ${name}${opts ? ` (${opts})` : ""} — ${formatMoney(item.price)} each`;
    });
    const total = formatMoney(subtotal(cart));
    const greeting = lang === "fr" ? "Bonjour NStore, je souhaite commander :" : "Hello NStore, I'd like to order:";
    const totalLabel = lang === "fr" ? "Total" : "Total";
    return `${greeting}\n\n${lines.join("\n")}\n\n${totalLabel}: ${total}`;
  }

  function checkoutWhatsapp() {
    const number = window.STORE_CONFIG ? window.STORE_CONFIG.whatsappNumber : "";
    const text = encodeURIComponent(buildOrderText());
    window.open(`https://wa.me/${number}?text=${text}`, "_blank");
  }

  function checkoutEmail() {
    const email = window.STORE_CONFIG ? window.STORE_CONFIG.orderEmail : "";
    const subject = encodeURIComponent("New order — NStore");
    const body = encodeURIComponent(buildOrderText());
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  function openCart() {
    document.querySelector("[data-cart-drawer]").classList.add("is-open");
    document.querySelector("[data-cart-overlay]").classList.add("is-open");
  }

  function closeCart() {
    document.querySelector("[data-cart-drawer]").classList.remove("is-open");
    document.querySelector("[data-cart-overlay]").classList.remove("is-open");
  }

  window.cart = { getCart, addToCart, removeFromCart, setQty, renderCart, checkoutWhatsapp, checkoutEmail, openCart, closeCart };

  document.addEventListener("DOMContentLoaded", () => {
    updateBadge(getCart());
    renderCart();
    document.querySelectorAll("[data-cart-open]").forEach((btn) => btn.addEventListener("click", openCart));
    document.querySelectorAll("[data-cart-close]").forEach((btn) => btn.addEventListener("click", closeCart));
    const overlay = document.querySelector("[data-cart-overlay]");
    if (overlay) overlay.addEventListener("click", closeCart);
    const waBtn = document.querySelector("[data-checkout-whatsapp]");
    if (waBtn) waBtn.addEventListener("click", checkoutWhatsapp);
    const emailBtn = document.querySelector("[data-checkout-email]");
    if (emailBtn) emailBtn.addEventListener("click", checkoutEmail);
  });

  window.addEventListener("i18nchanged", renderCart);
})();
