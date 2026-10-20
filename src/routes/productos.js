const express = require('express');
const router = express.Router();
const pool = require('../db');

// CREATE
router.post('/', async (req, res) => {
  const { nombre, categoria, precio, stock } = req.body;
  if (!nombre || !categoria || precio == null || stock == null)
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  try {
    const [r] = await pool.query(
      'INSERT INTO productos (nombre, categoria, precio, stock) VALUES (?, ?, ?, ?)',
      [nombre, categoria, precio, stock]
    );
    res.status(201).json({ id: r.insertId, nombre, categoria, precio, stock });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// READ (todos)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM productos');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// READ (uno)
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// UPDATE
router.put('/:id', async (req, res) => {
  const { nombre, categoria, precio, stock } = req.body;
  try {
    const [r] = await pool.query(
      'UPDATE productos SET nombre=?, categoria=?, precio=?, stock=? WHERE id=?',
      [nombre, categoria, precio, stock, req.params.id]
    );
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto actualizado' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const [r] = await pool.query('DELETE FROM productos WHERE id = ?', [req.params.id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto eliminado' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;