import { createContext, useContext, useState, useEffect } from 'react'

const Ctx = createContext()
export const useApp = () => useContext(Ctx)

const guardado = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }

export function AppProvider({ children }) {
  const [sesion, setSesion] = useState(() => guardado('sesion', null)) // { token, usuario }
  const [carrito, setCarrito] = useState(() => guardado('carrito', [])) // [{...producto, cantidad}]

  useEffect(() => localStorage.setItem('sesion', JSON.stringify(sesion)), [sesion])
  useEffect(() => localStorage.setItem('carrito', JSON.stringify(carrito)), [carrito])

  const agregar = (p) =>
    setCarrito((c) => {
      const ex = c.find((i) => i.id === p.id)
      if (ex) return c.map((i) => (i.id === p.id ? { ...i, cantidad: Math.min(i.cantidad + 1, p.stock) } : i))
      return [...c, { ...p, cantidad: 1 }]
    })
  const cambiarCantidad = (id, n) =>
    setCarrito((c) => c.map((i) => (i.id === id ? { ...i, cantidad: Math.max(1, Math.min(n, i.stock)) } : i)))
  const quitar = (id) => setCarrito((c) => c.filter((i) => i.id !== id))
  const vaciar = () => setCarrito([])

  const total = carrito.reduce((s, i) => s + Number(i.precio) * i.cantidad, 0)
  const cantidadTotal = carrito.reduce((s, i) => s + i.cantidad, 0)

  return (
    <Ctx.Provider value={{ sesion, setSesion, carrito, agregar, cambiarCantidad, quitar, vaciar, total, cantidadTotal }}>
      {children}
    </Ctx.Provider>
  )
}
