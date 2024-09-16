from django.contrib.auth.models import User
from inventario.models import *
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

class ActivoSerializer(serializers.ModelSerializer):
    id_registro = serializers.CharField(required = False)
    asiento = serializers.IntegerField(required = False)
    no_identificacion = serializers.CharField(required = False) 
    
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
                  'ubicacion_actual', 'precio', 'baja'] 
    
class ReadActivoSerializerComplete(serializers.ModelSerializer):
    ubicacion_original = serializers.CharField(required = False)
    ubicacion_actual = serializers.CharField(required = False)
    modo_adquisicion = serializers.CharField(required = False)

    class Meta:
        model = Activos
        fields = ['id', 'id_registro', 'asiento', 'no_identificacion',
                  'descripcion', 'marca', 'modelo', 'serie', 'estado',
                  'ubicacion_original', 'ubicacion_actual', 'modo_adquisicion',
                  'precio', 'conectividad', 'seguridad', 'placa','baja', 'fecha']

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

    def update(self, instance, validated_data):
        return 1
    
class UpdateUserSerializer(serializers.Serializer):
    username = serializers.CharField(required = False)
    password = serializers.CharField(required = False)
    nombre_completo = serializers.CharField(required = False)

class FuncionariosSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Funcionarios 
        fields = ['user', 'nombre_completo', 'departamento',
                  'puesto']

class UpdateUserSerializer(serializers.Serializer):
    #auth_user fields
    username = serializers.CharField(required = False, max_length = 150)

    password = serializers.CharField(required = False, max_length = 128)

    #funcionarios fields
    user_id = serializers.PrimaryKeyRelatedField(queryset = User.objects.all(),
                                                 required = False)
    nombre_completo = serializers.CharField(required = False)
    departamento = serializers.PrimaryKeyRelatedField(queryset = Departamentos.objects.all(),
                                                      required = False)
    puesto = serializers.PrimaryKeyRelatedField(queryset = Puestos.objects.all(),
                                                required = False)
 

    def validate(self, attrs):
        if not attrs:
            raise ValidationError("no data or not valid fields")  
        return attrs 

    def update(self, instance:User, validated_data:dict) -> User:
        funcionarios_keys = ['nombre_completo', "user_id",
                             "departamento", "puesto"] 
        check_for_password = validated_data.get("password", None)
        new_username = validated_data.get("username", instance.username)

        if new_username != instance.username and User.objects.filter(username = new_username).exists():
            raise ValidationError({"error": "username already in use by another user"})

        instance.username = new_username 

        if check_for_password is not None:
            instance.set_password(check_for_password)

        

        update_funcionario = self.check_keys(dictionary = validated_data,
                                             required_keys = funcionarios_keys)

        if update_funcionario: 
            try: 
                funcionario:Funcionarios    = Funcionarios.objects.get(user_id = instance.id)
                new_user_id = validated_data.get("user_id", funcionario.user_id)

                if new_user_id != funcionario.user_id and Funcionarios.objects.filter(user_id = new_user_id).exists():
                    raise ValidationError({"error": "user_id already in use by another funcionario"})

                funcionario.user = new_user_id
                funcionario.nombre_completo = validated_data.get("nombre_completo", funcionario.nombre_completo) 
                funcionario.departamento    = validated_data.get("departamento", funcionario.departamento)
                funcionario.puesto          = validated_data.get("puesto", funcionario.puesto) 
                funcionario.save() 
            except Funcionarios.DoesNotExist:
                raise ValidationError({"error": "funcionario does not exist, delete extra fields"})

        instance.save()  
        return instance

    def check_keys(self, dictionary:dict, required_keys:list) -> bool:
        return any([key in dictionary for key in required_keys])



class ReadFuncionariosSerializer(serializers.ModelSerializer):
    user = serializers.CharField(required = False)
    class Meta:
        model = Funcionarios
        fields = '__all__' 


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
    
    def is_valid(self, *args, **kwargs):
        valid = super().is_valid(*args, **kwargs)        
        init_vals:dict = self.get_initial()
        file_name:str = init_vals.get("file_name") 

        if valid: 
            file_name = self.validated_data.get('file_name', '')
            if not file_name.lower().endswith('.xlsx'):
                self._errors['file_name'] = ['El archivo debe tener la extensión .xlsx']
                return False

        return valid

class UbicacionesSerializer(serializers.ModelSerializer):
    img_path = serializers.FileField(required = False)

    class Meta:
        model = Ubicaciones
        fields = ['id', 'nombre_oficial',
                  'alias', 'funcionario_id',
                  'img_path']
    def update(self, instance, validated_data):
        validated_data.pop('img_path', None)
        return super().update(instance, validated_data)

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
            'fecha', 'observacion', 'impreso',
            'ubicacion_actual_alias', 'conectividad', 'seguridad',
            'placa', 'baja'
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
        fields = '__all__'

class NoIdentificacionSerializer(serializers.Serializer):
    nos_identificacion = serializers.ListField(child = serializers.CharField(),
                                min_length = 1)
