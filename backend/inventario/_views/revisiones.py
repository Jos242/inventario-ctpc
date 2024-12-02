#inventario modules--------------------------------------
from inventario.models                       import Revisiones 
from inventario.permissions                  import IsAdminUser, IsAdminOrFuncionarioUser
from inventario.serializers                  import RevisionesSerializer
#--------------------------------------------------------

#Django modules------------------------------------------
#--------------------------------------------------------

#Django rest frameworks modules--------------------------
from rest_framework import status
from rest_framework.permissions              import IsAuthenticated
from rest_framework.views                    import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.parsers                  import FormParser, MultiPartParser, JSONParser 
from rest_framework.request                  import Request
from rest_framework.response                 import Response
from rest_framework.decorators               import api_view, permission_classes, authentication_classes
#--------------------------------------------------------

#xlsxwriter modules--------------------------------------
#--------------------------------------------------------

#python/general modules----------------------------------
#--------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
@authentication_classes([JWTAuthentication])
def get_all_revisiones(request:Request) -> Response:
    try:
        revisiones = Revisiones.objects.all()
        serializer = RevisionesSerializer(instance = revisiones,
                                          many = True)
        return Response(serializer.data,
                        status = status.HTTP_200_OK)

    except Revisiones.DoesNotExist:
        return Response({"error": "there are not 'revisiones'"},
                        status = status.HTTP_404_NOT_FOUND)

class RevisionesView(APIView):
    parser_classes   = (MultiPartParser, FormParser, JSONParser)
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminOrFuncionarioUser] 
 
    def get(self, request:Request, pk:int | None = None) -> Response:
        path = request.path
      
        if f"/revision/{pk}/" == path:
            try: 
                revision = Revisiones.objects.get(id = pk)
                serializer = RevisionesSerializer(instance = revision)
                return Response(serializer.data, 
                                status = status.HTTP_200_OK)

            except Revisiones.DoesNotExist:
                return Response({"error": "revision does not exist"},
                                status = status.HTTP_404_NOT_FOUND)
 
        if "/no-existe/revisiones/" == path:
            try: 
                revisiones = Revisiones.objects.filter(status = "NO EXISTE")
                serializer = RevisionesSerializer(instance = revisiones, 
                                                many = True)
                return Response(serializer.data, 
                                status = status.HTTP_200_OK)

            except Revisiones.DoesNotExist:
                return Response({"error": "there are not 'revisiones' with status 'NO EXISTE'"},
                                status = status.HTTP_404_NOT_FOUND)


    def post(self, request:Request) -> Response:
        serializer = RevisionesSerializer(data = request.data)

        if not serializer.is_valid():
            return Response(serializer.errors,
                            status = status.HTTP_400_BAD_REQUEST)
        
        serializer.create(serializer.validated_data)

        return Response(serializer.data, 
                        status = status.HTTP_200_OK)

    def patch(self, request:Request, pk:int | None = None) -> Response: 
        try:
            revision: Revisiones = Revisiones.objects.get(id = pk)
            serializer = RevisionesSerializer(data = request.data)

            if not serializer.is_valid():
                return Response(serializer.errors, 
                                status = status.HTTP_400_BAD_REQUEST)

            revision:Revisiones = serializer.update(instance = revision,
                                                    validated_data= serializer.validated_data)
            return Response(serializer.data,
                            status.HTTP_200_OK) 

        except Revisiones.DoesNotExist:
            return Response({"error": "revisiones does not exist"},
                            status = status.HTTP_404_NOT_FOUND)
            

    def delete(self, request:Request, pk:int | None = None) -> Response:
        try: 
            revision = Revisiones.objects.get(id = pk)
            revision.delete() 
            return Response({"status": "revision has been deleted"}, 
                             status = status.HTTP_200_OK)

        except Revisiones.DoesNotExist:
            return Response({"error": "revision does not exist"},
                            status = status.HTTP_404_NOT_FOUND)

      
