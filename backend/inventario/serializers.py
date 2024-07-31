from django.contrib.auth.models import User
from inventario.models import *
from rest_framework import serializers

class ActivoSerializer(serializers.ModelSerializer):
    id_registro = serializers.CharField(required = False)
    asiento = serializers.IntegerField(required = False)
    no_identificacion = serializers.CharField(required = False) 
    creado_el = serializers.CharField(required = False)
    modo_adquisicion = serializers.PrimaryKeyRelatedField(queryset=ModoAdquisicion.objects.all())

    class Meta:
        model = Activos
        fields = '__all__' 
   
class UpdateActivoSerializer(serializers.ModelSerializer):
    descripcion = serializers.CharField(max_length=150,
                                        required = False)
    class Meta:
        model = Activos
        fields = ['descripcion', 'marca', 'modelo',
                  'serie', 'estado', 'modo_adquisicion',
                  'ubicacion_actual', 'precio', 'de_baja']
    
class ReadActivoSerializerComplete(serializers.ModelSerializer):
    ubicacion_original = serializers.CharField(required = False)
    ubicacion_actual = serializers.CharField(required = False)
    modo_adquisicion = serializers.CharField(required = False)

    class Meta:
        model = Activos
        fields = ['id', 'id_registro', 'asiento', 'no_identificacion',
                  'descripcion', 'marca', 'modelo', 'serie', 'estado',
                  'ubicacion_original', 'ubicacion_actual', 'modo_adquisicion',
                  'precio', 'conectividad', 'seguridad', 'placa_impresa','de_baja', 'creado_el']

class ReadActivoSerializerIncomplete(serializers.ModelSerializer):
    ubicacion_original = serializers.CharField(required = False) 

    class Meta: 
        model = Activos
        fields = ['id', 'id_registro', 'no_identificacion',
                  'descripcion', 'ubicacion_original']
 
class ObservacionesSerializer(serializers.Serializer):
    id = serializers.IntegerField(required = False)
    id_registro = serializers.CharField(max_length=150, read_only=True, required=False)
    asiento = serializers.IntegerField(read_only=True, required = False)
    descripcion = serializers.CharField(style={'base_template': 'textarea.html'})
    activo = serializers.SlugRelatedField(queryset=Activos.objects.all(), slug_field='id_registro')
    impreso = serializers.BooleanField(required = False)

    class Meta:
        model = Observaciones

    def create(self, validated_data):
        return Observaciones.objects.create(**validated_data)

class UserSerializer(serializers.ModelSerializer):
       
    class Meta:
        model  = User
        fields = ['username', 'password']

class FuncionariosSerializer(serializers.ModelSerializer):
   
    class Meta:
        model = Funcionarios 
        fields = ['user', 'nombre_completo', 'departamento',
                  'puesto']

class ReadFuncionariosSerializer(serializers.Serializer):
    user = serializers.CharField(max_length = 240, required = False)
    nombre_completo = serializers.CharField(max_length = 240, required = False)
    departamento = serializers.CharField(max_length = 240, required = False)
    puesto = serializers.CharField(max_length = 240, required = False)

class ReadUserSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required = False)
    first_name = serializers.CharField(max_length=150, required = False, 
                                       read_only = True)
    last_name = serializers.CharField(max_length=150, required = False, 
                                      read_only = True)
    password = serializers.CharField(max_length=128, required = False)
    class Meta:
        model = User
 
class DocSerializer(serializers.ModelSerializer):

    archivo = serializers.FileField(write_only = True,
                                    required = False)
    creado_el = serializers.DateTimeField(read_only = True)  

    class Meta:

        model  = Docs
        fields = ['titulo', 'tipo', 'archivo','creado_el']
    
    def create(self, validated_data:dict):
        archivo = validated_data.pop('archivo', None)
        return super().create(validated_data)
    
    def update(self, instance:Docs, validated_data:dict):
        archivo = validated_data.pop('archivo', None)
        return super().update(self, instance, validated_data)

class DocUpdateSerializer(serializers.ModelSerializer):


    class Meta:
        model = Docs
        fields = ['titulo', 'tipo', 'impreso']
    

class ReadDocSerializer(serializers.ModelSerializer):
    class Meta:
        model = Docs
        fields = ['id', 'titulo', 'tipo', 'ruta', 'impreso', 'creado_el']

class CierreInventarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = CierreInventario
        fields = ['tipo_revision', 'funcionario',
                  'ubicacion', 'fecha', 'finalizado']
        read_only_fields = ['id']

class ReadCierreInventarioSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only = True)
    funcionario = serializers.CharField(read_only = True)
    ubicacion = serializers.CharField(read_only = True)
    tipo_revision = serializers.CharField(read_only = True)
    fecha = serializers.CharField(read_only = True)
    finalizado = serializers.BooleanField(read_only = True)
      
class RevisionesSerializer(serializers.ModelSerializer):
  
    class Meta:
        model = Revisiones
        fields = ['id', 'id_registro', 'status', 'fecha', 'nota', 'cierre_inventario_id'] 
     
class WhatTheExcelNameIs(serializers.Serializer):
    file_name = serializers.CharField()

class UbicacionesSerializer(serializers.ModelSerializer):
    img_path = serializers.FileField(required = False)

    class Meta:
        model = Ubicaciones
        fields = ['id', 'nombre_oficial',
                  'alias', 'funcionario_id',
                  'img_path']

class ReadUbicacionesSerializer(serializers.ModelSerializer):
    img_path = serializers.CharField(required = False)

    class Meta:
        model = Ubicaciones
        fields = ['id', 'nombre_oficial',
                  'alias', 'funcionario_id',
                  'img_path']

class ModoAdquisicionSerializer(serializers.ModelSerializer):

    class Meta:
        model = ModoAdquisicion
        fields = ['id', 'descripcion']


class DynamicReadActivosSerializer(serializers.ModelSerializer):  
    ubicacion_original_alias = serializers.CharField()
    ubicacion_actual_alias = serializers.CharField()
    modo_adquisicion_desc = serializers.CharField()

  
    class Meta:
       model = Activos
       fields = [
            'id', 'id_registro', 'asiento',
            'no_identificacion', 'descripcion', 'marca',
            'modelo', 'serie', 'estado',
            'ubicacion_original_alias', 'modo_adquisicion_desc', 'precio',
            'creado_el', 'observacion', 'impreso',
            'ubicacion_actual_alias', 'conectividad', 'seguridad',
            'placa_impresa', 'de_baja'
        ]

    def __init__(self, *args, **kwargs):
        # Obtener los campos dinámicos desde kwargs
        fields = kwargs.pop('fields', None)
        super(DynamicReadActivosSerializer, self).__init__(*args, **kwargs)
        
        if fields is not None:
            # Limitar los campos del serializer a los especificados
            allowed = set(fields) 
            existing = set(self.fields.keys())
            for field_name in existing - allowed: 
                self.fields.pop(field_name)

class PlantillasSerializer(serializers.ModelSerializer):

    class Meta:
        model = Plantillas
        fields = '__all__'

class HistorialDeAccesoSerializer(serializers.ModelSerializer):

    class Meta:
        model = HistorialDeAcceso
        fields = ''
