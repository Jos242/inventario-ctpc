# using this path to search for modules
# >>> ~/Desktop/projects/inventario-ctpc/backend/ 

from inventario.models                       import HistorialUbicacion
from inventario.serializers                  import HistorialUbicacionSerializer
from rest_framework.response                 import Response
from rest_framework                          import status
from inventario.permissions                  import IsAdminUser
from rest_framework.permissions              import IsAuthenticated
from rest_framework.views                    import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.request                  import Request

class HistorialUbicacionView(APIView):

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, pk: int):
        path = request.path

        if path == f'/historial-ubicacion-activo/{pk}/':
            try:
                historial = HistorialUbicacion.objects.filter(activo = pk).order_by("-fecha")

                serializer = HistorialUbicacionSerializer(historial, many = True)
                return Response(serializer.data, status = status.HTTP_200_OK)

            except historial.DoesNotExist:
                return Response({"error": "Historial de Acceso Does Not Exist"},
                                status = status.HTTP_400_BAD_REQUEST)

    def post(self, request: Request):
        path = request.path

        if path == "/create-historial-ubicacion/":
            serializer: HistorialUbicacionSerializer = HistorialUbicacionSerializer(data = request.data)  

            if not serializer.is_valid():
                return Response(serializer.errors,
                            status = status.HTTP_400_BAD_REQUEST)

            serializer.save()
            return Response(serializer.data, status = status.HTTP_201_CREATED)
