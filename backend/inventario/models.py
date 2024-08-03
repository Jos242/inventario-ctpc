from django.db import models
from django.db.models.functions import Now
from django.contrib.auth.models import User

# Create your models here.
class Puestos(models.Model):
    id = models.AutoField(primary_key = True)
    descripcion = models.CharField(unique=True, max_length=240)

    class Meta: 
        db_table = 'puestos'

    def __str__(self) -> str:
        return self.descripcion

class Plantillas(models.Model):
    TIPOS_PLANTILLA = {
        "OBSERVACION": "OBSERVACION",
        "ACTA B": "ACTA B",
        "ACTA T": "ACTA T",
        "REVISIONES NOTAS": "REVISIONES NOTAS"
    }
    id = models.AutoField(primary_key = True)
    descripcion = models.TextField()
    tipo = models.CharField(max_length = 21,
                            choices= TIPOS_PLANTILLA)

    class Meta:
        db_table = 'plantillas'


class Departamentos(models.Model):
    id = models.AutoField(primary_key = True)
    descripcion = models.CharField(unique=True, max_length=240)

    class Meta: 
        db_table = 'departamentos'
    
    def __str__(self) -> str:
        return self.descripcion
 
class Funcionarios(models.Model):
    user = models.OneToOneField(User, on_delete = models.CASCADE)
    nombre_completo = models.TextField()
    departamento = models.ForeignKey(Departamentos, models.DO_NOTHING, db_column='departamento')
    puesto = models.ForeignKey(Puestos, models.DO_NOTHING, db_column='puesto') 
    
    class Meta:
        db_table = 'funcionarios'
    
    def __str__(self) -> str:
        return self.nombre_completo

class Ubicaciones(models.Model):

    id = models.AutoField(primary_key = True)
    # WHEN RUNNING testing.py they have to look like this:
    # nombre_oficial = models.CharField(unique=True, max_length=240,
    #                                  blank = True)
    
    #alias = models.CharField(unique = True, max_length = 240,
    #                         null = True, blank = True)
    
    # When done, like this:
    nombre_oficial = models.CharField(unique=True, max_length=240,
                                      blank = True)
    
    alias = models.CharField(unique = True, max_length = 240,
                             null = True, blank = True)
    
    
    funcionario_id = models.ForeignKey(Funcionarios, models.DO_NOTHING,
                                       db_column= "funcionario_id", null = True,
                                       blank = True)
    img_path = models.CharField(max_length = 250, blank = True)

    class Meta: 
        db_table = 'ubicaciones'

    def __str__(self) -> str:
        return self.alias

class ModoAdquisicion(models.Model):
    id = models.AutoField(primary_key = True)
    descripcion = models.CharField(max_length = 240, unique = True,
                                   blank = True) #IN PRODUCTION THIS ONE IS FALSE

    class Meta:
        db_table = 'modoadquisicion'

    def __str__(self) -> str:
        return self.descripcion

class Activos(models.Model):
    ESTADO_ACTIVO = {
        "BUENO": "BUENO",
        "MALO": "MALO",
        "REGULAR": "REGULAR"
    }

    DE_BAJA_TYPES = {
        "NO DADO DE BAJA": "NO DADO DE BAJA",
        "DADO DE BAJA CON PLACA": "DADO DE BAJA CON PLACA",
        "DADO DE BAJA SIN PLACA": "DADO DE BAJA SIN PLACA"
    }

    id = models.AutoField(primary_key=True)
    id_registro = models.CharField(max_length=150, unique = True)
    asiento = models.IntegerField()
    no_identificacion = models.CharField(unique=True, max_length=150)
    descripcion = models.CharField(max_length=150)
    marca = models.CharField(max_length=150, default = "N/A")
    modelo = models.CharField(max_length=150,default = "N/A")
    serie = models.CharField(max_length=150, default= "N/A")
    estado = models.CharField(max_length=7, blank=True, choices= ESTADO_ACTIVO) 
    ubicacion_original = models.ForeignKey(Ubicaciones, on_delete = models.SET_NULL, db_column='ubicacion_original',
                                           null=True, related_name = 'ubicacion_original')
    modo_adquisicion = models.ForeignKey(ModoAdquisicion, on_delete= models.SET_NULL, db_column = 'modo_adquisicion',
                                         blank = True, null = True) 
    precio = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True) 
    fecha = models.DateTimeField(auto_now_add = True)
    observacion = models.TextField(blank = True) 
    impreso = models.BooleanField(default = False)
    ubicacion_actual = models.ForeignKey(Ubicaciones, models.DO_NOTHING, db_column = 'ubicacion_actual',
                                         blank = True, null = True, related_name = 'ubicacion_actual')
    conectividad = models.BooleanField(default = False)
    seguridad = models.BooleanField(default = False)
    placa = models.BooleanField(default = False)
    baja = models.CharField(max_length = 25 ,choices = DE_BAJA_TYPES, default = "NO DADO DE BAJA")
    plcNvStm = models.BooleanField(default = False)

    class Meta: 
        db_table = 'activos'

    def save(self, *args, **kwargs):
        if not self.ubicacion_actual:
            self.ubicacion_actual = self.ubicacion_original
        super().save(*args, **kwargs)

