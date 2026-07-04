document.addEventListener("DOMContentLoaded", () => {
  const config = window.STORE_CONFIG || {};

  function setCard(selector, value, hrefBuilder) {
    const card = document.querySelector(selector);
    if (!card) return;
    if (!value) {
      card.classList.add("is-hidden");
      return;
    }
    const valueEl = card.querySelector("[data-card-value]");
    if (valueEl) {
      if (hrefBuilder) {
        const a = document.createElement("a");
        a.href = hrefBuilder(value);
        a.textContent = value;
        a.target = "_blank";
        a.rel = "noopener";
        valueEl.innerHTML = "";
        valueEl.appendChild(a);
      } else {
        valueEl.textContent = value;
      }
    }
  }

  setCard("[data-card-whatsapp]", config.whatsappNumber ? `+${config.whatsappNumber}` : "", () => `https://wa.me/${config.whatsappNumber}`);
  setCard("[data-card-email]", config.orderEmail, (v) => `mailto:${v}`);
  setCard("[data-card-instagram]", config.instagramHandle, (v) => `https://instagram.com/${v.replace(/^@/, "")}`);
  setCard("[data-card-address]", config.address);

  function buildMessage() {
    const name = document.querySelector("[data-contact-name]").value.trim();
    const message = document.querySelector("[data-contact-message]").value.trim();
    const lang = (window.i18n && window.i18n.getLang()) || "en";
    const label = lang === "fr" ? "Nom" : "Name";
    return `${message}\n\n${label}: ${name}`;
  }

  const waBtn = document.querySelector("[data-contact-whatsapp]");
  if (waBtn) {
    waBtn.addEventListener("click", () => {
      const text = encodeURIComponent(buildMessage());
      window.open(`https://wa.me/${config.whatsappNumber}?text=${text}`, "_blank");
    });
  }

  const emailBtn = document.querySelector("[data-contact-email]");
  if (emailBtn) {
    emailBtn.addEventListener("click", () => {
      const lang = (window.i18n && window.i18n.getLang()) || "en";
      const subject = encodeURIComponent(lang === "fr" ? "Message depuis NStore" : "Message from NStore");
      const body = encodeURIComponent(buildMessage());
      window.location.href = `mailto:${config.orderEmail}?subject=${subject}&body=${body}`;
    });
  }
});
