from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RutaViewSet, ParadaViewSet, CoordenadaViewSet,
    ParadaRutaViewSet, HorarioViewSet, DiaViewSet,
    DiaHorarioViewSet, RutaHorarioViewSet,
    NotificacionViewSet
)

router = DefaultRouter()
router.register(r'rutas', RutaViewSet, basename='ruta')
router.register(r'paradas', ParadaViewSet, basename='parada')
router.register(r'coordenadas', CoordenadaViewSet, basename='coordenada')
router.register(r'parada-ruta', ParadaRutaViewSet, basename='paradaruta')
router.register(r'horarios', HorarioViewSet, basename='horario')
router.register(r'dias', DiaViewSet, basename='dia')
router.register(r'dia-horario', DiaHorarioViewSet, basename='diahora')
router.register(r'ruta-horario', RutaHorarioViewSet, basename='rutahora')
router.register(r'notificaciones', NotificacionViewSet, basename='notificacion')

urlpatterns = [
    path('', include(router.urls)),
]
