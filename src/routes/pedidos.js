const router = require('express').Router();
const pool = require('../db');
const { verificarToken, soloAdmin } = require('../middleware/auth');

router.use(verificarToken);

const fallo = (status, msg) => Object.assign(new Error(msg), { status });

async function adjuntarItems(pedidos) {
  if (pedidos.length === 0) return pedidos;
  const [items] = await pool.query(
    'SELECT * FROM pedido_items WHERE pedido_id IN (?)', [pedidos.map((p) => p.id)]);
  pedidos.forEach((p) => { p.items = items.filter((i) => i.pedido_id === p.id); });
  return pedidos;
}

// Crear pedido: valida stock y lo descuenta dentro de una transacción
router.post('/', async (req, res) => {
  const { nombre, email, telefono, direccion, items } = req.body;
  if (!nombre || !email || !telefono || !direccion || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Faltan datos del pedido' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let total = 0;
    const detalle = [];
    for (const it of items) {
      const cantidad = Number(it.cantidad);
      if (!Number.isInteger(cantidad) || cantidad < 1) throw fallo(400, 'Cantidad inválida');
      const [rows] = await conn.query(
        'SELECT id, nombre, precio, stock FROM productos WHERE id = ? FOR UPDATE', [it.producto_id]);
      const p = rows[0];
      if (!p) throw fallo(404, `El producto ${it.producto_id} no existe`);
      if (p.stock < cantidad) throw fallo(409, `Stock insuficiente de "${p.nombre}" (quedan ${p.stock})`);
      total += Number(p.precio) * cantidad;
      detalle.push({ p, cantidad });
    }
    const [r] = await conn.query(
      'INSERT INTO pedidos (usuario_id, nombre, email, telefono, direccion, total) VALUES (?, ?, ?, ?, ?, ?)',
      [req.usuario.id, nombre, email, telefono, direccion, total]);
    for (const { p, cantidad } of detalle) {
      await conn.query(
        'INSERT INTO pedido_items (pedido_id, producto_id, nombre, precio, cantidad) VALUES (?, ?, ?, ?, ?)',
        [r.insertId, p.id, p.nombre, p.precio, cantidad]);
      await conn.query('UPDATE productos SET stock = stock - ? WHERE id = ?', [cantidad, p.id]);
    }
    await conn.commit();
    res.status(201).json({ id: r.insertId, estado: 'pendiente', total });
  } catch (e) {
    await conn.rollback();
    res.status(e.status || 500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

// Mis pedidos
router.get('/mios', async (req, res) => {
  try {
    const [pedidos] = await pool.query(
      'SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY id DESC', [req.usuario.id]);
    res.json(await adjuntarItems(pedidos));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Todos los pedidos (admin)
router.get('/', soloAdmin, async (req, res) => {
  try {
    const [pedidos] = await pool.query('SELECT * FROM pedidos ORDER BY id DESC');
    res.json(await adjuntarItems(pedidos));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Cambiar estado (admin)
router.patch('/:id/estado', soloAdmin, async (req, res) => {
  try {
    const { estado } = req.body;
    if (!['pendiente', 'enviado', 'entregado', 'cancelado'].includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    const [r] = await pool.query('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, req.params.id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json({ mensaje: `Pedido ${estado}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;