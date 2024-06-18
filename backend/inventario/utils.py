import os
#----------------------------------------------
from django.contrib.auth import logout, login
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.contrib.sessions.backends.signed_cookies import SessionStore
from sgica.settings import MEDIA_ROOT
#----------------------------------------------
from rest_framework             import status
from rest_framework.response    import Response
#----------------------------------------------
from .models import Activos, ReadActivos, Observaciones, Docs
from .serializers import *
from datetime import datetime


def handle_file_directories() -> list:
    """
        It creates a directory for the file in case that is a new product otherwise
        it returns the path for the specified product
    """

    absolute_path:str = f"{MEDIA_ROOT}/uploads/actas/"
    relative_path:str = f"uploads/actas/"
        
    if os.path.exists(absolute_path):
        return [relative_path, absolute_path]

    os.makedirs(absolute_path)
    return [relative_path, absolute_path]



def handle_uploaded_file(files: list) -> str:
    """
        This method is just for saving the file following this structure:
        uploads/{model pk}/{file_name.ext}
    """
    
    paths_list = handle_file_directories()
    absolute_path = paths_list[1] 
    relative_path = paths_list[0]
    
    for file in files:
        relative_path = os.path.join(relative_path, str(file))
        path_to_write = os.path.join(absolute_path, str(file)) 
        with open(path_to_write, 'wb') as destination: 
            for chunk in file.chunks():
                destination.write(chunk)
    
    return relative_path 

#----------------------------------------------

def get_remaining_fields():
    MAX_NUMBER = 41
    REMAINING_FIELDS = {
            "id_registro": None,
            "asiento": None,
            "no_identificacion": None
    }
    latest_activo_entry = Activos.objects.values("id", "id_registro", "no_identificacion").latest("id") 
    latest_observacion_entry = Observaciones.objects.values("id", "id_registro").latest("id")
    activo_registro = int(latest_activo_entry.get("id_registro").replace(",", ""))
    observacion_registro = int(latest_observacion_entry.get("id_registro").replace(",", "")) 
    if activo_registro > observacion_registro:
        split_registro  = latest_activo_entry.get("id_registro").split(",", 3)
    else:
        split_registro  = latest_observacion_entry.get("id_registro").split(",", 3)
    REMAINING_FIELDS["no_identificacion"] = calculate_no_identificacion(latest_activo_entry.get("no_identificacion")) 
    if int(split_registro[2]) == MAX_NUMBER:
        next_id_registro = int(f"{split_registro[0]}{split_registro[1]}")+1
        formatted_number = "{:,}".format(next_id_registro)
        REMAINING_FIELDS["asiento"] = 2
        REMAINING_FIELDS["id_registro"] = f"{formatted_number},0{REMAINING_FIELDS.get('asiento')}"
        return REMAINING_FIELDS
    next_asiento = int(split_registro[2])+1  
    REMAINING_FIELDS["asiento"] = next_asiento
    if next_asiento < 10:  
        next_id_registro = (f"{split_registro[0]},{split_registro[1]},0{next_asiento}")
        REMAINING_FIELDS["id_registro"] = next_id_registro
        return REMAINING_FIELDS
    next_id_registro = (f"{split_registro[0]},{split_registro[1]},{next_asiento}")
    REMAINING_FIELDS["id_registro"] = next_id_registro
    return REMAINING_FIELDS

#Activos related methods-----------------------------------
def calculate_no_identificacion(no_identificacion: str):
    input_str = no_identificacion
    cleaned_str = input_str.replace('-', '')
    number = int(cleaned_str) + 1
    number_str = str(number)
    new_no_identificacion = number_str[:4] + '-' + number_str[4:]
    return new_no_identificacion

def all_activos():
   activos = ReadActivos.objects.all().order_by('-id')
   serializer = ActivoSerializer(instance = activos, many = True)
   return Response(serializer.data, status = status.HTTP_200_OK)

def activos_filter_column():
    filter_all_activos = Activos.objects.values('id', 'id_registro', 'no_identificacion', 'descripcion', 'ubicacion').order_by('-id')
    serializer = ReadActivoSerializer(instance = filter_all_activos, many = True)
    return Response(serializer.data, status = status.HTTP_200_OK)


def add_activo(request):
    remaining_fields = get_remaining_fields()
    print(f"remaining_fields-------\n{remaining_fields}")
    serializer = ActivoSerializer(data = request.data)
    if serializer.is_valid():
        valid_activo = serializer.data | remaining_fields
        activo = Activos(**valid_activo)
        activo.save()
        return Response("I think that im working", status= status.HTTP_200_OK)
    return Response(serializer.errors, status = status.HTTP_400_BAD_REQUEST)
def get_activo_by_id(pk):
    try:
        activo = Activos.objects.get(pk = pk)
    except Activos.DoesNotExist:
        return Response({"error": "Activo no existe"}, status= status.HTTP_404_NOT_FOUND)
    serializer = ActivoSerializer(instance = activo)
    return Response(serializer.data, status = status.HTTP_200_OK)
