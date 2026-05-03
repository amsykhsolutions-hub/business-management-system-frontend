// =========================
// CONFIG
// =========================
let cart = [];
function addToCart(product) {
  const existing = cart.find(item => item.product === product._id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
  }

  renderCart();
}
function renderCart() {
  const cartContainer = document.getElementById("cart");
  const totalContainer = document.getElementById("total");

  cartContainer.innerHTML = "";

  cart.forEach(item => {
    cartContainer.innerHTML += `
      <div style="border:1px solid #ccc; padding:10px; margin:5px;">
        <h4>${item.name}</h4>
        <p>Price: ${item.price}</p>

        <input type="number" value="${item.quantity}"
          onchange="updateQuantity('${item.product}', this.value)" />

        <button onclick="removeFromCart('${item.product}')">
          Remove
        </button>
      </div>
    `;
  });

  totalContainer.innerText = getTotal();
}
function getTotal() {
  return cart.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);
}
function removeFromCart(productId) {
  cart = cart.filter(item => String(item.product) !== String(productId));
  renderCart();
}
const API = "https://business-management-system-kfkv.onrender.com/api";

// =========================
// TOAST SYSTEM
// =========================
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// =========================
// LOADING SYSTEM
// =========================
function setLoading(btn, loading = true) {
  if (!btn) return;

  const text = btn.querySelector(".btn-text");
  const loader = btn.querySelector(".btn-loader");

  btn.disabled = loading;

  if (loading) {
    text?.classList.add("hidden");
    loader?.classList.remove("hidden");
  } else {
    text?.classList.remove("hidden");
    loader?.classList.add("hidden");
  }
}

// =========================
// ACTIVE PAGE
// =========================
function setActivePage() {
  const links = document.querySelectorAll(".sidebar a");
  const currentPage = window.location.pathname.split("/").pop();

  links.forEach(link => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });
}

// =========================
// AUTH UI
// =========================
function showRegister() {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("registerBox").style.display = "block";
}

function showLogin() {
  document.getElementById("registerBox").style.display = "none";
  document.getElementById("loginBox").style.display = "block";
}

// =========================
// REGISTER
// =========================
async function register() {
  const btn = document.getElementById("registerBtn");
  setLoading(btn, true);

  try {
    const name = document.getElementById("regName").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;

    const res = await fetch(API + "/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (res.ok) {
      showToast("Registered successfully");
      showLogin();
    } else {
      showToast(data.message || "Registration failed", "error");
    }
  } catch {
    showToast("Server error", "error");
  } finally {
    setLoading(btn, false);
  }
}

// =========================
// LOGIN
// =========================
async function login() {
  const btn = document.getElementById("loginBtn");
  setLoading(btn, true);

  try {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const res = await fetch(API + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);

      showToast("Login successful");

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 800);
    } else {
      showToast(data.message || "Login failed", "error");
    }
  } catch {
    showToast("Error logging in", "error");
  } finally {
    setLoading(btn, false);
  }
}

// =========================
// PRODUCTS PAGE
// =========================
async function loadProducts() {
  const box = document.getElementById("products");
  if (!box) return;

  // ✅ skeleton restored
  box.innerHTML = `
    <div class="grid">
      ${[1,2,3,4].map(() => `
        <div class="card skeleton-card">
          <div class="skeleton skeleton-line long"></div>
          <div class="skeleton skeleton-line medium"></div>
          <div class="skeleton skeleton-line short"></div>
        </div>
      `).join("")}
    </div>
  `;

  try {
    const res = await fetch(API + "/products", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    });

    const result = await res.json();
    const data = result.data || [];

    box.innerHTML = "";

    if (!data.length) {
      box.innerHTML = `<div class="empty-state"><h2>No Products Yet</h2></div>`;
      return;
    }

    data.forEach(p => {
      box.innerHTML += `
        <div class="card">
          <h3>${p.name}</h3>
          <p>💰 Price: $${p.price}</p>
          <p>📦 Stock: ${p.stock}</p>

          ${localStorage.getItem("role") === "admin" ? `
            <button class="danger" onclick="deleteProduct('${p._id}')">Delete</button>
            <button class="edit" onclick="editProduct('${p._id}','${p.name}',${p.price},${p.stock})">Edit</button>
          ` : ""}
        </div>
      `;
    });

  } catch (err) {
    console.error(err);
    box.innerHTML = "Failed to load products";
  }
}

