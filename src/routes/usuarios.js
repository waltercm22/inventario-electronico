const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { verificarToken, soloAdmin } = require('../middleware/auth');

router.use(verificarToken);

const ROLES = ['admin', 'empleado'];

async function totalAdmins() {
  const [[{ t }]] = await pool.query("SELECT COUNT(*) AS t FROM usuarios WHERE rol = 'admin'");
  return Number(t);
}

function adminOPropio(req, res, next) {
  if (req.usuario.rol === 'admin' || req.usuario.id === Number(req.params.id)) return next();
  res.status(403).json({ error: 'Solo puedes modificar tu propio usuario' });
}

// Mi perfil
router.get('/me', (req, res) => res.json(req.usuario));

// Listar (admin)
router.get('/', soloAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, email, rol, creado_en FROM usuarios ORDER BY id');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Crear (admin, con rol)
router.post('/', soloAdmin, async (req, res) => {
  try {
    const { nombre, email, password, rol = 'empleado' } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Faltan campos: nombre, email, password' });
    }
    if (!ROLES.includes(rol)) return res.status(400).json({ error: 'Rol inválido (admin o empleado)' });
    if (password.length < 6) return res.status(400).json({ error: 'Contraseña mínima de 6 caracteres' });
    const hash = await bcrypt.hash(password, 10);
    const [r] = await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
      [nombre, email, hash, rol]);
    res.status(201).json({ id: r.insertId, nombre, email, rol });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ese email ya está registrado' });
    res.status(500).json({ error: e.message });
  }
});

// Actualizar datos (admin o el propio usuario); campos opcionales
router.put('/:id', adminOPropio, async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    const sets = [], valores = [];
    if (nombre) { sets.push('nombre = ?'); valores.push(nombre); }
    if (email) { sets.push('email = ?'); valores.push(email); }
    if (password) {
      if (password.length < 6) return res.status(400).json({ error: 'Contraseña mínima de 6 caracteres' });
      sets.push('password_hash = ?'); valores.push(await bcrypt.hash(password, 10));
    }
    if (sets.length === 0) return res.status(400).json({ error: 'No enviaste ningún dato para actualizar' });
    valores.push(req.params.id);
    const [r] = await pool.query(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = ?`, valores);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ mensaje: 'Usuario actualizado correctamente' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ese email ya está registrado' });
    res.status(500).json({ error: e.message });
  }
});

// Cambiar rol (admin)
router.patch('/:id/rol', soloAdmin, async (req, res) => {
  try {
    const { rol } = req.body;
    if (!ROLES.includes(rol)) return res.status(400).json({ error: 'Rol inválido (admin o empleado)' });
    const [rows] = await pool.query('SELECT rol FROM usuarios WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (rows[0].rol === 'admin' && rol !== 'admin' && (await totalAdmins()) <= 1) {
      return res.status(400).json({ error: 'No puedes quitar el rol al único administrador' });
    }
    await pool.query('UPDATE usuarios SET rol = ? WHERE id = ?', [rol, req.params.id]);
    res.json({ mensaje: `Rol cambiado a ${rol}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Eliminar (admin)
router.delete('/:id', soloAdmin, async (req, res) => {
  try {
    if (req.usuario.id === Number(req.params.id)) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }
    const [rows] = await pool.query('SELECT rol FROM usuarios WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (rows[0].rol === 'admin' && (await totalAdmins()) <= 1) {
      return res.status(400).json({ error: 'No puedes eliminar al único administrador' });
    }
    await pool.query('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;