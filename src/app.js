require('dotenv').config();
const express = require('express');
const { verificarToken, soloAdmin } = require('./middleware/auth');

const app = express();

app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/admin', require('./routes/admin'));

// Productos: requiere sesión; eliminar solo para admin
app.use(
  '/api/productos',
  verificarToken,
  (req, res, next) => (req.method === 'DELETE' ? soloAdmin(req, res, next) : next()),
  require('./routes/productos')
);

app.listen(process.env.PORT, () =>
  console.log(`Servidor en http://localhost:${process.env.PORT}`)
);