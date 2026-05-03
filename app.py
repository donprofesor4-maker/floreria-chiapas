from flask import Flask, render_template, request, jsonify, g
import sqlite3
import os

app = Flask(__name__)
DB = "mejor.db"


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exception):
    db = g.pop("db", None)
    if db is not None:
        db.close()


# ── Páginas ──────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/admin")
def admin():
    return render_template("admin.html")


# ── API Productos ────────────────────────────────────────

@app.route("/api/productos")
def api_productos():
    db = get_db()
    rows = db.execute(
        "SELECT * FROM productos WHERE disponible = 1 ORDER BY id"
    ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/productos/<int:pid>")
def api_producto(pid):
    db = get_db()
    row = db.execute("SELECT * FROM productos WHERE id = ?", (pid,)).fetchone()
    if row:
        return jsonify(dict(row))
    return jsonify({"error": "No encontrado"}), 404


@app.route("/api/productos", methods=["POST"])
def api_producto_crear():
    data = request.json
    db = get_db()
    c = db.execute(
        "INSERT INTO productos (nombre, descripcion, precio, imagen, disponible) VALUES (?, ?, ?, ?, ?)",
        (data["nombre"], data["descripcion"], data["precio"], data.get("imagen", "ramos-default.jpg"), 1),
    )
    db.commit()
    return jsonify({"id": c.lastrowid}), 201


@app.route("/api/productos/<int:pid>", methods=["PUT"])
def api_producto_editar(pid):
    data = request.json
    db = get_db()
    db.execute(
        "UPDATE productos SET nombre=?, descripcion=?, precio=?, imagen=?, disponible=? WHERE id=?",
        (data["nombre"], data["descripcion"], data["precio"], data.get("imagen", "ramos-default.jpg"), data.get("disponible", 1), pid),
    )
    db.commit()
    return jsonify({"ok": True})


@app.route("/api/productos/<int:pid>", methods=["DELETE"])
def api_producto_eliminar(pid):
    db = get_db()
    db.execute("UPDATE productos SET disponible = 0 WHERE id = ?", (pid,))
    db.commit()
    return jsonify({"ok": True})


@app.route("/api/productos/admin")
def api_productos_admin():
    db = get_db()
    rows = db.execute("SELECT * FROM productos ORDER BY id").fetchall()
    return jsonify([dict(r) for r in rows])


# ── API Pedidos ──────────────────────────────────────────

@app.route("/api/pedidos", methods=["POST"])
def api_pedido_crear():
    data = request.json
    # data: { cliente, telefono, direccion, fecha_entrega, total, productos }
    db = get_db()
    c = db.execute(
        "INSERT INTO pedidos (cliente, telefono, direccion, fecha_entrega, total, productos) VALUES (?, ?, ?, ?, ?, ?)",
        (data["cliente"], data["telefono"], data["direccion"], data["fecha_entrega"], data["total"], data["productos"]),
    )
    db.commit()
    return jsonify({"id": c.lastrowid, "status": "pendiente"}), 201


@app.route("/api/pedidos")
def api_pedidos():
    db = get_db()
    rows = db.execute("SELECT * FROM pedidos ORDER BY id DESC").fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/pedidos/<int:pid>/status", methods=["PUT"])
def api_pedido_status(pid):
    data = request.json
    db = get_db()
    db.execute("UPDATE pedidos SET status = ? WHERE id = ?", (data["status"], pid))
    db.commit()
    return jsonify({"ok": True})


def init_db():
    """Crea tablas y datos semilla si la BD no existe."""
    if os.path.exists(DB):
        return
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS productos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            descripcion TEXT NOT NULL,
            precio REAL NOT NULL,
            imagen TEXT DEFAULT 'ramos-default.jpg',
            disponible INTEGER DEFAULT 1
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS pedidos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente TEXT NOT NULL,
            telefono TEXT NOT NULL,
            direccion TEXT NOT NULL,
            fecha_entrega TEXT NOT NULL,
            total REAL NOT NULL,
            status TEXT DEFAULT 'pendiente',
            productos TEXT NOT NULL,
            creado TEXT DEFAULT (datetime('now','localtime'))
        )
    """)
    ramos = [
        ("Ramo Romántico Rosas", "12 rosas rojas de jardín ecuatoriano con follaje verde y envoltura kraft. El clásico para decir te amo.", 850.00, "ramo-rosas.jpg"),
        ("Bouquet Primavera", "Mezcla de tulipanes rosas, lilas blancos y astromelias con follaje delicado. Frescura de jardín.", 720.00, "bouquet-primavera.jpg"),
        ("Ramo Silvestre Elegante", "Girasoles, margaritas y eucalipto con un toque de lavanda. Luz y aroma en un solo ramo.", 680.00, "ramo-silvestre.jpg"),
        ("Arreglo Peonías Sueño", "Peonías rosadas con hortensias azules en base de musgo natural. Para ocasiones especiales.", 1200.00, "arreglo-peonias.jpg"),
        ("Ramo Minimalista", "Calas blancas con follaje verde oscuro atadas con listón de seda cruda. Pura elegancia.", 950.00, "ramo-minimalista.jpg"),
        ("Caja de Flores Eterna", "Rosas preservadas en tonos pastel dentro de caja redonda de terciopelo. Durán meses sin agua.", 1350.00, "caja-eterna.jpg"),
    ]
    c.executemany(
        "INSERT INTO productos (nombre, descripcion, precio, imagen, disponible) VALUES (?, ?, ?, ?, 1)",
        ramos,
    )
    conn.commit()
    conn.close()
    print("Base de datos creada con 6 ramos.")


init_db()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    app.run(debug=False, host="0.0.0.0", port=port)
