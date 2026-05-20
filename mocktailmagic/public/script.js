// =============================================================
//  MOCKTAIL MAGIC — Combined Script
//  Covers: index.html, editor.html, store.html
//  All persistence via Firebase Firestore
// =============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAHgm_CKR26INfBKX7X4dtx0EKgUqzJR4w",
  authDomain: "mocktail-magic-baf9a.firebaseapp.com",
  projectId: "mocktail-magic-baf9a",
  storageBucket: "mocktail-magic-baf9a.firebasestorage.app",
  messagingSenderId: "441721350813",
  appId: "1:441721350813:web:817e0c4e8de655c9008274"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Detect which page we're on
const PAGE = document.body.dataset.page; // set via <body data-page="index|editor|store">

// =============================================================
//  INDEX PAGE
// =============================================================
if (PAGE === "index") {

  const container = document.getElementById("recipeContainer");
  let allRecipes = [];

  async function loadRecipes() {
    try {
      const q = query(collection(db, "recipes"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      allRecipes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      displayRecipes(allRecipes);
    } catch (err) {
      container.innerHTML = `<div class="error-state"><p>😕 Couldn't load recipes. Check your Firebase config.</p><small>${err.message}</small></div>`;
    }
  }

  function displayRecipes(list) {
    if (list.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>🍹 No recipes found. <a href="editor.html">Add the first one!</a></p></div>`;
      return;
    }
    container.innerHTML = "";
    list.forEach((recipe, i) => {
      const card = document.createElement("div");
      card.classList.add("card");
      card.style.animationDelay = `${i * 0.07}s`;
      const emoji = recipe.type === "citrus" ? "🍊" : recipe.type === "berry" ? "🍓" : recipe.type === "tropical" ? "🍍" : "🍹";
      card.innerHTML = `<div class="card-emoji">${emoji}</div><h3>${recipe.name}</h3><span class="card-badge">${recipe.type.toUpperCase()}</span>`;
      card.onclick = () => openModal(recipe);
      container.appendChild(card);
    });
  }

  window.filterRecipes = function(type, btn) {
    document.querySelectorAll(".filters button").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
    displayRecipes(type === "all" ? allRecipes : allRecipes.filter(r => r.type === type));
  };

  window.openModal = function(recipe) {
    const emoji = recipe.type === "citrus" ? "🍊" : recipe.type === "berry" ? "🍓" : recipe.type === "tropical" ? "🍍" : "🍹";
    document.getElementById("modalTitle").textContent = `${emoji} ${recipe.name}`;
    document.getElementById("modalBadge").textContent = recipe.type.toUpperCase();
    document.getElementById("modalIngredients").textContent = recipe.ingredients;
    document.getElementById("modalSteps").textContent = recipe.steps;
    document.getElementById("modal").classList.remove("hidden");
  };

  window.closeModal = function() {
    document.getElementById("modal").classList.add("hidden");
  };

  document.getElementById("modal")?.addEventListener("click", e => {
    if (e.target === document.getElementById("modal")) window.closeModal();
  });

  loadRecipes();
}

// =============================================================
//  EDITOR PAGE
// =============================================================
if (PAGE === "editor") {

  window.submitRecipe = async function() {
    const name        = document.getElementById("recipeName").value.trim();
    const typeEl      = document.querySelector('input[name="recipeType"]:checked');
    const ingredients = document.getElementById("recipeIngredients").value.trim();
    const steps       = document.getElementById("recipeSteps").value.trim();
    const btn         = document.getElementById("submitBtn");
    const btnText     = document.getElementById("btnText");
    const successMsg  = document.getElementById("successMsg");
    const errorMsg    = document.getElementById("errorMsg");

    successMsg.classList.add("hidden");
    errorMsg.classList.add("hidden");

    if (!name)        return showEditorError("Please enter a recipe name.");
    if (!typeEl)      return showEditorError("Please select a category.");
    if (!ingredients) return showEditorError("Please list the ingredients.");
    if (!steps)       return showEditorError("Please add the steps.");

    btn.disabled = true;
    btnText.textContent = "Submitting...";

    try {
      await addDoc(collection(db, "recipes"), { name, type: typeEl.value, ingredients, steps, createdAt: serverTimestamp() });
      successMsg.classList.remove("hidden");
      document.getElementById("recipeName").value = "";
      document.querySelectorAll('input[name="recipeType"]').forEach(r => r.checked = false);
      document.getElementById("recipeIngredients").value = "";
      document.getElementById("recipeSteps").value = "";
    } catch (err) {
      showEditorError("Failed to submit: " + err.message);
    }

    btnText.textContent = "🍹 Submit Recipe";
    btn.disabled = false;
  };

  function showEditorError(msg) {
    const el = document.getElementById("errorMsg");
    el.textContent = msg;
    el.classList.remove("hidden");
  }
}

// =============================================================
//  STORE PAGE
// =============================================================
if (PAGE === "store") {

  let drinks         = [];
  let currentFilter  = "all";
  let currentDrinkId = null;
  let editingId      = null;

  // --------------- FIRESTORE LOAD ---------------
  async function loadDrinks() {
    try {
      const snapshot = await getDocs(collection(db, "drinks"));
      drinks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error("Failed to load drinks:", err);
      drinks = [];
    }
    buildFilterTabs();
    renderDrinks();
  }

  // --------------- UTILS ---------------
  function getCategories() {
    return [...new Set(drinks.map(d => d.category))].sort();
  }

  function normalize(str) {
    return (str || "").toLowerCase().trim();
  }

  function catEmoji(cat) {
    const map = { citrus:"🍊", berry:"🍓", tropical:"🍍", fruity:"🍉", classic:"🥛", coffee:"☕", tea:"🍵", smoothie:"🥤", soda:"🫧", juice:"🧃" };
    return map[normalize(cat)] || "🍹";
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
      const tagsHtml = (drink.tags || []).slice(0, 3).map(t => `<span class="tag">${t}</span>`).join("");
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

    [...bar.querySelectorAll(".filter-btn:not([data-cat='all'])")].forEach(b => b.remove());

    cats.forEach(cat => {
      const btn = document.createElement("button");
      btn.className = "filter-btn";
      btn.dataset.cat = cat;
      btn.textContent = `${cat} ${catEmoji(cat)}`;
      btn.onclick = () => setFilter(cat, btn);
      bar.appendChild(btn);
    });

    const dl = document.getElementById("catSuggestions");
    dl.innerHTML = cats.map(c => `<option value="${c}">`).join("");

    document.getElementById("totalCount").textContent    = `${drinks.length} drink${drinks.length !== 1 ? "s" : ""}`;
    document.getElementById("categoryCount").textContent = `${cats.length} categor${cats.length !== 1 ? "ies" : "y"}`;
  }

  window.setFilter = function(cat, btn) {
    currentFilter = cat;
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderDrinks();
  };

  // --------------- DETAIL MODAL ---------------
  window.openDetailModal = function(id) {
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
  };

  window.closeDetailModal = function() {
    document.getElementById("detailModal").classList.add("hidden");
    currentDrinkId = null;
  };

  // --------------- ADD / EDIT MODAL ---------------
  window.openAddModal = function() {
    editingId = null;
    document.getElementById("formTitle").textContent = "➕ Add Drink";
    clearForm();
    document.getElementById("formModal").classList.remove("hidden");
    setTimeout(() => document.getElementById("fName").focus(), 50);
  };

  function openEditModal(drink) {
    editingId = drink.id;
    document.getElementById("formTitle").textContent     = "✏️ Edit Drink";
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

  window.editCurrentDrink = function() {
    const drink = drinks.find(d => d.id === currentDrinkId);
    if (!drink) return;
    window.closeDetailModal();
    openEditModal(drink);
  };

  window.closeFormModal = function() {
    document.getElementById("formModal").classList.add("hidden");
    editingId = null;
    clearForm();
  };

  function clearForm() {
    ["fName","fCategory","fPrice","fDesc","fIngredients","fEmoji","fTags"]
      .forEach(id => { document.getElementById(id).value = ""; });
    document.getElementById("formError").classList.add("hidden");
  }

  window.saveDrink = async function() {
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
      tags:        document.getElementById("fTags").value.split(",").map(t => t.trim()).filter(Boolean)
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "drinks", editingId), drinkData);
        const idx = drinks.findIndex(d => d.id === editingId);
        if (idx !== -1) drinks[idx] = { ...drinks[idx], ...drinkData };
        showToast("✏️ Drink updated!");
      } else {
        const ref = await addDoc(collection(db, "drinks"), { ...drinkData, createdAt: serverTimestamp() });
        drinks.push({ id: ref.id, ...drinkData });
        showToast("🎉 Drink added!");
      }
    } catch (err) {
      showToast("❌ Error: " + err.message);
      console.error(err);
      return;
    }

    window.closeFormModal();
    buildFilterTabs();
    renderDrinks();
  };

  // --------------- DELETE ---------------
  window.deleteCurrentDrink = function() {
    const drink = drinks.find(d => d.id === currentDrinkId);
    if (!drink) return;
    window.closeDetailModal();
    document.getElementById("confirmName").textContent = drink.name;
    document.getElementById("confirmModal").classList.remove("hidden");
  };

  window.closeConfirmModal = function() {
    document.getElementById("confirmModal").classList.add("hidden");
  };

  window.confirmDelete = async function() {
    if (!currentDrinkId) return;
    try {
      await deleteDoc(doc(db, "drinks", currentDrinkId));
      drinks = drinks.filter(d => d.id !== currentDrinkId);
      showToast("🗑️ Drink deleted.");
    } catch (err) {
      showToast("❌ Error: " + err.message);
    }
    currentDrinkId = null;
    window.closeConfirmModal();
    buildFilterTabs();
    renderDrinks();
  };

  // --------------- TOAST ---------------
  let toastTimer;
  function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add("hidden"), 2400);
  }

  // --------------- OVERLAY CLOSE ---------------
  document.addEventListener("click", e => {
    if (e.target.id === "formModal")    window.closeFormModal();
    if (e.target.id === "detailModal")  window.closeDetailModal();
    if (e.target.id === "confirmModal") window.closeConfirmModal();
  });

  document.getElementById("searchInput").addEventListener("input", renderDrinks);

  // --------------- INIT ---------------
  loadDrinks();
}
