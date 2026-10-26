// Notification banner
// Shows published articles with the label "drift" as a dismissible banner in `.alertbox`

// Article labels to be considered for the alerts
const LABELS = "drift";
const STORAGE_PREFIX = "notification-banner-closed-";

// sessionStorage throws when the browser blocks site data, so the banner must not depend on it
function isClosed(articleId) {
  try {
    return sessionStorage.getItem(STORAGE_PREFIX + articleId) === "closed";
  } catch (e) {
    return false;
  }
}

function rememberClosed(articleId) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + articleId, "closed");
  } catch (e) {
    // Banner stays closed until the next page load
  }
}

// Built with DOM methods so article titles are always treated as text, never as HTML
function createBanner(article) {
  const banner = document.createElement("div");
  banner.className = "ns-box";
  banner.setAttribute("data-article-id", article.id);

  const icon = document.createElement("span");
  icon.className = "ns-icon";
  icon.setAttribute("aria-hidden", "true");

  const text = document.createElement("p");
  text.className = "ns-text";

  const link = document.createElement("a");
  link.href = article.html_url;
  link.textContent = article.title;

  text.appendChild(link);
  text.appendChild(document.createTextNode(" - Læs mere"));

  const close = document.createElement("button");
  close.type = "button";
  close.className = "ns-close";
  close.setAttribute("aria-label", `Luk driftsmeddelelse: ${article.title}`);

  banner.appendChild(icon);
  banner.appendChild(text);
  banner.appendChild(close);

  return banner;
}

// Move focus somewhere sensible, since the focused close button is removed from the page
function moveFocusAfterClose(region, banner) {
  const next = banner.nextElementSibling || banner.previousElementSibling;

  if (next) {
    next.querySelector(".ns-close").focus();
    return;
  }

  region.remove();

  const main = document.getElementById("main-content");
  if (main) {
    if (!main.hasAttribute("tabindex")) {
      main.setAttribute("tabindex", "-1");
    }
    main.focus();
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const alertbox = document.querySelector(".alertbox");
  if (!alertbox) {
    return;
  }

  const locale = document.documentElement.getAttribute("lang").toLowerCase();
  const url = `/api/v2/help_center/${locale}/articles.json?label_names=${LABELS}`;

  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Notification banner request failed: ${response.status}`
        );
      }
      return response.json();
    })
    .then((data) => {
      const articles = ((data && data.articles) || []).filter(
        (article) => !isClosed(article.id)
      );

      if (articles.length === 0) {
        return;
      }

      const region = document.createElement("section");
      region.className = "notification-banner";
      region.setAttribute("aria-label", "Driftsmeddelelser");

      articles.forEach((article) => {
        region.appendChild(createBanner(article));
      });

      region.addEventListener("click", (event) => {
        const close = event.target.closest(".ns-close");
        if (!close) {
          return;
        }

        const banner = close.closest(".ns-box");
        rememberClosed(banner.getAttribute("data-article-id"));
        moveFocusAfterClose(region, banner);
        banner.remove();
      });

      alertbox.appendChild(region);
    })
    .catch((error) => {
      console.error(error);
    });
});
