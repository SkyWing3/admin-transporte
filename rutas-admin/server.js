// server.js
// ----------
// Servidor Express que expondrá un endpoint real para GET/POST de las paradas
// y además servirá los archivos estáticos (index.html, style.css, script.js).

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Middleware para parsear JSON en los cuerpos de POST
app.use(bodyParser.json());

// Variable en memoria para “guardar” la lista de paradas seleccionadas.
// Inicialmente vacía.
let paradasSeleccionadas = [];

// 1) GET /paradas_mock
//    Devuelve JSON { "parada_id": [ … ] } con la lista actual.
app.get('/axios/paradas', (req, res) => {
  return res.json({ parada_id: paradasSeleccionadas });
});

// 2) POST /paradas_mock
//    Espera body { "parada_id": [ … ] }. Si es un arreglo, lo guarda y responde.
app.post('/axios/paradas', (req, res) => {
  const nuevaLista = req.body.parada_id;
  if (!Array.isArray(nuevaLista)) {
    return res
      .status(400)
      .json({ error: 'parada_id debe ser un arreglo de enteros' });
  }
  paradasSeleccionadas = nuevaLista;
  return res.json({ parada_id: paradasSeleccionadas });
});

// 2. Montar la carpeta de Leaflet (node_modules/leaflet/dist) en /leaflet
app.use(
  "/leaflet",
  express.static(
    path.join(__dirname, "node_modules", "leaflet", "dist")
  )
);

// 3. Montar la carpeta de Geoman (node_modules/@geoman-io/leaflet-geoman-free/dist) en /geoman
app.use(
  "/geoman",
  express.static(
    path.join(
      __dirname,
      "node_modules",
      "@geoman-io",
      "leaflet-geoman-free",
      "dist"
    )
  )
);

// 4. Ruta principal: servir index.html (Express hará esto automáticamente porque index.html está en public/)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// 3) Servir archivos estáticos (index.html, style.css, script.js, etc.)
app.use(express.static(path.join(__dirname, "public")));

// 4) Poner a escuchar en el puerto 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});



