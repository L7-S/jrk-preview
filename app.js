/* JRK Life Sciences. Vanilla JavaScript; no runtime dependencies. */
"use strict";

const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector("#mobile-nav");
function closeMenu() {
  mobileNav.hidden = true;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
  menuToggle.querySelector("use").setAttribute("href", "#i-menu");
}
menuToggle.addEventListener("click", () => {
  const opening = mobileNav.hidden;
  mobileNav.hidden = !opening;
  menuToggle.setAttribute("aria-expanded", String(opening));
  menuToggle.setAttribute(
    "aria-label",
    opening ? "Close navigation" : "Open navigation",
  );
  menuToggle.querySelector("use").setAttribute(
    "href",
    opening ? "#i-close" : "#i-menu",
  );
});
mobileNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !mobileNav.hidden) {
    closeMenu();
    menuToggle.focus();
  }
});
document.addEventListener("click", (event) => {
  if (!mobileNav.hidden && !event.target.closest(".site-header")) closeMenu();
});
window.matchMedia("(min-width: 768px)").addEventListener("change", (event) => {
  if (event.matches) closeMenu();
});

const navLinks = [...document.querySelectorAll(".desktop-nav .nav-link")];
function updateNavigation() {
  let active = "home";
  for (const link of navLinks) {
    const section = document.querySelector(link.getAttribute("href"));
    if (section.getBoundingClientRect().top <= 180) active = section.id;
  }
  navLinks.forEach((link) => {
    const selected = link.getAttribute("href") === "#" + active;
    link.classList.toggle("active", selected);
    if (selected) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}
let scrollPending = false;
window.addEventListener("scroll", () => {
  if (scrollPending) return;
  scrollPending = true;
  requestAnimationFrame(() => {
    updateNavigation();
    scrollPending = false;
  });
}, { passive: true });
updateNavigation();
document.querySelector("#copyright-year").textContent = new Date()
  .getFullYear();

const medicineDialog = document.querySelector("#medicine-dialog");
const legalDialog = document.querySelector("#legal-dialog");
function openDialog(dialog) {
  closeMenu();
  dialog.showModal();
  dialog.focus({ preventScroll: true });
  document.body.classList.add("dialog-open");
}
document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.querySelector("[data-close-dialog]").addEventListener(
    "click",
    () => dialog.close(),
  );
  dialog.addEventListener("close", () => {
    if (!document.querySelector("dialog[open]")) {
      document.body.classList.remove("dialog-open");
    }
  });
  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    if (
      event.target === dialog &&
      (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom)
    ) dialog.close();
  });
});

const products = window.JRK_PRODUCTS || [];
const ASSET_VERSION = "20261126f";
function versionedAsset(source) {
  if (!source) return source;
  return source.includes("?") ? source : `${source}?v=${ASSET_VERSION}`;
}
const productsPerPage = 6;
let activeFilter = "all";
let visibleProducts = productsPerPage;
const searchInput = document.querySelector("#catalogue-search");
const catalogueResults = document.querySelector("#catalogue-results");
const categoryFilters = document.querySelector("#catalogue-filters");
const catalogueCount = document.querySelector("#catalogue-count");
const loadMoreButton = document.querySelector("#catalogue-more");
const resetCatalogueButton = document.querySelector("#catalogue-reset");
const medicineTemplate = document.querySelector("#medicine-card-template");

function renderCategoryFilters() {
  categoryFilters.replaceChildren();
  const categories = [
    "all",
    ...new Set(products.map((product) => product.category)),
  ];
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-chip";
    button.dataset.filter = category;
    button.textContent = category === "all" ? "All medicines" : category;
    button.classList.toggle("active", category === activeFilter);
    button.setAttribute("aria-pressed", String(category === activeFilter));
    categoryFilters.append(button);
  });
}

