# using this path to search for modules
# >>> ~/Desktop/projects/inventario-ctpc/backend/ 

from inventario.models                       import HistorialDeAcceso
from inventario.serializers                  import HistorialDeAccesoSerializer
from rest_framework.response                 import Response
from rest_framework                          import status
from inventario.permissions                  import IsAdminUser
from rest_framework.permissions              import IsAuthenticated
from rest_framework.views                    import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.request                  import Request

class HistorialDeAccesoView(APIView):

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request:Request, **kwargs):
        user_id = kwargs.get('user_id')
        path = request.path

        if path == f'/historial-acceso/{user_id}/':
            try:
                historial_acceso = HistorialDeAcceso.objects.filter(usuario = user_id)
                serializer = HistorialDeAccesoSerializer(instance = historial_acceso,
                                                         many = True)
                return Response(serializer.data,
                                status = status.HTTP_200_OK)

            except HistorialDeAcceso.DoesNotExist:
                return Response({"error": "Historial de Acceso Does Not Exist"},
                                status = status.HTTP_400_BAD_REQUEST)
        
        if  path == '/all/historial-acceso/':
            historial_acceso = HistorialDeAcceso.objects.all()
            serializer = HistorialDeAccesoSerializer(instance = historial_acceso,
                                                     many = True)

            return Response(serializer.data, 
                            status = status.HTTP_200_OK)
        
        return Response({"error": "not a valid endpoint"},
                        status = status.HTTP_400_BAD_REQUEST)

