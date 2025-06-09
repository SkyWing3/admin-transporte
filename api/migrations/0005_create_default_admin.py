from django.db import migrations
from django.contrib.auth.hashers import make_password

def create_admin_user(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    if not User.objects.filter(username='admin').exists():
        User.objects.create(
            username='admin',
            email='admin@example.com',
            is_staff=True,
            is_superuser=True,
            password=make_password('admin123')
        )

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0004_horario_dias_ruta_horarios_ruta_paradas'),
    ]

    operations = [
        migrations.RunPython(create_admin_user, migrations.RunPython.noop),
    ]
