#std python classes and others-----------------
from http.client import ResponseNotReady
import io
import os
from typing import Any
import xlsxwriter
#----------------------------------------------

#Django herramientas---------------------------
from django.contrib.auth.models import User
from sgica.settings import BASE_DIR, MEDIA_ROOT
from django.db.models import F, Value, CharField, OuterRef, Subquery, Func
from django.db.models.functions import Coalesce
from django.http import HttpResponse
from django.db.models.query import QuerySet
#----------------------------------------------

#Django rest frameworks herramientas-----------
from rest_framework import status
from rest_framework.response import Response
from rest_framework.request import Request
#----------------------------------------------

from .models import * 
from .serializers import * 

#Metodos globales-----------------------------------------------
def count_files_in_directory(directory):
    count = 1
    for _, _, files in os.walk(directory):
        count += len(files)
    return count

def handle_file_directories(doc_type:str = None, folder_name:str = None) -> list:
    """
        It creates a directory for the file in case that is a new product otherwise
        it returns the path for the specified product
    """
    if doc_type is None:
        absolute_path:str = f"{MEDIA_ROOT}/uploads/actas/"
        relative_path:str = f"uploads/actas/"

    if doc_type == "ubicacion_img":
        absolute_path:str = f"{MEDIA_ROOT}/uploads/ubicaciones/{folder_name}/"
        relative_path:str = f"uploads/ubicaciones/{folder_name}/"
 
    if os.path.exists(absolute_path):
        return [relative_path, absolute_path]

    os.makedirs(absolute_path)
    return [relative_path, absolute_path]

def handle_uploaded_file(files: list, doc_type:str = None, **kwargs) -> str:
    """
        This method is just for saving the file following this structure:
        uploads/{model pk}/{file_name.ext}
    """

    nombre_oficial:str = kwargs.get("nombre_oficial", "")
    nombre_oficial = nombre_oficial.replace(" ", "_") if nombre_oficial != "" else ""
       
    paths_list = handle_file_directories(doc_type = doc_type,
                                         folder_name = nombre_oficial)
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
            path_to_write = os.path.join(absolute_path,
                                         f"{img_name}{count}.{ext}")  
            
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