#---------------------------------------------------------------
def all_observaciones() -> Response:

    observacion = Observaciones.objects.all()
    serializer = ObservacionesSerializer(instance = observacion, many = True)
    return Response(serializer.data, status = status.HTTP_200_OK)

def get_observacion_by_id_registro(activo:str) -> Response: 

    try:
        observacion = Observaciones.objects.filter(activo = activo) 
    except Observaciones.DoesNotExist:
        return Response({"error": "Observacion does not exist"}, status = status.HTTP_404_NOT_FOUND)
    serializer = ObservacionesSerializer(instance = observacion, many=True)
    return Response(serializer.data, status= status.HTTP_200_OK)

def add_new_observacion(request) -> Response:
    remaining_fields:dict = get_remaining_fields()
    remaining_fields.pop('no_identificacion')
    serializer = ObservacionesSerializer(data = request.data)
    if serializer.is_valid():
        print(f"Vengo de aqui\n{serializer}")
        serializer.validated_data.update(remaining_fields)
        try:
            observacion = serializer.create(serializer.validated_data)
            observacion.save()
        except ValueError as e:
            print(f"Error: {e}")
            return Response({"error": "Not able to create new Observacion"})
        return Response(serializer.data, status = status.HTTP_200_OK)
    return Response(serializer.errors, status = status.HTTP_200_OK)



#----------------------------------------------------------
#User related methods

def new_usuario(request) -> Response:

    serializer:UserSerializer = UserSerializer(data = request.data)
    if serializer.is_valid():
        user:User = serializer.create(serializer.validated_data)
        user.set_password(serializer.validated_data.get('password'))
        user.save()
        print(serializer) 
        return Response(serializer.validated_data, status = status.HTTP_200_OK) 
   
    return Response(serializer.errors, status = status.HTTP_200_OK)

def sign_up(request) -> Response:
    session:SessionStore = request.session
    print(f"Session information:\n {session.keys()}")
    required_keys:tuple = ("username", "password")
    for key in required_keys:
        if key not in request.data:
            return Response({"error": "Required keys to authenticate 'username' and 'password'"})

    serializer:ReadUserSerializer = ReadUserSerializer(data = request.data) 
    if serializer.is_valid():
        username = serializer.validated_data.get("username")
        password = serializer.validated_data.get("password")
        print(f"Username: {username}")
        print(f"Password: {password}")
        user:User = authenticate(username = username, password = password)
        if user is None:
            return Response({"error": "could not authenticate the user"})
        login(request, user) 
        serializer_1:UserSerializer = UserSerializer(instance = user)
        return Response(serializer_1.data, status = status.HTTP_200_OK)   
    return Response(serializer.errors, status= status.HTTP_400_BAD_REQUEST)

def log_out(request) -> Response:
    logout(request)
    return Response({"info": "you are logged out"}, status = status.HTTP_200_OK) 

#Docs related methods-------------------------------------------

def save_acta(request) -> Response:

    #Required fields -> Titulo, Tipo, archivo
    print(request.data)
    serializer:DocSerializer = DocSerializer(data = request.data)  
    if serializer.is_valid():
        files:list = request.FILES.getlist('archivo')
        ruta:str = handle_uploaded_file(files)

        modified_data_serializer:dict = dict(serializer.data)
        del modified_data_serializer['archivo']
        modified_data_serializer['ruta'] = ruta 
        titulo:str = modified_data_serializer.get('titulo')
        tipo:str = modified_data_serializer.get('tipo')
        
        doc = Docs(titulo = titulo,
                   tipo = tipo,
                   ruta = ruta)  
        doc.save()
        return Response(serializer.data, 
                        status = status.HTTP_200_OK)
    
    
    return Response(serializer.errors, 
                    status = status.HTTP_400_BAD_REQUEST)





    serializer:DocSerializer = DocSerializer(data = request.data)
    if serializer.is_valid():
        doc = serializer.create(serializer.validated_data)
        doc = Docs.objects.get(pk = doc.id)
        serializer = DocSerializer(instance = doc)
        
        return Response(serializer.data, 
                        status = status.HTTP_200_OK)

    return Response(serializer.errors, 
                    status = status.HTTP_400_BAD_REQUEST)
    
def get_all_docs() -> Response:

    docs:Docs = Docs.objects.all()
    serializer:ReadDocSerialiazer = ReadDocSerializer(instance = docs,
                                               many = True)  
    return Response(serializer.data,
                    status = status.HTTP_200_OK)

def get_doc_by_id(pk:int = None) -> Response:

    try:

        doc:Docs = Docs.objects.get(pk = pk)
        serializer:ReadDocSerializer = ReadDocSerializer(instance = doc)

    except Docs.DoesNotExist as ddne:

        return Response({"error": "document does not exist"},
                        status = status.HTTP_404_NOT_FOUND)

    return Response(serializer.data, 
                    status = status.HTTP_200_OK)

