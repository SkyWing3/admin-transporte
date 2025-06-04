/* eslint-disable no-undef */
/**
 * leaflet-geoman + conexión a API REST
*/
// -------------------------------------------------------------
// Ahora agregamos la parte de conexión con la API REST (Django)
// -------------------------------------------------------------

// 1) Función para hacer GET y mostrar datos en consola
async function fetchItems() {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/rutas/");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    console.log("Datos obtenidos del API:", data);
    // Aquí podrías, por ejemplo, dibujar marcadores en el mapa usando esos datos.
    // data podría ser un array de objetos con lat/lng, p.ej:
    // data.forEach(item => {
    //   L.marker([item.lat, item.lng]).addTo(map).bindPopup(item.nombre);
    // });
  } catch (error) {
    console.error("Error al hacer GET a /api/items/:", error);
  }
}

// 2) Función para hacer POST y crear un nuevo item
async function createItem(newItem) {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/rutas/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Si tu API requiere autenticación con token:
        // "Authorization": "Token <TU_TOKEN_AQUÍ>"
      },
      body: JSON.stringify(newItem),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${text}`);
    }
    const data = await response.json();
    console.log("Item creado correctamente:", data);
    // Por ejemplo, si quieres poner un marcador inmediatamente:
    // L.marker([data.lat, data.lng]).addTo(map).bindPopup(data.nombre);
  } catch (error) {
    console.error("Error al hacer POST a /api/items/:", error);
  }
}

// EJEMPLOS DE USO:
// Al cargar la página, obtengo todos los items del API:
fetchItems();

// Supongamos que, al hacer click en el mapa, quiero crear un item con la latitud/lng:
map.on("click", function (e) {
  const { lat, lng } = e.latlng;
  const nuevoItem = {
    nombre: "Marcador en mapa",
    lat: lat,
    lng: lng,
    // … otros campos que tu API necesite …
  };
  createItem(nuevoItem);
});
