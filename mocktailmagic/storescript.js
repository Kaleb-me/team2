// =====================================================
//  SIP & STORE — Drink Database
//  Local state (swap db.js below for Firestore reads)
// =====================================================

// --------------- INITIAL DATA ---------------
// TODO: Replace with Firestore reads (getDocs / onSnapshot)
let drinks = [
  {
    id: uid(),
    name: "Sunset Citrus Cooler",
    category: "Citrus",
    emoji: "🍊",
    price: 3.99,
    description: "A bright, tangy cooler bursting with orange and lemon.",
    ingredients: "Orange juice, lemon juice, soda water, ice",
    tags: ["cold", "tangy", "sparkling"]
  },
  {
    id: uid(),
    name: "Berry Bliss Fizz",
    category: "Berry",
    emoji: "🍓",
    price: 4.25,
    description: "Muddled berries meet sparkling water for the perfect sip.",
    ingredients: "Strawberries, blueberries, sparkling water, mint",
    tags: ["fruity", "sparkling", "refreshing"]
  },
  {
    id: uid(),
    name: "Tropical Dream",
    category: "Tropical",
    emoji: "🍍",
    price: 4.75,
    description: "Close your eyes — you're on a beach.",
    ingredients: "Pineapple juice, coconut water, lime, ice",
    tags: ["tropical", "cold", "sweet"]
  },
  {
    id: uid(),
    name: "Citrus Spark Twist",
    category: "Citrus",
    emoji: "🍋",
    price: 3.50,
    description: "Grapefruit and lemon soda collide in this zingy twist.",
    ingredients: "Grapefruit juice, lemon soda, orange slices",
    tags: ["citrusy", "bubbly"]
  },
  {
    id: uid(),
    name: "Watermelon Wave",
    category: "Fruity",
    emoji: "🍉",
    price: 4.00,
    description: "Juicy summer vibes in every sip.",
    ingredients: "Watermelon juice, mint, lime, sparkling water",
    tags: ["summer", "sweet", "sparkling"]
  },
  {
    id: uid(),
    name: "Minty Lemonade",
    category: "Classic",
    emoji: "🌿",
    price: 3.25,
    description: "The timeless lemonade — made better with fresh mint.",
    ingredients: "Lemon juice, mint leaves, sugar syrup, water",
    tags: ["classic", "refreshing", "herby"]
  }
];

// --------------- STATE ---------------
let currentFilter = "all";
let currentDrinkId = null; // used for detail / edit / delete

// --------------- UTILS ---------------
function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function getCategories() {
  return [...new Set(drinks.map(d => d.category))].sort();
}

function normalize(str) {
  return (str || "").toLowerCase().trim();
}

