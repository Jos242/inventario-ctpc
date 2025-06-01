#inventario modules--------------------------------------
from inventario.models                       import Departamentos
from inventario.serializers                  import DepartamentosSerializer
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


class DepartamentosView(APIView):
    parser_classes   = (MultiPartParser, FormParser, JSONParser)
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated] 

    def get(self, request:Request, pk:int | None = None) -> Response | HttpResponse:
        path:str = request.path

        if f"/all-departamentos/" == path:
            try: 
                departamento = Departamentos.objects.all()
                serializer = DepartamentosSerializer(instance = departamento, many = True)

                return Response(serializer.data, 
                               status = status.HTTP_200_OK)

            except Departamentos.DoesNotExist:
                return Response({"error": "departamento does not exist"},
                                status = status.HTTP_404_NOT_FOUND)
        