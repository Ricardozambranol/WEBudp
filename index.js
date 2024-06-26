const express = require('express');
const http = require('http');
const mysql = require('mysql2');
const path = require('path');
const WebSocket = require('ws');
const { spawn } = require('child_process'); // Importa el módulo child_process
const dotenv = require('dotenv');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Configuración de la conexión a la base de datos RDS MySQL
dotenv.config(); // Cargar variables de entorno desde .env

const conexionDB = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

// Ahora puedes usar conexionDB para interactuar con tu base de datos


conexionDB.connect((error) => {
  if (error) {
    console.error('Error al conectar a la base de datos:', error);
    return;
  }
});

let lastSentMessage = null;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/about.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/data.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'data.html'));
});

app.get('/time.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'time.html'));
});

app.get('/position.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'position.html'));
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
        }
      }
    });
  }, 100);

  req.on('close', () => {
    clearInterval(interval);
  });
});

// Agrega esta ruta para manejar la solicitud de filtrado
// Agrega esta ruta para manejar la solicitud de filtrado por rango de fechas y horas
app.get('/filterData', (req, res) => {
  const fechaInicio = req.query.fechaInicio;
  const horaInicio = req.query.horaInicio;
  const fechaFin = req.query.fechaFin;
  const horaFin = req.query.horaFin;

  console.log('Fecha de Inicio:', fechaInicio, 'Hora de Inicio:', horaInicio, 'Fecha de Fin:', fechaFin, 'Hora de Fin:', horaFin);
  console.log();

  const query = `
    SELECT fecha, hora, latitud, longitud
    FROM mensajes
    WHERE CONCAT(fecha, ' ', hora) >= ? AND CONCAT(fecha, ' ', hora) <= ?
  `;

  conexionDB.query(query, [`${fechaInicio} ${horaInicio}`, `${fechaFin} ${horaFin}`], (error, resultados) => {
    if (error) {
      console.error('Error al obtener datos filtrados:', error);
      res.status(500).send('Error al obtener datos filtrados');
      return;
    }

    res.json(resultados);
  });
});


app.get('/filterdataposition', (req, res) => {
  const fechaInicio = req.query.fechaInicio;
  const horaInicio = req.query.horaInicio;
  const fechaFin = req.query.fechaFin;
  const horaFin = req.query.horaFin;

  const latitudMin = req.query.latitudMin;
  const latitudMax = req.query.latitudMax;
  const longitudMin = req.query.longitudMin;
  const longitudMax = req.query.longitudMax;  
  console.log('Fecha de Inicio:', fechaInicio, 'Hora de Inicio:', horaInicio, 'Fecha de Fin:', fechaFin, 'Hora de Fin:', horaFin, 'longitud', longitudMin, longitudMax, 'latitud ',latitudMin, latitudMax);
  console.log();

  
  const query = `
    SELECT fecha, hora, latitud, longitud
    FROM mensajes
    WHERE CONCAT(fecha, ' ', hora) >= ? AND CONCAT(fecha, ' ', hora) <= ?
  `;

  conexionDB.query(query, [`${fechaInicio} ${horaInicio}`, `${fechaFin} ${horaFin}`], (error, resultados) => {
    if (error) {
      console.error('Error al obtener datos filtrados por fecha y hora:', error);
      res.status(500).send('Error al obtener datos filtrados por fecha y hora');
      return;
    }

    console.log('Resultados antes del filtrado por coordenadas:', resultados);

    // Ahora, vamos a filtrar los resultados por latitud y longitud
      

    const resultadosFiltrados = resultados.filter((registro) => {
      const latitud = parseFloat(registro.latitud); // Convertir la latitud a número
      const longitud = parseFloat(registro.longitud); // Convertir la longitud a número
   
      return (
        !isNaN(latitud) && // Verificar si la conversión fue exitosa
        !isNaN(longitud) && // Verificar si la conversión fue exitosa
        latitud >= parseFloat(latitudMin) &&
        latitud <= parseFloat(latitudMax) &&
        longitud >= parseFloat(longitudMin) &&
        longitud <= parseFloat(longitudMax)
      );
    });
    
    console.log('Resultados después del filtrado por coordenadas:', resultadosFiltrados);

    res.json(resultadosFiltrados);
  });
});




const puerto = 80;
server.listen(puerto, () => {
  console.log(`Servidor web en ejecución`);
});
// Inicia el servidor UDP como un proceso secundario
const udpServerProcess = spawn('node', ['udp-listener.js'], { stdio: 'inherit' });

udpServerProcess.on('exit', (code, signal) => {
  console.log(`Proceso del servidor UDP finalizado con código: ${code} y señal: ${signal}`);
});
