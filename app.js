(function () {
  "use strict";

  const config = window.SITE_CONFIG || {};

  function isSafeHttpUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:";
    } catch (_error) {
      return false;
    }
  }

  function configureLinks() {
    const links = {
      portal: config.portalUrl,
      privacy: config.privacyUrl,
      feedback: config.feedbackUrl
    };

    document.querySelectorAll("[data-site-link]").forEach((element) => {
      const key = element.dataset.siteLink;
      const value = links[key];
      const isRelative = typeof value === "string" && value.startsWith("./");
      const isMail = typeof value === "string" && value.startsWith("mailto:");

      if (!value || (!isRelative && !isMail && !isSafeHttpUrl(value))) {
        element.setAttribute("aria-disabled", "true");
        element.classList.add("link-disabled");
        element.removeAttribute("href");
        return;
      }

      element.href = value;
    });
  }

  function configureMenu() {
    const button = document.getElementById("menu-button");
    const menu = document.getElementById("mobile-menu");
    if (!button || !menu) return;

    function setMenu(open) {
      menu.hidden = !open;
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      document.body.classList.toggle("menu-open", open);
    }

    button.addEventListener("click", () => setMenu(menu.hidden));
    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setMenu(false);
    });
  }

  function configureFaq() {
    document.querySelectorAll(".faq-toggle").forEach((button) => {
      button.addEventListener("click", () => {
        const answerId = button.getAttribute("aria-controls");
        const answer = document.getElementById(answerId);
        const willOpen = button.getAttribute("aria-expanded") !== "true";

        document.querySelectorAll(".faq-toggle[aria-expanded='true']").forEach((openButton) => {
          openButton.setAttribute("aria-expanded", "false");
          const openAnswer = document.getElementById(openButton.getAttribute("aria-controls"));
          if (openAnswer) openAnswer.hidden = true;
        });

        button.setAttribute("aria-expanded", String(willOpen));
        if (answer) answer.hidden = !willOpen;
      });
    });
  }

  function configureMetadata() {
    document.querySelectorAll("[data-current-year]").forEach((element) => {
      element.textContent = String(new Date().getFullYear());
    });
    document.querySelectorAll("[data-site-version]").forEach((element) => {
      element.textContent = config.version || "piloto";
    });
    document.querySelectorAll("[data-contact-email]").forEach((element) => {
      element.textContent = config.contactEmail || "";
      if (element.tagName === "A" && config.contactEmail) {
        element.href = `mailto:${config.contactEmail}`;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    configureLinks();
    configureMenu();
    configureFaq();
    configureMetadata();
  });
})();
