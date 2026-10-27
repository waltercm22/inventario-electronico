require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { verificarToken, soloAdmin } = require('./middleware/auth');

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/pedidos', require('./routes/pedidos'));

// Productos: ver el catálogo es público; el resto requiere sesión; eliminar solo admin
app.use(
  '/api/productos',
  (req, res, next) => {
    if (req.method === 'GET') return next();
    verificarToken(req, res, () =>
      req.method === 'DELETE' ? soloAdmin(req, res, next) : next());
  },
  require('./routes/productos')
);

app.listen(process.env.PORT, () =>
  console.log(`Servidor en http://localhost:${process.env.PORT}`)
);