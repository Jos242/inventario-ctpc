# Generated by Django 5.0.3 on 2024-07-30 02:40

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='ubicaciones',
            name='funcionario_id',
            field=models.ForeignKey(blank=True, db_column='funcionario_id', null=True, on_delete=django.db.models.deletion.DO_NOTHING, to='inventario.funcionarios'),
        ),
    ]
