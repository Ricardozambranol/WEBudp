const dgram = require('dgram');
const mysql = require('mysql2');

// Use dynamic import() for the 'node-fetch' module to make it work in CommonJS
let fetch;

try {
  const { default: fetchModule } = require('node-fetch');
  fetch = fetchModule;
} catch (error) {
  // If require() fails (e.g., in a module environment), fall back to using a dummy fetch function
  fetch = async () => {
    throw new Error("fetch is not available in this environment.");
  };
}

// Rest of your code remains the same...

// Create the UDP server and handle messages
const udpServer = dgram.createSocket('udp4');

// Error and message handling code...

// Bind the UDP server to the specified IP and port
udpServer.bind(PUERTO, IP);

// Ensure that the database table exists
crearTabla();

// Fetch the public IP address using an async function
async function getPublicIPAddress() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error al obtener la dirección IP pública:', error);
    return null;
  }
}

// Use the async function to get the IP address
getPublicIPAddress()
  .then((ipAddress) => {
    if (ipAddress) {
      console.log(`Servidor UDP en ejecución. Esperando mensajes en ${ipAddress}:${PUERTO}`);
    }
  });
