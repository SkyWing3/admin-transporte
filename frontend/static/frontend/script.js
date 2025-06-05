/* eslint-disable no-undef */
/**
 * script.js
 * --- 1) GET SIMON para rutas y paradas
 *     2) POST Django-DRF para crear rutas, paradas, coordenadas, paradaruta
 */

// ——————————————————————————————————————————————
//  A) CONFIGURACIÓN BÁSICA DEL MAPA
// ——————————————————————————————————————————————

const mapConfig = {
  minZoom: 7,
  maxZoom: 18,
  zoomControl: false,
};
const initialZoom = 18;
const initialLat = -16.498797;
const initialLng = -68.140700;

const map = L.map("map", mapConfig).setView([initialLat, initialLng], initialZoom);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

L.control.zoom({ position: "topright" }).addTo(map);

// Añadimos los controles de Geoman (Draw Polyline, etc.)
map.pm.addControls({
  position: "topleft",
  drawMarker: true,
  drawPolygon: true,
  drawPolyline: true,
  drawCircle: true,
  editPolygon: true,
  deleteLayer: true,
});

// Grupo para las **paradas SIMON** (FeatureGroup para poder hacer fitBounds luego)
const simonStopsGroup = L.featureGroup().addTo(map);

// ——————————————————————————————————————————————
//  B) ELEMENTOS DEL DOM
// ——————————————————————————————————————————————

const rutasSelect = document.getElementById("rutas-select");
const sentidoSelect = document.getElementById("sentido-select");
const btnRefrescarParadas = document.getElementById("btn-refrescar-paradas");

// ——————————————————————————————————————————————
//  C) FUNCIONES PARA GET SIMON
// ——————————————————————————————————————————————

/**
 * 1) Obtiene la lista de rutas desde SIMON:
 *    GET http://simon.lapaz.bo/simonApp/Lista_Rutas.php
 *    → Devuelve JSON con un array de objetos:
 *      [{ rt_id, rt_nombre, rt_descripcion_ida, rt_descripcion_vuelta, … }, …]
 * 2) Llena el <select id="rutas-select"> con <option value="rt_id">rt_nombre</option>
 */
