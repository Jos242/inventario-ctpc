from django.db import models
from django.db.models.functions import Now
# Create your models here.

class Activos(models.Model):
    ESTADO_ACTIVO = {
        "BUENO": "BUENO",
        "MALO": "MALO",
        "REGULAR": "REGULAR"
    }
    id = models.AutoField(primary_key=True)
    id_registro = models.CharField(max_length=150, unique = True)
    asiento = models.IntegerField()
    no_identificacion = models.CharField(unique=True, max_length=150)
    descripcion = models.CharField(max_length=150)
    marca = models.CharField(max_length=150, blank=True)
    modelo = models.CharField(max_length=150, blank=True)
    serie = models.CharField(max_length=150, blank=True)
    estado = models.CharField(max_length=7, blank=True,choices= ESTADO_ACTIVO)
    ubicacion = models.CharField(max_length=255)
    modo_adquisicion = models.CharField(max_length=255)
    precio = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True) 
    creado_el = models.DateTimeField(db_default = Now())
    observacion = models.TextField(blank = True) 
    impreso = models.IntegerField(default = False)
    class Meta:
        managed = False
        db_table = 'activos'

    def __str__(self):
        return str({"id_registro": self.id_registro, "no_identificacion": self.no_identificacion})

class ReadActivos(models.Model):
    ESTADO_ACTIVO = {
        "BUENO": "BUENO",
        "MALO": "MALO",
        "REGULAR": "REGULAR"}
    id = models.AutoField(primary_key=True)
    id_registro = models.CharField(max_length=150)
    asiento = models.IntegerField()
    no_identificacion = models.CharField(unique=True, max_length=150)
    descripcion = models.CharField(max_length=150)
    marca = models.CharField(max_length=150, blank=True)
    modelo = models.CharField(max_length=150, blank=True)
    serie = models.CharField(max_length=150, blank=True)
    estado = models.CharField(max_length=7, blank=True,choices= ESTADO_ACTIVO)
    ubicacion = models.CharField(max_length=255)
    modo_adquisicion = models.CharField(max_length=255)
    precio = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    creado_el = models.DateTimeField()
    impreso = models.BooleanField(default = False) 
    class Meta:
        managed = False
        db_table = 'activos'

    def __str__(self):
        return str({"id_registro": self.id_registro, 
                    "no_identificacion": self.no_identificacion})
    

class Observaciones(models.Model):
    id = models.AutoField(primary_key=True)
    id_registro = models.CharField(unique=True, max_length=150)
    asiento = models.IntegerField()
    descripcion = models.TextField()
    activo = models.ForeignKey(Activos, to_field='id_registro', on_delete = models.CASCADE)
    impreso = models.BooleanField(default = False) 
    class Meta:
        managed = False
        db_table = 'observaciones'


class Docs(models.Model):
    DOCS_TYPE = {
        "PDF": "PDF",
        "EXCEL": "EXCEL"
    }
    id = models.AutoField(primary_key = True)
    titulo = models.CharField(max_length = 200)
    tipo = models.CharField(max_length = 5, choices = DOCS_TYPE)
    ruta = models.CharField(max_length = 250)
    creado_el = models.DateTimeField(db_default = Now())

    class Meta:
        managed = False
        db_table = "docs"

    def __str__(self):
        return f"Title: {self.titulo}, Path: {self.ruta}" 
