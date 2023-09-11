const dgram = require('dgram');
const mysql = require('mysql2');
const fetch = require('node-fetch'); // Importar el módulo node-fetch

// Configuración del socket UDP
const IP = '0.0.0.0'; // Escucha en todas las interfaces de red
const PUERTO = 25565;

// Configuración de la base de datos MySQL
const conexionDB = mysql.createConnection({
  host: 'disenobd.ceknllvmq2wx.us-east-2.rds.amazonaws.com',
  user: 'admin',
  password: '12345678',
  database: 'disenobd',
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
    console.log('Remitente:', remitente);
    console.log('Mensaje:', mensaje);
    console.log('Fecha:', datosFormateados.fecha);
    console.log('Hora:', datosFormateados.hora);
    console.log('Latitud:', datosFormateados.latitud);
    console.log('Longitud:', datosFormateados.longitud);
    console.log();

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

let ipAddress;

fetch('https://api.ipify.org?format=json')
  .then(response => response.json())
  .then(data => {
    const ipAddress = data.ip;
    console.log(`Servidor UDP en ejecución. Recibiendo mensajes en ${ipAddress}:${PUERTO}`);
  })
  .catch(error => {
    console.error('Error al obtener la dirección IP pública:', error);
});



