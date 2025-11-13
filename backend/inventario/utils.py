#std python classes and others-----------------
from http.client import ResponseNotReady
import io
import os
from typing import Any
import xlsxwriter
import textwrap
import math
import re

from datetime import datetime, timedelta
from django.utils import timezone

import pandas as pd
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
#----------------------------------------------

#Django herramientas---------------------------
from django.core.exceptions import FieldDoesNotExist
from django.contrib.auth.models import User
from sgica.settings import BASE_DIR, MEDIA_ROOT
from django.db.models import F, Value, CharField, Func, Count, Q, Subquery, OuterRef, IntegerField, CharField, Exists
from django.db.models.functions import Coalesce

from django.http import HttpResponse
from django.db.models.query import QuerySet
from django.db import transaction
from django.db.models import Model
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
                                                  'descripcion','ubicacion_original','serie_modificado')\
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
    
    def get_activo_by_no_identificacion(self, no_identificacion: str) -> Response:
        try:
            activo:Response = Activos.objects.get(no_identificacion = no_identificacion)
            serializer = ReadActivoSerializerComplete(instance = activo) 
            return Response(serializer.data,
                            status = status.HTTP_200_OK) 

        except Activos.DoesNotExist:
            return Response({"error": "activo does not exist"},
                            status = status.HTTP_404_NOT_FOUND)

    def get_activo_by_ubicacion_id(self, ubicacion_actual: int):
        try:
            activo: Activos = Activos.objects.filter(ubicacion_actual = ubicacion_actual)
        except Activos.DoesNotExist:
            return Response({"error": "activo does not exist"}, 
                            status = status.HTTP_404_NOT_FOUND)

        serializer = ReadActivoSerializerComplete(instance = activo,
                                                  many = True)

        return Response(serializer.data,
                        status = status.HTTP_200_OK)

    def get_activos_aleatorio(self, cant: int):
        try:
            three_years_ago = timezone.now() - timedelta(days = 3 * 365)
            recent_activos = Activos.objects.filter(
                fecha__gte = three_years_ago
            ).order_by('-id')[:300]

            import random
            recent_activos_list = list(recent_activos)
            random_10 = random.sample(recent_activos_list, min(10, len(recent_activos_list)))

            random_10_dicts = [
                {
                    'id': a.id,
                    'no_identificacion': a.no_identificacion,
                    'descripcion': a.descripcion,
                    'ubicacion_actual': 
                        {
                            'id': a.ubicacion_actual.id,
                            'nombre_oficial':a.ubicacion_actual.nombre_oficial
                        }
                } for a in random_10
            ]
        except Activos.DoesNotExist:
            return Response({"error": "activo does not exist"}, 
                            status = status.HTTP_404_NOT_FOUND)

        return Response(random_10_dicts,
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
    
    def get_registro_noimpreso_count(self):
        activos_no_impreso_count = Activos.objects.filter(impreso = False).count()
        observaciones_no_impreso_count = Observaciones.objects.filter(impreso = False).count()

        total_no_impreso = activos_no_impreso_count + observaciones_no_impreso_count

        return Response(total_no_impreso, status = status.HTTP_200_OK)

  #--------------------------------------------------------
    
    #Metodos para el HTTP POST-------------------------------
    def add_activo(self, request) -> Response: #Working
        remaining_fields = get_remaining_fields() 
        serializer = ActivoSerializer(data = request.data | remaining_fields)

        if serializer.is_valid():      
            # activo:Activos = serializer.create(serializer.validated_data)
            activo = Activos(**serializer.validated_data)
            activo.save()
            print(f"activo: Activos id: {activo.id}") 
            # print(f"activo:Activos id: {activo.id}")
            # return Response(ReadActivoSerializerIncomplete(instance = activo).data,
                            # status= status.HTTP_200_OK)
            return Response(activo.id, status=status.HTTP_201_CREATED)
        
        print(f"This are the serializer errors: \n\n{serializer.errors}") 
        return Response(serializer.errors,
                        status = status.HTTP_400_BAD_REQUEST)

    #Metodos para el HTTP POST-------------------------------
    def add_activos(self, request) -> Response: #Working
        data_list = request.data
        
        if not isinstance(data_list, list):
            return Response({"detail": "Expected a list of items."},
                            status = status.HTTP_400_BAD_REQUEST)
        results = []

        with transaction.atomic():
            for item in data_list:
                remaining_fields = get_remaining_fields() 
                serializer = ActivoSerializer(data = item | remaining_fields)

                if not serializer.is_valid():
                    print(f"Validation error for item: {serializer.errors}")
                    # If any error occurs, rollback all changes
                    transaction.set_rollback(True)
                    return Response(serializer.errors, status = status.HTTP_400_BAD_REQUEST)

                # Save the instance
                activo = Activos(**serializer.validated_data)
                activo.save()
                results.append(activo.no_identificacion)

        return Response(results, status=status.HTTP_201_CREATED)
    
    def select_columns_to_filter(self, request, exclude_de_baja = False, include_historial = False) -> Response:
        FIELDS = request.data.get('fields', [])
        ALWAYS_INCLUDED_FIELDS = ['id', 'id_registro', 'baja', 'serie_modificado']
        missing_fields = [f for f in ALWAYS_INCLUDED_FIELDS if f not in FIELDS]
        QUERY_FIELDS = FIELDS + missing_fields

        RELATED_FIELDS = ["ubicacion_original", "ubicacion_actual", "modo_adquisicion"]
        
        activos = Activos.objects.select_related(*RELATED_FIELDS).annotate(
            ubicacion_original_alias = F('ubicacion_original__alias'),
            ubicacion_actual_alias = F('ubicacion_actual__alias'),
            
            ubicacion_original_nombre_oficial = F('ubicacion_original__nombre_oficial'),
            ubicacion_actual_nombre_oficial = F('ubicacion_actual__nombre_oficial'),
            modo_adquisicion_desc = F('modo_adquisicion__descripcion'),
            
            # Include the IDs explicitly so serializer can get them
            ubicacion_original_id_val = F('ubicacion_original__id'),
            ubicacion_actual_id_val = F('ubicacion_actual__id'),
            modo_adquisicion_id_val = F('modo_adquisicion__id'),
        )

        if exclude_de_baja:
            activos = activos.exclude(baja__in=[
                'DADO DE BAJA CON PLACA',
                'DADO DE BAJA SIN PLACA'
            ])

        if include_historial:
            # Subquery for last historial.fecha
            first_historial = HistorialUbicacion.objects.filter(
                activo = OuterRef('id_registro'), acta = False
            ).order_by('fecha')

            activos = activos.annotate(
                count_historial = Count(
                    'historialubicacion_activo',
                    filter = Q(historialubicacion_activo__acta = False)
                ),
                ubicacion_primera_id_val=Subquery(
                    first_historial.values('ubicacion__id')[:1],
                    output_field = IntegerField()
                ),
                ubicacion_primera_nombre_oficial=Subquery(
                    first_historial.values('ubicacion__nombre_oficial')[:1],
                    output_field = CharField()
                )
            )
            for field in ['count_historial', 'ubicacion_primera_id_val', 'ubicacion_primera_nombre_oficial']:
                if field not in QUERY_FIELDS:
                    QUERY_FIELDS.append(field)
        
        if (request.data.get('observaciones', False)):
            #Add has_observaciones annotation ===
            observaciones_exist = ActivoObservacion.objects.filter(activo = OuterRef('id'))
        
            activos = activos.annotate(
                has_observaciones = Exists(observaciones_exist)
            )
        
            if 'has_observaciones' not in QUERY_FIELDS:
                QUERY_FIELDS.append('has_observaciones')
                
        activos = activos.order_by('-id')

        serializer = DynamicReadActivosSerializer(instance = activos,
                                                  many = True, fields = QUERY_FIELDS)

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
        
        EXCEL_FIELDS = ["No.Registro", "No.Identificacion", "Descripción",
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

        now = datetime.now() 
        date_str = now.strftime("%d-%m-%Y %H-%M-%S") 
        file_name = f"excel-personalizado_{date_str}.xlsx" 

        ruta = os.path.join("media", "excels", file_name) 
        os.makedirs(os.path.dirname(ruta), exist_ok = True) 
        
        with open(ruta, "wb") as f: 
            f.write(output.read()) 
            
        doc: Docs = Docs(titulo = file_name, tipo = "EXCEL", ruta = ruta, impreso = False) 
        doc.save() 
        
        output.close() 
        
        return Response(ruta, status = status.HTTP_200_OK)
        response = HttpResponse(output.read(), 
                            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response['Content-Disposition'] = "attachment; filename=excel_activos.xlsx"
        output.close()

        return response 

    
    #Metodos para el HTTP PATCH------------------------------
    def update_activo(self, request, pk:int) -> Response:
        data = request.data

        serializer = UpdateActivoSerializer(data = data)

        try:
            activo = Activos.objects.get(id = pk)
   
        except Activos.DoesNotExist:
            return Response({"error": "activo does not exist"},
                            status = status.HTTP_404_NOT_FOUND)
            
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    # Update the activo
                    activo = serializer.update(instance = activo, validated_data= serializer.validated_data)

                    # Create historial if needed
                    if data.get('ubicacion_anterior_id') != data.get('ubicacion_actual'):
                        ubicacion_anterior_id = data.get('ubicacion_anterior_id')
                        try:
                            ubicacion_anterior = Ubicaciones.objects.get(id = ubicacion_anterior_id)
                        except Ubicaciones.DoesNotExist:
                            return Response({"error": "Ubicación anterior no encontrada"}, status=status.HTTP_400_BAD_REQUEST)
                        
                        HistorialUbicacion.objects.create(
                            activo = activo,
                            ubicacion = ubicacion_anterior
                        )

                    response_serializer = ReadActivoSerializerComplete(instance=activo)
                    return Response(response_serializer.data, status=status.HTTP_200_OK)

            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

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
    
    def safe_str(self, val):
        if val is None or val == "" or val == "N/I":
            return "N/A"
        if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
            return "N/A"
        return str(val)
    
    def safe_number(self, val):
        if isinstance(val, (float, int)):
            if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
                return "0.00"
            return f"{float(val):.2f}"  # always 2 decimals

        if val is None or val in ("", "N/I", "N/A"):
            return "0.00"

        return str(val)
    
    def normalize_text(self, h):
        if h is None:
            return ""
        h = str(h).strip().lower()
        h = re.sub(r"\s+", " ", h)          # collapse multiple spaces
        h = re.sub(r"[\u200b\u200c\u200d]", "", h)  # remove zero-width chars
        return h
    
    def compare_dicts(self, excel_row, db_row):
        mismatches = []
        if not db_row:
            return mismatches

        for key in excel_row.keys():
            if self.normalize_text(excel_row.get(key)) != self.normalize_text(db_row.get(key)):
                mismatches.append(key)
        return mismatches
    
    def get_id_registro_range(self, value):
        parts = value.split(",")

        result = []

        last_part = parts[-1]

        if "-" in last_part:
            start_str, end_str = last_part.split("-")
            width = max(len(start_str), len(end_str))  # preserve leading zeros

            start = int(start_str)
            end = int(end_str)

            for i in range(start, end + 1):
                # format with leading zeros
                new_val = ",".join(parts[:-1] + [str(i).zfill(width)])
                result.append(new_val)
        else:
            result.append(value)
        
        return result
    
    def load_excel(self, request):
        excel_file = request.FILES["file"]

        try:
            # Read Excel into DataFrame
            df = pd.read_excel(excel_file)
            df.columns = [self.normalize_text(c) for c in df.columns]

            # Expected columns
            COLUMN_MAPPING = {
                "": "id_registro",
                "no. identificacion": "no_identificacion",
                "descripción": "descripcion",
                "marca": "marca",
                "modelo": "modelo",
                "serie": "serie",
                "estado": "estado",
                "ubicación": "ubicacion_original",
                "modo de adquisición": "modo_adquisicion",
                "precio": "precio"
            }

            # Rename columns
            df = df.rename(columns = COLUMN_MAPPING)

            # Validate columns
            missing = [col for col in COLUMN_MAPPING.values() if col not in df.columns]
            if missing:
                return Response({"error": f"Missing columns: {missing}"}, status = status.HTTP_400_BAD_REQUEST)

            results = []

            for _, row in df.iterrows():
                id_registro = self.safe_str(row.get("id_registro"))
                no_identificacion = self.safe_str(row.get("no_identificacion"))

                if re.search(r'^\d+\-\d+$', no_identificacion , re.IGNORECASE):
                    isObservacion = False
                else:
                    isObservacion = True
                    
                if (isObservacion):
                    range_id_registro = self.get_id_registro_range(id_registro)
                    descripciones = []
                    descripciones.extend(textwrap.wrap(no_identificacion, width = 98))

                    for index, ir in enumerate(range_id_registro):

                        descripcion = descripciones[index % len(descripciones)]
                        excel_data = {
                            "id_registro": ir, 
                            "no_identificacion": descripcion,
                        }

                        db_observacion = Observaciones.objects.filter(id_registro = ir).first()
                        
                        if db_observacion:
                            db_data = {
                                "id_registro": self.safe_str(db_observacion.id_registro),
                                "no_identificacion": self.safe_str(db_observacion.descripcion)
                            }
                        else:
                            db_data = None

                        results.append({
                            "excel": excel_data,
                            "db": db_data,
                            "nel": self.compare_dicts(excel_data, db_data),
                            "observacion": isObservacion
                        })
                else:
                    # Excel row (always exists)
                    excel_data = {
                        "id_registro": id_registro,
                        "no_identificacion": self.safe_str(row.get("no_identificacion")),
                        "descripcion": self.safe_str(row.get("descripcion")),
                        "marca": self.safe_str(row.get("marca")),
                        "modelo": self.safe_str(row.get("modelo")),
                        "serie": self.safe_str(row.get("serie")),
                        "estado": self.safe_str(row.get("estado")),
                        "ubicacion_original": self.safe_str(row.get("ubicacion_original")),
                        "precio": self.safe_number(row.get("precio"))
                    }
                    
                    db_activo = Activos.objects.filter(id_registro = id_registro).first()
                    if db_activo:
                        db_data = {
                            "id_registro": self.safe_str(db_activo.id_registro),
                            "no_identificacion": self.safe_str(db_activo.no_identificacion),
                            "descripcion": self.safe_str(db_activo.descripcion),
                            "marca": self.safe_str(db_activo.marca),
                            "modelo": self.safe_str(db_activo.modelo),
                            "serie": self.safe_str(db_activo.serie),
                            "estado": self.safe_str(db_activo.estado),
                            "ubicacion_original": self.safe_str(db_activo.ubicacion_original.nombre_oficial),
                            "precio": self.safe_number(db_activo.precio)
                        }
                    else:
                        db_data = None

                    results.append({
                        "excel": excel_data,
                        "db": db_data,
                        "nel": self.compare_dicts(excel_data, db_data),
                        "observacion": isObservacion
                    })

            return Response(results, status=status.HTTP_200_OK)

        except Exception as e:
                print(e)
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


    def apply_change(self, obj: Model, column: str, value):
        field = obj._meta.get_field(column)

        if field.is_relation:  # Si es ForeignKey o OneToOne
            related_model = field.related_model
            if value is None:
                setattr(obj, column, None)
            else:
                related_obj = related_model.objects.get(id=value)
                setattr(obj, column, related_obj)
        else:
            setattr(obj, column, value)
            
    def registros_guardar_cambios(self, request):
        data = request.data

        observaciones_to_update = []
        observaciones_fields = set()

        activos_to_update = []
        activos_fields = set()

        for registro in data:
            if registro.get('isObservacion'):
                observacion = Observaciones.objects.get(id=registro.get('id'))

                for change in registro.get('changes', []):
                    self.apply_change(observacion, change["column"], change["value"])
                    observaciones_fields.add(change["column"])

                observaciones_to_update.append(observacion)

            else:
                activo = Activos.objects.get(id=registro.get('id'))

                for change in registro.get('changes', []):
                    self.apply_change(activo, change["column"], change["value"])
                    activos_fields.add(change["column"])

                activos_to_update.append(activo)

        if observaciones_to_update:
            Observaciones.objects.bulk_update(observaciones_to_update, list(observaciones_fields))

        if activos_to_update:
            Activos.objects.bulk_update(activos_to_update, list(activos_fields))

        return Response(data, status=status.HTTP_200_OK)
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
            observacion_ids = ActivoObservacion.objects.filter(activo = activo).values_list('observacion', flat = True)
            observaciones = Observaciones.objects.filter(id__in = observacion_ids)
        except Observaciones.DoesNotExist:
            return Response({"error": "observacion does not exist"}, status = status.HTTP_404_NOT_FOUND)
        
        serializer = ObservacionesSerializer(instance = observaciones,
                                             many = True)
        return Response(serializer.data, status= status.HTTP_200_OK)

    def observaciones_excel(self):
        resultado = Observaciones.objects.filter().values(
                                'id_registro',
                                'descripcion',
                            )
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output, {"in_memory": True})
        worksheet = workbook.add_worksheet()
        worksheet.write('A1', "Registro ID")
        worksheet.write('B1', "Descripcion")
        counter = 2

        for item in resultado:
            id_registro = str(item['id_registro'])
            descripcion = str(item['descripcion'])
            worksheet.write(f'A{counter}', id_registro)
            worksheet.write(f'B{counter}', descripcion)
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
        remaining_fields: dict = get_remaining_fields()
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
    
    def add_new_observacion_revision(self, request) -> Response:
        descripciones = self.generate_descripcion(request.data)

        try:
            with transaction.atomic():
                for descripcion in descripciones:
                    remaining_fields = get_remaining_fields()
                    remaining_fields.pop('no_identificacion', None)

                    serializer = ObservacionesSerializer(data = {'descripcion': descripcion})
                    
                    serializer.is_valid(raise_exception = True)
                    serializer.validated_data.update(remaining_fields)

                    serializer.save(**remaining_fields)

            return Response({'nice'}, status = status.HTTP_200_OK)
        
        except Exception as e:
            print(f'Error: {e}')
            return Response({"error": str(e)}, status = status.HTTP_400_BAD_REQUEST)
        
    
    def generate_descripcion(self, activos):
        encontrados = [a['no_identificacion'].split("-", 1)[1] for a in activos if a['encontrado']]
        no_encontrados = [a['no_identificacion'].split("-", 1)[1] for a in activos if not a['encontrado']]

        descripciones = []
        dia = self.get_today_date()

        if len(encontrados) > 0:
            joined = self.format_with_and(encontrados)
            encontrado_str = f"Los bienes con número de identificación 6105-{joined} fueron sometidos a una verificación aleatoria el día {dia}, constatando la existencia de los mismos dentro del centro educativo."
            descripciones.extend(textwrap.wrap(encontrado_str, width = 98))

        if len(no_encontrados) > 0:
            joined = self.format_with_and(no_encontrados)
            no_encontrado_str = f"Los bienes con número de identificación 6105-{joined} fueron sometidos a una verificación aleatoria el día {dia}, constatando la ausensia de los mismos dentro del centro educativo."
            descripciones.extend(textwrap.wrap(no_encontrado_str, width = 98))

        return descripciones
    
    def format_with_and(setlf, items):
        if not items:
            return ""
        if len(items) == 1:
            return items[0]
        return ", ".join(items[:-1]) + " y " + items[-1]

    def get_today_date(self):
        months = [
            "enero", "febrero", "marzo", "abril", "mayo", "junio",
            "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
        ]

        today = datetime.today()
        day = today.day
        month = months[today.month - 1]
        year = today.year

        return f"{day} de {month} de {year}"

    def create_all_activo_observacion(self, request):
        activos = request.data.get('activos', [])
        descripciones = request.data.get('descripciones', [])

        activo_observacion = []

        if not activos or not descripciones:
            return 0

        try:
            with transaction.atomic():
                observaciones = []
                for descripcion in descripciones:
                    remaining_fields = get_remaining_fields()
                    remaining_fields.pop('no_identificacion', None)

                    serializer = ObservacionesSerializer(data = {'descripcion': descripcion})
                    
                    if serializer.is_valid():
                        serializer.validated_data.update(remaining_fields)
                        serializer.is_valid(raise_exception = True)

                        observacion = serializer.save(**remaining_fields)
                        observaciones.append(observacion)
                    else:
                        return 0

                for activo in activos:
                    for observacion in observaciones:
                        activo_observacion.append(
                            ActivoObservacion.objects.create(
                                activo_id = activo.get('id'),
                                observacion_id = observacion.id
                            )
                        )

            return len(activo_observacion)

        except Exception as e:
            print(f'Error: {e}')
            return 0
    
    def create_by_activo_observacion(self, data_acta):
        activos_data  = data_acta.get('items', [])
        activo_observacion = []

        if not activos_data:
            return 0

        try:
            with transaction.atomic():
                observaciones = []
                for activo_data in activos_data:
                    activo_id = activo_data.get('id')
                    descripciones = self.split_desctipcion(activo_data, data_acta)

                    if not activo_id or not descripciones:
                        return 0

                    observaciones = []
                    for descripcion in descripciones:
                        remaining_fields = get_remaining_fields()
                        remaining_fields.pop('no_identificacion', None)

                        serializer = ObservacionesSerializer(data = {'descripcion': descripcion})
                        
                        if serializer.is_valid():
                            serializer.validated_data.update(remaining_fields)
                            serializer.is_valid(raise_exception = True)

                            observacion = serializer.save(**remaining_fields)
                            observaciones.append(observacion)
                        else:
                            return 0

                    for observacion in observaciones:
                        activo_observacion.append(
                            ActivoObservacion.objects.create(
                                activo_id = activo_id,
                                observacion_id = observacion.id
                            )
                        )

            return len(activo_observacion)
        except Exception as e:
            print(f'Error: {e}')
            return 0
        
    def split_desctipcion(self, activo, data_acta):
        acta = data_acta.get('acta', '')
        if ( acta == 'baja'):
            descripcion = f"El activo con placa N°{activo.get('no_identificacion')}, el cual corresponde a un {activo.get('descripcion')}  y que consta en el Folio {self.get_folio(activo.get('id_registro'))} y asiento {self.get_asiento(activo.get('id_registro'))}, del tomo 1 del Libro de Inventario, fue dado de baja del inventario institucional a partir del {data_acta.get('fechaActa')}, por motivo de obsolescencia, según consta en el acta extraordinaria N°{data_acta.get('numActa')}-{data_acta.get('anio')}, la cual se encuentra en los archivos de esta institución."
        elif ( acta == 'traslado'):
            descripcion = f"El activo con placa N°{activo.get('no_identificacion')}, el cual corresponde a un {activo.get('descripcion')}, y que consta en el Folio {self.get_folio(activo.get('id_registro'))} y asiento {self.get_asiento(activo.get('id_registro'))}, del tomo 1 del Libro de Inventario, fue trasladado del {activo.get('origen')} a el  {activo.get('destino')}, a partir del {data_acta.get('fechaActa')}."

        return textwrap.wrap(descripcion, width = 98)
        
    def get_folio(self, id_registro):
        partes = id_registro.split(',')
        return partes[1]
    
    def get_asiento(self, id_registro):
        partes = id_registro.split(',')
        return partes[2]
    
    def mover_observaciones(self):
        activo_observaciones = []

        if (not ActivoObservacion.objects.exists() and has_field(Observaciones, 'activo')):
            try:
                with transaction.atomic():
                    for observacion in Observaciones.objects.only('id', 'activo'):
                        activo = getattr(observacion, 'activo', None)
                        if activo is not None:
                            activo_observaciones.append(ActivoObservacion(
                                observacion_id = observacion.id,
                                activo_id = activo.id
                            ))

                    ActivoObservacion.objects.bulk_create(activo_observaciones)
            except Exception as e:
                print(f"Failed moving Observaciones to ActivoObservacion: {e}")
                return 0

        return len(activo_observaciones)
#-------------------------------------------------------------

def has_field(model, field_name):
    try:
        model._meta.get_field(field_name)
        return True
    except FieldDoesNotExist:
        return False