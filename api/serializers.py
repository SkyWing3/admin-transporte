from rest_framework import serializers
from .models import (
    Ruta, Parada, Coordenada,
    ParadaRuta, Horario, Dia,
    DiaHorario, RutaHorario,
    Notificacion
)

class CoordenadaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coordenada
        fields = '__all__'

class ParadaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parada
        fields = '__all__'

class ParadaRutaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParadaRuta
        fields = ['ruta', 'parada', 'orden', 'tiempo', 'id_coordenada']

class RutaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ruta
        fields = '__all__'

class DiaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dia
        fields = '__all__'

class HorarioSerializer(serializers.ModelSerializer):
    dias = DiaSerializer(many=True, read_only=True)

    class Meta:
        model = Horario
        fields = ['id_horario', 'hora_inicio', 'hora_final', 'dias']

class DiaHorarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiaHorario
        fields = ['id_horar', 'dia_id']

class RutaHorarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = RutaHorario
        fields = ['rutas_id_ruta_puma', 'horario_id_horario']


class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = '__all__'

from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'username']
