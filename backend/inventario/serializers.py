from django.contrib.auth.models     import User
from inventario.models              import *
from rest_framework                 import serializers
from rest_framework.exceptions      import ValidationError
from inventario._utils              import handle_uploaded_file
from django.core.files.uploadedfile import InMemoryUploadedFile
import os
from sgica.settings                 import MEDIA_ROOT

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
                  'ubicacion_actual', 'precio', 'baja', 'placa'] 
    
class ReadActivoSerializerComplete(serializers.ModelSerializer):
    ubicacion_original = serializers.SerializerMethodField()
    ubicacion_actual = serializers.SerializerMethodField()
    modo_adquisicion = serializers.SerializerMethodField()

    class Meta:
        model = Activos
        fields = [
            'id', 'id_registro', 'asiento', 'no_identificacion',
            'descripcion', 'marca', 'modelo', 'serie', 'estado',
            'ubicacion_original', 'ubicacion_actual', 'modo_adquisicion',
            'precio', 'conectividad', 'seguridad', 'placa','baja', 'fecha'
        ]

    def get_ubicacion_original(self, obj):
        if obj.ubicacion_original:
            return {
                "id": obj.ubicacion_original.id,
                "nombre_oficial": str(obj.ubicacion_original)
            }
        return None

    def get_ubicacion_actual(self, obj):
        if obj.ubicacion_actual:
            return {
                "id": obj.ubicacion_actual.id,
                "nombre_oficial": str(obj.ubicacion_actual)
            }
        return None

    def get_modo_adquisicion(self, obj):
        if obj.modo_adquisicion:
            return {
                "id": obj.modo_adquisicion.id,
                "descripcion": str(obj.modo_adquisicion)
            }
        return None

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
    
#class UpdateUserSerializer(serializers.Serializer):
#    username = serializers.CharField(required = False)
#    password = serializers.CharField(required = False)
#    nombre_completo = serializers.CharField(required = False)

class FuncionariosSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    departamento_descripcion = serializers.CharField(source='departamento.descripcion', read_only=True)
    puesto_descripcion = serializers.CharField(source='puesto.descripcion', read_only=True)
    
    class Meta:
        model = Funcionarios 
        fields = ['id', 'user', 'username', 'nombre_completo', 'departamento', 'departamento_descripcion',
                  'puesto', 'puesto_descripcion']

class UpdateUserSerializer(serializers.Serializer):
    #auth_user fields
    username = serializers.CharField(required = False, max_length = 150)

    password = serializers.CharField(required = False, max_length = 128, allow_null = True, allow_blank = True)

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

    def update(self, instance: User, validated_data: dict) -> User:
        funcionarios_keys = ['nombre_completo', 'user_id',
                             'departamento', 'puesto'] 
        check_for_password = validated_data.get("password", None)
        new_username = validated_data.get("username", instance.username)

        if new_username != instance.username and User.objects.filter(username = new_username).exists():
            raise ValidationError({"error": "El usuario ya es utilizado por otro Usuario"})

        instance.username = new_username 

        if check_for_password is not None:
            instance.set_password(check_for_password)

        
        update_funcionario = self.check_keys(dictionary = validated_data, required_keys = funcionarios_keys)

        if update_funcionario: 
            try: 
                funcionario: Funcionarios = Funcionarios.objects.get(id = instance.funcionario_id)
                new_user_id = validated_data.get("user_id", funcionario.user_id)

                if new_user_id != funcionario.user_id and Funcionarios.objects.filter(user_id = new_user_id).exists():
                    raise ValidationError({"error": "user_id already in use by another funcionario"})
                funcionario.user_id         = new_user_id
                funcionario.nombre_completo = validated_data.get("nombre_completo", funcionario.nombre_completo) 
                funcionario.departamento    = validated_data.get("departamento", funcionario.departamento)
                funcionario.puesto          = validated_data.get("puesto", funcionario.puesto) 
                funcionario.save() 
            except Funcionarios.DoesNotExist:
                raise ValidationError({"error": "funcionario does not exist, delete extra fields"})
            
        print(vars(instance))
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

class ActaBajaSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only = True)
    no_identificacion = serializers.CharField(read_only = True)
    descripcion = serializers.CharField(read_only = True)
    marca = serializers.CharField(read_only = True)
    modelo = serializers.CharField(read_only = True)
    serie = serializers.CharField(read_only = True)
    obsolencia = serializers.BooleanField(read_only = True)
    inservibilidad = serializers.BooleanField(read_only = True)
 
