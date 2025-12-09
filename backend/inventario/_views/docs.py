#inventario modules--------------------------------------
from inventario.models                       import Docs, Activos, Observaciones, HistorialUbicacion, Ubicaciones, ActivoObservacion
from inventario.permissions                  import IsAdminUser
from inventario.serializers                  import ActaBajaSerializer, ReadDocSerializer, DocUpdateSerializer, WhatTheExcelNameIs, DocSerializer
from inventario._utils.activos_utils         import get_combined_results, determine_print_type, exportar_excel_todo, handle_excel_impresion, get_export_excel_results
from inventario._utils.file_utils            import handle_uploaded_file, store_acta
#--------------------------------------------------------

#Django modules------------------------------------------
from django.db.models                        import F, QuerySet, Value
from django.http                             import HttpResponse, HttpResponseBadRequest, HttpResponseServerError
from django.db.models.functions              import Coalesce
from django.db.models                        import CharField, OuterRef, Subquery, Func
from django.db import transaction
from django.conf import settings

from datetime import datetime
from docxtpl import DocxTemplate
from io import BytesIO
from pathlib import Path
from collections import defaultdict

from ..utils import ObservacionesActions

import platform
import tempfile
import os
import subprocess

#--------------------------------------------------------

#Django rest frameworks modules--------------------------
from rest_framework import status
from rest_framework.permissions              import IsAuthenticated
from rest_framework.views                    import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.parsers                  import FormParser, MultiPartParser, JSONParser 
from rest_framework.request                  import Request
from rest_framework.response                 import Response
from rest_framework.decorators               import api_view, permission_classes
#--------------------------------------------------------

#xlsxwriter modules--------------------------------------
import xlsxwriter
#--------------------------------------------------------

#python/general modules----------------------------------
import io
import os
from typing                                  import Any
from sgica.settings                          import MEDIA_ROOT
#--------------------------------------------------------

