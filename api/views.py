from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from django.utils.dateparse import parse_datetime

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

    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def sync(self, request):
        since = request.query_params.get('since')
        qs = self.queryset
        if since:
            dt = parse_datetime(since)
            qs = qs.filter(updated_at__gt=dt)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def paradas(self, request, pk=None):
        """Retorna las paradas asociadas a la ruta especificada."""
        ruta = self.get_object()
        paradas_qs = ruta.paradas.order_by('paradaruta__orden')
        serializer = ParadaSerializer(paradas_qs, many=True)
        return Response(serializer.data)

class ParadaViewSet(viewsets.ModelViewSet):
    queryset = Parada.objects.all()
    serializer_class = ParadaSerializer

    permission_classes = [IsAuthenticated] 

    @action(detail=False, methods=['get'])
    def sync(self, request):
        since = request.query_params.get('since')
        qs = self.queryset
        if since:
            dt = parse_datetime(since)
            qs = qs.filter(updated_at__gt=dt)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

class CoordenadaViewSet(viewsets.ModelViewSet):
    queryset = Coordenada.objects.all()
    serializer_class = CoordenadaSerializer

    @action(detail=False, methods=['get'])
    def sync(self, request):
        since = request.query_params.get('since')
        qs = self.queryset
        if since:
            dt = parse_datetime(since)
            qs = qs.filter(updated_at__gt=dt)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

class ParadaRutaViewSet(viewsets.ModelViewSet):
    queryset = ParadaRuta.objects.all()
    serializer_class = ParadaRutaSerializer

    @action(detail=False, methods=['get'])
    def sync(self, request):
        since = request.query_params.get('since')
        qs = self.queryset
        if since:
            dt = parse_datetime(since)
            qs = qs.filter(updated_at__gt=dt)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def by_ruta(self, request):
        """Devuelve todas las paradas de una ruta específica."""
        ruta_id = request.data.get("ruta")
        if not ruta_id:
            return Response(
                {"error": "Se requiere el id de la ruta en el cuerpo."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        qs = (
            self.queryset.filter(ruta_id=ruta_id)
            .select_related("parada")
            .order_by("orden")
        )
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

class HorarioViewSet(viewsets.ModelViewSet):
    queryset = Horario.objects.all()
    serializer_class = HorarioSerializer

    @action(detail=False, methods=['get'])
    def sync(self, request):
        since = request.query_params.get('since')
        qs = self.queryset
        if since:
            dt = parse_datetime(since)
            qs = qs.filter(updated_at__gt=dt)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

class DiaViewSet(viewsets.ModelViewSet):
    queryset = Dia.objects.all()
    serializer_class = DiaSerializer

    @action(detail=False, methods=['get'])
    def sync(self, request):
        since = request.query_params.get('since')
        qs = self.queryset
        if since:
            dt = parse_datetime(since)
            qs = qs.filter(updated_at__gt=dt)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

class DiaHorarioViewSet(viewsets.ModelViewSet):
    queryset = DiaHorario.objects.all()
    serializer_class = DiaHorarioSerializer

    @action(detail=False, methods=['get'])
    def sync(self, request):
        since = request.query_params.get('since')
        qs = self.queryset
        if since:
            dt = parse_datetime(since)
            qs = qs.filter(updated_at__gt=dt)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

class RutaHorarioViewSet(viewsets.ModelViewSet):
    queryset = RutaHorario.objects.all()
    serializer_class = RutaHorarioSerializer

    @action(detail=False, methods=['get'])
    def sync(self, request):
        since = request.query_params.get('since')
        qs = self.queryset
        if since:
            dt = parse_datetime(since)
            qs = qs.filter(updated_at__gt=dt)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

class LoginAPIView(APIView):
    # Permitimos que cualquiera (incluso no autenticado) haga POST aquí
    permission_classes = [AllowAny] # o bien: (AllowAny,)

    def post(self, request, *args, **kwargs):
        """
        Espera JSON { "username": "...", "password": "..." }.
        Si el usuario existe y tiene is_staff=True, devuelve {"token": "..."}.
        Si no, devuelve 401 Unauthorized.
        """
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return Response(
                {"error": "Debes enviar 'username' y 'password' en el body."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=username, password=password)
        if user is None:
            # Usuario o contraseña inválidos
            return Response(
                {"error": "Credenciales incorrectas."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Verificamos que sea administrador (o staff)
        if not user.is_staff:
            return Response(
                {"error": "No tienes permisos de administrador."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Si es válido y es staff, creamos o recuperamos el token
        token, created = Token.objects.get_or_create(user=user)
        return Response({"token": token.key})