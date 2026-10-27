const router = require('express').Router();
const pool = require('../db');
const { verificarToken, soloAdmin } = require('../middleware/auth');

router.use(verificarToken, soloAdmin);

router.post('/reiniciar', async (req, res) => {
  const { modo, confirmacion } = req.body;
  if (confirmacion !== 'BORRAR') {
    return res.status(400).json({ error: 'Debes enviar confirmacion: "BORRAR"' });
  }
  if (modo !== 'productos' && modo !== 'todo') {
    return res.status(400).json({ error: 'Modo inválido (productos o todo)' });
  }

  // Conexión propia, porque SET FOREIGN_KEY_CHECKS vale solo para esa conexión
  const conn = await pool.getConnection();
  try {
    if (modo === 'productos') {
      await conn.query('SET FOREIGN_KEY_CHECKS = 0');
      await conn.query('TRUNCATE TABLE pedido_items');
      await conn.query('TRUNCATE TABLE pedidos');
      await conn.query('TRUNCATE TABLE productos');
      await conn.query('SET FOREIGN_KEY_CHECKS = 1');
      return res.json({ mensaje: 'Se eliminaron todos los productos y pedidos, y los ID se reiniciaron' });
    }

    await conn.query('DROP TABLE IF EXISTS pedido_items');
    await conn.query('DROP TABLE IF EXISTS pedidos');
    await conn.query('DROP TABLE IF EXISTS productos');
    await conn.query('DROP TABLE IF EXISTS usuarios');
    return res.json({ mensaje: 'Aplicación destruida: se eliminaron todas las tablas' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    // Por si algo falló a mitad de camino, se deja la conexión limpia
    try { await conn.query('SET FOREIGN_KEY_CHECKS = 1'); } catch {}
    conn.release();
  }
});

module.exports = router;