// =========================
// ADD PRODUCT
// =========================
async function addProduct() {
  const btn = document.getElementById("addProductBtn");
  setLoading(btn, true);

  try {
    const name = document.getElementById("name").value;
    const price = Number(document.getElementById("price").value);
    const stock = Number(document.getElementById("stock").value);

    const res = await fetch(API + "/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token")
      },
      body: JSON.stringify({ name, price, stock })
    });

    const data = await res.json();

    if (res.ok) {
      showToast("Product added");
    document.getElementById("name").value = "";
  document.getElementById("price").value = "";
  document.getElementById("stock").value = "";

  loadProducts(); loadProductsForOrder();// 🔥 THIS IS THE FIX
}else {
      showToast(data.message || "Error", "error");
    }
  } catch {
    showToast("Server error", "error");
  } finally {
    setLoading(btn, false);
  }
}
// =========================
// ORDERS PAGE
// =========================
async function loadOrders() {
  const box = document.getElementById("orders");
  if (!box) return;

  // skeleton restored
  box.innerHTML = `
    ${[1,2,3].map(() => `
      <div class="card skeleton-card">
        <div class="skeleton skeleton-line long"></div>
        <div class="skeleton skeleton-line medium"></div>
        <div class="skeleton skeleton-line short"></div>
      </div>
    `).join("")}
  `;

  try {
    const res = await fetch(API + "/orders", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    });

    const result = await res.json();
    const orders = result.data || result || [];

    box.innerHTML = "";

    if (!orders.length) {
      box.innerHTML = "<h3>No Orders Yet</h3>";
      return;
    }

    orders.forEach(o => {
      const itemsList = o.items.map(i => `${i.name} x${i.quantity}`).join(", ");

      box.innerHTML += `
        <div class="card">
          <h3>Order: ${o._id}</h3>
          <p>${itemsList}</p>
          <p>Total: $${o.totalPrice}</p>
        </div>
      `;
    });

  } catch (err) {
    console.error(err);
    box.innerHTML = "Failed to load orders";
  }
}

// =========================
// ORDER SYSTEM (FIXED CLEAN)
// =========================


// =========================
// LOAD PRODUCTS FOR ORDER
// =========================
async function loadProductsForOrder() {
  const box = document.getElementById("product-list");
  if (!box) return;

  try {
    const res = await fetch(API + "/products", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    });

    const result = await res.json();
    const products = result.data || [];

    box.innerHTML = "";

    products.forEach(p => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <h3>${p.name}</h3>
        <p>💰 $${p.price}</p>
        <button class="select-btn">Select</button>
      `;

      const btn = card.querySelector(".select-btn");

      btn.addEventListener("click", () => {
  addToCart(p); // ✅ new
  selectProduct(p._id, p.name, p.price, btn); // ✅ keep old UI working
});

      box.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    box.innerHTML = "Failed to load products";
  }
}

// =========================
// SELECT PRODUCT (FIXED)
// =========================

// =========================
// CREATE ORDER
// =========================
async function createOrder() {
  const btn = document.getElementById("createOrderBtn");
  setLoading(btn, true);

  try {
    if (cart.length === 0) {
  showToast("Cart is empty", "error");
  return;
}

const res = await fetch(API + "/orders", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer " + localStorage.getItem("token")
  },
  body: JSON.stringify({
    items: cart
  })
});

    const data = await res.json();

   if (res.ok) {
  showToast("Order created");

  cart = [];        // ✅ clear cart data
  renderCart();     // ✅ refresh UI
}  else {
      showToast(data.message || "Order failed", "error");
    }

  } catch {
    showToast("Server error", "error");
  } finally {
    setLoading(btn, false);
  }
}

// =========================
// DASHBOARD STATS (FIXED INIT)
// =========================
async function loadDashboardStats() {
  try {
    const token = localStorage.getItem("token");

    const [productsRes, ordersRes] = await Promise.all([
      fetch(API + "/products", {
        headers: { Authorization: "Bearer " + token }
      }),
      fetch(API + "/orders", {
        headers: { Authorization: "Bearer " + token }
      })
    ]);

    const products = (await productsRes.json()).data || [];
    const orders = (await ordersRes.json()).data || [];

    let revenue = 0;
    orders.forEach(o => revenue += o.totalPrice || 0);

    document.getElementById("totalProducts").innerText = products.length;
    document.getElementById("totalOrders").innerText = orders.length;
    document.getElementById("totalRevenue").innerText = "$" + revenue;

  } catch (err) {
    console.error(err);
  }
}

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
  setActivePage();

  // FIX: stats now actually runs
  if (window.location.pathname.includes("dashboard")) {
    loadDashboardStats();
  }
});

// =========================
// LOGOUT
// =========================
function logout() {
  localStorage.clear();
  showToast("Logged out");

  setTimeout(() => {
    window.location.href = "index.html";
  }, 800);
}

// =========================
// SIDEBAR
// =========================
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

if (menuToggle && sidebar && overlay) {
  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");
  });

  overlay.addEventListener("click", () => {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
  });
}