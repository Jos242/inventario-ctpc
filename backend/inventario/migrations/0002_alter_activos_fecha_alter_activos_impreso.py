# Generated by Django 5.0.3 on 2024-08-03 12:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='activos',
            name='fecha',
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AlterField(
            model_name='activos',
            name='impreso',
            field=models.BooleanField(default=False),
        ),
    ]
