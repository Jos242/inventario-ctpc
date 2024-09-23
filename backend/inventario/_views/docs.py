#inventario modules--------------------------------------
from inventario.models                       import Docs, Activos, Observaciones 
from inventario.permissions                  import IsAdminUser
from inventario.serializers                  import ReadDocSerializer, DocUpdateSerializer, WhatTheExcelNameIs, DocSerializer
from inventario._utils.activos_utils         import get_combined_results, determine_print_type, handle_observaciones_y_activos, handle_solo_activos, handle_solo_observaciones
from inventario._utils.file_utils            import handle_uploaded_file
#--------------------------------------------------------

#Django modules------------------------------------------
from django.db.models                        import F, QuerySet, Value
from django.http                             import HttpResponse
from django.db.models.functions              import Coalesce
from django.db.models                        import CharField, OuterRef, Subquery, Func
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
            docs:Docs = Docs.objects.all()
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

    def post(self, request:Request):
        path = request.path

        if path == "/guardar-acta/":
            serializer:DocSerializer = DocSerializer(data = request.data)  
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

                
        if path == f"/crear-excel/impresiones/":
            serializer:WhatTheExcelNameIs = WhatTheExcelNameIs(data = request.data)

            if not serializer.is_valid():

                return Response(serializer.errors,
                                status = status.HTTP_400_BAD_REQUEST)

            file_name:str = serializer.validated_data.get("file_name", "")
            resultados:QuerySet = get_combined_results()
            
            if len(resultados[:40]) < 40:
                return Response(data = {"error": ("there is not enough information "
                                                  "to generate the excel")},
                                status = status.HTTP_400_BAD_REQUEST)

            print_type:str = determine_print_type(resultados[:40])
            path_to_save   = os.path.join(MEDIA_ROOT, 'documentos_de_impresion',
                                          file_name)

            if print_type == "SoloActivos":
                return handle_solo_activos(resultados, path_to_save, file_name)

            elif print_type == "SoloObservaciones":
                return handle_solo_observaciones(resultados, path_to_save,
                                                 file_name)

            return handle_observaciones_y_activos(resultados, path_to_save, file_name)            


        if path == f"/forzar-excel/impresiones/":
            return Response("/forzar-excel/impresiones/", status = status.HTTP_200_OK) 

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




    def delete(self, request:Docs, pk:int | None =  None) -> Response:
        try:
            doc:Docs = Docs.objects.get(id = pk)
            path = str(doc.ruta).split(sep = "/")
            document_absolute_path:str = os.path.join(BASE_DIR, path[0],
                                                      path[1], path[2])
            exist = os.path.exists(document_absolute_path)
            
            if not exist:
                doc.delete()
                return Response({"status": "doc entry exists but not the file, entry deleted"},
                                status = status.HTTP_200_OK)

            os.remove(document_absolute_path)
            doc.delete()
            return Response({"success": "doc entry and file have been deleted"},
                            status = status.HTTP_200_OK)

        except Docs.DoesNotExist:
            return Response({"error": "document does not exist"},
                            status = status.HTTP_404_NOT_FOUND)
        