function createMedicineCard(product) {
  const fragment = medicineTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".medicine-card");
  card.dataset.productId = product.id;
  fragment.querySelector(".medicine-name").textContent = product.name;
  fragment.querySelector(".medicine-category").textContent = product.category;
  fragment.querySelector(".medicine-composition").textContent =
    product.composition;
  fragment.querySelector(".medicine-pack span").textContent = product.packSize;
  fragment.querySelectorAll("[data-product-details]").forEach((button) => {
    button.dataset.productDetails = product.id;
    button.setAttribute("aria-label", `View ${product.name} details`);
  });
  const image = fragment.querySelector(".medicine-card-image");
  const imageSource = versionedAsset(product.images?.[0]);
  image.hidden = !imageSource;
  fragment.querySelector(".medicine-image-empty").hidden = Boolean(imageSource);
  if (imageSource) {
    image.src = imageSource;
    image.alt = `${product.name} product packaging`;
  }
  const enquiryButton = fragment.querySelector(".medicine-enquiry-button");
  enquiryButton.dataset.productId = product.id;
  enquiryButton.setAttribute("aria-label", `Enquire about ${product.name}`);
  return fragment;
}

function renderCatalogue() {
  const query = searchInput.value.toLowerCase().replace(/[-–]/g, " ").trim();
  const terms = query.split(/\s+/).filter(Boolean);
  const results = products.filter((product) => {
    const searchable = [
      product.name,
      product.composition,
      product.category,
      product.form,
      product.packSize,
    ]
      .join(" ").toLowerCase().replace(/[-–]/g, " ");
    return (activeFilter === "all" || product.category === activeFilter) &&
      terms.every((term) => searchable.includes(term));
  });
  catalogueResults.replaceChildren();
  const shown = Math.min(visibleProducts, results.length);
  catalogueCount.textContent = `Showing ${shown} of ${results.length} ${
    results.length === 1 ? "medicine" : "medicines"
  }`;
  loadMoreButton.hidden = shown === results.length;
  resetCatalogueButton.hidden = !query && activeFilter === "all";
  if (!results.length) {
    const empty = document.createElement("p");
    empty.className = "catalogue-empty";
    empty.textContent =
      "No medicines found. Try another name or composition, or clear the filters.";
    catalogueResults.append(empty);
    return;
  }
  results.slice(0, shown).forEach((product) => {
    catalogueResults.append(createMedicineCard(product));
  });
}

searchInput.addEventListener("input", () => {
  visibleProducts = productsPerPage;
  renderCatalogue();
});
categoryFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  activeFilter = button.dataset.filter;
  visibleProducts = productsPerPage;
  categoryFilters.querySelectorAll("[data-filter]").forEach((chip) => {
    const selected = chip === button;
    chip.classList.toggle("active", selected);
    chip.setAttribute("aria-pressed", String(selected));
  });
  renderCatalogue();
});
resetCatalogueButton.addEventListener("click", () => {
  searchInput.value = "";
  activeFilter = "all";
  visibleProducts = productsPerPage;
  renderCategoryFilters();
  renderCatalogue();
  searchInput.focus({ preventScroll: true });
});
loadMoreButton.addEventListener("click", () => {
  const previousCount = catalogueResults.children.length;
  visibleProducts += productsPerPage;
  renderCatalogue();
  if (loadMoreButton.hidden) {
    catalogueResults.children[previousCount]?.querySelector(
      ".medicine-details-button",
    )?.focus({ preventScroll: true });
  }
});
renderCategoryFilters();
renderCatalogue();

