import sqlite3

conn = sqlite3.connect("mejor.db")
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
    creado TEXT DEFAULT (datetime('now', 'localtime'))
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

c.execute("SELECT COUNT(*) FROM productos")
if c.fetchone()[0] == 0:
    c.executemany(
        "INSERT INTO productos (nombre, descripcion, precio, imagen, disponible) VALUES (?, ?, ?, ?, 1)",
        ramos,
    )
    print("6 ramos de prueba insertados.")

conn.commit()
conn.close()
print("Base de datos lista.")
