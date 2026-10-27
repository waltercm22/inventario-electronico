import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { http } from '../services/api'

export default function Perfil() {
  const { sesion, setSesion } = useApp()
  const [f, setF] = useState({ nombre: '', email: '', password: '', confirmar: '' })
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  useEffect(() => {
    http('/usuarios/me', { token: sesion.token })
      .then((u) => setF((x) => ({ ...x, nombre: u.nombre, email: u.email })))
      .catch((e) => setError(e.message))
  }, [])

  const guardar = async (e) => {
    e.preventDefault()
    setError(''); setOk('')
    if (!f.nombre.trim()) return setError('El nombre es obligatorio')
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setError('El email no es válido')
    if (f.password && f.password.length < 6) return setError('La contraseña debe tener mínimo 6 caracteres')
    if (f.password !== f.confirmar) return setError('Las contraseñas no coinciden')

    const cuerpo = { nombre: f.nombre.trim(), email: f.email.trim() }
    if (f.password) cuerpo.password = f.password
    try {
      const r = await http(`/usuarios/${sesion.usuario.id}`, {
        method: 'PUT',
        token: sesion.token,
        body: cuerpo,
      })
      // Actualiza el nombre y email que se ven en el menú
      setSesion({ ...sesion, usuario: { ...sesion.usuario, nombre: cuerpo.nombre, email: cuerpo.email } })
      setOk(r.mensaje || 'Datos actualizados')
      setF((x) => ({ ...x, password: '', confirmar: '' }))
    } catch (err) { setError(err.message) }
  }

  return (
    <>
      <h2>Mi perfil</h2>
      <p>Rol: <strong>{sesion.usuario.rol}</strong></p>
      <form className="card" onSubmit={guardar}>
        <label>Nombre<input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></label>
        <label>Email<input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label>Nueva contraseña (opcional)<input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
        <label>Confirmar contraseña<input type="password" value={f.confirmar} onChange={(e) => setF({ ...f, confirmar: e.target.value })} /></label>
        <button>Guardar cambios</button>
      </form>
      {error && <p className="error">{error}</p>}
      {ok && <p style={{ color: 'green' }}>{ok}</p>}
    </>
  )
}