class DocSerializer(serializers.ModelSerializer):

    archivo = serializers.FileField(write_only = True,
                                    required = False)
    creado_el = serializers.DateTimeField(read_only = True)  

    class Meta:
        model  = Docs
        fields = ['titulo', 'tipo', 'ruta', 'archivo','creado_el']
    
    def is_valid(self, *, raise_exception=False) -> bool:#, impreso
        valid: bool = super().is_valid(raise_exception=raise_exception)

        if not valid:
            return valid

        #is_file_type_pdf:bool    = self.validated_data.get("TIPO") == 'PDF' 
        #is_impreso_not_none:bool = impreso is None
 
        #if  is_file_type_pdf and is_impreso_not_none:
        #    self._errors["field_required"] = ["field 'impreso' is required"]
        #    return False

        return valid

    def create(self, validated_data:dict):
        validated_data.pop('archivo', None)
        return super().create(validated_data)
    
    def update(self, instance:Docs, validated_data:dict):
        validated_data.pop('archivo', None)
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
    funcionario_nombre = serializers.CharField(source='funcionario.nombre_completo', read_only=True)
    ubicacion_nombre = serializers.CharField(source='ubicacion.nombre_oficial', read_only=True)
    class Meta:
        model = CierreInventario
        fields = ['id', 'tipo_revision', 'funcionario', 'funcionario_nombre',
                  'ubicacion', 'ubicacion_nombre', 'fecha', 'finalizado']
        read_only_fields = ['id']

class ReadCierreInventarioSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only = True)
    funcionario = serializers.CharField(read_only = True)
    funcionario_nombre = serializers.CharField(source="funcionario.nombre_completo", read_only=True)
    ubicacion = serializers.CharField(read_only = True)
    ubicacion_nombre = serializers.CharField(source="ubicacion.nombre_oficial", read_only=True)
    tipo_revision = serializers.CharField(read_only = True)
    fecha = serializers.CharField(read_only = True)
    finalizado = serializers.BooleanField(read_only = True)
      
class RevisionesSerializer(serializers.ModelSerializer):
    cierre_inventario = CierreInventarioSerializer(source='cierre_inventario_id', read_only=True)
    no_identificacion = serializers.CharField(source='id_registro.no_identificacion', read_only=True)
    descripcion = serializers.CharField(source='id_registro.descripcion', read_only=True)
    marca = serializers.CharField(source='id_registro.marca', read_only=True)
    modelo = serializers.CharField(source='id_registro.modelo', read_only=True)
  
    class Meta:
        model = Revisiones
        fields = ['id', 'id_registro', 'status',
                  'fecha', 'nota', 'cierre_inventario_id', 'cierre_inventario', 'no_identificacion', 'descripcion', 'marca', 'modelo'] 

    def is_valid(self, *, raise_exception=False) -> bool:
        valid:bool = super().is_valid(raise_exception = raise_exception)

        if not valid:
            return valid
        
        no_existe_status:bool          = self.validated_data["status"] == "NO EXISTE"
        nota_in_validated_data:bool    = "nota" in self.validated_data

        if no_existe_status and not nota_in_validated_data:
            self._errors['field_required'] = ["field 'nota' is required"]
            return False

        return valid 

    def update(self, instance:Revisiones, validated_data:dict) -> Revisiones:
        instance = super().update(instance, validated_data)
        instance.save()
        return instance
     
class WhatTheExcelNameIs(serializers.Serializer):
    file_name = serializers.CharField()
    
    def is_valid(self, *args, **kwargs):
        valid = super().is_valid(*args, **kwargs)        
        file_name: str = self.validated_data.get("file_name") 

        if not valid:
            return valid

        if not file_name.lower().endswith('.xlsx'):
            self._errors['file_name'] = ['not .xlsx extension']
            return False

        return valid

