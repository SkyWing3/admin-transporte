from rest_framework import viewsets
from .models import (
    Ruta, Parada, Coordenada,
    ParadaRuta, Horario, Dia,
    DiaHorario, RutaHorario
)
from .serializers import (
    RutaSerializer, ParadaSerializer, CoordenadaSerializer,
    ParadaRutaSerializer, HorarioSerializer, DiaSerializer,
    DiaHorarioSerializer, RutaHorarioSerializer
)

class RutaViewSet(viewsets.ModelViewSet):
    queryset = Ruta.objects.all()
    serializer_class = RutaSerializer

class ParadaViewSet(viewsets.ModelViewSet):
    queryset = Parada.objects.all()
    serializer_class = ParadaSerializer

class CoordenadaViewSet(viewsets.ModelViewSet):
    queryset = Coordenada.objects.all()
    serializer_class = CoordenadaSerializer

class ParadaRutaViewSet(viewsets.ModelViewSet):
    queryset = ParadaRuta.objects.all()
    serializer_class = ParadaRutaSerializer

class HorarioViewSet(viewsets.ModelViewSet):
    queryset = Horario.objects.all()
    serializer_class = HorarioSerializer

class DiaViewSet(viewsets.ModelViewSet):
    queryset = Dia.objects.all()
    serializer_class = DiaSerializer

class DiaHorarioViewSet(viewsets.ModelViewSet):
    queryset = DiaHorario.objects.all()
    serializer_class = DiaHorarioSerializer

class RutaHorarioViewSet(viewsets.ModelViewSet):
    queryset = RutaHorario.objects.all()
    serializer_class = RutaHorarioSerializer
