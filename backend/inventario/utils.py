#Python clases incorporadas and others---------
import os
import xlsxwriter
#----------------------------------------------

#Django herramientas---------------------------
from django.contrib.auth import logout, login
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from sgica.settings import MEDIA_ROOT
from django.db.models import F, Value, CharField
from django.db.models.functions import Cast
from django.http import Http404
#----------------------------------------------

#Django rest frameworks herramientas-----------
from rest_framework import status
from rest_framework.response import Response
#----------------------------------------------

from .models import * 
from .serializers import * 

#Metodos globales-----------------------------------------------
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

def calculate_no_identificacion(no_identificacion: str):
    input_str = no_identificacion
    cleaned_str = input_str.replace('-', '')
    number = int(cleaned_str) + 1
    number_str = str(number)
    new_no_identificacion = number_str[:4] + '-' + number_str[4:]
    return new_no_identificacion

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

def restar_uno(id_registro:str) -> str:
    """
    Este metodo toma como param el id_registro y le resta uno,
    esto haciendo que el output sea un str valido para escribirlo
    en el excel de impresiones.
    """
    nums = id_registro.split(',')
    nums[2] = f"0{int(nums[2]) - 1}" if int(nums[2])-1 < 10 else f"{int(nums[2])-1}"
    return ",".join(nums)

def update_id_registro_and_asiento(id_registro:str) -> dict:
    """
    Este metodo toma como el param el id_registro y le resta uno,
    esto haciendo que el output sea un nuevo value valido para escri
    birlo en la base de datos.
    """
    nums = id_registro.split(",")

    if int(nums[2]) -1 < 10 and int(nums[2]) > 2:
        nums[2] = f"0{int(nums[2]) - 1}"
        return {
            "id_registro": ",".join(nums),
            "asiento": nums[2]
        }
    
    if int(nums[2]) == 2:
        nums[1] = str(int(nums[1]) -1)
        nums[2] = "41"
        return {
            "id_registro": ",".join(nums),
            "asiento": nums[2]
        }

    
    if int(nums[2]) -1 >= 10: 
        nums[2] = f"{int(nums[2]) - 1}"
        return {
            "id_registro": ",".join(nums),
            "asiento": nums[2]
        }
 


#--------------------------------------------------------------

class ActivosActions:

    def __init__(self) -> None:
        pass

#Metodos para el HTTP GET-------------------------------
    def all_activos(self) -> Response: #Working
        activos:ReadActivos = ReadActivos.objects.all().order_by('-id')
        serializer:ActivoSerializer = ActivoSerializer(instance = activos, many = True)
        return Response(serializer.data, status = status.HTTP_200_OK)

    def activos_filter_column(self) -> Response: #Working
        filter_all_activos = Activos.objects.values('id', 'id_registro', 'no_identificacion',
                                                    'descripcion', 'ubicacion').order_by('-id')
        serializer = ReadActivoSerializer(instance = filter_all_activos, many = True)
        return Response(serializer.data, status = status.HTTP_200_OK)


    def get_activo_by_id(self, pk:int) -> Response: #Working
        try:
            activo:Activos = Activos.objects.get(pk = pk)
        except Activos.DoesNotExist:
            return Response({"error": "activo does not exist"}, 
                            status = status.HTTP_404_NOT_FOUND)
        serializer:ActivoSerializer = ActivoSerializer(instance = activo)
        return Response(serializer.data,
                        status = status.HTTP_400_BAD_REQUEST)
    
    def get_activo_by_no_identificacion(self, no_identificacion:str) -> Response:
        try:
            activo:Response = Activos.objects.get(no_identificacion = no_identificacion)
            serializer:ActivoSerializer = ActivoSerializer(instance = activo) 
            return Response(serializer.data,
                            status = status.HTTP_200_OK) 

        except Activos.DoesNotExist:
            return Response({"error": "activo does not exist"},
                            status = status.HTTP_404_NOT_FOUND)

        
#--------------------------------------------------------
    
#Metodos para el HTTP POST-------------------------------
    def add_activo(self, request) -> Response: #Working
        remaining_fields = get_remaining_fields()
        print(f"remaining_fields-------\n{remaining_fields}")
        serializer = ActivoSerializer(data = request.data)
        if serializer.is_valid():
            valid_activo = serializer.data | remaining_fields
            activo = Activos(**valid_activo)
            activo.save()
            
            return Response(ReadActivoSerializer(instance = activo).data,
                            status= status.HTTP_200_OK)
        return Response(serializer.errors,
                        status = status.HTTP_400_BAD_REQUEST)
