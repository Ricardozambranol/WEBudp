const express = require('express');
const http = require('http');
const path = require('path');
const dgram = require('dgram');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const udpServer = dgram.createSocket('udp4');

udpServer.on('error', (err) => {
  console.error(`Error en el servidor UDP: ${err.stack}`);
  udpServer.close();
});

udpServer.on('message', (message, remote) => {
  const data = message.toString('utf8');
  // Transmitir los datos UDP a todos los clientes WebSocket conectados
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
});

udpServer.bind(25565); // Puerto UDP 25565

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const puerto = 80;
server.listen(puerto, () => {
  console.log(`Servidor web en ejecución en http://localhost:${puerto}`);
});
