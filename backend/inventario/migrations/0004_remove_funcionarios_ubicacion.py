# Generated by Django 5.0.3 on 2024-07-21 00:20

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0003_alter_ubicaciones_alias'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='funcionarios',
            name='ubicacion',
        ),
    ]