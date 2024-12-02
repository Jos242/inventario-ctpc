#inventario modules--------------------------------------
from inventario.models                       import CierreInventario 
from inventario.permissions                  import IsAdminOrFuncionarioUser, IsAdminUser
from inventario.serializers                  import CierreInventarioSerializer, ReadCierreInventarioSerializer
#--------------------------------------------------------

#Django modules------------------------------------------
#--------------------------------------------------------

#Django rest frameworks modules--------------------------
from rest_framework.permissions              import IsAuthenticated
from rest_framework.views                    import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.parsers                  import FormParser, MultiPartParser, JSONParser 
from rest_framework.request                  import Request
from rest_framework.response                 import Response
from rest_framework.decorators               import api_view, authentication_classes, permission_classes
from rest_framework                          import status
#--------------------------------------------------------

#xlsxwriter modules--------------------------------------
#--------------------------------------------------------

#io modules----------------------------------------------
#--------------------------------------------------------

class CierreInventarioView(APIView):
    parser_classes   = (MultiPartParser, FormParser, JSONParser)
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser] 

    def get(self, request:Request, pk = None) -> Response:
       path = request.path
       if f'/cierre/{pk}/' == path:
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
                return Response(context, 
                                 status = status.HTTP_200_OK)
              
            except CierreInventario.DoesNotExist:
                return Response({"error": "cierre inventario does not exist"},
                                status = status.HTTP_404_NOT_FOUND)

       if '/all-cierres/' == path:
            try: 
                cierres = CierreInventario.objects.all()
                serializer = ReadCierreInventarioSerializer(instance = cierres,
                                                            many = True) 
                return Response(serializer.data, 
                                status = status.HTTP_200_OK)

            except CierreInventario.DoesNotExist:
                return Response({"error": "cierre inventario db is empty"},
                                status = status.HTTP_404_NOT_FOUND)


    def delete(self, request:Request, pk = None) -> Response:
        try: 
            cierre = CierreInventario.objects.get(id = pk)
            cierre.delete()
            return Response({"status": "entry was deleted"}, 
                        status = status.HTTP_200_OK)
 
        except CierreInventario.DoesNotExist:
            return Response({"error": "cierre inventario db is empty"},
                            status = status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated, IsAdminOrFuncionarioUser])
def new_cierre(request:Request) -> Response:
    serializer = CierreInventarioSerializer(data = request.data)
    if not serializer.is_valid():
        return Response(serializer.errors,
                    status = status.HTTP_400_BAD_REQUEST)

    cierre = serializer.create(serializer.validated_data)
    serializer = CierreInventarioSerializer(instance = cierre)
    return Response(serializer.data, 
                    status = status.HTTP_200_OK)

@api_view(['PATCH'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated, IsAdminOrFuncionarioUser])
def update_cierre(request:Request, pk:int | None = None) -> Response:
    serializer = CierreInventarioSerializer(data = request.data)
    if not serializer.is_valid():
        return Response(serializer.errors,
                            status = status.HTTP_400_BAD_REQUEST)

    try:
        cierre = CierreInventario.objects.get(id = pk)
        cierre:CierreInventario = serializer.update(instance = cierre,
                                                    validated_data= serializer.validated_data)
        cierre.save()
        serializer = ReadCierreInventarioSerializer(instance = cierre)  
        return Response(serializer.data) 

    except CierreInventario.DoesNotExist:
        return Response({"error": "cierre inventario does not exist"},
                        status = status.HTTP_404_NOT_FOUND)
        
