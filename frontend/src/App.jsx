import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import { MODO } from './services/api'
import Catalogo from './pages/Catalogo'
import Carrito from './pages/Carrito'
import Checkout from './pages/Checkout'
import { Login, Registro } from './pages/Auth'
import Pedidos from './pages/Pedidos'
import Detalle from './pages/Detalle'
import Admin from './pages/Admin'
import Perfil from './pages/Perfil'

function Privada({ children }) {
  const { sesion } = useApp()
  return sesion ? children : <Navigate to="/login" />
}

export default function App() {
  const { sesion, setSesion, cantidadTotal } = useApp()
  const nav = useNavigate()
  const salir = () => { setSesion(null); nav('/') }

  return (
    <>
      <header className="nav">
        <strong>TiendaElectrónica</strong>
        <NavLink to="/">Catálogo</NavLink>
        <NavLink to="/carrito">Carrito ({cantidadTotal})</NavLink>
        {sesion && <NavLink to="/pedidos">Mis pedidos</NavLink>}
        {sesion && <NavLink to="/perfil">Mi perfil</NavLink>}
        {sesion?.usuario.rol === 'admin' && <NavLink to="/admin">Admin</NavLink>}
        <span className="espacio" />
        <small className="modo">{MODO}</small>
        {sesion ? (
          <>
            <span>{sesion.usuario.nombre} ({sesion.usuario.rol})</span>
            <button onClick={salir}>Salir</button>
          </>
        ) : (
          <>
            <NavLink to="/login">Ingresar</NavLink>
            <NavLink to="/registro">Registrarse</NavLink>
          </>
        )}
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Catalogo />} />
          <Route path="/producto/:id" element={<Detalle />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/checkout" element={<Privada><Checkout /></Privada>} />
          <Route path="/pedidos" element={<Privada><Pedidos /></Privada>} />
          <Route path="/perfil" element={<Privada><Perfil /></Privada>} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="*" element={<h2>Página no encontrada</h2>} />
        </Routes>
      </main>
    </>
  )
}