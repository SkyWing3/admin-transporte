from django.db import models
from django.utils import timezone

class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True

class Ruta(TimeStampedModel):
    id_ruta_puma = models.AutoField(primary_key=True)
    nombre       = models.CharField(max_length=50)
    sentido      = models.CharField(max_length=20)
    estado       = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.nombre} ({self.sentido})"

class Parada(TimeStampedModel):
    id_parada = models.AutoField(primary_key=True)
    latitud   = models.FloatField()
    longitud  = models.FloatField()
    nombre    = models.CharField(max_length=50)
    direccion = models.CharField(max_length=50)
    estado    = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

class Coordenada(TimeStampedModel):
    id_coordenada = models.AutoField(primary_key=True)
    latitud       = models.FloatField()
    longitud      = models.FloatField()

    def __str__(self):
        return f"{self.latitud}, {self.longitud}"

class ParadaRuta(TimeStampedModel):
    ruta         = models.ForeignKey(Ruta, on_delete=models.CASCADE, db_column='id_ruta')
    parada       = models.ForeignKey(Parada, on_delete=models.CASCADE, db_column='id_parada')
    orden        = models.IntegerField()
    tiempo       = models.IntegerField()
    id_coordenada = models.ForeignKey(Coordenada, on_delete=models.CASCADE, db_column='id_coordenada')

    class Meta:
        unique_together = ('ruta', 'parada')
        db_table = 'paradaruta'

    def __str__(self):
        return f"Ruta {self.ruta_id} → Parada {self.parada_id} (orden {self.orden})"

Ruta.paradas = models.ManyToManyField(
    Parada,
    through=ParadaRuta,
    through_fields=('ruta', 'parada'),
    related_name='rutas'
)

class Horario(TimeStampedModel):
    id_horario  = models.AutoField(primary_key=True)
    hora_inicio = models.IntegerField()
    hora_final  = models.IntegerField()

    def __str__(self):
        return f"{self.hora_inicio} - {self.hora_final}"

class Dia(TimeStampedModel):
    dia_id      = models.AutoField(primary_key=True)
    descripcion = models.CharField(max_length=15)

    def __str__(self):
        return self.descripcion

class DiaHorario(TimeStampedModel):
    id_horar = models.ForeignKey(Horario, on_delete=models.CASCADE, db_column='id_horar')
    dia_id   = models.ForeignKey(Dia, on_delete=models.CASCADE, db_column='dia_id')

    class Meta:
        unique_together = ('id_horar', 'dia_id')
        db_table = 'dia_horario'

    def __str__(self):
        return f"{self.id_horar_id} – {self.dia_id_id}"

Horario.dias = models.ManyToManyField(
    Dia,
    through=DiaHorario,
    through_fields=('id_horar', 'dia_id'),
    related_name='horarios'
)

class RutaHorario(models.Model):
    rutas_id_ruta_puma = models.ForeignKey(Ruta, on_delete=models.CASCADE, db_column='rutas_id_ruta_puma')
    horario_id_horario = models.ForeignKey(Horario, on_delete=models.CASCADE, db_column='horario_id_horario')

    class Meta:
        unique_together = ('rutas_id_ruta_puma', 'horario_id_horario')
        db_table = 'ruta_horario'

    def __str__(self):
        return f"Ruta {self.rutas_id_ruta_puma_id} – Horario {self.horario_id_horario_id}"


Ruta.horarios = models.ManyToManyField(
    Horario,
    through=RutaHorario,
    through_fields=('rutas_id_ruta_puma', 'horario_id_horario'),
    related_name='rutas'
)


class Notificacion(TimeStampedModel):
    ruta_afectada = models.ForeignKey(
        Ruta,
        on_delete=models.CASCADE,
        related_name='notificaciones_afectada'
    )
    ruta_auxiliar = models.ForeignKey(
        Ruta,
        on_delete=models.CASCADE,
        related_name='notificaciones_auxiliar'
    )
    paradas_afectadas = models.ManyToManyField(
        Parada,
        related_name='notificaciones'
    )
    informacion = models.TextField()

    def __str__(self):
        return f"Afecta {self.ruta_afectada_id} usa {self.ruta_auxiliar_id}"

# Profile for mobile application users
from django.contrib.auth.models import User

class AppUserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    age = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return self.user.username