class DocsView(APIView):
    parser_classes   = (MultiPartParser, FormParser, JSONParser)
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser] 

    def get(self, request:Request, pk:int | None = None): 
        path = request.path

        if path == "/obtener-documentos/":  
            docs = Docs.objects.all()
            serializer =  ReadDocSerializer(instance = docs,
                                            many = True)  
            return Response(serializer.data,
                            status = status.HTTP_200_OK)

        if path == f"/obtener-documento/{pk}/":
            try:
                doc:Docs = Docs.objects.get(pk = pk)
                serializer = ReadDocSerializer(instance = doc)
                return Response(serializer.data, 
                                status = status.HTTP_200_OK)

            except Docs.DoesNotExist:
                return Response({"error": "document does not exist"},
                            status = status.HTTP_404_NOT_FOUND)



        if path == f"/excel/activos-observaciones/":
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
                
        if path == f"/exportar-excel/todo/":
            regsitros: QuerySet = get_export_excel_results()
            
            return exportar_excel_todo(regsitros)

    def post(self, request:Request):
        path = request.path

        if path == "/guardar-acta/":
            serializer: DocSerializer = DocSerializer(data = request.data)  
            impreso = request.data.get('impreso', None)

            if not serializer.is_valid(impreso = impreso):
                return Response(serializer.errors, 
                                status = status.HTTP_400_BAD_REQUEST)
            
            files:Any = request.FILES.getlist(key = 'archivo', default = [])
            ruta:str = handle_uploaded_file(files)
            doc:Docs = serializer.create(serializer.validated_data)
            doc.ruta = f"media/{ruta}"
            doc.impreso = impreso
            doc.save()

            return Response(serializer.data, 
                        status = status.HTTP_200_OK)

        if path == "/generar-acta/":
            formato = request.data.get('formato', 'pdf').lower()
            items = request.data.get('items', [])
            acta = request.data.get('acta', '')

            data_acta = {
                'numActa': request.data.get('numActa', 1),
                'anio': request.data.get('anio', ''),
                'fechaActa': request.data.get('fechaActa', ''),
                'nombreColegio': request.data.get('nombreColegio', 'CARRIZAL'),
                'descActa': request.data.get('descActa', ''),
                'acta': request.data.get('acta', ''),
                'items': items
            }

            try:
                with transaction.atomic():
                    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                    if acta == 'baja':
                        acta_template = os.path.join(BASE_DIR, 'assets', 'acta_baja_template.docx')
                        file_name_base = f"ACTA DE BAJA DE BIENES N {data_acta['numActa']}-{data_acta['anio']}"
                        
                        activo_ids = [item.get('id') for item in items if item.get('id')]

                        if len(activo_ids) != len(items):
                            raise ValueError("Missing ID in one or more items.")

                        activos_to_update = list(Activos.objects.filter(id__in = activo_ids))

                        if len(activos_to_update) != len(activo_ids):
                            raise ValueError("One or more activos not found.")
                        
                        for activo in activos_to_update:
                            activo.baja = 'DADO DE BAJA CON PLACA'

                        obs_actions = ObservacionesActions()
                        success = obs_actions.create_by_activo_observacion(data_acta)

                        if success > 0:
                            Activos.objects.bulk_update(activos_to_update, ['baja'])
                        else:
                            raise Exception("Failed to create observations. Rolling back.")

                    elif acta == 'traslado' :
                        acta_template = os.path.join(BASE_DIR, 'assets', 'acta_traslado_template.docx')
                        file_name_base = f"ACTA DE TRASLADO DE BIENES N {data_acta['numActa']}-{data_acta['anio']}"

                        # Step 1: Extract destino_ids from items
                        destino_ids = [item['destino_id'] for item in items if item.get('destino_id')]

                        # Step 2: Fetch all necessary Ubicacion instances
                        ubicaciones = Ubicaciones.objects.filter(id__in = destino_ids)
                        ubicacion_map = {u.id: u for u in ubicaciones}

                        # Step 3: Fetch Activos
                        activo_ids = [item['id'] for item in items if item.get('id')]

                        if len(activo_ids) != len(items):
                            raise ValueError("One or more items are missing 'id'.")

                        activos_to_update = Activos.objects.filter(id__in = activo_ids)
                        activo_map = {a.id: a for a in activos_to_update}

                        # Step 4: Assign matched ubicacion to each activo
                        for item in items:
                            activo = activo_map.get(item.get('id'))
                            destino = ubicacion_map.get(item.get('destino_id'))
                            if activo and destino:
                                activo.ubicacion_actual = destino

                        Activos.objects.bulk_update(activos_to_update, ['ubicacion_actual'])
                        HistorialUbicacion.objects.filter(activo__in = activos_to_update).update(acta = True)
                        
                        #obs_actions = ObservacionesActions()
                        #success = obs_actions.create_by_activo_observacion(data_acta)

                        #if success > 0:
                        #else:
                        #    raise Exception("Failed to create observations. Rolling back.")
                            
                    try:
                        doc = DocxTemplate(acta_template)
                        doc.render(data_acta)
                    except Exception as e:
                        return HttpResponseServerError(f"Error loading template: {str(e)}")

                    with tempfile.TemporaryDirectory() as tmpdirname:
                        pdf_path = os.path.join(tmpdirname, 'acta.pdf')
                        docx_path = os.path.join(tmpdirname, 'acta.docx')
                        doc.save(docx_path)

                        def save_and_respond(file_path, extension, content_type):
                            full_filename = f"{file_name_base}.{extension}"

                            with open(file_path, 'rb') as file:
                                ruta = store_acta(file, full_filename)

                                doc_data = {
                                    "titulo": full_filename,
                                    "tipo": "PDF" if extension == "pdf" else "WORD",
                                    "ruta": ruta
                                }

                                serializer = DocSerializer(data = doc_data)
                                if not serializer.is_valid():
                                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                                
                                serializer.save()

                                file.seek(0)
                                response = HttpResponse(file.read(), content_type = content_type)
                                response['Content-Disposition'] = f'attachment; filename="{full_filename}"'
                                return response


                        if formato == 'pdf':
                            # Detect OS
                            if platform.system() == "Windows":
                                libreoffice_cmd = r'C:\Program Files\LibreOffice\program\soffice.exe'
                            else:
                                libreoffice_cmd = '/usr/bin/libreoffice'  # or '/usr/bin/soffice'

                            if not os.path.exists(libreoffice_cmd):
                                return HttpResponseServerError(f"LibreOffice not found at {libreoffice_cmd}")
                            
                            try:
                                subprocess.run([
                                    libreoffice_cmd,
                                    '--headless',
                                    '--convert-to', 'pdf',
                                    docx_path,
                                    '--outdir', tmpdirname
                                ], check=True)
                            except FileNotFoundError:
                                return HttpResponseServerError("LibreOffice is not installed or not found in PATH.")
                            except subprocess.CalledProcessError as e:
                                return HttpResponseServerError(f"LibreOffice conversion failed: {str(e)}")

                            if not os.path.exists(pdf_path):
                                return HttpResponseServerError("PDF file was not generated.")

                            return save_and_respond(pdf_path, 'pdf', 'application/pdf')
                        
                        elif formato == 'docx':
                            return save_and_respond(docx_path, 'docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
                        
                        else:
                            return Response({'error': f"Formato '{formato}' no soportado."}, status = 400)
            except Exception as e:
                # Nothing was saved
                return Response({'error': str(e)}, status = 400)
                
        if path == f"/crear-excel/impresiones/":
            serializer: WhatTheExcelNameIs = WhatTheExcelNameIs(data = request.data)
            
            if not serializer.is_valid():
                return Response(serializer.errors,
                                status = status.HTTP_400_BAD_REQUEST)

            file_name: str = serializer.validated_data.get("file_name", "")
            resultados: QuerySet = get_combined_results()

            path_to_save = os.path.join(MEDIA_ROOT, 'documentos_de_impresion', file_name)
            
            last_doc = Docs.objects.filter(last_row__isnull = False).order_by('-id').first()
            last_row = last_doc.last_row if last_doc else 0

            return handle_excel_impresion(resultados, path_to_save, file_name, last_row)       

        return Response({"error": "not a valid post request"},
                        status = status.HTTP_400_BAD_REQUEST)

    def patch(self, request:Request, pk:int) -> Response:

        try:
            serializer = DocUpdateSerializer(data = request.data)
            if not serializer.is_valid():
                return Response(serializer.errors,
                            status = status.HTTP_400_BAD_REQUEST)        

            doc = Docs.objects.get(id = pk)
            doc = serializer.update(instance = doc,
                                    validated_data = serializer.validated_data)
            context = ReadDocSerializer(instance = doc)

            return Response(context.data,
                            status = status.HTTP_200_OK)

        except Docs.DoesNotExist:
            return Response({"error": "doc does not exist"},
                            status = status.HTTP_404_NOT_FOUND)




    def delete(self, request: Docs, pk: int | None =  None) -> Response:
        try:
            base_dir = settings.BASE_DIR
            doc: Docs = Docs.objects.get(id = pk)

            # Use pathlib for clean path handling
            ruta_path = Path(doc.ruta)

            # Join with BASE_DIR using only relevant parts
            document_absolute_path = os.path.join(base_dir, *ruta_path.parts)
            print(document_absolute_path)
            
            if not os.path.exists(document_absolute_path):
                doc.delete()
                return Response(
                    {"status": "doc entry exists but not the file, entry deleted"},
                    status=status.HTTP_200_OK
                )

            os.remove(document_absolute_path)
            doc.delete()
            return Response(
                {"success": "doc entry and file have been deleted"},
                status=status.HTTP_200_OK
            )

        except Docs.DoesNotExist:
            return Response({"error": "document does not exist"},
                            status = status.HTTP_404_NOT_FOUND)
        