#--------------------------------------------------------

class ObservacionesActivos():
    
    def __init__(self) -> None:
        pass
#Metodos para el HTTP GET--------------------------------
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
#----------------------------------------------------------


#Metodos para el HTTP POST-------------------------------

    def add_new_observacion(self, request) -> Response:
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
            
                return Response({"error": "not able to create new observacion"})
            
            return Response(serializer.data, status = status.HTTP_200_OK)
 
        return Response(serializer.errors, status = status.HTTP_200_OK)
#----------------------------------------------------------
      
class UserActions:
     
    def __init__(self) -> None:
        pass

#Metodos para el HTTP POST-------------------------------
    def new_usuario(self, request) -> Response:
        
        serializer:UserSerializer = UserSerializer(data = request.data)
             
        if serializer.is_valid():       
            user_type:str = serializer.validated_data.get('user_type') 
            user:User = serializer.create_instance(serializer.validated_data) 

            if user_type == 'OBSERVADOR':
                user.is_staff = False
                user.is_superuser = False

            if user_type == 'ADMINISTRADOR':
                user.is_staff = False
                user.is_superuser = False

            if user_type == 'PROFESOR': 
                user.save()
                data = serializer.validated_data | {"user": user.pk}
                extra_info_serializer= ExtraInfoSerializer(data = data)
                print(extra_info_serializer) 
                
                if extra_info_serializer.is_valid():
                    validated_data = extra_info_serializer.validated_data
                    extra_info = extra_info_serializer.create(validated_data = validated_data) 
                    data = extra_info_serializer.data | serializer.data
                    
                    del data['user']
                    del data['user_type']
                    print(data) 

                    return Response(data,
                                    status = status.HTTP_200_OK)

                User.objects.get(pk = user.pk).delete() 
                return Response(extra_info_serializer.errors)

            user.save()
            print(serializer) 
            return Response(serializer.validated_data, 
                            status = status.HTTP_200_OK) 
   
        return Response(serializer.errors,
                         status = status.HTTP_200_OK)
  
    def sign_up(self, request) -> Response:
        required_keys:tuple = ("username", "password")
        
        for key in required_keys:
            if key not in request.data:
                return Response({"error": "required keys to authenticate 'username' and 'password'"})

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

    def log_out(self, request) -> Response:
        logout(request)
        return Response({"info": "you are logged out"}, status = status.HTTP_200_OK)  
#-------------------------------------------------------------

class DocsActions:

    def __init__(self) -> None:
        pass

#Metodos para el HTTP GET------------------------------- 
    def get_all_docs(self) -> Response:
        docs:Docs = Docs.objects.all()
        serializer:ReadDocSerializer= ReadDocSerializer(instance = docs,
                                               many = True)  
        return Response(serializer.data,
                    status = status.HTTP_200_OK)

    def get_doc_by_id(self, pk:int = None) -> Response:

        try:
            doc:Docs = Docs.objects.get(pk = pk)
            serializer:ReadDocSerializer = ReadDocSerializer(instance = doc)

        except Docs.DoesNotExist:
            return Response({"error": "document does not exist"},
                            status = status.HTTP_404_NOT_FOUND)

        return Response(serializer.data, 
                        status = status.HTTP_200_OK)


