import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { admin } from '../services/admin'
import { http } from '../services/api'

const VACIO = { nombre: '', categoria: '', precio: '', stock: '' }

function Productos({ token, avisar }) {
  const [lista, setLista] = useState([])
  const [f, setF] = useState(VACIO)
  const [editId, setEditId] = useState(null)

  const cargar = () => admin.productos().then(setLista).catch((e) => avisar(e.message))
  useEffect(() => { cargar() }, [])

  const guardar = async (e) => {
    e.preventDefault()
    const cuerpo = { ...f, precio: Number(f.precio), stock: Number(f.stock) }
    try {
      if (editId) await admin.editarProducto(editId, cuerpo, token)
      else await admin.crearProducto(cuerpo, token)
      setF(VACIO); setEditId(null); avisar(''); cargar()
    } catch (err) { avisar(err.message) }
  }
  const borrar = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return
    try { await admin.borrarProducto(id, token); cargar() } catch (err) { avisar(err.message) }
  }
  const editar = (p) => { setEditId(p.id); setF({ nombre: p.nombre, categoria: p.categoria, precio: p.precio, stock: p.stock }) }

  return (
    <>
      <form className="fila" onSubmit={guardar}>
        {['nombre', 'categoria', 'precio', 'stock'].map((c) => (
          <input key={c} required placeholder={c} value={f[c]} onChange={(e) => setF({ ...f, [c]: e.target.value })} />
        ))}
        <button>{editId ? 'Guardar' : 'Agregar'}</button>
        {editId && <button type="button" onClick={() => { setEditId(null); setF(VACIO) }}>Cancelar</button>}
      </form>
      <table>
        <thead><tr><th>ID</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Stock</th><th></th></tr></thead>
        <tbody>{lista.map((p) => (
          <tr key={p.id}>
            <td>{p.id}</td><td>{p.nombre}</td><td>{p.categoria}</td><td>S/ {Number(p.precio).toFixed(2)}</td><td>{p.stock}</td>
            <td><button onClick={() => editar(p)}>Editar</button> <button onClick={() => borrar(p.id)}>Eliminar</button></td>
          </tr>))}
        </tbody>
      </table>
    </>
  )
}

function Usuarios({ token, avisar }) {
  const [lista, setLista] = useState([])
  const cargar = () => admin.usuarios(token).then(setLista).catch((e) => avisar(e.message))
  useEffect(() => { cargar() }, [])

  const rol = async (id, r) => { try { await admin.cambiarRol(id, r, token); avisar(''); cargar() } catch (e) { avisar(e.message) } }
  const borrar = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return
    try { await admin.borrarUsuario(id, token); avisar(''); cargar() } catch (e) { avisar(e.message) }
  }
  return (
    <table>
      <thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th></th></tr></thead>
      <tbody>{lista.map((u) => (
        <tr key={u.id}>
          <td>{u.id}</td><td>{u.nombre}</td><td>{u.email}</td>
          <td><select value={u.rol} onChange={(e) => rol(u.id, e.target.value)}><option>admin</option><option>empleado</option></select></td>
          <td><button onClick={() => borrar(u.id)}>Eliminar</button></td>
        </tr>))}
      </tbody>
    </table>
  )
}

function Pedidos({ token, avisar }) {
  const [lista, setLista] = useState([])
  const cargar = () => admin.pedidos(token).then(setLista).catch((e) => avisar(e.message))
  useEffect(() => { cargar() }, [])

  const estado = async (id, s) => { try { await admin.cambiarEstado(id, s, token); avisar(''); cargar() } catch (e) { avisar(e.message) } }
  return (
    <>
      {lista.length === 0 && <p>No hay pedidos.</p>}
      {lista.map((p) => (
        <article className="card" key={p.id}>
          <strong>Pedido #{p.id}</strong> · {p.nombre} · {p.telefono} · {p.direccion} · <b>S/ {Number(p.total).toFixed(2)}</b>
          <ul>{p.items.map((i) => <li key={i.id}>{i.cantidad} × {i.nombre}</li>)}</ul>
          Estado:{' '}
          <select value={p.estado} onChange={(e) => estado(p.id, e.target.value)}>
            {['pendiente', 'enviado', 'entregado', 'cancelado'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </article>
      ))}
    </>
  )
}

function ZonaPeligrosa({ token, avisar }) {
  const [modo, setModo] = useState('productos')
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(false)
  const [ok, setOk] = useState('')

  const ejecutar = async () => {
    const aviso = modo === 'todo'
      ? 'Se eliminarán TODAS las tablas y se cerrará tu sesión. ¿Continuar?'
      : 'Se eliminarán todos los productos y pedidos. ¿Continuar?'
    if (!confirm(aviso)) return
    setCargando(true); avisar(''); setOk('')
    try {
      const r = await http('/admin/reiniciar', {
        method: 'POST',
        token,
        body: { modo, confirmacion: texto },
      })
      setTexto('')
      if (modo === 'todo') {
        alert(r.mensaje + '\nVuelve a ejecutar el script SQL en phpMyAdmin para reinstalar.')
        localStorage.clear()
        window.location.href = '/'
      } else {
        setOk(r.mensaje)
      }
    } catch (e) {
      avisar(e.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <section className="card" style={{ border: '2px solid #c0392b' }}>
      <h3 style={{ color: '#c0392b' }}>Zona peligrosa</h3>
      <p>Estas acciones no se pueden deshacer.</p>
      <label>
        Acción:{' '}
        <select value={modo} onChange={(e) => setModo(e.target.value)}>
          <option value="productos">Vaciar productos (y pedidos)</option>
          <option value="todo">Destruir TODA la aplicación (elimina todas las tablas)</option>
        </select>
      </label>
      <p>Escribe <strong>BORRAR</strong> para confirmar:</p>
      <div className="fila">
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="BORRAR" />
        <button
          onClick={ejecutar}
          disabled={texto !== 'BORRAR' || cargando}
          style={{ background: '#c0392b', color: '#fff' }}
        >
          {cargando ? 'Ejecutando...' : 'Ejecutar'}
        </button>
      </div>
      {ok && <p style={{ color: 'green' }}>{ok}</p>}
    </section>
  )
}

export default function Admin() {
  const { sesion } = useApp()
  const [tab, setTab] = useState('productos')
  const [aviso, setAviso] = useState('')
  if (sesion?.usuario.rol !== 'admin') return <Navigate to="/" />
  const props = { token: sesion.token, avisar: setAviso }

  return (
    <>
      <h2>Panel de administración</h2>
      <div className="fila">
        {['productos', 'usuarios', 'pedidos', 'peligro'].map((t) => (
          <button key={t} className={tab === t ? '' : 'sec'} onClick={() => { setTab(t); setAviso('') }}>
            {t === 'peligro' ? 'zona peligrosa' : t}
          </button>
        ))}
      </div>
      {aviso && <p className="error">{aviso}</p>}
      {tab === 'productos' && <Productos {...props} />}
      {tab === 'usuarios' && <Usuarios {...props} />}
      {tab === 'pedidos' && <Pedidos {...props} />}
      {tab === 'peligro' && <ZonaPeligrosa {...props} />}
    </>
  )
}