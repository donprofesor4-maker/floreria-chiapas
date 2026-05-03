/* ── Carrito ─────────────────────────────────────────── */
const Cart = {
  items: JSON.parse(localStorage.getItem("floreria_cart") || "[]"),

  save() {
    localStorage.setItem("floreria_cart", JSON.stringify(this.items));
  },

  add(producto) {
    const existing = this.items.find((i) => i.id === producto.id);
    if (existing) {
      existing.qty += 1;
    } else {
      this.items.push({ ...producto, qty: 1 });
    }
    this.save();
    this.updateUI();
  },

  remove(id) {
    this.items = this.items.filter((i) => i.id !== id);
    this.save();
    this.updateUI();
  },

  updateQty(id, delta) {
    const item = this.items.find((i) => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      this.remove(id);
      return;
    }
    this.save();
    this.updateUI();
  },

  clear() {
    this.items = [];
    this.save();
    this.updateUI();
  },

  total() {
    return this.items.reduce((sum, i) => sum + i.precio * i.qty, 0);
  },

  count() {
    return this.items.reduce((sum, i) => sum + i.qty, 0);
  },

  updateUI() {
    const count = this.count();
    document.querySelectorAll(".cart-count").forEach((el) => {
      el.textContent = count;
      el.style.display = count > 0 ? "" : "none";
    });
    const badge = document.querySelector(".cart-badge .badge");
    if (badge) {
      const prev = parseInt(badge.textContent || "0");
      if (count > prev) {
        badge.classList.add("bump");
        setTimeout(() => badge.classList.remove("bump"), 250);
      }
      badge.textContent = count;
      badge.style.display = count > 0 ? "flex" : "none";
    }
    this.renderPanel();
    this.renderResumen();
  },

  renderPanel() {
    const panel = document.querySelector(".cart-items");
    if (!panel) return;
    if (this.items.length === 0) {
      panel.innerHTML = `<div class="cart-empty"><span class="emoji">💐</span><p>Tu carrito está vacío</p></div>`;
    } else {
      panel.innerHTML = this.items
        .map(
          (item) => `
        <div class="cart-item">
          <div class="cart-item-img">${item.emoji || "💐"}</div>
          <div class="cart-item-info">
            <div class="nombre">${item.nombre}</div>
            <div class="precio">$${item.precio.toFixed(2)}</div>
          </div>
          <div class="cart-item-actions">
            <button class="qty-btn" onclick="Cart.updateQty(${item.id}, -1)">−</button>
            <span class="qty">${item.qty}</span>
            <button class="qty-btn" onclick="Cart.updateQty(${item.id}, 1)">+</button>
            <button class="btn-remove" onclick="Cart.remove(${item.id})" title="Quitar">✕</button>
          </div>
        </div>`
        )
        .join("");
    }
    const totalEl = document.querySelector(".cart-total .total");
    if (totalEl) totalEl.textContent = `$${this.total().toFixed(2)}`;
  },

  renderResumen() {
    const resumen = document.querySelector(".resumen-pedido");
    if (!resumen) return;
    if (this.items.length === 0) {
      resumen.innerHTML = `<p style="color:var(--texto-claro);text-align:center;padding:1rem;">No hay productos en el carrito.</p>`;
      return;
    }
    resumen.innerHTML = `
      <h3>Tu pedido</h3>
      ${this.items.map(i => `<div class="resumen-item"><span>${i.nombre} ×${i.qty}</span><span>$${(i.precio * i.qty).toFixed(2)}</span></div>`).join("")}
      <div class="resumen-total"><span>Total</span><span class="monto">$${this.total().toFixed(2)}</span></div>
    `;
  },
};

/* ── Carrito Panel toggle ────────────────────────────── */
function toggleCart() {
  document.querySelector(".cart-panel").classList.toggle("open");
  document.querySelector(".cart-overlay").classList.toggle("open");
  document.body.style.overflow =
    document.querySelector(".cart-panel").classList.contains("open") ? "hidden" : "";
}

function closeCart() {
  document.querySelector(".cart-panel").classList.remove("open");
  document.querySelector(".cart-overlay").classList.remove("open");
  document.body.style.overflow = "";
}

/* ── Toast ────────────────────────────────────────────── */
function showToast(msg) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2600);
}