async function fetchRutasSimon() {
  try {
    const response = await fetch("http://simon.lapaz.bo/simonApp/Lista_Rutas.php");
    if (!response.ok) throw new Error(`SIMON rutas HTTP ${response.status}`);
    const rutas = await response.json(); // array de objetos simulados en tu ejemplo

    // Limpiar el <select> y agregar una opción inicial vacía
    rutasSelect.innerHTML = '<option value="">-- Seleccione ruta --</option>';
    rutas.forEach((ruta) => {
      const opt = document.createElement("option");
      opt.value = ruta.rt_id; // aquí usamos rt_id (no rt_id_rutas_traccar; la clave que en tu JSON es "rt_id")
      opt.textContent = ruta.rt_nombre.trim();
      rutasSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Error al cargar rutas SIMON:", err);
    rutasSelect.innerHTML = '<option value="">-- Error cargando rutas --</option>';
  }
}

/**
 * 1) Dado un id de ruta (rt_id) y un sentido (1 o 2), hace POST a SIMON:
 *      POST http://simon.lapaz.bo/simonApp/ListaParadasAppLPB2.php
 *      BODY: { ruta: <rt_id>, sentido: <1|2> }
 *    → SIMON devuelve un array de paradas:
 *      [{ pro_geofence_id, pro_orden, pro_direccion, name_parada, latitud, longitud, … }, …]
 * 2) Vacia el grupo 'simonStopsGroup' y agrega marcadores por cada parada:
 *    - Cada marcador es editable (arrastrable) con Geoman.
 *    - Se asigna un popup con el nombre y orden.
 */
// ——————————————————————————————————————————————

// ——————————————————————————————————————————————
//  C) FUNCIONES PARA GET SIMON
// ——————————————————————————————————————————————

async function fetchParadasSimon(rutaId, sentido) {
  if (!rutaId || (sentido !== 1 && sentido !== 2)) {
    simonStopsGroup.clearLayers();
    return;
  }
  simonStopsGroup.clearLayers();

  try {
    const payload = { ruta: rutaId, sentido: sentido };
    const response = await fetch("http://simon.lapaz.bo/simonApp/ListaParadasAppLPB2.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`SIMON paradas HTTP ${response.status} – ${text}`);
    }
    const paradas = await response.json();
    if (!Array.isArray(paradas) || paradas.length === 0) {
      alert("SIMON: No se encontraron paradas para esa ruta/sentido.");
      return;
    }

    paradas.forEach((p) => {
      const latP = parseFloat(p.latitud);
      const lngP = parseFloat(p.longitud);
      const nombre = p.name_parada || "Parada sin nombre";
      const orden = p.pro_orden || "-";

      const marker = L.marker([latP, lngP], {
        title: nombre,
      })
        .bindPopup(`<strong>${nombre}</strong><br/>Orden: ${orden}`)
        .addTo(simonStopsGroup);

      // Guardamos todo el objeto “p” dentro del marcador para recuperarlo luego
      marker.paradaData = p;

      // Hacer que el marcador sea editable/arrastrable (Geoman)
      marker.pm.enable({ draggable: true });

    });

    // Ajustar zoom/centro tal como antes
    const bounds = simonStopsGroup.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.2));
    }
  } catch (err) {
    console.error("Error al obtener paradas SIMON:", err);
    alert("No se pudo cargar las paradas desde SIMON.");
  }
}
// Cuando el usuario pulse el botón “Mostrar Paradas SIMON”
btnRefrescarParadas.addEventListener("click", () => {
  const rutaId = parseInt(rutasSelect.value, 10);
  const sentido = parseInt(sentidoSelect.value, 10);
  fetchParadasSimon(rutaId, sentido);
});

// Al cargar la página, obtenemos la lista de rutas SIMON
fetchRutasSimon();
// ——————————————————————————————————————————————
//  D) FUNCIONES PARA POST Django-DRF
//     (///rutas/, ///paradas/, ///coordenadas/, ///parada-ruta/)
// ——————————————————————————————————————————————

/**
 * POST a /rutas/ con { nombre, sentido: "IDA"|"VUELTA", estado: true }.
 * Devuelve el objeto JSON creado (por ejemplo: { id_ruta_puma, nombre, sentido, estado }).
 *
 * Nota: si tu backend está en otro host/puerto (p.ej. http://localhost:8000/rutas/),
 *       cámbialo aquí por la URL absoluta.
 */
async function crearRutaDRF(nombreRuta, sentidoTexto) {
  const payload = { nombre: nombreRuta, sentido: sentidoTexto, estado: true };
  const resp = await fetch("/api/rutas/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`DRF crearRuta HTTP ${resp.status} – ${txt}`);
  }
  return await resp.json();
}

/**
 * GET /coordenadas/?latitud=<lat>&longitud=<lng>
 * Si existe, devuelve el array y tomamos el primer elemento.
 * Si no existe o hay error, retornamos null.
 */
