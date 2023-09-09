const dgram = require('dgram');

const udpServer = dgram.createSocket('udp4');

// Importa la conexión a la base de datos desde index.js
const { conexionDB } = require('./index');

udpServer.on('error', (err) => {
  console.error(`Error en el servidor UDP: ${err.stack}`);
  udpServer.close();
});

udpServer.on('message', (message, remote) => {
  const data = message.toString('utf8');
  console.log(`Mensaje UDP recibido: ${data} from ${remote.address}:${remote.port}`);

  // Guarda el mensaje en la base de datos
  const insertQuery = `
    INSERT INTO mensajes (remitente, mensaje) VALUES (?, ?)
  `;
  
  const remitente = remote.address;
  const mensaje = data;

  conexionDB.query(insertQuery, [remitente, mensaje], (error) => {
    if (error) {
      console.error('Error al guardar el mensaje en la base de datos:', error);
    } else {
      console.log('Mensaje guardado en la base de datos:', mensaje);
    }
  });
});

udpServer.bind(25565); // Puerto UDP 25565

console.log('Servidor UDP en ejecución. Esperando mensajes...');
