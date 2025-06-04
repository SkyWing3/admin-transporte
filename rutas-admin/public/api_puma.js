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
    const response = await fetch("http://simon.lapaz.bo/simonApp/Lista_Rutas.php");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    console.log("Datos obtenidos del API:", data);
    // Aquí podrías, por ejemplo, dibujar marcadores en el mapa usando esos datos.
    // data podría ser un array de objetos con lat/lng, p.ej:
    // data.forEach(item => {
    //   L.marker([item.lat, item.lng]).addTo(map).bindPopup(item.nombre);
    // });
  } catch (error) {
    console.error("Error al hacer GET a /simonApp/Lista_Rutas.php/:", error);
  }
}

// EJEMPLOS DE USO:
// Al cargar la página, obtengo todos los items del API:
fetchItems();