/* ── Catálogo ─────────────────────────────────────────── */
const emojis = ["🌹", "🌷", "🌻", "🪷", "🤍", "🎀"];
let emojiIdx = 0;

async function cargarCatalogo() {
  try {
    const res = await fetch("/api/productos");
    const productos = await res.json();
    const grid = document.querySelector(".grid-ramos");
    if (!grid) return;

    grid.innerHTML = productos
      .map((p, i) => {
        const emoji = emojis[i % emojis.length];
        return `
          <div class="tarjeta-ramo">
            <div class="tarjeta-ramo-img">
              <span class="flor-emoji">${emoji}</span>
            </div>
            <div class="tarjeta-ramo-body">
              <h3>${p.nombre}</h3>
              <p class="desc">${p.descripcion}</p>
              <div class="tarjeta-ramo-footer">
                <span class="precio">$${p.precio.toFixed(2)}</span>
                <button class="btn-add" onclick="agregarAlCarrito(${p.id}, '${p.nombre.replace(/'/g, "\\'")}', ${p.precio}, '${emoji}', this)" title="Agregar al carrito">+</button>
              </div>
            </div>
          </div>`;
      })
      .join("");
  } catch (e) {
    console.error("Error cargando catálogo:", e);
  }
}

function agregarAlCarrito(id, nombre, precio, emoji, btn) {
  Cart.add({ id, nombre, precio, emoji });
  if (btn) {
    btn.classList.add("added");
    setTimeout(() => btn.classList.remove("added"), 500);
  }
  showToast("Agregado al carrito ✨");
}

