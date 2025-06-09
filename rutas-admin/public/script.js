/* eslint-disable no-undef */
/**
 * script.js
 * --- 1) GET SIMON para rutas y paradas
 *     2) POST Django-DRF para crear rutas, paradas, coordenadas, paradaruta
 *     3) NUEVO: alternar entre SIMON y API, seleccionar paradas de API y enviar lista con Axios
 */

// ——————————————————————————————————————————————
//  A) CONFIGURACIÓN BÁSICA DEL MAPA (sin cambios)
// ——————————————————————————————————————————————
const mapConfig = { minZoom: 7, maxZoom: 18, zoomControl: false };
const initialZoom = 18;
const initialLat = -16.498797;
const initialLng = -68.140700;
const map = L.map("map", mapConfig).setView([initialLat, initialLng], initialZoom);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);
L.control.zoom({ position: "topright" }).addTo(map);
map.pm.addControls({
  position: "topleft",
  drawMarker: true,
  drawPolygon: true,
  drawPolyline: true,
  drawCircle: true,
  editPolygon: true,
  deleteLayer: true,
});
const simonStopsGroup = L.featureGroup().addTo(map);
const apiStopsGroup = L.featureGroup();
const token = localStorage.getItem('authToken');

// ——————————————————————————————————————————————
//  B) ELEMENTOS DEL DOM (sin cambios)
// ——————————————————————————————————————————————
const dataSourceSelect = document.getElementById("data-source-select");
const rutasSelect = document.getElementById("rutas-select");
const sentidoSelect = document.getElementById("sentido-select");
const btnRefrescarParadas = document.getElementById("btn-refrescar-paradas");
const btnEnviarParadas = document.getElementById("btn-enviar-paradas");
const btnDibujarApi = document.getElementById("btn-dibujar-api");
let selectedParadaIds = [];

// ——————————————————————————————————————————————
//  C) ENDPOINT REAL DE NODE
//     Ya no usamos mockAdapter; apuntamos directo al servidor Node en localhost:3000
// ——————————————————————————————————————————————
const ENDPOINT_URL = "http://localhost:3000/axios/paradas";

// ——————————————————————————————————————————————
//  D) LÓGICA DE “CAMBIO DE FUENTE DE DATOS” (sin cambios)
// ——————————————————————————————————————————————
function showSimonControls() {
  rutasSelect.style.display = "";
  sentidoSelect.style.display = "";
  btnRefrescarParadas.style.display = "";
  btnEnviarParadas.style.display = "none";
  btnDibujarApi.style.display = "none";
}
function showApiControls() {
  rutasSelect.style.display = "";
  sentidoSelect.style.display = "none";
  btnRefrescarParadas.style.display = "none";
  btnEnviarParadas.style.display = "";
  btnDibujarApi.style.display = "";
}
dataSourceSelect.addEventListener("change", () => {
  const source = dataSourceSelect.value;
  simonStopsGroup.clearLayers();
  apiStopsGroup.clearLayers();
  selectedParadaIds = [];
  if (source === "SIMON") {
    showSimonControls();
    fetchRutasSimon();
  } else if (source === "API") {
    showApiControls();
    fetchRutasAPI();
  }
});
if (dataSourceSelect.value === "API") {
  showApiControls();
  fetchRutasAPI();
} else {
  showSimonControls();
  fetchRutasSimon();
}

