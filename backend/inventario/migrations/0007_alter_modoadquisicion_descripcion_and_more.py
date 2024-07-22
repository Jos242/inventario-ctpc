# Generated by Django 5.0.3 on 2024-07-21 08:23

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0006_modoadquisicion'),
    ]

    operations = [
        migrations.AlterField(
            model_name='modoadquisicion',
            name='descripcion',
            field=models.CharField(blank=True, max_length=240, unique=True),
        ),
        migrations.AlterField(
            model_name='ubicaciones',
            name='alias',
            field=models.CharField(blank=True, max_length=240, null=True, unique=True),
        ),
        migrations.AlterField(
            model_name='ubicaciones',
            name='nombre_oficial',
            field=models.CharField(blank=True, max_length=240, unique=True),
        ),
    ]