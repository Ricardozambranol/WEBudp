const dgram = require('dgram');
const mysql = require('mysql2');
const https = require('https');
const dotenv = require('dotenv');
// Configuración del socket UDP

dotenv.config(); // Cargar variables de entorno desde .env

const IP = '0.0.0.0'; // Escucha en todas las interfaces de red
const PUERTO = process.env.UDP_PORT;
// Configuración de la base de datos MySQL
const conexionDB = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

// Crear la tabla si no existe
function crearTabla() {
  conexionDB.query(`
    CREATE TABLE IF NOT EXISTS mensajes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      remitente VARCHAR(255),
      mensaje TEXT,
      fecha DATE,
      hora TIME,
      latitud DECIMAL(12, 10),
      longitud DECIMAL(12, 10)
    )
  `, (error) => {
    if (error) {
      console.error('Error al crear la tabla:', error);
    }
  });
}

// Función para extraer datos del mensaje y formatearlos
function formatearMensaje(mensaje) {
  // El mensaje tiene el formato: "FH: 09/09/2023 18:53:49 Lat: 10.993603506967576 Lon: -74.82182298606484 Alt: 122.0"
  const partes = mensaje.split(' ');

  // Extraer la fecha, la hora y las partes de latitud y longitud
  const fechaParte = partes[1];
  const horaParte = partes[2];
  const latitudParte = partes[4];
  const longitudParte = partes[6];

  // Extraer la fecha y la hora de las partes correspondientes
  const fecha = fechaParte; // Obtener solo la fecha
  const hora = horaParte.split(' ')[0]; // Obtener solo la hora

  return {
    fecha,
    hora,
    latitud: parseFloat(latitudParte),
    longitud: parseFloat(longitudParte),
  };
}

// Insertar un mensaje en la base de datos
function insertarMensaje(remitente, mensaje) {
  const datosFormateados = formatearMensaje(mensaje);

  if (datosFormateados) { // Verificar que los datos sean válidos
    // Formatear la fecha antes de insertarla en la base de datos
    const fechaFormateada = datosFormateados.fecha.split('/').reverse().join('-');

    conexionDB.query(
      'INSERT INTO mensajes (remitente, mensaje, fecha, hora, latitud, longitud) VALUES (?, ?, ?, ?, ?, ?)',
      [
        remitente,
        mensaje,
        fechaFormateada,
        datosFormateados.hora,
        datosFormateados.latitud,
        datosFormateados.longitud,
      ],
      (error) => {
        if (error) {
          console.error('Error al insertar el mensaje en la base de datos:', error);
        } else {
          console.log('Mensaje almacenado en la base de datos:', mensaje);
          console.log();
        }
      }
    );
  }
}

// Crear el servidor UDP
const udpServer = dgram.createSocket('udp4');

udpServer.on('error', (err) => {
  console.error(`Error en el servidor UDP: ${err.stack}`);
  udpServer.close();
});

udpServer.on('message', (message, remote) => {
  const remitente = remote.address;
  const mensaje = message.toString('utf8');
  // Almacenar el mensaje en la base de datos MySQL
  insertarMensaje(remitente, mensaje);
});

udpServer.bind(PUERTO, IP);

crearTabla(); // Asegurarse de que la tabla exista

// Obtener la dirección IP pública
function obtenerDireccionIPPUBLICA() {
  https.get('https://api.ipify.org?format=json', (response) => {
    let data = '';

    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      try {
        const ipAddress = JSON.parse(data).ip;
        console.log(`Servidor UDP en ejecución. Esperando mensajes en ${ipAddress}:${PUERTO}`);
      } catch (error) {
        console.error('Error al obtener la dirección IP pública:', error);
      }
    });
  }).on('error', (error) => {
    console.error('Error al obtener la dirección IP pública:', error);
  });
}

udpServer.on('message', (message, remote) => {
  const remitente = remote.address;
  const mensaje = message.toString('utf8');
  console.log('Mensaje recibido:', mensaje); // Esta línea imprime el mensaje recibido en la consola
  // Almacenar el mensaje en la base de datos MySQL
  insertarMensaje(remitente, mensaje);
});


obtenerDireccionIPPUBLICA();