async function obtenerCoordenadaSiExisteDRF(lat, lng) {
  // Si tu DRF está en un host distinto, reemplaza por "http://localhost:8000/coordenadas/?latitud=...".
  const url = `/api/coordenadas/?latitud=${encodeURIComponent(lat)}&longitud=${encodeURIComponent(lng)}`;
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

/**
 * POST /coordenadas/ con { latitud, longitud }. Devuelve el objeto { id_coordenada, latitud, longitud }.
 */
async function crearCoordenadaDRF(lat, lng) {
  const payload = { latitud: lat, longitud: lng };
  const resp = await fetch("/api/coordenadas/", {
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

/**
 * POST /paradas/ con { latitud, longitud, nombre, direccion, estado: true }.
 * Devuelve el objeto creado { id_parada, latitud, longitud, nombre, direccion, estado }.
 */
async function crearParadaDRF(lat, lng, nombreParada, direccionParada) {
  const payload = {
    latitud: lat,
    longitud: lng,
    nombre: nombreParada,
    direccion: direccionParada,
    estado: true,
  };
  const resp = await fetch("/api/paradas/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`DRF crearParada HTTP ${resp.status} – ${txt}`);
  }
  return await resp.json();
}

/**
 * POST /parada-ruta/ con {
 *     ruta: <id_ruta_puma>,
 *     parada: <id_parada>,
 *     orden: <número>,
 *     tiempo: 0,
 *     id_coordenada: <id_coordenada>
 * }.
 * Devuelve el objeto ParadaRuta creado.
 */
async function crearParadaRutaDRF(rutaId, paradaId, orden, tiempo, idCoordenada) {
  const payload = {
    ruta: rutaId,
    parada: paradaId,
    orden: orden,
    tiempo: tiempo,
    id_coordenada: idCoordenada,
  };
  const resp = await fetch("/api/parada-ruta/", {
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
//  E) FLUJO “DRAW POLYLINE” → CREAR RUTA+PARADAS+COORDENADAS+PARADARUTA
// ——————————————————————————————————————————————

map.on("pm:create", async function (e) {
  // Solo nos interesa cuando e.shape === "Poly" (polilínea)
  if (!(e.layer instanceof L.Polyline)) return;

  const layer = e.layer; // objeto L.Polyline recién dibujado

  // 1) Obtener ruta seleccionada (de SIMON) y sentido
  const simonRutaId = parseInt(rutasSelect.value, 10);
  if (!simonRutaId) {
    alert("Primero selecciona una ruta en el desplegable.");
    map.removeLayer(layer);
    return;
  }
  const simonRutaNombre = rutasSelect.options[rutasSelect.selectedIndex].text.trim();
  // Por ejemplo "ACHUMANI", porque el texto visible es rt_nombre en el <option>

  const sentidoNum = parseInt(sentidoSelect.value, 10);
  if (![1, 2].includes(sentidoNum)) {
    alert("Selecciona un sentido válido (1 o 2).");
    map.removeLayer(layer);
    return;
  }
  const sentidoTexto = sentidoNum === 1 ? "IDA" : "VUELTA";

  try {

    const nombreRuta = `${simonRutaNombre} (${sentidoTexto})`
    const rutaCreada = await crearRutaDRF(nombreRuta, sentidoTexto);
    const idRutaPumaCreada = rutaCreada.id_ruta_puma;

    // Recuperar todos los vértices de la polilínea (array de LatLngs)
    const latlngs = layer.getLatLngs();

    let ordenParada = 1;
    for (let i = 0; i < latlngs.length; i++)
    {
      const { lat: latP, lng: lngP } = latlngs[i];
      const puntoDibujado = L.latLng(latP, lngP);

      const umbralMetros = 3;

      // 3.1) Primero comprobar si ya existe esta Coordenada en DRF
      let coordExistente = await crearCoordenadaDRF(latP, lngP);

      for (const marker of simonStopsGroup.getLayers()) 
      {
        const paradaLatLng = marker.getLatLng();
        const distancia = paradaLatLng.distanceTo(puntoDibujado); // en metros

        if (distancia <= umbralMetros)
        {
          const idCoordenadaUsada = coordExistente.id_coordenada;
          const paradaObj = marker.paradaData;
          /*const yaAgregada = paradasTocadas.some(
            (p) => p.pro_geofence_id === paradaObj.pro_geofence_id
          );*/

          const paradaCreada = await crearParadaDRF(latP, lngP, paradaObj.name_parada, paradaObj.name_parada);
          const idParadaCreada = paradaCreada.id_parada;

          //console.log("Se encontro una parada: ", paradaObj);

          await crearParadaRutaDRF(idRutaPumaCreada, idParadaCreada, ordenParada, 0, idCoordenadaUsada);

          ordenParada += 1;
          //if (!yaAgregada) {
            //const idCoordenadaUsada = coordExistente.id_coordenada;
            /*paradasTocadas.push(paradaObj);
            console.log("tocaste una parada", paradaObj);*/
            /*const defaultNombre = `Parada ${ordenParada}`;
            const nombreParada = window.prompt(
              `Ingresa nombre para la Parada #${ordenParada} (lat ${latP.toFixed(6)}, lng ${lngP.toFixed(6)}):`,
              defaultNombre
            );
            if (!nombreParada) {
              alert("Nombre vacío. Se omite esta parada.");
              continue; // saltar sin crear Parada ni ParadaRuta
            }
            const defaultDireccion = `Dirección Parada ${ordenParada}`;
            const direccionParada = window.prompt(
              `Ingresa la dirección física para Parada "${nombreParada}":`,
              defaultDireccion
            );
            if (direccionParada === null) {
              alert("Dirección vacía. Se omitirá esta parada.");
              continue;
            }
          
            // 3.3) Crear la Parada en DRF
            const paradaCreada = await crearParadaDRF(latP, lngP, nombreParada, direccionParada);
            // { id_parada: 88, latitud:…, longitud:…, nombre:…, direccion:…, estado: true }
            const idParadaCreada = paradaCreada.id_parada;
          
            // 3.4) Ahora creamos ParadaRuta para vincular ruta + parada + coordenada
            await crearParadaRutaDRF(idRutaPumaCreada, idParadaCreada, ordenParada, 0, idCoordenadaUsada);
            ordenParada += 1;*/
            
          //}
        }
      }
      // 3.2) Pedir al usuario nombre y dirección para esta parada
      //     (puedes sustituirlo por tu propio modal o formularios en la UI)
    
    }

    alert("✅ Se creó ruta + paradas + coordenadas + paradaruta en tu API DRF.");
  } catch (err) {
    console.error("Error al crear recursos en DRF:", err);
    alert("❌ Hubo un error al guardar en la base de datos. Revisa la consola.");
  }

  // Si no quieres que la polilínea quede dibujada tras guardar, descomenta:
  // map.removeLayer(layer);
});

// ——————————————————————————————————————————————
//  F) OPCIONALES: si quieres permitir editar la polilínea luego:
//     (ej. disparar un PUT/PATCH en vez de crear todo de nuevo)
// ——————————————————————————————————————————————
/*map.on("pm:drawstart", ({ workingLayer }) => {
  workingLayer.on("pm:vertexadded", (e) => {
    const { lat, lng } = e.latlng;
    const puntoDibujado = L.latLng(lat, lng);

    // Distancia máxima en metros para considerar “muy cercano”
    const umbralMetros = 3;

    simonStopsGroup.eachLayer((marker) => {
      const paradaLatLng = marker.getLatLng();
      const distancia = paradaLatLng.distanceTo(puntoDibujado); // en metros

      if (distancia <= umbralMetros) {
        const paradaObj = marker.paradaData;
        const yaAgregada = paradasTocadas.some(
          (p) => p.pro_geofence_id === paradaObj.pro_geofence_id
        );
        if (!yaAgregada) {
          paradasTocadas.push(paradaObj);
          console.log("tocaste una parada", paradaObj);
        }
      }
    });
  });
});*/
map.on("pm:edit", (e) => {
  if (e.shape === "Poly") {
    console.log("La polilínea fue editada. Aquí podrías actualizar la BD si quisieras.");
  }
});

map.on("pm:remove", (e) => {
  if (e.shape === "Poly") {
    console.log("La polilínea fue eliminada. Podrías eliminar la Ruta relacionada en tu BD.");
  }
});
