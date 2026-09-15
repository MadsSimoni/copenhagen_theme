// Notification banner
// Shows published articles with the label "drift" as a dismissible banner in `.alertbox`

// Article labels to be considered for the alerts
const LABELS = "drift,Drift";

window.addEventListener("DOMContentLoaded", () => {
  const alertbox = document.querySelector(".alertbox");
  if (!alertbox) {
    return;
  }

  const locale = document.documentElement.getAttribute("lang").toLowerCase();
  const url = `/api/v2/help_center/${locale}/articles.json?label_names=${LABELS}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      const articles = (data && data.articles) || [];

      articles.forEach((article) => {
        if (sessionStorage.getItem(article.id) === "closed") {
          return;
        }

        const html = `
          <div id=${article.id} class="ns-box ns-bar ns-effect-slidetop ns-type-notice ns-show">
            <div class="ns-box-inner">
              <span class="megaphone"></span>
              <p>
                <a href="${article.html_url}">${article.title} | Tryk her for at læse mere</a>
              </p>
            </div>
            <span class="ns-close"></span>
          </div>
        `;
        alertbox.insertAdjacentHTML("beforeend", html);
      });
    });
});

// Close alert and remember it for the rest of the session
document.addEventListener("click", (event) => {
  if (event.target.matches(".ns-close")) {
    event.preventDefault();
    sessionStorage.setItem(event.target.parentElement.id, "closed");
    event.target.parentElement.remove();
  }
});
