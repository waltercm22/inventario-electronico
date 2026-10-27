import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { useApp } from '../context/AppContext'

export default function Pedidos() {
  const { sesion } = useApp()
  const [pedidos, setPedidos] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.misPedidos(sesion.token).then(setPedidos).catch((e) => setError(e.message))
  }, [sesion.token])

  return (
    <>
      <h2>Mis pedidos</h2>
      {error && <p className="error">{error}</p>}
      {pedidos.length === 0 && !error && <p>Aún no tienes pedidos.</p>}
      {pedidos.map((p) => (
        <article className="card" key={p.id}>
          <strong>Pedido #{p.id}</strong> · {p.estado} · {new Date(p.creado_en).toLocaleDateString()}
          <ul>{(p.items || []).map((i) => <li key={i.id}>{i.cantidad} × {i.nombre}</li>)}</ul>
        </article>
      ))}
    </>
  )
}
