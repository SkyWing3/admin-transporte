from django.contrib import admin
from .models import Ruta, Parada, Coordenada, Horario, Dia, RutaHorario, DiaHorario, ParadaRuta, Notificacion, AppUserProfile

admin.site.register(Coordenada)
admin.site.register(Ruta)
admin.site.register(Parada)
admin.site.register(Horario)
admin.site.register(Dia)
admin.site.register(RutaHorario)
admin.site.register(DiaHorario)
admin.site.register(ParadaRuta)
admin.site.register(Notificacion)
admin.site.register(AppUserProfile)