// --------------- RENDER ---------------
function renderDrinks() {
  const grid      = document.getElementById("drinkGrid");
  const empty     = document.getElementById("emptyState");
  const searchVal = normalize(document.getElementById("searchInput").value);
  const sortVal   = document.getElementById("sortSelect").value;

  let list = drinks.filter(d => {
    const matchCat    = currentFilter === "all" || normalize(d.category) === normalize(currentFilter);
    const matchSearch = !searchVal ||
      normalize(d.name).includes(searchVal) ||
      normalize(d.category).includes(searchVal) ||
      normalize(d.description).includes(searchVal) ||
      (d.tags || []).some(t => normalize(t).includes(searchVal));
    return matchCat && matchSearch;
  });

  // Sort
  list = list.sort((a, b) => {
    if (sortVal === "name")       return a.name.localeCompare(b.name);
    if (sortVal === "name-desc")  return b.name.localeCompare(a.name);
    if (sortVal === "category")   return a.category.localeCompare(b.category);
    if (sortVal === "price")      return (a.price || 0) - (b.price || 0);
    if (sortVal === "price-desc") return (b.price || 0) - (a.price || 0);
    return 0;
  });

  document.getElementById("resultCount").textContent =
    list.length === drinks.length
      ? `${drinks.length} drink${drinks.length !== 1 ? "s" : ""}`
      : `${list.length} of ${drinks.length}`;

  if (list.length === 0) {
    grid.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  grid.innerHTML = "";

  list.forEach((drink, i) => {
    const card = document.createElement("div");
    card.className = "drink-card";
    card.style.animationDelay = `${i * 40}ms`;

    const tagsHtml = (drink.tags || []).slice(0, 3)
      .map(t => `<span class="tag">${t}</span>`).join("");

    card.innerHTML = `
      <span class="card-emoji">${drink.emoji || "🥤"}</span>
      <h3>${drink.name}</h3>
      <span class="card-category">${drink.category}</span>
      <p class="card-desc">${drink.description || ""}</p>
      ${drink.price ? `<span class="card-price">$${Number(drink.price).toFixed(2)}</span>` : ""}
      ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ""}
    `;

    card.addEventListener("click", () => openDetailModal(drink.id));
    grid.appendChild(card);
  });
}

// --------------- FILTER TABS ---------------
function buildFilterTabs() {
  const bar  = document.getElementById("filterBar");
  const cats = getCategories();

  // Remove old category buttons (keep "All")
  [...bar.querySelectorAll(".filter-btn:not([data-cat='all'])")].forEach(b => b.remove());

  cats.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "filter-btn";
    btn.dataset.cat = cat;
    btn.textContent = `${cat} ${catEmoji(cat)}`;
    btn.onclick = () => setFilter(cat, btn);
    bar.appendChild(btn);
  });

  // Update datalist for category suggestions
  const dl = document.getElementById("catSuggestions");
  dl.innerHTML = cats.map(c => `<option value="${c}">`).join("");

  // Update header stats
  document.getElementById("totalCount").textContent    = `${drinks.length} drink${drinks.length !== 1 ? "s" : ""}`;
  document.getElementById("categoryCount").textContent = `${cats.length} categor${cats.length !== 1 ? "ies" : "y"}`;
}

function catEmoji(cat) {
  const map = {
    citrus: "🍊", berry: "🍓", tropical: "🍍", fruity: "🍉",
    classic: "🥛", coffee: "☕", tea: "🍵", smoothie: "🥤",
    soda: "🫧", juice: "🧃"
  };
  return map[normalize(cat)] || "🍹";
}

function setFilter(cat, btn) {
  currentFilter = cat;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderDrinks();
}

// --------------- DETAIL MODAL ---------------
function openDetailModal(id) {
  const drink = drinks.find(d => d.id === id);
  if (!drink) return;
  currentDrinkId = id;

  document.getElementById("detailEmoji").textContent       = drink.emoji || "🥤";
  document.getElementById("detailName").textContent        = drink.name;
  document.getElementById("detailCategory").textContent    = drink.category;
  document.getElementById("detailPrice").textContent       = drink.price ? `$${Number(drink.price).toFixed(2)}` : "";
  document.getElementById("detailDesc").textContent        = drink.description || "No description provided.";
  document.getElementById("detailIngredients").textContent = drink.ingredients || "—";

  const tagsEl = document.getElementById("detailTags");
  if (drink.tags && drink.tags.length) {
    tagsEl.innerHTML = drink.tags.map(t => `<span class="tag">${t}</span>`).join("");
    document.getElementById("detailTagsWrap").classList.remove("hidden");
  } else {
    document.getElementById("detailTagsWrap").classList.add("hidden");
  }

  document.getElementById("detailModal").classList.remove("hidden");
}

function closeDetailModal() {
  document.getElementById("detailModal").classList.add("hidden");
  currentDrinkId = null;
}

// --------------- ADD / EDIT MODAL ---------------
let editingId = null;

function openAddModal() {
  editingId = null;
  document.getElementById("formTitle").textContent = "➕ Add Drink";
  clearForm();
  document.getElementById("formModal").classList.remove("hidden");
  document.getElementById("fName").focus();
}

