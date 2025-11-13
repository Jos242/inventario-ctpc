

from inventario.serializers                  import PendienteSerializer
from inventario.models                       import Pendiente, User
from inventario.permissions                  import IsAdminUser
#--------------------------------------------------------

#Django modules------------------------------------------
from django.db.models                        import F, Value
from django.http                             import HttpResponse
from django.db.models.functions              import Coalesce
from django.utils                            import timezone
from django.db                               import transaction
#--------------------------------------------------------

#Django rest frameworks modules--------------------------
from rest_framework                          import status
from rest_framework.permissions              import IsAuthenticated
from rest_framework.views                    import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.parsers                  import FormParser, MultiPartParser, JSONParser 
from rest_framework.request                  import Request
from rest_framework.response                 import Response
from rest_framework.decorators               import api_view, permission_classes

class PendienteView(APIView):
    parser_classes   = (MultiPartParser, FormParser, JSONParser)
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated] 


    def get(self, request:Request, pk:int | None = None) -> Response | HttpResponse:
        path:str = request.path

        if path == "/all-pendientes/":
            pendientes = Pendiente.objects.all().order_by('creado_en')
            serializer = PendienteSerializer(pendientes, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # retrieve single pendiente if pk provided
        if pk is not None:
            try:
                pendiente = Pendiente.objects.get(id=pk)
            except Pendiente.DoesNotExist:
                return Response({"error": "Pendiente does not exist"},
                                status=status.HTTP_404_NOT_FOUND)

            serializer = PendienteSerializer(instance=pendiente)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # fallback: path not recognized
        return Response({"error": "bad request"}, status=status.HTTP_400_BAD_REQUEST)
            
    def post(self, request:Request, pk:int | None = None):
        path: str = request.path

        if pk is not None:
            try:
                pendiente = Pendiente.objects.get(id=pk)
            except Pendiente.DoesNotExist:
                return Response({"error": "Pendiente does not exist"},  status=status.HTTP_404_NOT_FOUND)
          
            if not pendiente.aprovado:
                pendiente.aprovado = 1
                pendiente.aprovado_por = request.user
                pendiente.aprovado_en = timezone.now()
                pendiente.save(update_fields=['aprovado', 'aprovado_por', 'aprovado_en'])
          
            read_ser = PendienteSerializer(instance=pendiente)
            return Response(read_ser.data, status=status.HTTP_200_OK)

        
        # CREATE: no pk (POST /pendiente/create/)
        try:
          serializer = PendienteSerializer(data=request.data)

          if not serializer.is_valid():
              print(serializer.errors)  # <-- This will show validation errors in console
              return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

          pendiente = serializer.save(usuario=request.user)
          read_ser = PendienteSerializer(instance=pendiente)
          return Response(read_ser.data, status=status.HTTP_201_CREATED)

        except Exception as e:
          print(e)  # <-- Print error to console/log
          return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request: Request, pk: int) -> Response:
        try:
            pendiente = Pendiente.objects.get(id=pk)
        except Pendiente.DoesNotExist:
            return Response({"error": "Pendiente does not exist"}, status=status.HTTP_404_NOT_FOUND)

        want_approve = bool(request.data.get('aprovar'))
        aprovado_por_id = request.data.get('aprovado_por_id')
        with transaction.atomic():
            try:
                user_obj = User.objects.get(id=aprovado_por_id)
                if want_approve:
                    pendiente.aprovado = 1
                    pendiente.aprovado_por = user_obj
                    pendiente.aprovado_en = timezone.now()
                    pendiente.save(update_fields=['aprovado', 'aprovado_por', 'aprovado_en'])
                else:
                    pendiente.aprovado = 0
                    pendiente.aprovado_por = user_obj
                    pendiente.aprovado_en = timezone.now()
                    pendiente.save(update_fields=['aprovado', 'aprovado_por', 'aprovado_en'])
            except User.DoesNotExist:
                return Response({"error": f"User {aprovado_por_id} not found"},
                                status=status.HTTP_400_BAD_REQUEST)

        return Response(PendienteSerializer(instance = pendiente).data, status=status.HTTP_200_OK)

    def delete(self, request:Request, pk:int):
        try:
            pendiente = Pendiente.objects.get(id=pk)
            pendiente.delete()
            return Response({"status": "pendiente has been deleted"},
                            status=status.HTTP_200_OK)
        except Pendiente.DoesNotExist:
            return Response({"error": "Pendiente does not exist"},
                            status=status.HTTP_404_NOT_FOUND)

