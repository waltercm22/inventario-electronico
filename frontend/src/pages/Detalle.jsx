import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../services/api'
import { useApp } from '../context/AppContext'

export default function Detalle() {
  const { id } = useParams()
  const { agregar } = useApp()
  const [p, setP] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.productos()
      .then((l) => setP(l.find((x) => x.id === Number(id)) || false))
      .catch((e) => setError(e.message))
  }, [id])

  if (error) return <p className="error">{error}</p>
  if (p === false) return <p>Producto no encontrado. <Link to="/">Volver</Link></p>
  if (!p) return <p>Cargando...</p>

  return (
    <article className="card">
      <Link to="/">← Volver al catálogo</Link>
      <h2>{p.nombre}</h2>
      <p>Categoría: {p.categoria}</p>
      <p className="precio">S/ {Number(p.precio).toFixed(2)}</p>
      <p>{p.stock > 0 ? `Disponibles: ${p.stock}` : 'Agotado'}</p>
      <button disabled={p.stock === 0} onClick={() => agregar(p)}>Agregar al carrito</button>
    </article>
  )
}