#--------------------------------------------------------------
class ActivosActions():

    def __init__(self) -> None:
        pass

    def activos_filter_column(self) -> Response: 
        filter_all_activos = Activos.objects.only('id', 'id_registro', 'no_identificacion',
                                                  'descripcion','ubicacion_original')\
                                                   .order_by('-id')

        serializer = ReadActivoSerializerIncomplete(instance = filter_all_activos,
                                                    many = True)
        return Response(serializer.data,
                        status = status.HTTP_200_OK)

    def get_activo_by_id(self, pk:int) -> Response: 
        try:
            activo:Activos = Activos.objects.get(pk = pk)
        except Activos.DoesNotExist:
            return Response({"error": "activo does not exist"}, 
                            status = status.HTTP_404_NOT_FOUND)

        serializer = ReadActivoSerializerComplete(instance = activo)

        return Response(serializer.data,
                        status = status.HTTP_200_OK)
    
    def get_activo_by_no_identificacion(self, no_identificacion:str) -> Response:
        try:
            activo:Response = Activos.objects.get(no_identificacion = no_identificacion)
            serializer = ReadActivoSerializerComplete(instance = activo) 
            return Response(serializer.data,
                            status = status.HTTP_200_OK) 

        except Activos.DoesNotExist:
            return Response({"error": "activo does not exist"},
                            status = status.HTTP_404_NOT_FOUND)

    def get_activo_by_ubicacion_id(self, ubicacion_actual:int):
        try:
            activo:Activos = Activos.objects.filter(ubicacion_actual = ubicacion_actual)
        except Activos.DoesNotExist:
            return Response({"error": "activo does not exist"}, 
                            status = status.HTTP_404_NOT_FOUND)

        print("Llegue antes del serializer")
        serializer = ReadActivoSerializerComplete(instance = activo,
                                                  many = True)

        return Response(serializer.data,
                        status = status.HTTP_200_OK)

    def get_excel_all_activos(self):
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output, {"in_memory": True})
        worksheet = workbook.add_worksheet()
        related_fields = ["ubicacion_actual", "modo_adquisicion"]
        annotations = {
                'ubicacion_actual_alias': F('ubicacion_actual__alias'),
                'modo_adquisicion_desc': F('modo_adquisicion__descripcion'),
        }
        RETRIEVE_FIELDS = ["id_registro", "no_identificacion",
                           "descripcion", "marca", "modelo",
                           "serie", "estado", "ubicacion_actual_alias",
                           "modo_adquisicion_desc", "precio"]
        
        EXCEL_FIELDS = ["", "No.Identificacion", "Descripción",
                        "Marca", "Modelo", "Serie", "Estado",
                        "Ubicación", "Modo de adquisición", "Precio",
                        ]

        COLUMNS = ["A1", "B1", "C1", "D1",
                   "E1", "F1", "G1", "H1",
                   "I1", "J1"]
        activos = Activos.objects.select_related(*related_fields)\
                                 .annotate(**annotations)\
                                 .values(*RETRIEVE_FIELDS)
        [worksheet.write(column, field) for column, field in zip(COLUMNS, EXCEL_FIELDS)] 

        for i, activo in enumerate(activos, start=2):
            row = [
                activo["id_registro"],
                activo["no_identificacion"],
                activo["descripcion"],
                activo["marca"],
                activo["modelo"],
                activo["serie"],
                activo["estado"],
                activo["ubicacion_actual_alias"],
                activo["modo_adquisicion_desc"],
                activo["precio"]
            ]
            worksheet.write_row(f'A{i}', row)
            
        workbook.close()
        output.seek(0)

        response = HttpResponse(output.read(), 
                            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response['Content-Disposition'] = "attachment; filename=excel_activos.xlsx"
        output.close()

        return response
  #--------------------------------------------------------
    
    #Metodos para el HTTP POST-------------------------------
    def add_activo(self, request) -> Response: #Working
        remaining_fields = get_remaining_fields() 
        serializer = ActivoSerializer(data = request.data | remaining_fields)

        if serializer.is_valid():      
            # activo:Activos = serializer.create(serializer.validated_data)
            a_ver = Activos(**serializer.validated_data)
            a_ver.save()
            print(f"a_ver:Activos id: {a_ver.id}") 
            # print(f"activo:Activos id: {activo.id}")
            # return Response(ReadActivoSerializerIncomplete(instance = activo).data,
                            # status= status.HTTP_200_OK)
            return Response("A ver")
        print(f"This are the serializer errors: \n\n{serializer.errors}") 
        return Response(serializer.errors,
                        status = status.HTTP_400_BAD_REQUEST)

    def select_columns_to_filter(self, request) -> Response:
        FIELDS = request.data.get('fields', [])
        RELATED_FIELDS = ["ubicacion_original_nombre_oficial", "ubicacion_actual_nombre_oficial", "modo_adquisicion_desc"]
        SELECT_RELATED = ['ubicacion_original', 'ubicacion_actual', 'modo_adquisicion']
        related_map = dict(zip(RELATED_FIELDS, SELECT_RELATED))
        related_fields = [related_map[column] for column in RELATED_FIELDS if column in FIELDS]
        annotations = {
                'ubicacion_original_nombre_oficial': F('ubicacion_original__nombre_oficial'),
                'ubicacion_actual_nombre_oficial': F('ubicacion_actual__nombre_oficial'),
                'modo_adquisicion_desc': F('modo_adquisicion__descripcion'),
        }

        for column in RELATED_FIELDS:
            if column not in annotations:
                del annotations[column]

        activos = Activos.objects.select_related(*related_fields) \
                                 .annotate(**annotations) \
                                 .values(*FIELDS) \
                                 .order_by('-id')
        
        serializer = DynamicReadActivosSerializer(instance = activos,
                                                  many = True, fields = FIELDS)

        return Response(serializer.data, 
                        status= status.HTTP_200_OK)

    def create_excel_by_nos_identificacion(self, request:Request) -> HttpResponse:
        serializer = NoIdentificacionSerializer(data = request.data)

        if not serializer.is_valid():
            return Response(serializer.errors,
                            status = status.HTTP_400_BAD_REQUEST)

        nos_iden_to_fetch = serializer.validated_data["nos_identificacion"]

        activos = Activos.objects.filter(no_identificacion__in = nos_iden_to_fetch).annotate(
            _ubicacion_actual=Coalesce(F('ubicacion_actual__nombre_oficial'), Value('')),
            _modo_adquisicion=Coalesce(F('modo_adquisicion__descripcion'), Value(''))
        ).values(
            'id_registro', 'no_identificacion', 'descripcion', 'marca', 'modelo', 'serie',
            'estado', '_ubicacion_actual', '_modo_adquisicion', 'precio'
        )
        if not activos:
            return Response({"data": "no valid no_identificacion in activos"},
                            status = status.HTTP_400_BAD_REQUEST) 

        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output, {"in_memory": True})
        worksheet = workbook.add_worksheet()
        
        EXCEL_FIELDS = ["", "No.Identificacion", "Descripción",
                        "Marca", "Modelo", "Serie", "Estado",
                        "Ubicación", "Modo de adquisición", "Precio",
                        ]

        COLUMNS = ["A1", "B1", "C1", "D1",
                   "E1", "F1", "G1", "H1",
                   "I1", "J1"]

        [worksheet.write(column, field) for column, field in zip(COLUMNS, EXCEL_FIELDS)] 

        for i, activo in enumerate(activos, start=2):
            row = [
                activo["id_registro"],
                activo["no_identificacion"],
                activo["descripcion"],
                activo["marca"],
                activo["modelo"],
                activo["serie"],
                activo["estado"],
                activo["_ubicacion_actual"],
                activo["_modo_adquisicion"],
                activo["precio"]
            ]
            worksheet.write_row(f'A{i}', row)
            
        workbook.close()
        output.seek(0)

        response = HttpResponse(output.read(), 
                            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response['Content-Disposition'] = "attachment; filename=excel_activos.xlsx"
        output.close()

        return response 

    
    #Metodos para el HTTP PATCH------------------------------
    def update_activo(self, request, pk:int) -> Response:
        data = request.data
        serializer = UpdateActivoSerializer(data = data)
        print(serializer)
        try:
            activo = Activos.objects.get(id = pk)
   
        except Activos.DoesNotExist:
            return Response({"error": "activo does not exist"},
                            status = status.HTTP_404_NOT_FOUND)
            
        if serializer.is_valid():
            activo:Activos = serializer.update(instance = activo,
                                                        validated_data= serializer.validated_data)
            activo.save()
            serializer = ReadActivoSerializerComplete(instance = activo)  
            return Response(serializer.data,
                            status = status.HTTP_200_OK) 

        return Response(serializer.errors, 
                        status = status.HTTP_400_BAD_REQUEST )

    #Metodos para el HTTP DELETE------------------------------
    def delete_last_id_registro(self):  
       resultado = Activos.objects.values('id_registro')\
                                  .annotate(tipo = Value('Activo', output_field= CharField()))\
                                  .union(Observaciones.objects.values('id_registro')\
                                                              .annotate(tipo = Value('Observacion', output_field = CharField())))\
                                                              .order_by('-id_registro')[:1]
       
       tipo = resultado[0]['tipo']
       id_registro = resultado[0]['id_registro']

       if tipo == "Observacion":
           observacion = Observaciones.objects.get(id_registro = id_registro)
           observacion.delete()           

       if tipo == "Activo":
           activo = Activos.objects.get(id_registro = id_registro)
           activo.delete()

       return Response({"info": f"{resultado[0]} has been deleted"},
                       status = status.HTTP_200_OK) 

#--------------------------------------------------------
class ObservacionesActions():
    
    def __init__(self) -> None:
        pass
#Metodos para el HTTP GET--------------------------------
    def all_observaciones(self) -> Response:
        observacion = Observaciones.objects.all()
        serializer = ObservacionesSerializer(instance = observacion, many = True)
        return Response(serializer.data, status = status.HTTP_200_OK)

    def get_observacion_by_activo(self, activo:str) -> Response: 
        try:
            observacion = Observaciones.objects.filter(activo = activo) 
        except Observaciones.DoesNotExist:
            return Response({"error": "observacion does not exist"}, status = status.HTTP_404_NOT_FOUND)
        
        serializer = ObservacionesSerializer(instance = observacion,
                                             many=True)
        return Response(serializer.data, status= status.HTTP_200_OK)

    def observaciones_excel(self):
        resultado = Observaciones.objects.filter(                            ).values(
                                'id_registro',
                                'descripcion',
                                'activo_id'
                            )
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output, {"in_memory": True})
        worksheet = workbook.add_worksheet()
        worksheet.write('A1', "Registro ID")
        worksheet.write('B1', "Descripcion")
        worksheet.write('C1', "Activo")
        counter = 2

        for item in resultado:
            id_registro = str(item['id_registro'])
            descripcion = str(item['descripcion'])
            activo = str(item['activo_id'])
            worksheet.write(f'A{counter}', id_registro)
            worksheet.write(f'B{counter}', descripcion)
            worksheet.write(f'C{counter}', activo)
            counter += 1

        workbook.close()
        output.seek(0)
        response = HttpResponse(output.read(), 
                                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response['Content-Disposition'] = "attachment; filename=excel_observaciones.xlsx"
        output.close()
        return response

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

#-------------------------------------------------------------
