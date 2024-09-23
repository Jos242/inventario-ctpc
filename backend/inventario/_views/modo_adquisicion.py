# using this path to search for modules
# >>> ~/Desktop/projects/inventario-ctpc/backend/ 

from inventario.models                       import ModoAdquisicion
from inventario.serializers                  import ModoAdquisicionSerializer
from rest_framework.response                 import Response
from rest_framework                          import status
from rest_framework.request                  import Request
from inventario.permissions                  import IsAdminUser
from rest_framework.permissions              import IsAuthenticated
from rest_framework.views                    import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.parsers                  import FormParser, MultiPartParser, JSONParser 

class ModoAdquisicionView(APIView):
    parser_classes   = (MultiPartParser, FormParser, JSONParser)
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]  

    def get(self, request:Request, pk:int | None = None) -> Response:
        path:str = request.path

        if f'/modo-adquisicion/{pk}/' == path:
            try: 
                adquisicion = ModoAdquisicion.objects.get(id = pk)
                serializer = ModoAdquisicionSerializer(instance = adquisicion)

            except ModoAdquisicion.DoesNotExist:
                return Response({"error": "modo adquisicion does not exist"},
                                 status = status.HTTP_404_NOT_FOUND)
            
            return Response(serializer.data,
                            status = status.HTTP_200_OK)


        if f'/all/modo-adquisicion/' == path:
            try:
                adquisicion = ModoAdquisicion.objects.all().order_by('id')
                serializer = ModoAdquisicionSerializer(instance = adquisicion,
                                                       many = True)
            except ModoAdquisicion.DoesNotExist:
                return Response({"error": "there are not 'modos de adquisicion'"},
                                status = status.HTTP_404_NOT_FOUND)

            return Response(serializer.data,
                            status = status.HTTP_200_OK)

        return Response({'error': 'could not find any GET endpoint'},
                        status = status.HTTP_404_NOT_FOUND)

    def post(self, request:Request):
        serializer = ModoAdquisicionSerializer(data = request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors,
                            status = status.HTTP_400_BAD_REQUEST)

        serializer.create(serializer.validated_data)
        return Response(serializer.data, 
                            status = status.HTTP_200_OK)


                
    def patch(self, request:Request, pk:int | None = None) -> Response:
        serializer = ModoAdquisicionSerializer(data = request.data)

        if not serializer.is_valid():
            return Response(serializer.errors,
                            status = status.HTTP_400_BAD_REQUEST)

        try:
            adquisicion = ModoAdquisicion.objects.get(id = pk)
            revision = serializer.update(instance = adquisicion,
                                         validated_data= serializer.validated_data)
            revision.save()
            serializer = ModoAdquisicionSerializer(instance = adquisicion)
            return Response(serializer.data,
                       status = status.HTTP_200_OK) 
            
        except ModoAdquisicion.DoesNotExist:
            return Response({"error": "modo adquisicion does not exist"},
                            status = status.HTTP_404_NOT_FOUND)
                   
    def delete(self, request:Request, pk:int | None = None) -> Response:

        try: 
            adquisicion = ModoAdquisicion.objects.get(id = pk)
            adquisicion.delete()
            return Response({"status": "modo adquisicion deleted"}, 
                            status = status.HTTP_200_OK) 
 
        except ModoAdquisicion.DoesNotExist:
            return Response({"error": "modo adquisicion does not exist"},
                            status = status.HTTP_404_NOT_FOUND)
