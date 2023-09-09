const express = require('express');
const http = require('http');
const mysql = require('mysql2');
const path = require('path');
const WebSocket = require('ws');
const { spawn } = require('child_process'); // Importa el módulo child_process

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Configuración de la conexión a la base de datos RDS MySQL
const conexionDB = mysql.createConnection({
  host: 'disenobd.ceknllvmq2wx.us-east-2.rds.amazonaws.com',
  user: 'admin',
  password: '12345678',
  database: 'disenobd',
});

// Conexión a la base de datos
conexionDB.connect((error) => {
  if (error) {
    console.error('Error al conectar a la base de datos:', error);
    return;
  }
  console.log('Conexión a la base de datos exitosa.');

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS mensajes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      remitente VARCHAR(255),
      mensaje TEXT
    )
  `;

  conexionDB.query(createTableQuery, (error) => {
    if (error) {
      console.error('Error al crear la tabla:', error);
      return;
    }
    console.log('Tabla creada o ya existente.');
  });
});

let lastSentMessage = null;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/data.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'data.html'));
});

app.get('/alldata', (req, res) => {
  conexionDB.query('SELECT * FROM mensajes', (error, resultados) => {
    if (error) {
      console.error('Error al obtener datos:', error);
      res.status(500).send('Error al obtener datos');
      return;
    }
    res.json(resultados);
  });
});

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const interval = setInterval(() => {
    conexionDB.query('SELECT remitente, mensaje FROM mensajes ORDER BY id DESC LIMIT 1', (error, resultados) => {
      if (error) {
        console.error('Error al obtener datos:', error);
        return;
      }
      if (resultados.length > 0) {
        const data = JSON.stringify(resultados[0]);
        if (data !== lastSentMessage) {
          res.write(`data: ${data}\n\n`);
          lastSentMessage = data;

          // Agrega un mensaje de confirmación
          console.log('Mensaje recibido y guardado en la base de datos:', data);

          // Envía una respuesta al cliente para confirmar que el mensaje se ha guardado
          res.write(`data: Mensaje guardado en la base de datos: ${data}\n\n`);
        }
      }
    });
  }, 1000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

const puerto = 80;
server.listen(puerto, () => {
  console.log(`Servidor web en ejecución en http://localhost:${puerto}`);
});

// Inicia el servidor UDP como un proceso secundario
const udpServerProcess = spawn('node', ['udp-listener.js'], { stdio: 'inherit' });

udpServerProcess.on('exit', (code, signal) => {
  console.log(`Proceso del servidor UDP finalizado con código: ${code} y señal: ${signal}`);
});
