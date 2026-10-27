import { http } from './api'

// Todas estas llamadas usan las rutas de tu backend (requieren token de admin)
export const admin = {
  productos: () => http('/productos'),
  crearProducto: (p, token) => http('/productos', { method: 'POST', body: p, token }),
  editarProducto: (id, p, token) => http(`/productos/${id}`, { method: 'PUT', body: p, token }),
  borrarProducto: (id, token) => http(`/productos/${id}`, { method: 'DELETE', token }),
  usuarios: (token) => http('/usuarios', { token }),
  cambiarRol: (id, rol, token) => http(`/usuarios/${id}/rol`, { method: 'PATCH', body: { rol }, token }),
  borrarUsuario: (id, token) => http(`/usuarios/${id}`, { method: 'DELETE', token }),
  pedidos: (token) => http('/pedidos', { token }),
  cambiarEstado: (id, estado, token) => http(`/pedidos/${id}/estado`, { method: 'PATCH', body: { estado }, token }),
}