class Observaciones(models.Model):
    id = models.AutoField(primary_key=True)
    id_registro = models.CharField(unique=True, max_length=150)
    asiento = models.IntegerField()
    descripcion = models.TextField()
    activo = models.ForeignKey(Activos, to_field='id_registro', on_delete = models.CASCADE)
    impreso = models.BooleanField(default = False) 

    class Meta:
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
    impreso  = models.BooleanField(default = False)
    creado_el = models.DateTimeField(db_default = Now())

    class Meta:
        db_table = "docs"

    def __str__(self):
        return f"Title: {self.titulo}, Path: {self.ruta}" 

class CierreInventario(models.Model):
    VALID_REVISIONES = {
        "PRINCIPIO": "PRINCIPIO",
        "MEDIO": "MEDIO",
        "FINAL": "FINAL"
    }
     
    id = models.AutoField(primary_key = True)
    tipo_revision = models.CharField(choices = VALID_REVISIONES, max_length = 10) 
    funcionario = models.ForeignKey(Funcionarios, models.DO_NOTHING, db_column = 'funcionario')
    ubicacion = models.ForeignKey(Ubicaciones, models.DO_NOTHING, db_column = 'aula', null = True)
    fecha = models.DateField(null = True)
    finalizado = models.BooleanField(default = False)

    class Meta: 
        db_table = 'cierreinventario'

    def __str__(self) -> str:
        return self.tipo_revision

class Revisiones(models.Model):
    REVISIONES_STATUS = {
        "SI EXISTE": "SI EXISTE",
        "NO EXISTE": "NO EXISTE",
    }
         
    id = models.AutoField(primary_key = True)
    id_registro = models.ForeignKey(Activos, models.DO_NOTHING,
                                    db_column = 'id_registro', to_field = 'id_registro')
    status = models.CharField(max_length = 11, choices = REVISIONES_STATUS)
    fecha = models.DateField(null = True)
    nota = models.TextField(null = True)
    cierre_inventario_id = models.ForeignKey(CierreInventario, models.DO_NOTHING, db_column = 'cierre_inventario_id')

    class Meta:
        db_table = 'revisiones'

class HistorialUbicacion(models.Model):
    id = models.AutoField(primary_key = True)
    ubicacion = models.ForeignKey(Ubicaciones, models.DO_NOTHING,
                                  db_column = 'ubicacion')
    activo = models.ForeignKey(Activos, models.DO_NOTHING,
                               to_field = 'id_registro', db_column= 'activo')
    fecha =  models.DateField(null = True)

    class Meta:
        db_table = 'historialubicaciones'

class HistorialDeAcceso(models.Model):
    TIPOS_USUARIO = [
        ('Administrador', 'Administrador'),
        ('Observador', 'Observador'),
        ('Funcionario', 'Funcionario'),
    ]

    id = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name='accesos')
    tipo_usuario = models.CharField(max_length=20, choices=TIPOS_USUARIO)
    fecha_hora_acceso = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Historial de Acceso"
        verbose_name_plural = "Historiales de Acceso"
        db_table = 'historialacceso'

    def __str__(self):
        return f"{self.usuario.username} - {self.tipo_usuario} - {self.fecha_hora_acceso}" 
