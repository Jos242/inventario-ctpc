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
   
    # def update(self, instance:Activos, validated_data:dict):
    #     instance.id_registro = validated_data.get('id_registro', instance.id_registro)
    #     instance.asiento = validated_data.get('asiento', instance.asiento)
    #     instance.no_identificacion = validated_data.get('no_identificacion', instance.no_identificacion)
    #     instance.descripcion = validated_data.get('descripcion', instance.descripcion)
    #     instance.marca = validated_data.get('marca', instance.marca)
    #     instance.modelo = validated_data.get('modelo', instance.modelo)
    #     instance.serie = validated_data.get('serie', instance.serie)
    #     instance.estado = validated_data.get('estado', instance.estado)
    #     instance.ubicacion = validated_data.get('ubicacion', instance.ubicacion)
    #     instance.modo_adquisicion = validated_data.get('modo_adquisicion', instance.modo_adquisicion)
    #     instance.precio = validated_data.get('precio', instance.precio)
    #     instance.creado_el = validated_data.get('creado_el', instance.creado_el)
    #     instance.save()
    #     return instance

class ReadActivoSerializerComplete(serializers.ModelSerializer):
    ubicacion_original = serializers.CharField(required = False)
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
    ubicacion = serializers.PrimaryKeyRelatedField(allow_null=True, queryset=Ubicaciones.objects.all(), required=False) 
    
    class Meta:
        model = Funcionarios 
        fields = ['user', 'nombre_completo', 'departamento',
                  'puesto', 'ubicacion']

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

class ColumnsToFilterActivosSerializer(serializers.Serializer):
    columns_list = serializers.ListField()


# class DynamicFieldsModelSerializer(serializers.ModelSerializer):
#     """
#     A ModelSerializer that takes an additional `fields` argument that
#     controls which fields should be displayed.
#     """

#     def __init__(self, *args, **kwargs):
#         # Instantiate the superclass normally
#         super(DynamicFieldsModelSerializer, self).__init__(*args, **kwargs)
#         fields = self.context['request'].query_params.get('fields')

#         if fields:
#             fields = fields.split(',')
#             # Drop any fields that are not specified in the `fields` argument.
#             allowed = set(fields)
#             existing = set(self.fields.keys())
#             for field_name in existing - allowed:
#                 self.fields.pop(field_name)

class DynamicReadActivosSerializer(serializers.ModelSerializer):
  
    ubicacion_original = serializers.CharField(required = False)
    ubicacion_actual = serializers.CharField(required = False)
    modo_adquisicion = serializers.CharField(required = False) 
  
    class Meta:
       model = Activos
       fields = ['id', 'id_registro', 'asiento', 'no_identificacion',
                  'descripcion', 'marca', 'modelo', 'serie', 'estado',
                  'ubicacion_original', 'ubicacion_actual', 'modo_adquisicion',
                  'precio', 'conectividad', 'seguridad', 'placa_impresa','de_baja', 'creado_el']

   
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


# class TestinSerializer(serializers.ModelSerializer):
    
#     class Meta:
#         model = Activos
#         fields = '__all__' 