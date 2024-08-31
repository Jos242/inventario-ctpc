#std python classes and others-----------------
import io
import os
from typing import Any
import xlsxwriter
#----------------------------------------------

#Django herramientas---------------------------
from django.contrib.auth.models import User
from xlsxwriter.workbook import Format
from sgica.settings import MEDIA_ROOT
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
    print("Llegue auqi?") 

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
        RELATED_FIELDS = ["ubicacion_original_alias", "ubicacion_actual_alias", "modo_adquisicion_desc"]
        SELECT_RELATED = ['ubicacion_original', 'ubicacion_actual', 'modo_adquisicion']
        related_map = dict(zip(RELATED_FIELDS, SELECT_RELATED))
        related_fields = [related_map[column] for column in RELATED_FIELDS if column in FIELDS]
        annotations = {
                'ubicacion_original_alias': F('ubicacion_original__alias'),
                'ubicacion_actual_alias': F('ubicacion_actual__alias'),
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

#---------------------------------------------------------- 
class UserActions():
     
    def __init__(self) -> None:
        pass
    #Metodos para el HTTP GET--------------------------------

    #Metodos para el HTTP POST-------------------------------
    def new_usuario(self, request) -> Response:
        USER_TYPES = ["ADMINISTRADOR", "OBSERVADOR", "FUNCIONARIO"]
        
        try: 
            user_type = request.data.get("user_type")

            if user_type not in USER_TYPES:
                return Response({"error": f"not a valid user type, valid user types: {USER_TYPES}"},
                                status = status.HTTP_400_BAD_REQUEST)

            else:
                user_type = request.data.pop("user_type")

        except KeyError as e:
            return Response({"error": "required field: 'user_type'"},
                            status = status.HTTP_400_BAD_REQUEST)

        serializer:UserSerializer = UserSerializer(data = request.data)

        if serializer.is_valid():   
            user:User = serializer.create(serializer.validated_data)

            if user_type == 'OBSERVADOR':
                user.is_staff = False
                user.is_superuser = False
                user.set_password(serializer.validated_data['password'])
                user.save()

            if user_type == 'ADMINISTRADOR':
                user.is_staff = False
                user.is_superuser = True 
                user.set_password(serializer.validated_data['password'])
                user.save()

            if user_type == 'FUNCIONARIO':
                
                user.is_staff = True
                user.is_superuser = False 
                user.set_password(serializer.validated_data['password'])
                user.save() 
                data = request.data | {"user": user.pk}
                funcionario_serializer= FuncionariosSerializer(data = data)

                if funcionario_serializer.is_valid():
                    validated_data = funcionario_serializer.validated_data
                    funcionario:Funcionarios = funcionario_serializer.create(validated_data)  
                    serializer = FuncionariosSerializer(instance = funcionario)

                    return Response(serializer.data,
                                    status = status.HTTP_200_OK)
               
                User.objects.get(pk = user.pk).delete() 
                print(funcionario_serializer.errors) 
                return Response(funcionario_serializer.errors)

            return Response(serializer.validated_data, 
                            status = status.HTTP_200_OK) 
   
        return Response(serializer.errors,
                         status = status.HTTP_200_OK)    
    #Metodos para el HTTP DELETE-----------------------------
    def delete_user(self, request:Request, pk:int) -> Response:

        try: 
            user = User.objects.get(id = pk)
            user.delete()
        
        except User.DoesNotExist:
            return Response({"error": "user does not exist"},
                            status = status.HTTP_404_NOT_FOUND)
          
        return Response({"status": "user deleted"}, 
                        status = status.HTTP_200_OK)
    
    #Metodos para el HTTP PATCH----------------------------------
    def update_user(self, request:Request, pk:int) -> Response: 
        serializer:UpdateUserSerializer = UpdateUserSerializer(data = request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, 
                            status = status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id = pk)

        except User.DoesNotExist:
            return Response({"error": "user does not exist"},
                            status = status.HTTP_400_BAD_REQUEST)

        user = serializer.update(instance = user,
                                 validated_data = serializer.validated_data)
        
        return Response({"success": "user was updated"},
                         status = status.HTTP_200_OK )

#-------------------------------------------------------------
class DocsActions():

    def __init__(self) -> None:
        pass

    #Metodos para el HTTP GET------------------------------- 
    def get_all_docs(self) -> Response:
        docs:Docs = Docs.objects.all()
        serializer:Any =  ReadDocSerializer(instance = docs,
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

    def get_excel_observ_activo(self):
        activos_query = Activos.objects.select_related('ubicacion_actual', 'modo_adquisicion').annotate(
        ubicacion_actual_alias=F('ubicacion_actual__alias'),
        modo_adquisicion_desc=F('modo_adquisicion__descripcion')
            ).values(
                'id_registro',
                'no_identificacion',
                'descripcion',
                'marca',
                'modelo',
                'serie',
                'estado',
                'ubicacion_actual_alias',
                'modo_adquisicion_desc',
                'precio'
            )

        # Consulta para Observaciones
        observaciones_query = Observaciones.objects.annotate(
            no_identificacion=Value(None, output_field=CharField()),
            marca=Value(None, output_field=CharField()),
            modelo=Value(None, output_field=CharField()),
            serie=Value(None, output_field=CharField()),
            estado=Value(None, output_field=CharField()),
            ubicacion_actual_alias=Value(None, output_field=CharField()),
            modo_adquisicion_desc=Value(None, output_field=CharField()),
            precio=Value(None, output_field=CharField())
        ).values(
            'id_registro',
            'no_identificacion',
            'descripcion',
            'marca',
            'modelo',
            'serie',
            'estado',
            'ubicacion_actual_alias',
            'modo_adquisicion_desc',
            'precio'
        )

        # Combinar las consultas
        resultado = activos_query.union(observaciones_query)

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

        for i, activo in enumerate(resultado, start=2):
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
    def save_acta(self, request:Request) -> Response:
        serializer:DocSerializer = DocSerializer(data = request.data)  

        if not serializer.is_valid():
            return Response(serializer.errors, 
                            status = status.HTTP_400_BAD_REQUEST)

        impreso = request.data.get('impreso', None)
        tipo = serializer.validated_data['tipo']
        
        if tipo == 'PDF' and impreso is None:
            return Response({"error": "field 'impreso' is required"},
                            status = status.HTTP_400_BAD_REQUEST)
        
        files:Any = request.FILES.getlist(key = 'archivo', default = [])
        ruta:str = handle_uploaded_file(files)
        doc:Docs = serializer.create(serializer.validated_data)
        doc.ruta = ruta
        doc.impreso = impreso
        doc.save()

        return Response(serializer.data, 
                    status = status.HTTP_200_OK)
    
    def create_print_doc(self, request) -> Response:
        serializer = WhatTheExcelNameIs(data = request.data)
        entries_activos = Activos.objects.filter(impreso=0) \
                               .annotate(origen=Value('activos', output_field=CharField())) \
                               .values('id_registro', 'asiento', 'no_identificacion',
                                       'descripcion', 'marca', 'modelo', 'serie',
                                       'origen')

        # Query for Observaciones
        entries_observaciones:QuerySet = Observaciones.objects.filter(impreso=0) \
                                                .annotate(
                                                    no_identificacion = Value(None, output_field = CharField()),
                                                    marca=Value(None, output_field=CharField()),
                                                    modelo=Value(None, output_field=CharField()),
                                                    serie=Value(None, output_field=CharField()),
                                                    estado=Value(None, output_field=CharField()),
                                                    origen=Value('observaciones', output_field=CharField())) \
                                                .values('id_registro', 'asiento',
                                                        'no_identificacion','descripcion',
                                                        'marca', 'modelo', 'serie',
                                                        'origen')

        # Combine both queries using union
        resultados:QuerySet = entries_activos.union(entries_observaciones)\
                                             .order_by('id_registro')
  
        only_activos = 1
        only_observaciones = 2
        list_decide = []

        for result in resultados[:40]:
            if result['origen'] == 'observaciones':
                list_decide.append(only_observaciones)
            if result['origen'] == 'activos':
                list_decide.append(only_activos)
 

        if (1 in list_decide and 2 not in list_decide):
            print_type = "SoloActivos"
        
        if (1 not in list_decide and 2 in list_decide):
            print_type = "SoloObservaciones"
        count_1 = list_decide.count(1)
        count_2 = list_decide.count(2)

        if count_1 > 0 and count_2 > 0:
            print_type = "ObservacionesYActivos"

        if not serializer.is_valid():
            return Response(serializer.errors,
                            status = status.HTTP_200_OK)

        file_name = serializer.validated_data.get("file_name")
        path_to_save = os.path.join(MEDIA_ROOT, 'documentos_de_impresion' ,
                                    file_name)

        bold_param        = {'bold': True}
        center_text_param = {'align': 'center'}
        left_text_param   = {'align': 'left'}
        font_type         = {'font_name': 'Arial'}
        font_size         = {'font_size': 11}

        if print_type == "SoloActivos":
            activos_list:QuerySet = resultados[:40] 
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
            
            
            for i, activo in enumerate(activos_list, start = 2):
                in_case = None
    
                if activo["asiento"] == 2 and i > 30:
                    print("Entre aqui")
                    id_registro = activo["id_registro"].split(',')
                    id_registro[2] = "41"
                    id_registro[1] = f"{int(id_registro[1]) - 1}"
                    in_case = ",".join(id_registro)  
            
                row = [
                    restar_uno(activo["id_registro"]),
                    activo["asiento"] - 1 if activo["asiento"] != 2 and i <= 41 else 41,
                    activo["no_identificacion"],
                    activo["descripcion"],
                    activo["marca"],
                    activo["modelo"],
                    activo["serie"]
                ]
                if in_case != None:
                    row[0] = in_case

                worksheet.write_row(f'A{i}', row)

            workbook.close()
            #TODO descomentar esta linea en prod
            # Activos.objects.filter(impreso = False).update(impreso = True) 
            msg = f"go to '/media/documento_de_impresion/{file_name}/' to download the file"
            return Response({"success": msg},
                   status = status.HTTP_200_OK)

        if print_type == "SoloObservaciones":
            workbook = xlsxwriter.Workbook(path_to_save) 
            worksheet = workbook.add_worksheet() 
            observaciones_list:QuerySet = resultados 
            
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

            activos_observaciones_list:Any = resultados[:40]
            workbook = xlsxwriter.Workbook(path_to_save)
            worksheet = workbook.add_worksheet()
            #Para aumentar el ancho de la columna-------------------------------------
            outer_borders_black ={'top': 1,
                                  'left': 1,
                                  'bottom': 1,
                                  'right': 1}

            #Crea un objeto 'Format' para dar formato al texto------------------------
            bold = workbook.add_format({'bold': True} | outer_borders_black)

            worksheet.write(f'A1', "Registrado en",
                            workbook.add_format(bold_param | center_text_param |
                                                font_type | font_size | outer_borders_black))
            worksheet.write(f'B1', "1", 
                            workbook.add_format(bold_param | center_text_param |
                                                outer_borders_black))
                            
            worksheet.write(f'C1', "No. Identificacion", 
                            workbook.add_format(bold_param | center_text_param |
                                                outer_borders_black))
            worksheet.write(f'D1', "Descripción", bold)
            worksheet.write(f'E1', "Marca", bold)
            worksheet.write(f'F1', "Modelo", bold)
            worksheet.write(f'G1', "Serie", bold)

            for i, element in enumerate(activos_observaciones_list, start = 1):
                row = [
                    element["id_registro"],
                    element["asiento"],
                    element["no_identificacion"],
                    element["descripcion"],
                    element["marca"],
                    element["modelo"],
                    element["serie"]
                ]

                worksheet.write_row(row = i,
                                    col = 0,
                                    data = row)

                      

            ## APPLY FORMAT TO [A:A, B:B, C:C]
            a_column_format = workbook.add_format({'align':'center',
                                                   'font_name': 'Arial',
                                                   'font_size': 11} | outer_borders_black)
            
            b_column_format = workbook.add_format({'bold': True, 
                                                   'align': 'center'} | outer_borders_black)

            c_column_format = workbook.add_format({'align': 'center'} | outer_borders_black)

            worksheet.set_column("A:A", 14.57, a_column_format)
            worksheet.set_column("B:B", 2.29, b_column_format)
            worksheet.set_column("C:C", 16.86, c_column_format) 
            worksheet.set_column('D:D', 20.29, workbook.add_format(outer_borders_black)) 
            worksheet.set_column('E:E', 11.86, workbook.add_format(outer_borders_black)) 
            worksheet.set_column('F:F', 17.57, workbook.add_format(outer_borders_black))
            worksheet.set_column('G:G', 19.71, workbook.add_format(outer_borders_black))
             

            workbook.close()

            #TODO descomentar esta linea en prod
            # Activos.objects.filter(impreso = False).update(impreso = True)  
            context = {"success": (f"go to/media/documento_de_impresion/{file_name}/ to "
                                   "download the file")}
            return Response(context,
                   status = status.HTTP_200_OK) 
    

    def update_doc_info(self, request:Request, pk:int) -> Response: 
        data = request.data
        serializer = DocUpdateSerializer(data = data)

        if not serializer.is_valid():
            return Response(serializer.errors,
                            status = status.HTTP_400_BAD_REQUEST)
        
        try:
            doc = Docs.objects.get(id = pk)

        except Docs.DoesNotExist:
            return Response({"error": "doc does not exist"},
                            status = status.HTTP_404_NOT_FOUND)

        doc = serializer.update(instance = doc,
                                validated_data = serializer.validated_data)
        print(type(doc))
        context = ReadDocSerializer(instance = doc)

        return Response(context.data,
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
#--------------------------------------------------------    

class UbicacionesActions():

   #Metodos para el HTTP GET---------------------------------
   def all_ubicaciones(self) -> Response:
        try:
            ubicaciones = Ubicaciones.objects.all()
            serializer = UbicacionesSerializer(instance = ubicaciones,
                                              many = True)
        except Ubicaciones.DoesNotExist:
            return Response({"error": "there are not 'ubicaciones'"},
                            status = status.HTTP_404_NOT_FOUND)

        return Response(serializer.data,
                        status = status.HTTP_200_OK)

    
   def ubicacion_by_id(self, pk:int) -> Response:
        try: 
            ubicacion = Ubicaciones.objects.get(id = pk)
            serializer = ReadUbicacionesSerializer(instance = ubicacion)

        except Ubicaciones.DoesNotExist:
            return Response({"error": "ubicacion does not exist"},
                            status = status.HTTP_404_NOT_FOUND)

        return Response(serializer.data, 
                        status = status.HTTP_200_OK)
   
   def ubicaciones_excel(self):

    resultado = Ubicaciones.objects.annotate(
                            nombre_completo_funcionario=Coalesce(
                            F('funcionario_id__nombre_completo'),
                            Value(None)
                        )
                        ).values(
                            'nombre_oficial',
                            'alias',
                            'nombre_completo_funcionario'
                        )
    # return Response("hola", status=status.HTTP_200_OK)

    output = io.BytesIO()
    workbook = xlsxwriter.Workbook(output, {"in_memory": True})
    worksheet = workbook.add_worksheet()
    worksheet.write('A1', "Nombre Oficial")
    worksheet.write('B1', "Alias")
    worksheet.write('C1', "Funcionario")
    counter = 2

    for item in resultado:
        nombre_oficial = str(item['nombre_oficial'] or '')
        alias = str(item['alias'] or '')
        funcionario = str(item['nombre_completo_funcionario'] or 'No Asignado')
        worksheet.write(f'A{counter}', nombre_oficial)
        worksheet.write(f'B{counter}', alias)
        worksheet.write(f'C{counter}', funcionario)
        counter += 1 

    workbook.close()
    output.seek(0)
    response = HttpResponse(output.read(), 
                            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    response['Content-Disposition'] = "attachment; filename=excel_ubicaciones.xlsx"
    output.close()
    return response

   def ubicacion_by_funcionario_id(self, pk:int) -> Response:
        try: 
            ubicacion = Ubicaciones.objects.get(funcionario_id = pk)
            serializer = UbicacionesSerializer(instance = ubicacion)

        except Ubicaciones.DoesNotExist:
            return Response({"error": "ubicacion with selected funcionario does not exist"},
                            status = status.HTTP_404_NOT_FOUND)

        return Response(serializer.data, 
                        status = status.HTTP_200_OK)

   #Metodos para el HTTP POST--------------------------------
   def nueva_ubicacion(self, request) -> Response:
        serializer = UbicacionesSerializer(data = request.data)

        if not serializer.is_valid():
            return Response(serializer.errors,
                        status = status.HTTP_400_BAD_REQUEST)
   
        nombre_oficial = serializer.validated_data["nombre_oficial"]

        if "alias" not in serializer.validated_data:
            serializer.validated_data["alias"] = nombre_oficial 

        files:list = request.FILES.getlist('img_path')
        params = {"files": files,
                    "doc_type": "ubicacion_img",
                    "nombre_oficial": serializer.data["nombre_oficial"]} 

        ruta:str = handle_uploaded_file(**params)  

        if "img_path" in serializer.validated_data:
            serializer.validated_data["img_path"] = ruta

        ubicacion = serializer.create(serializer.validated_data)
        serializer = ReadUbicacionesSerializer(instance = ubicacion)

        return Response(serializer.data, 
                        status = status.HTTP_200_OK)

   #Metodos para el HTTP PATCH--------------------------------
   def update_ubicacion(self, request:Request, pk:int):
        data = request.data 
        serializer = UbicacionesSerializer(data = data)

        try:
            ubicacion = Ubicaciones.objects.get(id = pk)
           
        except Ubicaciones.DoesNotExist:
            return Response({"error": "ubicacion does not exist"},
                            status = status.HTTP_404_NOT_FOUND)
            
        if not serializer.is_valid(): 
            return Response(serializer.errors,
                            status = status.HTTP_400_BAD_REQUEST)

        old_folder_name:str = ubicacion.nombre_oficial.replace(" ", "_")
        new_folder_name:str = serializer.validated_data.get('nombre_oficial',
                                                            ubicacion.nombre_oficial).replace(" ", "_")

        old_dir = os.path.join(MEDIA_ROOT, "uploads", "ubicaciones", old_folder_name)
        new_dir = os.path.join(MEDIA_ROOT, "uploads", "ubicaciones", new_folder_name) 
        relative_new_dir =  os.path.join("uploads", "ubicaciones", new_folder_name)

        if not os.path.exists(old_dir):
            os.makedirs(new_dir)
            ubicacion.img_path = relative_new_dir

        elif old_folder_name != new_folder_name:
            os.rename(old_dir, new_dir)
            ubicacion.img_path = relative_new_dir

        ubicacion:Ubicaciones = serializer.update(instance = ubicacion,
                                                  validated_data = serializer.validated_data) 
        files:list = request.FILES.getlist("img_path")
        handle_uploaded_file(**{
                       "files": files,
                       "doc_type": "ubicacion_img",
                       "nombre_oficial": ubicacion.nombre_oficial
                       })

        return Response(ReadUbicacionesSerializer(instance = ubicacion).data,
                        status = status.HTTP_200_OK) 

    #Metodos para el HTTP DELETE-------------------------------
   def delete_ubicacion(self, pk:int):
        try: 
            ubicacion = Ubicaciones.objects.get(id = pk)
            ubicacion.delete()

        except Ubicaciones.DoesNotExist:
            return Response({"error": "ubicacion does not exist"},
                            status = status.HTTP_404_NOT_FOUND)

        return Response({"status": "ubicacion has been deleted"}, 
                        status = status.HTTP_200_OK)
#--------------------------------------------------------    
       
class FuncionariosActions():

   #Metodos para el HTTP GET---------------------------------
   def funcionario_by_id(self, pk:int): 
        try: 
            funcionario = Funcionarios.objects.get(id = pk)
            serializer = ReadFuncionariosSerializer(instance = funcionario)

        except Funcionarios.DoesNotExist:
            return Response({"error": "funcionario does not exist"},
                            status = status.HTTP_404_NOT_FOUND)

        return Response(serializer.data, 
                        status = status.HTTP_200_OK)

   def all_funcionarios(self):   
        try:
            funcionarios = Funcionarios.objects.all()
            serializer = ReadFuncionariosSerializer(instance = funcionarios,
                                              many = True)
        except Revisiones.DoesNotExist:
            return Response({"error": "there are not 'funcionarios'"},
                            status = status.HTTP_404_NOT_FOUND)

        return Response(serializer.data,
                        status = status.HTTP_200_OK)
   
   def funcionarios_as_excel_file(self):
        funcionarios = Funcionarios.objects.annotate(
            username=Subquery(
                User.objects.filter(id=OuterRef('user_id')).values('username')[:1]
            ),
            departamento_desc=Subquery(
                Departamentos.objects.filter(id=OuterRef('departamento')).values('descripcion')[:1]
            ),
            puesto_desc=Subquery(
                Puestos.objects.filter(id=OuterRef('puesto')).values('descripcion')[:1]
            ),
            ubicacion=Coalesce(
              Subquery(
                        Ubicaciones.objects.filter(funcionario_id=OuterRef('id'))
                            .values('funcionario_id')
                            .annotate(ubicaciones_str=Func(
                                F('nombre_oficial'),
                                function='GROUP_CONCAT',
                                distinct=True,
                                separator=', '
                            ))
                            .values('ubicaciones_str')[:1]
                    ),
                    Value('Aun no asignada'),
                    output_field=CharField()
                ) 
            )\
            .values(
            'id',
            'username',
            'nombre_completo',
            'departamento_desc',
            'puesto_desc',
            'ubicacion'
            )
        total_ubicaciones = max(
            (len(funcionario["ubicacion"].split(","))
            for funcionario in funcionarios
            if funcionario["ubicacion"] != 'Aun no asignada'),
            default= 1)

        excel_fields = ["Cedula", "Nombre Completo", "Departamento",
                        "Puesto", "Ubicacion"]
             
        if total_ubicaciones > 1:
            excel_fields = ["Username", "Nombre Completo",
                            "Departamento", "Puesto"]
            
            for i in range(0, total_ubicaciones):
                excel_fields.append(f"Ubicacion_{i + 1}")
                
                 
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output, {"in_memory": True})
        worksheet = workbook.add_worksheet()
        worksheet.write_row('A1', excel_fields)
        for i, funcionario in enumerate(funcionarios, start=2):
            row = [
                funcionario["username"],
                funcionario["nombre_completo"],
                funcionario["departamento_desc"],
                funcionario["puesto_desc"]
            ]
            ubicaciones:list = funcionario["ubicacion"].split(",")
            
            if len(ubicaciones) < total_ubicaciones:
                ubicaciones.extend(['Aun no asignada'] * (total_ubicaciones - len(ubicaciones)))

            for ubicacion in ubicaciones:
                row.append(ubicacion)

            worksheet.write_row(f'A{i}', row)
        workbook.close()
        output.seek(0)
        response = HttpResponse(output.read(), 
                            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response['Content-Disposition'] = "attachment; filename=.xlsx"
        output.close()

        return response
#--------------------------------------------------------    

class ModoAdquisicionActions():

    #Metodos para el HTTP GET---------------------------------
    def modo_adquisicion_by_id(self, pk:int):
        try: 
            adquisicion = ModoAdquisicion.objects.get(id = pk)
            serializer = ModoAdquisicionSerializer(instance = adquisicion)

        except ModoAdquisicion.DoesNotExist:
            return Response({"error": "modo adquisicion does not exist"},
                            status = status.HTTP_404_NOT_FOUND)

        return Response(serializer.data, 
                        status = status.HTTP_200_OK)
    
    def all_modo_adquisicion(self):
        try:
            adquisicion = ModoAdquisicion.objects.all().order_by('id')
            serializer = ModoAdquisicionSerializer(instance = adquisicion,
                                              many = True)
        except ModoAdquisicion.DoesNotExist:
            return Response({"error": "there are not 'modos de adquisicion'"},
                            status = status.HTTP_404_NOT_FOUND)

        return Response(serializer.data,
                        status = status.HTTP_200_OK)

    #Metodos para el HTTP POST--------------------------------
    def nuevo_modo_adquisicion(self, request):
        serializer = ModoAdquisicionSerializer(data = request.data)

        if serializer.is_valid():
            revision = serializer.create(serializer.validated_data)

            return Response(serializer.data, 
                            status = status.HTTP_200_OK)

        return Response(serializer.errors,
                        status = status.HTTP_400_BAD_REQUEST)

    #Metodos para el HTTP PATCH--------------------------------
    def update_modo_adquisicion(self, request, pk:int):
        data = request.data
        serializer = ModoAdquisicionSerializer(data = data)

        try:
            adquisicion = ModoAdquisicion.objects.get(id = pk)

        except ModoAdquisicion.DoesNotExist:
            return Response({"error": "modo adquisicion does not exist"},
                            status = status.HTTP_404_NOT_FOUND)
            

        if serializer.is_valid():
            revision = serializer.update(instance = adquisicion,
                                                    validated_data= serializer.validated_data)
            revision.save()
            serializer = ModoAdquisicionSerializer(instance = adquisicion)  
            return Response(serializer.data,
                           status = status.HTTP_200_OK) 

        return Response(serializer.errors,
                        status = status.HTTP_400_BAD_REQUEST)
 
    #Metodos para el HTTP DELETE-------------------------------
    def delete_modo_adquisicion(self, pk:int):
        try: 
            adquisicion = ModoAdquisicion.objects.get(id = pk)
            adquisicion.delete()

        except ModoAdquisicion.DoesNotExist:
            return Response({"error": "modo adquisicion does not exist"},
                            status = status.HTTP_404_NOT_FOUND)

        return Response({"status": "modo adquisicion deleted"}, 
                        status = status.HTTP_200_OK)
    