class UbicacionesSerializer(serializers.ModelSerializer):
    img_path = serializers.FileField(required = False)
    funcionario_nombre = serializers.CharField(source='funcionario_id.nombre_completo', read_only=True)

    class Meta:
        model = Ubicaciones
        fields = ['id', 'nombre_oficial',
                  'alias', 'funcionario_id', 'funcionario_nombre',
                  'img_path']

    def create(self, ubicacion_files:list[InMemoryUploadedFile],
               validated_data: dict) -> Ubicaciones:

        nombre_oficial = validated_data["nombre_oficial"]

        if "alias" not in validated_data:
            validated_data["alias"] = nombre_oficial 

        params =   {"files": ubicacion_files,
                    "doc_type": "ubicacion_img",
                    "nombre_oficial": validated_data.get("nombre_oficial", "")} 

        ruta:str = handle_uploaded_file(**params)  

        if "img_path" in validated_data:
            validated_data["img_path"] = ruta

        ubicacion:Ubicaciones = Ubicaciones(**validated_data)
        ubicacion.save() 
        return ubicacion 

    def update(self, instance: Ubicaciones, ubicacion_files: list[InMemoryUploadedFile], validated_data: dict):
        old_folder_name: str = instance.nombre_oficial.replace(" ", "_")
        new_folder_name: str = validated_data.get('nombre_oficial', instance.nombre_oficial).replace(" ", "_")

        old_dir = os.path.join(MEDIA_ROOT, "uploads", "ubicaciones", old_folder_name)
        new_dir = os.path.join(MEDIA_ROOT, "uploads", "ubicaciones", new_folder_name) 
        relative_new_dir = os.path.join("uploads", "ubicaciones", new_folder_name)

        if not os.path.exists(old_dir):
            os.makedirs(new_dir)
            instance.img_path = relative_new_dir

        elif old_folder_name != new_folder_name:
            os.rename(old_dir, new_dir)
            instance.img_path = relative_new_dir

        files:list = ubicacion_files
        handle_uploaded_file(**{
                       "files": files,
                       "doc_type": "ubicacion_img",
                       "nombre_oficial": instance.nombre_oficial
                       })
        validated_data.pop('img_path', None)

        return super().update(instance, validated_data)


class ReadUbicacionesSerializer(serializers.ModelSerializer):
    img_path = serializers.CharField(required = False)
    funcionario_nombre = serializers.CharField(source='funcionario_id.nombre_completo', read_only=True)

    class Meta:
        model = Ubicaciones
        fields = ['id', 'nombre_oficial',
                  'alias', 'funcionario_id', 'funcionario_nombre',
                  'img_path']

class ModoAdquisicionSerializer(serializers.ModelSerializer):

    class Meta:
        model = ModoAdquisicion
        fields = ['id', 'descripcion']


class DynamicReadActivosSerializer(serializers.ModelSerializer):  
    ubicacion_original = serializers.SerializerMethodField()
    ubicacion_actual = serializers.SerializerMethodField()
    modo_adquisicion = serializers.SerializerMethodField()
    count_historial = serializers.IntegerField(read_only = True)
    ubicacion_primera = serializers.SerializerMethodField()
    has_observaciones = serializers.BooleanField(read_only = True)

    class Meta:
       model = Activos
       fields = [
            'id', 'id_registro', 'asiento', 'no_identificacion', 'descripcion',
            'marca', 'modelo', 'serie', 'estado',
            'ubicacion_original', 'modo_adquisicion', 'precio',
            'fecha', 'observacion', 'impreso',
            'ubicacion_actual', 'conectividad', 'seguridad',
            'placa', 'baja',
            'count_historial', 'ubicacion_primera', 'has_observaciones'
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

    def get_ubicacion_original(self, obj):
        return {
            'id': getattr(obj, 'ubicacion_original_id_val', None),
            'nombre_oficial': getattr(obj, 'ubicacion_original_nombre_oficial', ''),
            'alias': getattr(obj, 'ubicacion_original_alias', '')
        }

    def get_ubicacion_actual(self, obj):
        return {
            'id': getattr(obj, 'ubicacion_actual_id_val', None),
            'nombre_oficial': getattr(obj, 'ubicacion_actual_nombre_oficial', ''),
            'alias': getattr(obj, 'ubicacion_actual_alias', '')
        }

    def get_modo_adquisicion(self, obj):
        return {
            'id': getattr(obj, 'modo_adquisicion_id_val', None),
            'descripcion': getattr(obj, 'modo_adquisicion_desc', '')
        }

    def get_ubicacion_primera(self, obj):
        return {
            'id': getattr(obj, 'ubicacion_primera_id_val', None),
            'nombre_oficial': getattr(obj, 'ubicacion_primera_nombre_oficial', '')
        }

class PlantillasSerializer(serializers.ModelSerializer):

    class Meta:
        model = Plantillas
        fields = '__all__'

class HistorialDeAccesoSerializer(serializers.ModelSerializer):

    class Meta:
        model = HistorialDeAcceso
        fields = '__all__'

class HistorialUbicacionSerializer(serializers.ModelSerializer):

    class Meta:
        model = HistorialUbicacion
        fields = '__all__'

class NoIdentificacionSerializer(serializers.Serializer):
    nos_identificacion = serializers.ListField(child = serializers.CharField(),
                                min_length = 1)

class DepartamentosSerializer(serializers.ModelSerializer):

    class Meta:
        model = Departamentos
        fields = '__all__'

class PuestosSerializer(serializers.ModelSerializer):

    class Meta:
        model = Puestos
        fields = '__all__'