/* ── Pedido Form ─────────────────────────────────────── */
function enviarPedido(e) {
  e.preventDefault();
  if (Cart.items.length === 0) {
    showToast("Agrega productos al carrito primero.");
    return;
  }
  const form = e.target;
  const data = {
    cliente: form.cliente.value.trim(),
    telefono: form.telefono.value.trim(),
    direccion: form.direccion.value.trim(),
    fecha_entrega: form.fecha_entrega.value,
    total: Cart.total(),
    productos: JSON.stringify(Cart.items.map((i) => ({ id: i.id, nombre: i.nombre, qty: i.qty, precio: i.precio }))),
  };

  if (!data.cliente || !data.telefono || !data.direccion || !data.fecha_entrega) {
    showToast("Completá todos los campos.");
    return;
  }

  fetch("/api/pedidos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then((r) => r.json())
    .then(() => {
      Cart.clear();
      form.reset();
      document.getElementById("form-pedido").style.display = "none";
      document.getElementById("confirmacion").classList.add("show");
    })
    .catch(() => showToast("Error al enviar el pedido."));
}

/* ── Admin ───────────────────────────────────────────── */
let adminTab = "productos";
let adminProductos = [];
let editandoId = null;

async function cargarAdmin(tab = "productos") {
  adminTab = tab;
  const url = tab === "productos" ? "/api/productos/admin" : "/api/pedidos";
  const res = await fetch(url);
  const data = await res.json();
  const cont = document.querySelector(".admin-content");
  if (!cont) return;

  if (tab === "productos") {
    adminProductos = data;
    cont.innerHTML = `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>Imagen</th><th>Nombre</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            ${data.map(p => `
              <tr>
                <td>${p.imagen}</td>
                <td><strong>${p.nombre}</strong><br><small style="color:var(--texto-claro)">${p.descripcion.slice(0,60)}…</small></td>
                <td>$${p.precio.toFixed(2)}</td>
                <td>${p.disponible ? "✅ Activo" : "❌ Inactivo"}</td>
                <td class="actions">
                  <button class="btn btn-outline btn-sm" onclick="editarProducto(${p.id})">Editar</button>
                  <button class="btn btn-danger btn-sm" onclick="eliminarProducto(${p.id})">Eliminar</button>
                </td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
  } else {
    cont.innerHTML = data.length === 0
      ? `<p style="color:var(--texto-claro);text-align:center;padding:2rem;">No hay pedidos aún.</p>`
      : data.map(p => {
          let prods = "";
          try { prods = JSON.parse(p.productos).map(i => `${i.nombre} ×${i.qty}`).join(", "); } catch { prods = p.productos; }
          return `
            <div class="pedido-card">
              <div class="pedido-card-header">
                <span class="id">Pedido #${p.id} — ${p.cliente}</span>
                <span class="pedido-status ${p.status}">${p.status}</span>
              </div>
              <div class="pedido-card-body">
                <p>📞 ${p.telefono} &nbsp; 📍 ${p.direccion}</p>
                <p>📅 ${p.fecha_entrega}</p>
                <p class="productos">💐 ${prods}</p>
                <p>Total: <strong>$${p.total.toFixed(2)}</strong></p>
                <p style="font-size:0.8rem;color:var(--texto-claro)">${p.creado}</p>
              </div>
              <div class="pedido-card-footer">
                <button class="btn btn-sm btn-success" onclick="cambiarStatus(${p.id}, 'entregado')">✓ Entregado</button>
                <button class="btn btn-sm btn-outline" onclick="cambiarStatus(${p.id}, 'enviado')">Enviado</button>
                <button class="btn btn-sm btn-danger" onclick="cambiarStatus(${p.id}, 'cancelado')">Cancelar</button>
              </div>
            </div>`;
        }).join("");
  }
}

function cambiarStatus(id, status) {
  fetch(`/api/pedidos/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  }).then(() => cargarAdmin(adminTab));
}

function abrirModal(id = null) {
  editandoId = id;
  const modal = document.querySelector(".modal-overlay");
  const titulo = document.getElementById("modal-titulo");
  modal.style.display = "flex";
  const form = document.getElementById("modal-form");
  form.reset();

  if (id) {
    titulo.textContent = "Editar ramo";
    const p = adminProductos.find((p) => p.id === id);
    if (p) {
      document.getElementById("m-nombre").value = p.nombre;
      document.getElementById("m-descripcion").value = p.descripcion;
      document.getElementById("m-precio").value = p.precio;
      document.getElementById("m-imagen").value = p.imagen;
      document.getElementById("m-disponible").checked = p.disponible === 1;
    }
  } else {
    titulo.textContent = "Nuevo ramo";
    document.getElementById("m-disponible").checked = true;
  }
}

function cerrarModal() {
  document.querySelector(".modal-overlay").style.display = "none";
  editandoId = null;
}

function guardarProducto(e) {
  e.preventDefault();
  const data = {
    nombre: document.getElementById("m-nombre").value.trim(),
    descripcion: document.getElementById("m-descripcion").value.trim(),
    precio: parseFloat(document.getElementById("m-precio").value),
    imagen: document.getElementById("m-imagen").value.trim() || "ramos-default.jpg",
    disponible: document.getElementById("m-disponible").checked ? 1 : 0,
  };
  const method = editandoId ? "PUT" : "POST";
  const url = editandoId ? `/api/productos/${editandoId}` : "/api/productos";

  fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(() => {
    cerrarModal();
    cargarAdmin("productos");
    showToast(editandoId ? "Ramo actualizado 💐" : "Ramo creado 💐");
  });
}

function editarProducto(id) { abrirModal(id); }

function eliminarProducto(id) {
  if (!confirm("¿Eliminar este ramo?")) return;
  fetch(`/api/productos/${id}`, { method: "DELETE" }).then(() => {
    cargarAdmin("productos");
    showToast("Ramo eliminado.");
  });
}

function cambiarTabAdmin(tab) {
  document.querySelectorAll(".admin-tab").forEach(b => b.classList.remove("active"));
  document.querySelector(`.admin-tab.${tab}`)?.classList.add("active");
  cargarAdmin(tab);
}

/* ── WhatsApp ────────────────────────────────────────── */
function toggleWhatsappTooltip(show) {
  const el = document.querySelector(".whatsapp-tooltip");
  if (el) el.classList.toggle("show", show);
}

/* ── Init ────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  Cart.updateUI();
  cargarCatalogo();

  // Cart overlay click
  document.querySelector(".cart-overlay")?.addEventListener("click", closeCart);

  // Modal overlay click
  document.querySelector(".modal-overlay")?.addEventListener("click", function (e) {
    if (e.target === this) cerrarModal();
  });

  // Pedido form
  document.getElementById("form-pedido")?.addEventListener("submit", enviarPedido);
  document.getElementById("modal-form")?.addEventListener("submit", guardarProducto);

  // Admin tabs
  if (document.querySelector(".admin-tabs")) {
    cargarAdmin("productos");
  }

  // Fecha mínima = mañana
  const fechaInput = document.getElementById("fecha_entrega");
  if (fechaInput) {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    fechaInput.min = manana.toISOString().split("T")[0];
  }
});
