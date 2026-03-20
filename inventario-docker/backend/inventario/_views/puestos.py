#inventario modules--------------------------------------
from inventario.models                       import Puestos
from inventario.serializers                  import PuestosSerializer
#--------------------------------------------------------

#Django modules------------------------------------------
from django.db.models                        import F, Value, CharField, OuterRef, Subquery, Func
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
from rest_framework.decorators               import api_view, permission_classes, authentication_classes
#--------------------------------------------------------

#xlsxwriter modules--------------------------------------
import xlsxwriter
#--------------------------------------------------------

#io modules----------------------------------------------
import io
#--------------------------------------------------------


class PuestosView(APIView):
    parser_classes   = (MultiPartParser, FormParser, JSONParser)
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated] 

    def get(self, request:Request, pk:int | None = None) -> Response | HttpResponse:
        path:str = request.path

        if f"/all-puestos/" == path:
            try: 
                puesto = Puestos.objects.all()
                serializer = PuestosSerializer(instance = puesto, many = True)

                return Response(serializer.data, 
                               status = status.HTTP_200_OK)

            except Puestos.DoesNotExist:
                return Response({"error": "puesto does not exist"},
                                status = status.HTTP_404_NOT_FOUND)
        