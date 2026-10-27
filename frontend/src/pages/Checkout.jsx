import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../services/api'

function validar(f) {
  const e = {}
  if (f.nombre.trim().length < 3) e.nombre = 'Ingresa tu nombre completo (mínimo 3 letras)'
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Correo electrónico no válido'
  if (!/^9\d{8}$/.test(f.telefono)) e.telefono = 'Celular de 9 dígitos que empiece con 9'
  if (f.direccion.trim().length < 5) e.direccion = 'Ingresa una dirección de entrega válida'
  return e
}

export default function Checkout() {
  const { sesion, carrito, total, vaciar } = useApp()
  const nav = useNavigate()
  const [f, setF] = useState({ nombre: sesion.usuario.nombre, email: sesion.usuario.email, telefono: '', direccion: '' })
  const [errores, setErrores] = useState({})
  const [error, setError] = useState('')

  const cambiar = (e) => setF({ ...f, [e.target.name]: e.target.value })

  const enviar = async (e) => {
    e.preventDefault()
    const errs = validar(f)
    setErrores(errs)
    if (Object.keys(errs).length) return
    try {
      await api.crearPedido(f, carrito, sesion.token)
      vaciar()
      nav('/pedidos')
    } catch (err) { setError(err.message) }
  }

  if (carrito.length === 0) return <p>Tu carrito está vacío.</p>

  return (
    <>
      <h2>Finalizar pedido</h2>
      <form onSubmit={enviar} noValidate>
        {['nombre', 'email', 'telefono', 'direccion'].map((c) => (
          <label key={c}>
            {c[0].toUpperCase() + c.slice(1)}
            <input name={c} value={f[c]} onChange={cambiar} />
            {errores[c] && <span className="error">{errores[c]}</span>}
          </label>
        ))}
        <h3>Total a pagar: S/ {total.toFixed(2)}</h3>
        {error && <p className="error">{error}</p>}
        <button type="submit">Confirmar pedido</button>
      </form>
    </>
  )
}
