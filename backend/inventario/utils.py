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
def count_files_in_directory(directory):
    count = 1
    for _, _, files in os.walk(directory):
        count += len(files)
    return count

def handle_file_directories(doc_type:str = None) -> list:
    """
        It creates a directory for the file in case that is a new product otherwise
        it returns the path for the specified product
    """
    if doc_type is None:
        absolute_path:str = f"{MEDIA_ROOT}/uploads/actas/"
        relative_path:str = f"uploads/actas/"

    if doc_type == "ubicacion_img":
        absolute_path:str = f"{MEDIA_ROOT}/uploads/ubicaciones/"
        relative_path:str = f"uploads/ubicaciones/"
 
    if os.path.exists(absolute_path):
        return [relative_path, absolute_path]

    os.makedirs(absolute_path)
    return [relative_path, absolute_path]

def handle_uploaded_file(files: list, doc_type:str = None) -> str:
    """
        This method is just for saving the file following this structure:
        uploads/{model pk}/{file_name.ext}
    """
    
    paths_list = handle_file_directories(doc_type = doc_type)
    absolute_path = paths_list[1] 
    relative_path = paths_list[0]

    if doc_type is None: 
        for file in files:
            relative_path = os.path.join(relative_path, str(file))
            path_to_write = os.path.join(absolute_path, str(file)) 
            with open(path_to_write, 'wb') as destination: 
                for chunk in file.chunks():
                    destination.write(chunk)

    if doc_type == "ubicacion_img":
        img_name = "img"
        count = count_files_in_directory(directory = absolute_path)

        for file in files:
            ext = str(file).split(".")[1]  
            relative_path = os.path.join(relative_path, f"{img_name}{count}.{ext}")
            path_to_write = os.path.join(absolute_path, f"{img_name}{count}.{ext}")  
            
            with open(path_to_write, 'wb') as destination: 
                for chunk in file.chunks():
                    destination.write(chunk)
            
            count+=1 

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
                        status = status.HTTP_200_OK)
    
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
    def all_observaciones(self) -> Response:
        observacion = Observaciones.objects.all()
        serializer = ObservacionesSerializer(instance = observacion, many = True)
        return Response(serializer.data, status = status.HTTP_200_OK)

    def get_observacion_by_id_registro(self, activo:str) -> Response: 
        try:
            observacion = Observaciones.objects.filter(activo = activo) 
        except Observaciones.DoesNotExist:
            return Response({"error": "observacion does not exist"}, status = status.HTTP_404_NOT_FOUND)
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
    #Metodos para el HTTP GET--------------------------------

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
                user.is_superuser = True 

            if user_type == 'FUNCIONARIO':
                content = {
                    "username": None,
                    "user_type": None,
                    "full_name": None,
                    "department": None, 
                    "location": None,
                    "position_title": None
                } 
                user.is_staff = True
                user.is_superuser = False 
                user.save()
                data = serializer.validated_data | {"user": user.pk}
                funcionario_serializer= FuncionariosSerializer(data = data)  
                if funcionario_serializer.is_valid():
                    
                    if 'ubicacion' in funcionario_serializer.validated_data:
                        ubicacion = funcionario_serializer.validated_data['ubicacion'] 
                        funcionario_serializer.validated_data.pop('ubicacion')
                    else:
                        content.pop('location')

                    validated_data = funcionario_serializer.validated_data
                    funcionario:Funcionarios = funcionario_serializer.create(validated_data) 
                    data = funcionario_serializer.data | serializer.data
                    
                    content['username'] = user.username 
                    content['user_type'] = 'Funcionario'
                    content['full_name'] = str(funcionario.nombre_completo)
                    content['department'] = str(funcionario.departamento)
                    content['position_title'] = str(funcionario.puesto)

                    if 'location' in content:
                        content['location'] = str(ubicacion)

                    return Response(content,
                                    status = status.HTTP_200_OK)
               
                User.objects.get(pk = user.pk).delete() 
                return Response(funcionario_serializer.errors)

            return Response(serializer.validated_data, 
                            status = status.HTTP_200_OK) 
   
        return Response(serializer.errors,
                         status = status.HTTP_200_OK)
  
      
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
class CierreInventarioActions():
    #Metodos para el HTTP GET---------------------------------
    def cierre_by_pk(self, pk) -> Response:
        try:
            cierre = CierreInventario.objects.get(id = pk)
            context = {
            "id": cierre.id,
            "funcionario": str(cierre.funcionario.nombre_completo),
            "ubicacion": str(cierre.ubicacion),
            "tipo_revision": str(cierre.tipo_revision),
            "fecha": cierre.fecha,
            "finalizado": cierre.finalizado   
            }
                
        except CierreInventario.DoesNotExist:
            return Response({"error": "cierre inventario does not exist"},
                            status = status.HTTP_404_NOT_FOUND)

        return Response(context, 
                        status = status.HTTP_200_OK)

    def all_cierres(self) -> Response:
        try: 
            cierres = CierreInventario.objects.all()
            serializer = ReadCierreInventarioSerializer(instance = cierres,
                                                    many = True) 
        except CierreInventario.DoesNotExist:
            return Response({"error": "cierre inventario db is empty"},
                            status = status.HTTP_404_NOT_FOUND)
        return Response(serializer.data, 
                        status = status.HTTP_200_OK)

    
    #Metodos para el HTTP POST--------------------------------
    def nuevo_cierre(self, request):
        serializer = CierreInventarioSerializer(data = request.data)
        if serializer.is_valid():
            cierre = serializer.create(serializer.validated_data)
            serializer = CierreInventarioSerializer(instance = cierre)
            return Response(serializer.data, 
                            status = status.HTTP_200_OK) 
        return Response(serializer.errors,
                        status = status.HTTP_400_BAD_REQUEST)

    #Metodos para el HTTP UPDATE-------------------------------
    def update_cierre(self, request, pk:int) -> Response:
        data = request.data
        serializer = CierreInventarioSerializer(data = data)
        try:
            cierre = CierreInventario.objects.get(id = pk)

        except CierreInventario.DoesNotExist:
            return Response({"error": "cierre inventario does not exist"},
                            status = status.HTTP_404_NOT_FOUND)
            

        if serializer.is_valid():
            cierre:CierreInventario = serializer.update(instance = cierre,
                                                        validated_data= serializer.validated_data)
            cierre.save()
            serializer = ReadCierreInventarioSerializer(instance = cierre)  
            return Response(serializer.data) 

        return Response(serializer.errors)

    #Metodos para el HTTP DELETE-------------------------------
    def delete_cierre(self, pk:int) -> Response:
        try: 
            cierre = CierreInventario.objects.get(id = pk)
            cierre.delete()
        except CierreInventario.DoesNotExist:
            return Response({"error": "cierre inventario db is empty"},
                            status = status.HTTP_404_NOT_FOUND)

        return Response({"status": "entry was deleted"}, 
                        status = status.HTTP_200_OK)

