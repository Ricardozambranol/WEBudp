const dgram = require('dgram');
const mysql = require('mysql2');

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
      mensaje TEXT
    )
  `, (error) => {
    if (error) {
      console.error('Error al crear la tabla:', error);
    } else {
      console.log('Tabla creada o ya existente.');
    }
  });
}

// Insertar un mensaje en la base de datos
function insertarMensaje(remitente, mensaje) {
  conexionDB.query('INSERT INTO mensajes (remitente, mensaje) VALUES (?, ?)', [remitente, mensaje], (error) => {
    if (error) {
      console.error('Error al insertar el mensaje en la base de datos:', error);
    } else {
      console.log('Mensaje almacenado en la base de datos:', mensaje);
    }
  });
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
  console.log(`Mensaje UDP recibido desde ${remitente}: ${mensaje}`);

  // Almacenar el mensaje en la base de datos MySQL
  insertarMensaje(remitente, mensaje);
});

udpServer.bind(PUERTO, IP);

crearTabla(); // Asegurarse de que la tabla exista

console.log(`Servidor UDP en ejecución. Esperando mensajes en ${IP}:${PUERTO}...`);
