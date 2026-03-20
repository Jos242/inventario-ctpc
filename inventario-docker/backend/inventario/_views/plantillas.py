from inventario.models                       import Plantillas
from inventario.serializers                  import PlantillasSerializer 
from rest_framework.response                 import Response
from rest_framework                          import status
from inventario.permissions                  import IsAdminUser
from rest_framework.permissions              import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework                          import generics
from rest_framework                          import mixins


class PlantillasView(mixins.CreateModelMixin,
                     mixins.ListModelMixin,
                     mixins.RetrieveModelMixin,
                     mixins.UpdateModelMixin,
                     mixins.DestroyModelMixin,
                     generics.GenericAPIView):

    queryset = Plantillas.objects.all()
    serializer_class = PlantillasSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, *args, **kwargs):
        if 'pk' in kwargs:
            return self.retrieve(request, *args, **kwargs)

        elif request.path == '/all-plantillas/':
            return self.list(request, *args, **kwargs)
        
        return Response({"error": "not a valid endpoint"},
                         status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, *args, **kwargs):
        if request.path == '/nueva-plantilla/':
            return self.create(request, *args, **kwargs)
        
        return Response({"error": "not a valid endpoint"},
                         status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request, *args, **kwargs):
        if 'pk' in kwargs:
            return self.update(request, *args, **kwargs)
        
        return Response({"error": "not a valid endpoint"},
                         status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, *args, **kwargs):
        if 'pk' in kwargs:
            return self.destroy(request, *args, **kwargs)
        
        return Response({"error": "not a valid endpoint"},
                         status=status.HTTP_400_BAD_REQUEST)

