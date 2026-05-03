# Florería Chiapas — Tienda de ramos en línea

Proyecto Flask + SQLite + Vanilla JS. Sin frameworks externos.

## Stack
- **Backend:** Flask (app.py), SQLite (mejor.db)
- **Frontend:** HTML5, CSS3 custom properties, Vanilla JS (ES6+)
- **Fonts:** Playfair Display (títulos), Inter (cuerpo) — Google Fonts vía @import
- **Sin dependencias:** jQuery, Bootstrap, Tailwind, React, etc.

## Estructura
```
floreria/
  app.py              # Flask app, 10 rutas API
  init_db.py          # Crear tablas + 6 ramos semilla
  mejor.db            # SQLite (generado)
  templates/
    index.html        # Tienda: catálogo, carrito slideover, formulario pedido
    admin.html        # Panel admin: CRUD ramos, gestión pedidos
  static/
    css/style.css     # Diseño completo ~460 líneas
    js/main.js        # Lógica cliente ~390 líneas
  CLAUDE.md
```

## Base de datos
- **productos:** id, nombre, descripcion, precio, imagen, disponible
- **pedidos:** id, cliente, telefono, direccion, fecha_entrega, total, status, productos, creado

## API
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/productos | Productos disponibles (catálogo público) |
| GET | /api/productos/admin | Todos los productos (activos e inactivos) |
| GET | /api/productos/<id> | Un producto |
| POST | /api/productos | Crear producto |
| PUT | /api/productos/<id> | Editar producto |
| DELETE | /api/productos/<id> | Soft-delete (disponible=0) |
| GET | /api/pedidos | Lista de pedidos |
| POST | /api/pedidos | Crear pedido |
| PUT | /api/pedidos/<id>/status | Cambiar estatus de pedido |

## Diseño
- Paleta: crema (#faf6f1), rosa palo (#d4a5a5), verde salvia (#b5c4a5)
- Tipografía serif para títulos (Playfair), sans para cuerpo (Inter)
- Animaciones suaves: fadeUp en tarjetas, scaleIn en modales, popIn en botón carrito
- Responsive: mobile-first con breakpoint 768px
- Carrito persiste en localStorage

## Arranque
```bash
cd floreria
python init_db.py      # solo primera vez
python app.py           # http://localhost:5050
```
