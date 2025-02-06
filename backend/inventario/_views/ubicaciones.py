#inventario modules--------------------------------------
from inventario.models                       import Ubicaciones
from inventario.permissions                  import IsAdminUser
from inventario.serializers                  import ReadUbicacionesSerializer, UbicacionesSerializer
#--------------------------------------------------------

#Django modules------------------------------------------
from django.db.models                        import F, Value
from django.http                             import HttpResponse
from django.db.models.functions              import Coalesce
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
#--------------------------------------------------------



class UbicacionesView(APIView):
    parser_classes   = (MultiPartParser, FormParser, JSONParser)
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated] 


    def get(self, request:Request, pk:int | None = None) -> Response | HttpResponse:
        path:str = request.path

        if f"/ubicacion/{pk}/" == path:
            try: 
                ubicacion = Ubicaciones.objects.get(id = pk)
                serializer = ReadUbicacionesSerializer(instance = ubicacion)
                return Response(serializer.data, 
                               status = status.HTTP_200_OK)

            except Ubicaciones.DoesNotExist:
                return Response({"error": "ubicacion does not exist"},
                                status = status.HTTP_404_NOT_FOUND)
        
        if path == "/ubicaciones-excel/":
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
   
        if path == "/all-ubicaciones/":
            try:
                ubicaciones = Ubicaciones.objects.all()
                serializer = UbicacionesSerializer(instance = ubicaciones,
                                                   many = True)
                return Response(serializer.data,
                                status = status.HTTP_200_OK)
                                                                
            except Ubicaciones.DoesNotExist:
                return Response({"error": "there are not 'ubicaciones'"},
                                status = status.HTTP_404_NOT_FOUND)


            
    def post(self, request:Request):
        serializer = UbicacionesSerializer(data = request.data)

        if not serializer.is_valid():
            return Response(serializer.errors,
                            status = status.HTTP_400_BAD_REQUEST)
        
        files = request.FILES.getlist('img_path')
        
        ubicacion:Ubicaciones = serializer.create(ubicacion_files = files,
                                                  validated_data = serializer.validated_data)

        serializer = ReadUbicacionesSerializer(instance = ubicacion)

        return Response(serializer.data, 
                        status = status.HTTP_200_OK)

    def patch(self, request:Request, pk:int) -> Response:
        serializer = UbicacionesSerializer(data = request.data)

        try:
            ubicacion = Ubicaciones.objects.get(id = pk)
           
        except Ubicaciones.DoesNotExist:
            return Response({"error": "ubicacion does not exist"},
                            status = status.HTTP_404_NOT_FOUND)
            
        if not serializer.is_valid(): 
            return Response(serializer.errors,
                            status = status.HTTP_400_BAD_REQUEST)
        files = request.FILES.getlist('img_path')
        ubicacion:Ubicaciones = serializer.update(instance = ubicacion,
                                                  ubicacion_files = files,
                                                  validated_data = serializer.validated_data) 

        return Response(ReadUbicacionesSerializer(instance = ubicacion).data,
                        status = status.HTTP_200_OK) 

    def delete(self, request:Request, pk:int):
        try: 
            ubicacion = Ubicaciones.objects.get(id = pk)
            ubicacion.delete()
            return Response({"status": "ubicacion has been deleted"}, 
                            status = status.HTTP_200_OK)

        except Ubicaciones.DoesNotExist:
            return Response({"error": "ubicacion does not exist"},
                            status = status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([])
def get_ubicacion_by_funcionarios(request:Request,
                                  funcionario_id: int | None = None) -> Response:
    try: 
        ubicacion = Ubicaciones.objects.get(funcionario_id = funcionario_id)
        serializer = UbicacionesSerializer(instance = ubicacion)
        return Response(serializer.data, 
                        status = status.HTTP_200_OK)

    except Ubicaciones.DoesNotExist:
        return Response({"error": "ubicacion with selected funcionario does not exist"},
                        status = status.HTTP_404_NOT_FOUND)

