import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useApp } from '../context/AppContext'

export function Login() {
  const { setSesion } = useApp()
  const nav = useNavigate()
  const [f, setF] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const enviar = async (e) => {
    e.preventDefault()
    try { setSesion(await api.login(f.email, f.password)); nav('/') }
    catch (err) { setError(err.message) }
  }
  return (
    <form onSubmit={enviar}>
      <h2>Iniciar sesión</h2>
      <label>Email<input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
      <label>Contraseña<input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
      {error && <p className="error">{error}</p>}
      <button>Ingresar</button>
    </form>
  )
}

export function Registro() {
  const nav = useNavigate()
  const [f, setF] = useState({ nombre: '', email: '', password: '' })
  const [error, setError] = useState('')

  const enviar = async (e) => {
    e.preventDefault()
    if (f.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres')
    try { await api.registro(f.nombre, f.email, f.password); nav('/login') }
    catch (err) { setError(err.message) }
  }
  return (
    <form onSubmit={enviar}>
      <h2>Crear cuenta</h2>
      <label>Nombre<input required value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></label>
      <label>Email<input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
      <label>Contraseña<input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
      {error && <p className="error">{error}</p>}
      <button>Registrarme</button>
    </form>
  )
}