#Metodos para el HTTP POST-------------------------------
    def save_acta(self, request) -> Response:
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

    def create_print_doc(self, request) -> Response:
        serializer = WhatTheExcelNameIs(data = request.data)
        # resultados = (Activos.objects.filter(impreso=0)
        #       .annotate(origen=Value('activos', output_field=CharField())) 
        #       .values('id_registro', 'asiento', 'origen')
        #       .union(
        #           Observaciones.objects.filter(impreso=0)
        #           .annotate(origen=Value('observaciones', output_field=CharField())) 
        #           .values('id_registro', 'asiento', 'origen')
        #       )
        #       .order_by('id_registro'))
        

        query_activos = Activos.objects.filter(impreso=0) \
                               .annotate(origen=Value('activos', output_field=CharField())) \
                               .values('id_registro', 'asiento', 'origen', 'descripcion')

        # Query for Observaciones
        query_observaciones = Observaciones.objects.filter(impreso=0) \
                                                .annotate(origen=Value('observaciones', output_field=CharField())) \
                                                .values('id_registro', 'asiento', 'origen', 'descripcion')

        # Combine both queries using union
        resultados = query_activos.union(query_observaciones).order_by('id_registro')
        
        only_activos = 1
        only_observaciones = 2
        list_decide = []

        for result in list(resultados[:41]):
            if result['origen'] == 'observaciones':
                list_decide.append(only_observaciones)
            if result['origen'] == 'activos':
                list_decide.append(only_activos)

        
        if(x == 1 for x in list_decide):
            print_type = "SoloActivos"
        
        if(x == 2 for x in list_decide):
            print_type = "SoloObservaciones"

        count_1 =  list_decide.count(1)
        count_2 =  list_decide.count(2)

        if count_1 > 0 and count_2 > 0:
            print_type = "ObservacionesYActivos"

        print(print_type)      
        print(list_decide) 
        to_print_values = list(resultados[:41])



        if serializer.is_valid():
            file_name:str = serializer.validated_data.get("file_name")
            
            if '.xlsx' not in file_name:
                return Response({"error": "add file extension '.xlsx' to the 'file_name' value"},
                                status = status.HTTP_400_BAD_REQUEST)
 
            path_to_save = os.path.join(MEDIA_ROOT, 'documentos_de_impresion' ,file_name)
            bold_param = {'bold': True}
            center_text_param = {'align': 'center'}
            font_type = {'font_name': 'Arial'}
            font_size = {'font_size': 11}

            if print_type == "SoloActivos":
                activos = Activos.objects.filter(impreso = False).values('id_registro', 'asiento', 'no_identificacion', 
                                                                         'descripcion', 'marca', 'modelo', 'serie')
                activos_list = list(activos) 
                workbook = xlsxwriter.Workbook(path_to_save)
                worksheet = workbook.add_worksheet()
                #Para aumentar el ancho de la columna-------------------------------------
                worksheet.set_column('A:A', 14.57) 
                worksheet.set_column('B:B', 2.29) 
                worksheet.set_column('C:C', 16.86) 
                worksheet.set_column('D:D', 20.29) 
                worksheet.set_column('E:E', 11.86) 
                worksheet.set_column('F:F', 17.57)
                worksheet.set_column('G:G', 19.71) 
                #Crea un objeto 'Format' para dar formato al texto------------------------
                bold = workbook.add_format({'bold': True})
                counter = 1

                for activo in activos_list:
                    if counter == 1:
                        worksheet.write(f'A1', "Registrado en",
                                        workbook.add_format(bold_param | center_text_param |
                                                            font_type | font_size))
                        worksheet.write(f'B1', "1", 
                                        workbook.add_format(bold_param | center_text_param))
                                        
                        worksheet.write(f'C1', "No. Identificacion", 
                                        workbook.add_format(bold_param | center_text_param))
                        worksheet.write(f'D1', "Descripción", bold)
                        worksheet.write(f'E1', "Marca", bold)
                        worksheet.write(f'F1', "Modelo", bold)
                        worksheet.write(f'G1', "Serie", bold)
                        counter += 1
                        continue

                    worksheet.write(f'A{counter}', activo['id_registro'], 
                                    workbook.add_format(center_text_param | font_type | font_size))
                    worksheet.write(f'B{counter}', activo['asiento'],
                                    workbook.add_format(bold_param | center_text_param))
                    worksheet.write(f'C{counter}', activo['no_identificacion'],
                                    workbook.add_format(center_text_param))
                    worksheet.write(f'D{counter}', activo['descripcion'])
                    worksheet.write(f'E{counter}', activo['marca'])
                    worksheet.write(f'F{counter}', activo['modelo'])
                    worksheet.write(f'G{counter}', activo['serie'])
                    counter += 1

                workbook.close()
                Activos.objects.filter(impreso = False).update(impreso = True)  
                return Response({"success": f"go to '/media/documentos_de_impresion/{file_name}/' to download the file"},
                                status = status.HTTP_200_OK)

            if print_type == "SoloObservaciones":
                workbook = xlsxwriter.Workbook(path_to_save) 
                worksheet = workbook.add_worksheet() 
                observaciones_list:list = to_print_values 
                
                if len(observaciones_list) < 41:
                    return Response({"error": "not enough entries to create 'tabla de impresiones'"},
                                    status = status.HTTP_400_BAD_REQUEST)
                print(observaciones_list) 

                #Para aumentar el ancho de la columna-------------------------------------
                worksheet.set_column('A:A', 14.57) 
                worksheet.set_column('B:B', 2.29) 
                worksheet.set_column('C:C', 86.29) 
                worksheet.set_column('D:D', 20.29) 
                worksheet.set_column('E:E', 11.86) 
                worksheet.set_column('F:F', 17.57)
                worksheet.set_column('G:G', 19.71)
                counter:int = 1
                
                for observacion in observaciones_list:
                    obs:Observaciones = Observaciones.objects.get(id_registro = observacion['id_registro']) 
                    new_id_registro = restar_uno(observacion['id_registro'])
                    new_asiento = int(observacion['asiento'] -1) 
         
                    if int(observacion['asiento']) == 2 and counter > 30:
                        nums = observacion['id_registro'].split(',') 
                        nums[2] = "41"
                        nums[1] = f"{int(nums[1]) - 1}"
                        result =  ",".join(nums)
                        print(observacion['id_registro'])
                        print(nums[1]) 
                        worksheet.write(f'A{counter}', result,
                                    workbook.add_format(center_text_param | font_type | font_size)) 
                        worksheet.write(f'B{counter}', "41",
                                        workbook.add_format(bold_param | center_text_param))
                        worksheet.write(f'C{counter}', observacion['descripcion'])
                        obs.id_registro = result
                        obs.asiento = 41
                        obs.impreso = True 
                        obs.save()
                        last_id_registro_checked = observacion['id_registro']
                        print(last_id_registro_checked)
                        break

                    worksheet.write(f'A{counter}', new_id_registro,
                                    workbook.add_format(center_text_param | font_type | font_size))
                    worksheet.write(f'B{counter}', new_asiento,
                                    workbook.add_format(bold_param | center_text_param))

                    obs.id_registro = new_id_registro
                    obs.asiento = new_asiento
                    obs.impreso = True
                    obs.save()
                    worksheet.write(f'C{counter}', observacion['descripcion'])
                    counter += 1
 
                workbook.close()

                query_activos = Activos.objects.filter(impreso=0) \
                                    .annotate(origen=Value('activos', output_field=CharField())) \
                                    .values('id_registro', 'asiento', 'origen', 'descripcion')

                # Query for Observaciones
                query_observaciones = Observaciones.objects.filter(impreso=0) \
                                                        .annotate(origen=Value('observaciones', output_field=CharField())) \
                                                        .values('id_registro', 'asiento', 'origen', 'descripcion')

                # Combine both queries using union
                resultados = query_activos.union(query_observaciones).order_by('id_registro')
                resultados_list = list(resultados)
                for resultado in resultados_list:

                    if resultado['origen'] == 'activos':                         
                        activo:Activos = Activos.objects.get(id_registro = resultado['id_registro'])
                        updated_values = update_id_registro_and_asiento(activo.id_registro)
                        print("Estoy fallando antes de llegar aca (activos)")
                        print(resultado['id_registro'])
                        activo.id_registro = updated_values.get("id_registro")
                        activo.asiento = updated_values.get("asiento")
                        activo.save() 

                    if resultado['origen'] == 'observaciones':
                        observacion:Observaciones = Observaciones.objects.get(id_registro = resultado['id_registro'])
                        updated_values = update_id_registro_and_asiento(observacion.id_registro)
                        print("Estoy fallando antes de llegar aca (observaciones)")
                        print(resultado['id_registro'])
                        observacion.id_registro = updated_values.get("id_registro")
                        observacion.asiento = updated_values.get("asiento")
                        observacion.save()                       

                return Response({"testing": "SoloObservaciones"},
                                status = status.HTTP_200_OK)

            if print_type == "ObservacionesYActivos": 
                return Response({"testing": "ObservacionesYActivos"}, 
                                status = status.HTTP_200_OK)
    
        return Response(serializer.errors,
                        status = status.HTTP_200_OK)
#--------------------------------------------------------    
    
#--------------------------------------------------------    
