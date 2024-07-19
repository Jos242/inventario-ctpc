from django.contrib.auth.models import User
from inventario.models import *
from rest_framework import serializers

class ActivoSerializer(serializers.Serializer):
    id = serializers.IntegerField(required = False)
    id_registro = serializers.CharField(max_length = 150, required = False) 
    asiento = serializers.IntegerField(required = False)
    no_identificacion = serializers.CharField(max_length=150, required = False) 
    descripcion = serializers.CharField(max_length=150)
    marca = serializers.CharField(max_length=150, required=False, allow_blank=True)
    modelo = serializers.CharField(max_length=150, required=False, allow_blank=True)
    serie = serializers.CharField(max_length=150, required=False, allow_blank=True)
    estado = serializers.ChoiceField(choices=[
        ("Bueno", "Bueno"),
        ("Malo", "Malo"),
        ("Regular", "Regular")
    ], required=False, allow_blank=True)
      
    ubicacion = serializers.CharField(max_length=255)
    modo_adquisicion = serializers.CharField(max_length=255)
    precio = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)   
    creado_el = serializers.DateTimeField(required = False)

    def create(self, validated_data):
        print(validated_data)
        return Activos.objects.create(**validated_data)

    def update(self, instance:Activos, validated_data:dict):
        instance.id_registro = validated_data.get('id_registro', instance.id_registro)
        instance.asiento = validated_data.get('asiento', instance.asiento)
        instance.no_identificacion = validated_data.get('no_identificacion', instance.no_identificacion)
        instance.descripcion = validated_data.get('descripcion', instance.descripcion)
        instance.marca = validated_data.get('marca', instance.marca)
        instance.modelo = validated_data.get('modelo', instance.modelo)
        instance.serie = validated_data.get('serie', instance.serie)
        instance.estado = validated_data.get('estado', instance.estado)
        instance.ubicacion = validated_data.get('ubicacion', instance.ubicacion)
        instance.modo_adquisicion = validated_data.get('modo_adquisicion', instance.modo_adquisicion)
        instance.precio = validated_data.get('precio', instance.precio)
        instance.creado_el = validated_data.get('creado_el', instance.creado_el)
        instance.save()
        return instance
    
class ReadActivoSerializer(serializers.Serializer):
    id = serializers.IntegerField(required = False)
    id_registro = serializers.CharField(max_length = 150, required = False) 
    no_identificacion = serializers.CharField(max_length=150, required = False) 
    descripcion = serializers.CharField(max_length=150, required = False)
    ubicacion = serializers.CharField(max_length=255, required = False)
 
class ObservacionesSerializer(serializers.Serializer):
    id_registro = serializers.CharField(max_length=150, read_only=True, required=False)
    asiento = serializers.IntegerField(read_only=True, required = False)
    descripcion = serializers.CharField(style={'base_template': 'textarea.html'})
    activo = serializers.SlugRelatedField(queryset=Activos.objects.all(), slug_field='id_registro')
    class Meta:
        model = Observaciones
    def create(self, validated_data):
        return Observaciones.objects.create(**validated_data)
     
class UserSerializer(serializers.ModelSerializer):
    user_type = serializers.ChoiceField(choices=[
                ("ADMINISTRADOR", "ADMINISTRADOR"),
                ("FUNCIONARIO", "FUNCIONARIO"),
                ("OBSERVADOR", "OBSERVADOR")
            ], required=True)
    nombre_completo = serializers.CharField()

    departamento = serializers.IntegerField(required = False)
    puesto = serializers.IntegerField(required = False)
    ubicacion = serializers.IntegerField(required = False)

    
    class Meta:
        model  = User
        fields = ['username', 'password', 'user_type',
                  'nombre_completo', 'departamento', 'puesto',
                  'ubicacion']

    def create_instance(self, validated_data:dict):
        user:User = User(
            username = validated_data.get('username'),
            password = validated_data.get('password')
        )
        user.set_password(user.password)  
        return user

class FuncionariosSerializer(serializers.ModelSerializer):

    class Meta:
        model = Funcionarios 
        fields = ['user', 'nombre_completo', 'departamento',
                  'puesto', 'ubicacion']

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

    archivo = serializers.FileField()
    creado_el = serializers.DateTimeField(required = False)

    class Meta:

        model  = Docs
        fields = ['titulo', 'tipo', 'archivo', 'creado_el']

class ReadDocSerializer(serializers.ModelSerializer):
    class Meta:
        model = Docs
        fields = ['id', 'titulo', 'tipo', 'ruta', 'creado_el']

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
    
    class Meta:
        model = Ubicaciones
        fields = ['id', 'nombre_oficial',
                  'alias', 'funcionario_id']

