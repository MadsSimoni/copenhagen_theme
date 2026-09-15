// Structured data (JSON-LD)
// Built from the rendered page because the templates don't expose loop indexes or absolute URLs.
// Article data is rendered server-side in templates/article_page.hbs.

function appendJsonLd(data) {
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

window.addEventListener("DOMContentLoaded", () => {
  // Breadcrumbs on article, section and category pages
  const breadcrumbLinks = [
    ...document.querySelectorAll(".sub-nav .breadcrumbs a"),
  ];

  if (breadcrumbLinks.length > 0) {
    appendJsonLd({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbLinks.map((link, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: link.textContent.trim(),
        item: link.href,
      })),
    });
  }

  // Site name on the home page
  const homeLink = document.querySelector(".header .logo a");
  const siteName = document.querySelector("h1.visibility-hidden");

  if (document.querySelector(".hero") && homeLink && siteName) {
    appendJsonLd({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteName.textContent.trim(),
      url: homeLink.href,
    });
  }
});
