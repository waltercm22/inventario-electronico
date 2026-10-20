const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');

const API = 'http://localhost:3000/api';
const rl = readline.createInterface({ input, output });

let token = null;
let sesion = null; // { id, nombre, email, rol }

// Función auxiliar: hace la petición (con token si hay sesión) y maneja errores
async function llamar(url, opciones = {}) {
  const headers = { ...(opciones.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { ...opciones, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en la petición');
  return data;
}

const conCuerpo = (metodo, cuerpo) => ({
  method: metodo,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(cuerpo)
});

// Ejecuta una acción mostrando los errores sin cerrar el programa
async function seguro(fn) {
  try {
    await fn();
  } catch (e) {
    if (e instanceof TypeError) console.log('\nError: no se pudo conectar con el servidor. ¿Está encendido?');
    else console.log('\nError:', e.message);
  }
}

// ================= ACCESO =================
async function registrarse() {
  const nombre = await rl.question('Nombre: ');
  const email = await rl.question('Email: ');
  const password = await rl.question('Contraseña (mínimo 6 caracteres): ');
  const u = await llamar(`${API}/auth/registro`, conCuerpo('POST', { nombre, email, password }));
  console.log(`\nUsuario creado con rol "${u.rol}". Ahora inicia sesión.`);
}

async function iniciarSesion() {
  const email = await rl.question('Email: ');
  const password = await rl.question('Contraseña: ');
  const data = await llamar(`${API}/auth/login`, conCuerpo('POST', { email, password }));
  token = data.token;
  sesion = data.usuario;
  console.log(`\nBienvenido, ${sesion.nombre} (${sesion.rol})`);
}

// ================= PRODUCTOS =================
async function listar() {
  const productos = await llamar(`${API}/productos`);
  if (productos.length === 0) return console.log('\nNo hay productos registrados.');
  console.table(productos);
}

async function verUno() {
  const id = await rl.question('ID del producto: ');
  console.table([await llamar(`${API}/productos/${id}`)]);
}

async function crear() {
  const nombre = await rl.question('Nombre: ');
  const categoria = await rl.question('Categoría: ');
  const precio = Number(await rl.question('Precio: '));
  const stock = Number(await rl.question('Stock: '));
  const nuevo = await llamar(`${API}/productos`, conCuerpo('POST', { nombre, categoria, precio, stock }));
  console.log('\nProducto creado:');
  console.table([nuevo]);
}

async function actualizar() {
  const id = await rl.question('ID del producto a actualizar: ');
  const actual = await llamar(`${API}/productos/${id}`);
  console.log('\nDeja vacío y presiona Enter para mantener el valor actual.');
  const nombre = (await rl.question(`Nombre [${actual.nombre}]: `)) || actual.nombre;
  const categoria = (await rl.question(`Categoría [${actual.categoria}]: `)) || actual.categoria;
  const p = await rl.question(`Precio [${actual.precio}]: `);
  const s = await rl.question(`Stock [${actual.stock}]: `);
  const precio = p === '' ? Number(actual.precio) : Number(p);
  const stock = s === '' ? actual.stock : Number(s);
  const r = await llamar(`${API}/productos/${id}`, conCuerpo('PUT', { nombre, categoria, precio, stock }));
  console.log('\n' + r.mensaje);
}

async function eliminar() {
  const id = await rl.question('ID del producto a eliminar: ');
  const confirmar = await rl.question('¿Seguro? (s/n): ');
  if (confirmar.toLowerCase() !== 's') return console.log('Cancelado.');
  const r = await llamar(`${API}/productos/${id}`, { method: 'DELETE' });
  console.log('\n' + r.mensaje);
}

async function menuProductos() {
  while (true) {
    console.log(`
----- PRODUCTOS -----
1. Listar todos los productos
2. Buscar producto por ID
3. Registrar producto
4. Actualizar producto
5. Eliminar producto${sesion.rol === 'admin' ? '' : ' (solo admin)'}
0. Volver`);
    const opcion = await rl.question('Elige una opción: ');
    if (opcion === '0') return;
    else if (opcion === '1') await seguro(listar);
    else if (opcion === '2') await seguro(verUno);
    else if (opcion === '3') await seguro(crear);
    else if (opcion === '4') await seguro(actualizar);
    else if (opcion === '5') await seguro(eliminar);
    else console.log('Opción no válida.');
  }
}

// ================= MI PERFIL =================
async function verPerfil() {
  console.table([await llamar(`${API}/usuarios/me`)]);
}

async function actualizarPerfil() {
  console.log('\nDeja vacío y presiona Enter para mantener el valor actual.');
  const nombre = await rl.question(`Nombre [${sesion.nombre}]: `);
  const email = await rl.question(`Email [${sesion.email}]: `);
  const password = await rl.question('Nueva contraseña (opcional): ');
  const cuerpo = {};
  if (nombre) cuerpo.nombre = nombre;
  if (email) cuerpo.email = email;
  if (password) cuerpo.password = password;
  const r = await llamar(`${API}/usuarios/${sesion.id}`, conCuerpo('PUT', cuerpo));
  if (nombre) sesion.nombre = nombre;
  if (email) sesion.email = email;
  console.log('\n' + r.mensaje);
}

async function menuPerfil() {
  while (true) {
    console.log(`
----- MI PERFIL -----
1. Ver mis datos
2. Actualizar mis datos
0. Volver`);
    const opcion = await rl.question('Elige una opción: ');
    if (opcion === '0') return;
    else if (opcion === '1') await seguro(verPerfil);
    else if (opcion === '2') await seguro(actualizarPerfil);
    else console.log('Opción no válida.');
  }
}

// ================= USUARIOS (ADMIN) =================
async function listarUsuarios() {
  console.table(await llamar(`${API}/usuarios`));
}

async function crearUsuario() {
  const nombre = await rl.question('Nombre: ');
  const email = await rl.question('Email: ');
  const password = await rl.question('Contraseña (mínimo 6 caracteres): ');
  const rol = (await rl.question('Rol (admin/empleado) [empleado]: ')) || 'empleado';
  const u = await llamar(`${API}/usuarios`, conCuerpo('POST', { nombre, email, password, rol }));
  console.log(`\nUsuario creado con ID ${u.id} y rol "${u.rol}".`);
}

async function cambiarRol() {
  const id = await rl.question('ID del usuario: ');
  const rol = await rl.question('Nuevo rol (admin/empleado): ');
  const r = await llamar(`${API}/usuarios/${id}/rol`, conCuerpo('PATCH', { rol }));
  console.log('\n' + r.mensaje);
}

async function actualizarUsuario() {
  const id = await rl.question('ID del usuario a actualizar: ');
  console.log('\nDeja vacío y presiona Enter para mantener el valor actual.');
  const nombre = await rl.question('Nuevo nombre: ');
  const email = await rl.question('Nuevo email: ');
  const password = await rl.question('Nueva contraseña: ');
  const cuerpo = {};
  if (nombre) cuerpo.nombre = nombre;
  if (email) cuerpo.email = email;
  if (password) cuerpo.password = password;
  const r = await llamar(`${API}/usuarios/${id}`, conCuerpo('PUT', cuerpo));
  console.log('\n' + r.mensaje);
}

async function eliminarUsuario() {
  const id = await rl.question('ID del usuario a eliminar: ');
  const confirmar = await rl.question('¿Seguro? (s/n): ');
  if (confirmar.toLowerCase() !== 's') return console.log('Cancelado.');
  const r = await llamar(`${API}/usuarios/${id}`, { method: 'DELETE' });
  console.log('\n' + r.mensaje);
}

async function zonaPeligrosa() {
  console.log(`
!!! ZONA PELIGROSA !!!
1. Vaciar todos los productos
2. Destruir TODA la aplicación (elimina todas las tablas)
0. Cancelar`);
  const opcion = await rl.question('Elige una opción: ');
  if (opcion !== '1' && opcion !== '2') return console.log('Cancelado.');
  const confirmacion = await rl.question('Escribe BORRAR para confirmar: ');
  if (confirmacion !== 'BORRAR') return console.log('Confirmación incorrecta. Cancelado.');
  const modo = opcion === '1' ? 'productos' : 'todo';
  const r = await llamar(`${API}/admin/reiniciar`, conCuerpo('POST', { modo, confirmacion }));
  console.log('\n' + r.mensaje);
  if (modo === 'todo') {
    token = null;
    sesion = null;
    console.log('Para reinstalar, vuelve a ejecutar el script SQL en phpMyAdmin.');
  }
}

async function menuUsuarios() {
  while (token) {
    console.log(`
----- GESTIÓN DE USUARIOS (ADMIN) -----
1. Listar usuarios
2. Crear usuario
3. Cambiar rol
4. Actualizar datos de un usuario
5. Eliminar usuario
6. Zona peligrosa (vaciar / destruir)
0. Volver`);
    const opcion = await rl.question('Elige una opción: ');
    if (opcion === '0') return;
    else if (opcion === '1') await seguro(listarUsuarios);
    else if (opcion === '2') await seguro(crearUsuario);
    else if (opcion === '3') await seguro(cambiarRol);
    else if (opcion === '4') await seguro(actualizarUsuario);
    else if (opcion === '5') await seguro(eliminarUsuario);
    else if (opcion === '6') await seguro(zonaPeligrosa);
    else console.log('Opción no válida.');
  }
}

// ================= MENÚS PRINCIPALES =================
// Devuelve false si el usuario elige salir del programa
async function menuAcceso() {
  while (!token) {
    console.log(`
===== ACCESO AL SISTEMA =====
1. Iniciar sesión
2. Registrarse
0. Salir`);
    const opcion = await rl.question('Elige una opción: ');
    if (opcion === '0') return false;
    else if (opcion === '1') await seguro(iniciarSesion);
    else if (opcion === '2') await seguro(registrarse);
    else console.log('Opción no válida.');
  }
  return true;
}

// Devuelve true si el usuario elige salir del programa
async function menuPrincipal() {
  while (token) {
    console.log(`
===== INVENTARIO TIENDA ELECTRÓNICA | ${sesion.nombre} (${sesion.rol}) =====
1. Productos
2. Mi perfil${sesion.rol === 'admin' ? '\n3. Gestión de usuarios' : ''}
9. Cerrar sesión
0. Salir`);
    const opcion = await rl.question('Elige una opción: ');
    if (opcion === '0') return true;
    else if (opcion === '9') {
      token = null;
      sesion = null;
      console.log('\nSesión cerrada.');
      return false;
    }
    else if (opcion === '1') await menuProductos();
    else if (opcion === '2') await menuPerfil();
    else if (opcion === '3' && sesion.rol === 'admin') await menuUsuarios();
    else console.log('Opción no válida.');
  }
  return false;
}

async function main() {
  while (true) {
    if (!token && !(await menuAcceso())) break;
    if (await menuPrincipal()) break;
  }
  rl.close();
}

main();