import { PRODUCTOS } from '../data/productos'

// INTERRUPTOR: en frontend/.env pon VITE_USAR_API=true para usar el backend real
const USAR_API = import.meta.env.VITE_USAR_API === 'true'
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export async function http(ruta, { method = 'GET', body, token } = {}) {
  const res = await fetch(BASE + ruta, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error en la petición')
  return data
}

// ---- Simulación local (modo sin backend) ----
const espera = (v) => new Promise((r) => setTimeout(() => r(v), 250))
const leer = (k, d) => JSON.parse(localStorage.getItem(k) || JSON.stringify(d))

const mock = {
  productos: () => espera(PRODUCTOS),
  login: async (email, password) => {
    const u = leer('mock_usuarios', []).find((x) => x.email === email && x.password === password)
    if (!u) throw new Error('Credenciales incorrectas')
    return espera({ token: 'mock-' + u.id, usuario: { id: u.id, nombre: u.nombre, email, rol: u.rol } })
  },
  registro: async (nombre, email, password) => {
    const us = leer('mock_usuarios', [])
    if (us.some((x) => x.email === email)) throw new Error('Ese email ya está registrado')
    const u = { id: us.length + 1, nombre, email, password, rol: us.length === 0 ? 'admin' : 'empleado' }
    localStorage.setItem('mock_usuarios', JSON.stringify([...us, u]))
    return espera({ id: u.id, nombre, email, rol: u.rol })
  },
  crearPedido: async (pedido, items) => {
    const ps = leer('mock_pedidos', [])
    const p = { id: ps.length + 1, estado: 'pendiente', creado_en: new Date().toISOString(), ...pedido, items }
    localStorage.setItem('mock_pedidos', JSON.stringify([p, ...ps]))
    return espera(p)
  },
  misPedidos: () => espera(leer('mock_pedidos', [])),
}

// ---- Llamadas reales al backend ----
// Las rutas /pedidos las crearemos en el backend en la Fase 3
const real = {
  productos: () => http('/productos'),
  login: (email, password) => http('/auth/login', { method: 'POST', body: { email, password } }),
  registro: (nombre, email, password) => http('/auth/registro', { method: 'POST', body: { nombre, email, password } }),
  crearPedido: (pedido, items, token) =>
    http('/pedidos', { method: 'POST', token, body: { ...pedido, items: items.map((i) => ({ producto_id: i.id, cantidad: i.cantidad })) } }),
  misPedidos: (token) => http('/pedidos/mios', { token }),
}

export const api = USAR_API ? real : mock
export const MODO = USAR_API ? 'API real' : 'Datos de ejemplo'
