const net = require('net');

// Crear un servidor de sockets TCP
const server = net.createServer((socket) => {
  // Se ejecuta cuando un cliente se conecta al servidor
  console.log('Cliente conectado desde:', socket.remoteAddress, socket.remotePort);

  // Enviar un mensaje al cliente
  socket.write('¡Hola, cliente!\n');

  // Manejar los datos recibidos del cliente
  socket.on('data', (data) => {
    console.log('Datos recibidos del cliente:', data.toString());

    // Enviar una respuesta al cliente
    socket.write('Mensaje recibido: ' + data.toString());
  });

  // Manejar la desconexión del cliente
  socket.on('end', () => {
    console.log('Cliente desconectado');
  });
});

// Escuchar en un puerto específico (por ejemplo, puerto 8080)
const port = 25565;
server.listen(port, () => {
  console.log('Servidor de sockets escuchando en el puerto', port);
});
