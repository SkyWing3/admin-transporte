/* eslint-disable no-undef */
/**
 * leaflet-geoman + conexión a SIMON API para rutas y paradas
 */

// 1) CONFIGURACIÓN BÁSICA DEL MAPA
let config = {
  minZoom: 7,
  maxZoom: 18,
  zoomControl: false, // zoom control off
};
const zoom = 18;
const lat = -16.498797;
const lng = -68.140700;

const map = L.map("map", config).setView([lat, lng], zoom);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

L.control.zoom({ position: "topright" }).addTo(map);

const options = {
  position: "topleft",
  drawMarker: true,
  drawPolygon: true,
  drawPolyline: true,
  drawCircle: true,
  editPolygon: true,
  deleteLayer: true,
};
map.pm.addControls(options);

// — Aquí cambiamos LayerGroup por FeatureGroup —
const stopsLayerGroup = L.featureGroup().addTo(map);

// 2) ELEMENTOS DEL DOM
const rutasSelect = document.getElementById("rutas-select");
const sentidoSelect = document.getElementById("sentido-select");

// 3) FUNCIONES PARA CONSUMIR LA API

/**
 * Obtiene la lista de rutas y llena el SELECT.
 */
async function fetchRutas() {
  try {
    const response = await fetch("http://simon.lapaz.bo/simonApp/Lista_Rutas.php");
    if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
    const rutas = await response.json();
    // Limpiamos el select (excepto la primera opción)
    rutasSelect.innerHTML = '<option value="">-- Seleccione ruta --</option>';
    rutas.forEach((ruta) => {
      const opt = document.createElement("option");
      opt.value = ruta.rt_id;
      opt.textContent = ruta.rt_nombre.trim();
      rutasSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Error al obtener rutas:", err);
    alert("No se pudo cargar la lista de rutas.");
  }
}

/**
 * Dado un id de ruta y sentido (1 o 2), pide la lista de paradas
 * y las pinta en el mapa como marcadores arrastrables.
 *
 * @param {number} rutaId
 * @param {number} sentido  // 1 = ida, 2 = vuelta
 */
async function fetchParadas(rutaId, sentido) {
  if (!rutaId || (sentido !== 1 && sentido !== 2)) {
    stopsLayerGroup.clearLayers();
    return;
  }

  // Limpiar marcadores anteriores
  stopsLayerGroup.clearLayers();

  try {
    const payload = {
      ruta: rutaId,
      sentido: sentido,
    };
    const response = await fetch(
      "http://simon.lapaz.bo/simonApp/ListaParadasAppLPB2.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Error HTTP ${response.status} - ${text}`);
    }
    const paradas = await response.json();

    if (!Array.isArray(paradas) || paradas.length === 0) {
      alert("No se encontraron paradas para esta ruta/sentido.");
      return;
    }

    // Recorremos todas las paradas y agregamos un marcador
    paradas.forEach((p) => {
      const latP = parseFloat(p.latitud);
      const lngP = parseFloat(p.longitud);
      const nombre = p.name_parada;

      const marker = L.marker([latP, lngP], {
        title: nombre,
      });

      marker.bindPopup(`<strong>${nombre}</strong><br/>Orden: ${p.pro_orden}`);

      // Hacer que el marcador sea arrastrable/editarle posición
      marker.pm.enable({ draggable: true });

      stopsLayerGroup.addLayer(marker);
    });

    // Ajustar el zoom/centrado para que se vean todas las paradas
    const bounds = stopsLayerGroup.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.2));
    }
  } catch (err) {
    console.error("Error al obtener paradas:", err);
    alert("No se pudo cargar las paradas de la ruta seleccionada.");
  }
}

// 4) EVENTOS: cuando cambie la ruta o el sentido, recargamos paradas
function onSelectionChange() {
  const rutaId = parseInt(rutasSelect.value, 10);
  const sentido = parseInt(sentidoSelect.value, 10);
  fetchParadas(rutaId, sentido);
}

rutasSelect.addEventListener("change", onSelectionChange);
sentidoSelect.addEventListener("change", onSelectionChange);

// 5) Inicializamos la carga de rutas al arrancar la página
fetchRutas();

// Opcional: escuchar eventos de edición de marcadores
map.on("pm:edit", (e) => {
  if (e.layer instanceof L.Marker) {
    const { lat, lng } = e.layer.getLatLng();
    console.log("Marcador editado. Nueva posición:", lat, lng);
    // Aquí podrías enviar un PUT/PATCH a tu propio servidor para persistir la edición.
  }
});
