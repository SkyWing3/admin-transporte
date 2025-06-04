const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Servir archivos estáticos de "public/"
app.use(express.static(path.join(__dirname, "public")));

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
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