#--------------------------------------------------------    
class RevisionesActions():

    #Metodos para el HTTP GET---------------------------------
    def revision_by_id(self, pk:int) -> Response:
        try: 
            revision = Revisiones.objects.get(id = pk)
            serializer = RevisionesSerializer(instance = revision)

        except Revisiones.DoesNotExist:
            return Response({"error": "revision does not exist"},
                            status = status.HTTP_404_NOT_FOUND)

        return Response(serializer.data, 
                        status = status.HTTP_200_OK)

    def revision_by_no_existe(self) -> Response:
        try: 
            revisiones = Revisiones.objects.filter(status = "NO EXISTE")
            serializer = RevisionesSerializer(instance = revisiones, 
                                            many = True)

        except Revisiones.DoesNotExist:
            return Response({"error": "there are not 'revisiones' with status 'NO EXISTE'"},
                            status = status.HTTP_404_NOT_FOUND)
        return Response(serializer.data, 
                        status = status.HTTP_200_OK)

    def all_revisiones(self) -> Response:
        try:
            revisiones = Revisiones.objects.all()
            serializer = RevisionesSerializer(instance = revisiones,
                                              many = True)
        except Revisiones.DoesNotExist:
            return Response({"error": "there are not 'revisiones'"},
                            status = status.HTTP_404_NOT_FOUND)

        return Response(serializer.data,
                        status = status.HTTP_200_OK)

    #Metodos para el HTTP POST--------------------------------
    def nueva_revision(self, request) -> Response:
        serializer = RevisionesSerializer(data = request.data)

        if serializer.is_valid():
            if serializer.validated_data["status"] == "NO EXISTE" and "nota" not in serializer.validated_data:
                return Response({"error": "field 'nota' is required"})
            revision = serializer.create(serializer.validated_data)

            return Response(serializer.data, 
                            status = status.HTTP_200_OK)

        return Response(serializer.errors,
                        status = status.HTTP_400_BAD_REQUEST)

    #Metodos para el HTTP PATCH----------------------------------
    def update_revision(self, request, pk:int) -> Response:
        data = request.data
        serializer = RevisionesSerializer(data = data)

        try:
            cierre = Revisiones.objects.get(id = pk)

        except Revisiones.DoesNotExist:
            return Response({"error": "revisiones does not exist"},
                            status = status.HTTP_404_NOT_FOUND)
            

        if serializer.is_valid():
            revision:Revisiones = serializer.update(instance = cierre,
                                                    validated_data= serializer.validated_data)
            revision.save()
            serializer = RevisionesSerializer(instance = cierre)  
            return Response(serializer.data) 

        return Response(serializer.errors)

    #Metodos para el HTTP DELETE---------------------------------
    def delete_revision_by_id(self, pk:int) -> Response:
        try: 
            revision = Revisiones.objects.get(id = pk)
            revision.delete() 

        except Revisiones.DoesNotExist:
            return Response({"error": "revision does not exist"},
                            status = status.HTTP_404_NOT_FOUND)

        return Response({"status": "revision has been deleted"}, 
                        status = status.HTTP_200_OK)

class UbicacionesActions:

   #Metodos para el HTTP GET---------------------------------
   def ubicacion_by_id(self, pk:int) -> Response:
        try: 
            ubicacion = Ubicaciones.objects.get(id = pk)
            serializer = UbicacionesSerializer(instance = ubicacion)

        except Ubicaciones.DoesNotExist:
            return Response({"error": "ubicacion does not exist"},
                            status = status.HTTP_404_NOT_FOUND)

        return Response(serializer.data, 
                        status = status.HTTP_200_OK)

   #Metodos para el HTTP POST--------------------------------
   def nueva_ubicacion(self, request) -> Response:
        serializer = UbicacionesSerializer(data = request.data)

        if serializer.is_valid():
            nombre_oficial =serializer.validated_data["nombre_oficial"]
            
            files:list = request.FILES.getlist('img_path') 
            ruta:str = handle_uploaded_file(files, "ubicacion_img") if files != [] else None 
            

            if "alias" not in serializer.validated_data:
                serializer.validated_data["alias"] = nombre_oficial

            if "img_path" in serializer.validated_data:
                serializer.validated_data["img_path"] = ruta

            
            ubicacion = serializer.create(serializer.validated_data)
            serializer = ReadUbicacionesSerializer(instance = ubicacion)

            return Response(serializer.data, 
                            status = status.HTTP_200_OK)

        return Response(serializer.errors,
                        status = status.HTTP_400_BAD_REQUEST)
   
   #FALTA PATCH Y DELETE


