import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { useApp } from '../context/AppContext'

export default function Catalogo() {
  const { agregar } = useApp()
  const [productos, setProductos] = useState([])
  const [categoria, setCategoria] = useState('Todas')
  const [buscar, setBuscar] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.productos().then(setProductos).catch((e) => setError(e.message))
  }, [])

  const categorias = ['Todas', ...new Set(productos.map((p) => p.categoria))]
  const visibles = productos.filter(
    (p) => (categoria === 'Todas' || p.categoria === categoria) &&
           p.nombre.toLowerCase().includes(buscar.toLowerCase())
  )

  return (
    <>
      <h2>Catálogo</h2>
      {error && <p className="error">{error}</p>}
      <div className="filtros">
        <input placeholder="Buscar producto..." value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {categorias.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="grid">
        {visibles.map((p) => (
          <article className="card" key={p.id}>
            <small>{p.categoria}</small>
            <h3><Link to={`/producto/${p.id}`}>{p.nombre}</Link></h3>
            <p className="precio">S/ {Number(p.precio).toFixed(2)}</p>
            <p>{p.stock > 0 ? `Stock: ${p.stock}` : 'Agotado'}</p>
            <button disabled={p.stock === 0} onClick={() => agregar(p)}>Agregar al carrito</button>
          </article>
        ))}
      </div>
      {visibles.length === 0 && !error && <p>No hay productos.</p>}
    </>
  )
}
