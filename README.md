# Panel Administrativo para crear rutas

Aplicación web basada en Django. Provee una API REST para gestionar rutas y un panel interactivo con Leaflet para registrar paradas.

## Requisitos
- Python 3
- pip

## Instalación
1. Instala las dependencias de Python:
   ```bash
   pip install -r requirements.txt
   ```
2. Ejecuta las migraciones:
   ```bash
   python manage.py migrate
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   python manage.py runserver
   ```
   El panel estará disponible en `http://localhost:8000/`.

## Endpoints API
- `/api/rutas/`
- `/api/paradas/`
- `/api/coordenadas/`
- `/api/parada-ruta/`
- `/api/horarios/`
- `/api/dias/`
- `/api/dia-horario/`
- `/api/ruta-horario/`
