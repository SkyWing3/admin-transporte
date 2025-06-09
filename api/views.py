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
    DiaHorario, RutaHorario,
    Notificacion
)
from .serializers import (
    RutaSerializer, ParadaSerializer, CoordenadaSerializer,
    ParadaRutaSerializer, HorarioSerializer, DiaSerializer,
    DiaHorarioSerializer, RutaHorarioSerializer,
    NotificacionSerializer
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


class NotificacionViewSet(viewsets.ModelViewSet):
    queryset = Notificacion.objects.all()
    serializer_class = NotificacionSerializer
    permission_classes = [IsAuthenticated]

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


class AppRegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')
        age = request.data.get('age')
        name = request.data.get('name')

        if not email or not password or not name:
            return Response({"error": "email, password y name son requeridos"}, status=status.HTTP_400_BAD_REQUEST)

        from django.contrib.auth.models import User
        if User.objects.filter(username=email).exists():
            return Response({"error": "Usuario ya existe"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=email, email=email, password=password, first_name=name)
        user.is_staff = False
        user.save()

        # Guardamos edad en el perfil
        from .models import AppUserProfile
        if age is not None:
            try:
                age_int = int(age)
            except (TypeError, ValueError):
                age_int = None
        else:
            age_int = None
        AppUserProfile.objects.create(user=user, age=age_int)

        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "userId": user.id, "name": user.first_name})


class AppLoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')
        if not email or not password:
            return Response({"error": "email y password requeridos"}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=email, password=password)
        if user is None:
            return Response({"error": "Credenciales incorrectas"}, status=status.HTTP_401_UNAUTHORIZED)

        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "userId": user.id, "name": user.first_name})


class DeleteUserAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id, *args, **kwargs):
        from django.contrib.auth.models import User
        if request.user.id != user_id:
            return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        user.delete()
        Token.objects.filter(user=user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