// ——————————————————————————————————————————————
//  E) FUNCIONES PARA GET SIMON (idénticas a tu código original)
// ——————————————————————————————————————————————
async function fetchRutasSimon() {
  try {
    const response = await fetch("http://simon.lapaz.bo/simonApp/Lista_Rutas.php");
    if (!response.ok) throw new Error(`SIMON rutas HTTP ${response.status}`);
    const rutas = await response.json();
    rutasSelect.innerHTML = '<option value="">-- Seleccione ruta --</option>';
    rutas.forEach(ruta => {
      const opt = document.createElement("option");
      opt.value = ruta.rt_id;
      opt.textContent = ruta.rt_nombre.trim();
      rutasSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Error al cargar rutas SIMON:", err);
    rutasSelect.innerHTML = '<option value="">-- Error cargando rutas --</option>';
  }
}

async function fetchRutasAPI() {
  try {
    const resp = await fetch("http://127.0.0.1:8000/api/rutas/", {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`
      }
    });
    if (!resp.ok) throw new Error(`DRF GET rutas HTTP ${resp.status}`);
    const rutas = await resp.json();
    rutasSelect.innerHTML = '<option value="">-- Seleccione ruta --</option>';
    rutas.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id_ruta_puma;
      opt.textContent = r.nombre;
      rutasSelect.appendChild(opt);
    });
  } catch (err) {
    console.error('Error al cargar rutas desde API:', err);
    rutasSelect.innerHTML = '<option value="">-- Error cargando rutas --</option>';
  }
}
async function fetchParadasSimon(rutaId, sentido) {
  if (!rutaId || (sentido !== 1 && sentido !== 2)) {
    simonStopsGroup.clearLayers();
    return;
  }
  simonStopsGroup.clearLayers();
  try {
    const payload = { ruta: rutaId, sentido: sentido };
    const response = await fetch(
      "http://simon.lapaz.bo/simonApp/ListaParadasAppLPB2.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`SIMON paradas HTTP ${response.status} – ${text}`);
    }
    const paradas = await response.json();
    if (!Array.isArray(paradas) || paradas.length === 0) {
      alert("SIMON: No se encontraron paradas para esa ruta/sentido.");
      return;
    }
    paradas.forEach(p => {
      const latP = parseFloat(p.latitud);
      const lngP = parseFloat(p.longitud);
      const nombre = p.name_parada || "Parada sin nombre";
      const orden = p.pro_orden || "-";
      const marker = L.marker([latP, lngP], { title: nombre })
        .bindPopup(`<strong>${nombre}</strong><br/>Orden: ${orden}`)
        .addTo(simonStopsGroup);
      marker.paradaData = p;
      marker.pm.enable({ draggable: true });
    });
    const bounds = simonStopsGroup.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.2));
    }
  } catch (err) {
    console.error("Error al obtener paradas SIMON:", err);
    alert("No se pudo cargar las paradas desde SIMON.");
  }
}
btnRefrescarParadas.addEventListener("click", () => {
  const rutaId = parseInt(rutasSelect.value, 10);
  const sentido = parseInt(sentidoSelect.value, 10);
  fetchParadasSimon(rutaId, sentido);
});

btnDibujarApi.addEventListener('click', () => {
  const rutaId = parseInt(rutasSelect.value, 10);
  if (!rutaId) {
    alert('Selecciona una ruta.');
    return;
  }
  cargarParadasDesdeAPIRuta(rutaId);
});

// ——————————————————————————————————————————————
//  F) FUNCIONES PARA POST Django-DRF (idénticas a tu código original)
// ——————————————————————————————————————————————
async function crearRutaDRF(nombreRuta, sentidoTexto) {
  const payload = { nombre: nombreRuta, sentido: sentidoTexto, estado: true };
  const resp = await fetch("http://127.0.0.1:8000/api/rutas/", {
    method: "POST",
    headers: { "Content-Type": "application/json", 'Authorization': `Token ${token}` },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`DRF crearRuta HTTP ${resp.status} – ${txt}`);
  }
  return await resp.json();
}
async function obtenerCoordenadaSiExisteDRF(lat, lng) {
  const url = `/coordenadas/?latitud=${encodeURIComponent(lat)}&longitud=${encodeURIComponent(lng)}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    console.warn("DRF GET coordenada falló", resp.status);
    return null;
  }
  const arr = await resp.json();
  if (Array.isArray(arr) && arr.length > 0) {
    return arr[0];
  }
  return null;
}
async function crearCoordenadaDRF(lat, lng) {
  const payload = { latitud: lat, longitud: lng };
  const resp = await fetch("http://127.0.0.1:8000/api/coordenadas/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`DRF crearCoordenada HTTP ${resp.status} – ${txt}`);
  }
  return await resp.json();
}
async function crearParadaDRF(lat, lng, nombreParada, direccionParada) {
  const payload = {
    latitud: lat,
    longitud: lng,
    nombre: nombreParada,
    direccion: direccionParada,
    estado: true,
  };
  const resp = await fetch("http://127.0.0.1:8000/api/paradas/", {
    method: "POST",
    headers: { "Content-Type": "application/json", 'Authorization': `Token ${token}` },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`DRF crearParada HTTP ${resp.status} – ${txt}`);
  }
  return await resp.json();
}
async function crearParadaRutaDRF(rutaId, paradaId, orden, tiempo, idCoordenada) {
  const payload = {
    ruta: rutaId,
    parada: paradaId,
    orden: orden,
    tiempo: tiempo,
    id_coordenada: idCoordenada,
  };
  const resp = await fetch("http://127.0.0.1:8000/api/parada-ruta/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`DRF crearParadaRuta HTTP ${resp.status} – ${txt}`);
  }
  return await resp.json();
}

// ——————————————————————————————————————————————
//  G) FLUJO “DRAW POLYLINE” → CREAR RUTA+PARADAS+COORDENADAS+PARADARUTA
//     (idéntico a tu código original)
// ——————————————————————————————————————————————
map.on("pm:create", async function (e) {
  if (!(e.layer instanceof L.Polyline)) return;
  const layer = e.layer;
  const simonRutaId = parseInt(rutasSelect.value, 10);
  if (!simonRutaId) {
    alert("Primero selecciona una ruta en el desplegable.");
    map.removeLayer(layer);
    return;
  }
  const simonRutaNombre = rutasSelect.options[rutasSelect.selectedIndex].text.trim();
  const sentidoNum = parseInt(sentidoSelect.value, 10);
  if (![1, 2].includes(sentidoNum)) {
    alert("Selecciona un sentido válido (1 o 2).");
    map.removeLayer(layer);
    return;
  }
  const sentidoTexto = sentidoNum === 1 ? "IDA" : "VUELTA";
  try {
    const nombreRuta = `${simonRutaNombre} (${sentidoTexto})`;
    const rutaCreada = await crearRutaDRF(nombreRuta, sentidoTexto);
    const idRutaPumaCreada = rutaCreada.id_ruta_puma;
    const latlngs = layer.getLatLngs();
    let ordenParada = 1;
    for (let i = 0; i < latlngs.length; i++) {
      const { lat: latP, lng: lngP } = latlngs[i];
      const puntoDibujado = L.latLng(latP, lngP);
      const umbralMetros = 3;
      let coordExistente = await crearCoordenadaDRF(latP, lngP);
      for (const marker of simonStopsGroup.getLayers()) {
        const paradaLatLng = marker.getLatLng();
        const distancia = paradaLatLng.distanceTo(puntoDibujado);
        if (distancia <= umbralMetros) {
          const idCoordenadaUsada = coordExistente.id_coordenada;
          const paradaObj = marker.paradaData;
          const paradaCreada = await crearParadaDRF(latP, lngP, paradaObj.name_parada, paradaObj.name_parada);
          const idParadaCreada = paradaCreada.id_parada;
          await crearParadaRutaDRF(idRutaPumaCreada, idParadaCreada, ordenParada, 0, idCoordenadaUsada);
          ordenParada += 1;
        }
      }
    }
    alert("✅ Se creó ruta + paradas + coordenadas + paradaruta en tu API DRF.");
  } catch (err) {
    console.error("Error al crear recursos en DRF:", err);
    alert("❌ Hubo un error al guardar en la base de datos. Revisa la consola.");
  }
});

// ——————————————————————————————————————————————
//  H) NUEVAS FUNCIONES PARA “MODO API”: CARGAR PARADAS Y SELECCIONARLAS
// ——————————————————————————————————————————————
async function cargarParadasDesdeAPI() {
  try {
    const resp = await fetch("http://127.0.0.1:8000/api/paradas/", {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`
      }
    });
    if (!resp.ok) throw new Error(`DRF GET paradas HTTP ${resp.status}`);
    const paradas = await resp.json();
    apiStopsGroup.clearLayers();
    paradas.forEach((p) => {
      const latP = parseFloat(p.latitud);
      const lngP = parseFloat(p.longitud);
      const nombre = p.nombre || "Parada sin nombre";
      const idParada = p.id_parada;
      const marker = L.marker([latP, lngP], { title: nombre, opacity: 1 }).addTo(apiStopsGroup);
      marker.paradaId = idParada;
      marker.bindPopup(`<strong>${nombre}</strong><br/>ID: ${idParada}`);
      marker.on("click", () => {
        const idx = selectedParadaIds.indexOf(idParada);
        if (idx === -1) {
          selectedParadaIds.push(idParada);
          marker.setOpacity(0.5);
        } else {
          selectedParadaIds.splice(idx, 1);
          marker.setOpacity(1);
        }
      });
    });
    apiStopsGroup.addTo(map);
    const bounds = apiStopsGroup.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.2));
    }
  } catch (err) {
    console.error("Error al cargar paradas desde API:", err);
    alert("No se pudieron cargar las paradas desde tu API.");
  }
}

async function cargarParadasDesdeAPIRuta(rutaId) {
  if (!rutaId) {
    apiStopsGroup.clearLayers();
    return;
  }
  try {
    const resp = await fetch(`http://127.0.0.1:8000/api/rutas/${rutaId}/paradas/`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`
      }
    });
    if (!resp.ok) throw new Error(`DRF GET paradas ruta HTTP ${resp.status}`);
    const paradas = await resp.json();
    apiStopsGroup.clearLayers();
    paradas.forEach(p => {
      const latP = parseFloat(p.latitud);
      const lngP = parseFloat(p.longitud);
      const nombre = p.nombre || 'Parada sin nombre';
      const idParada = p.id_parada;
      const marker = L.marker([latP, lngP], { title: nombre, opacity: 1 }).addTo(apiStopsGroup);
      marker.paradaId = idParada;
      marker.bindPopup(`<strong>${nombre}</strong><br/>ID: ${idParada}`);
    });
    apiStopsGroup.addTo(map);
    const bounds = apiStopsGroup.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.2));
    }
  } catch (err) {
    console.error('Error al cargar paradas de la ruta:', err);
    alert('No se pudieron cargar las paradas de la ruta.');
  }
}

// ——————————————————————————————————————————————
//  I) BOTÓN “Enviar paradas” (solo en modo API)
//     → Aquí hacemos POST real al endpoint de Node en /paradas_mock
// ——————————————————————————————————————————————
btnEnviarParadas.addEventListener("click", () => {
  /*if (selectedParadaIds.length === 0) {
    alert("No hay paradas seleccionadas para enviar.");
    return;
  }*/
  axios
    .post(ENDPOINT_URL, { parada_id: selectedParadaIds })
    .then((response) => {
      alert("✅ Se actualizó la lista en el endpoint real con éxito.");
      console.log("Respuesta del endpoint real:", response.data);
      // Limpiar selección visual en el mapa
      apiStopsGroup.eachLayer((marker) => {
        marker.setOpacity(1);
      });
      selectedParadaIds = [];
    })
    .catch((error) => {
      console.error("Error al actualizar el endpoint real:", error);
      alert("❌ Hubo un error al actualizar la lista en el endpoint real.");
    });
});