function showMedicineDetails(product) {
  document.querySelector("#medicine-title").textContent = product.name;
  document.querySelector("#medicine-detail-category").textContent =
    product.category;
  document.querySelector("#medicine-detail-composition").textContent =
    product.composition;
  document.querySelector("#medicine-detail-form").textContent = product.form;
  document.querySelector("#medicine-detail-pack").textContent =
    product.packSize;
  document.querySelector("#medicine-detail-enquiry").dataset.productId =
    product.id;
  const images = product.images || [];
  const mainImage = document.querySelector("#medicine-detail-image");
  const fullImage = document.querySelector("#medicine-full-image");
  const thumbnails = document.querySelector("#medicine-thumbnails");
  mainImage.hidden = images.length === 0;
  fullImage.hidden = images.length === 0;
  document.querySelector("#medicine-detail-no-image").hidden =
    images.length > 0;
  thumbnails.replaceChildren();
  images.forEach((rawSource, index) => {
    const source = versionedAsset(rawSource);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "medicine-thumbnail";
    const label = index === 0
      ? "Front of pack"
      : (index === images.length - 1
        ? "Back of pack"
        : `Pack view ${index + 1}`);
    button.setAttribute(
      "aria-label",
      `Show ${product.name}, ${label.toLowerCase()}`,
    );
    button.setAttribute("aria-pressed", String(index === 0));
    const image = document.createElement("img");
    image.src = source;
    image.alt = label;
    button.append(image);
    button.addEventListener("click", () => {
      mainImage.src = source;
      mainImage.alt = `${product.name}, ${label.toLowerCase()}`;
      fullImage.href = source;
      thumbnails.querySelectorAll("button").forEach((thumbnail) => {
        thumbnail.setAttribute("aria-pressed", String(thumbnail === button));
      });
    });
    thumbnails.append(button);
  });
  if (images.length) {
    const firstSource = versionedAsset(images[0]);
    mainImage.src = firstSource;
    mainImage.alt = `${product.name}, front of pack`;
    fullImage.href = firstSource;
  }
  openDialog(medicineDialog);
}
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-product-details]");
  if (!button) return;
  const product = products.find((item) =>
    item.id === button.dataset.productDetails
  );
  if (product) showMedicineDetails(product);
});

const legalCopy = {
  medical: {
    title: "Medical information",
    html:
      "<p>This website presents JRK Life Sciences and supports business enquiries about pharmaceutical products and partnerships. Consult a qualified healthcare professional for medical advice, diagnosis, and treatment.</p><h3>About JRK</h3><p>JRK Life Sciences is a pharmaceutical marketing and distribution company. Manufacturing partners produce medicines commissioned under the JRK name.</p><h3>Product information</h3><p>The medicine catalogue uses names, compositions, pack sizes, and photographs from JRK product packaging. Contact the JRK team to confirm current availability, manufacturer details, and product documentation. Follow the product label and applicable prescription requirements.</p>",
  },
};
document.querySelectorAll("[data-open-legal]").forEach((button) =>
  button.addEventListener("click", () => {
    const copy = legalCopy[button.dataset.openLegal];
    if (!copy) return;
    document.querySelector("#legal-title").textContent = copy.title;
    document.querySelector("#legal-content").innerHTML = copy.html;
    openDialog(legalDialog);
  })
);

const reachOutCard = document.querySelector("#reach-out-card");
const contactEmailCta = document.querySelector("#contact-email-cta");
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-enquiry]");
  if (!button) return;
  if (medicineDialog.open) medicineDialog.close();
  const product = products.find((item) => item.id === button.dataset.productId);
  if (contactEmailCta) {
    const topic = product
      ? `${product.name} enquiry`
      : (button.dataset.enquiry || "Business enquiry");
    const body = product
      ? `Hello JRK Life Sciences,\n\nI would like to enquire about ${product.name} (${product.composition}), pack ${product.packSize}.`
      : `Hello JRK Life Sciences,\n\nI would like to enquire about ${topic.toLowerCase()}.`;
    contactEmailCta.href =
      `mailto:jrklifescience@gmail.com?subject=${encodeURIComponent(topic)}&body=${encodeURIComponent(body)}`;
    contactEmailCta.querySelector("span").textContent = product
      ? `Email about ${product.name}`
      : "Email our team";
  }
  document.querySelector("#contact").scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
  reachOutCard?.focus({ preventScroll: true });
});
