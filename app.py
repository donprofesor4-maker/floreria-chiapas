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


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    if not os.path.exists(DB):
        print("Ejecutá init_db.py primero para crear la base de datos.")
    else:
        app.run(debug=False, host="0.0.0.0", port=port)
