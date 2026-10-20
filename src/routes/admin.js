const router = require('express').Router();
const pool = require('../db');
const { verificarToken, soloAdmin } = require('../middleware/auth');

router.use(verificarToken, soloAdmin);

router.post('/reiniciar', async (req, res) => {
  try {
    const { modo, confirmacion } = req.body;
    if (confirmacion !== 'BORRAR') {
      return res.status(400).json({ error: 'Debes enviar confirmacion: "BORRAR"' });
    }
    if (modo === 'productos') {
      await pool.query('TRUNCATE TABLE productos');
      return res.json({ mensaje: 'Todos los productos fueron eliminados y el ID se reinició' });
    }
    if (modo === 'todo') {
      await pool.query('DROP TABLE IF EXISTS productos');
      await pool.query('DROP TABLE IF EXISTS usuarios');
      return res.json({ mensaje: 'Aplicación destruida: se eliminaron todas las tablas' });
    }
    res.status(400).json({ error: 'Modo inválido (productos o todo)' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;