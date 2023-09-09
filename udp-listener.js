const dgram = require('dgram');

const udpServer = dgram.createSocket('udp4');

udpServer.on('error', (err) => {
  console.error(`Error en el servidor UDP: ${err.stack}`);
  udpServer.close();
});

udpServer.on('message', (message, remote) => {
  const data = message.toString('utf8');
  console.log(`Mensaje UDP recibido: ${data} from ${remote.address}:${remote.port}`);
});

udpServer.bind(25565); // Puerto UDP 25565

console.log('Servidor UDP en ejecución. Esperando mensajes...');