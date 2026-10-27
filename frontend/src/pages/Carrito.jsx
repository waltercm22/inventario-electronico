import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Carrito() {
  const { carrito, cambiarCantidad, quitar, total } = useApp()
  if (carrito.length === 0) return <><h2>Carrito</h2><p>Está vacío. <Link to="/">Ver catálogo</Link></p></>

  return (
    <>
      <h2>Carrito</h2>
      <table>
        <thead><tr><th>Producto</th><th>Precio</th><th>Cantidad</th><th>Subtotal</th><th></th></tr></thead>
        <tbody>
          {carrito.map((i) => (
            <tr key={i.id}>
              <td>{i.nombre}</td>
              <td>S/ {Number(i.precio).toFixed(2)}</td>
              <td>
                <input type="number" min="1" max={i.stock} value={i.cantidad}
                  onChange={(e) => cambiarCantidad(i.id, Number(e.target.value))} />
              </td>
              <td>S/ {(Number(i.precio) * i.cantidad).toFixed(2)}</td>
              <td><button onClick={() => quitar(i.id)}>Quitar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Total: S/ {total.toFixed(2)}</h3>
      <Link to="/checkout"><button>Continuar al pedido</button></Link>
    </>
  )
}