function openEditModal(drink) {
  editingId = drink.id;
  document.getElementById("formTitle").textContent = "✏️ Edit Drink";
  document.getElementById("fName").value        = drink.name || "";
  document.getElementById("fCategory").value    = drink.category || "";
  document.getElementById("fPrice").value       = drink.price || "";
  document.getElementById("fDesc").value        = drink.description || "";
  document.getElementById("fIngredients").value = drink.ingredients || "";
  document.getElementById("fEmoji").value       = drink.emoji || "";
  document.getElementById("fTags").value        = (drink.tags || []).join(", ");
  document.getElementById("formError").classList.add("hidden");
  document.getElementById("formModal").classList.remove("hidden");
}

function editCurrentDrink() {
  const drink = drinks.find(d => d.id === currentDrinkId);
  if (!drink) return;
  closeDetailModal();
  openEditModal(drink);
}

function closeFormModal() {
  document.getElementById("formModal").classList.add("hidden");
  editingId = null;
  clearForm();
}

function clearForm() {
  ["fName","fCategory","fPrice","fDesc","fIngredients","fEmoji","fTags"]
    .forEach(id => { document.getElementById(id).value = ""; });
  document.getElementById("formError").classList.add("hidden");
}

function saveDrink() {
  const name     = document.getElementById("fName").value.trim();
  const category = document.getElementById("fCategory").value.trim();

  if (!name || !category) {
    document.getElementById("formError").classList.remove("hidden");
    return;
  }

  const drinkData = {
    name,
    category,
    price:       parseFloat(document.getElementById("fPrice").value) || 0,
    description: document.getElementById("fDesc").value.trim(),
    ingredients: document.getElementById("fIngredients").value.trim(),
    emoji:       document.getElementById("fEmoji").value.trim() || "🥤",
    tags:        document.getElementById("fTags").value.split(",")
                   .map(t => t.trim()).filter(Boolean)
  };

  if (editingId) {
    // TODO: Firestore — updateDoc(doc(db, "drinks", editingId), drinkData)
    const idx = drinks.findIndex(d => d.id === editingId);
    if (idx !== -1) drinks[idx] = { ...drinks[idx], ...drinkData };
    showToast("✏️ Drink updated!");
  } else {
    // TODO: Firestore — addDoc(collection(db, "drinks"), drinkData)
    drinkData.id = uid();
    drinks.push(drinkData);
    showToast("🎉 Drink added!");
  }

  closeFormModal();
  buildFilterTabs();
  renderDrinks();
}

// --------------- DELETE ---------------
function deleteCurrentDrink() {
  const drink = drinks.find(d => d.id === currentDrinkId);
  if (!drink) return;
  closeDetailModal();
  document.getElementById("confirmName").textContent = drink.name;
  document.getElementById("confirmModal").classList.remove("hidden");
}

function closeConfirmModal() {
  document.getElementById("confirmModal").classList.add("hidden");
}

function confirmDelete() {
  if (!currentDrinkId) return;
  // TODO: Firestore — deleteDoc(doc(db, "drinks", currentDrinkId))
  drinks = drinks.filter(d => d.id !== currentDrinkId);
  currentDrinkId = null;
  closeConfirmModal();
  buildFilterTabs();
  renderDrinks();
  showToast("🗑️ Drink deleted.");
}

// --------------- TOAST ---------------
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 2400);
}

// --------------- CLOSE ON OVERLAY CLICK ---------------
document.addEventListener("click", e => {
  if (e.target.id === "formModal")    closeFormModal();
  if (e.target.id === "detailModal")  closeDetailModal();
  if (e.target.id === "confirmModal") closeConfirmModal();
});

// --------------- SEARCH ---------------
document.getElementById("searchInput").addEventListener("input", renderDrinks);

// --------------- INIT ---------------
buildFilterTabs();
renderDrinks();
