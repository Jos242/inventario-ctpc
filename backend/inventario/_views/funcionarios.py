#inventario modules--------------------------------------
from inventario.models                       import User, Funcionarios, Ubicaciones, Departamentos, Puestos
from inventario.permissions                  import IsAdminUser
from inventario.serializers                  import ReadFuncionariosSerializer
#--------------------------------------------------------

#Django modules------------------------------------------
from django.db.models                        import F, Value, CharField, OuterRef, Subquery, Func
from django.http                             import HttpResponse
from django.db.models.functions              import Coalesce
#--------------------------------------------------------

#Django rest frameworks modules--------------------------
from rest_framework.permissions              import IsAuthenticated
from rest_framework.views                    import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.parsers                  import FormParser, MultiPartParser, JSONParser 
from rest_framework.request                  import Request
from rest_framework.response                 import Response
from rest_framework.decorators               import api_view, permission_classes
from rest_framework                          import status
#--------------------------------------------------------

#xlsxwriter modules--------------------------------------
import xlsxwriter
#--------------------------------------------------------

#io modules----------------------------------------------
import io
#--------------------------------------------------------


class FuncionariosView(APIView):
    parser_classes   = (MultiPartParser, FormParser, JSONParser)
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser] 

    def get(self, request:Request) -> HttpResponse:
        funcionarios = Funcionarios.objects.annotate(
            username=Subquery(
                User.objects.filter(id=OuterRef('user_id')).values('username')[:1]
            ),
            departamento_desc=Subquery(
                Departamentos.objects.filter(id=OuterRef('departamento')).values('descripcion')[:1]
            ),
            puesto_desc=Subquery(
                Puestos.objects.filter(id=OuterRef('puesto')).values('descripcion')[:1]
            ),
            ubicacion=Coalesce(
              Subquery(
                        Ubicaciones.objects.filter(funcionario_id=OuterRef('id'))
                            .values('funcionario_id')
                            .annotate(ubicaciones_str=Func(
                                F('nombre_oficial'),
                                function='GROUP_CONCAT',
                                distinct=True,
                                separator=', '
                            ))
                            .values('ubicaciones_str')[:1]
                    ),
                    Value('Aun no asignada'),
                    output_field=CharField()
                ) 
            )\
            .values(
            'id',
            'username',
            'nombre_completo',
            'departamento_desc',
            'puesto_desc',
            'ubicacion'
            )
        total_ubicaciones = max(
            (len(funcionario["ubicacion"].split(","))
            for funcionario in funcionarios
            if funcionario["ubicacion"] != 'Aun no asignada'),
            default= 1)

        excel_fields = ["Cedula", "Nombre Completo", "Departamento",
                        "Puesto", "Ubicacion"]
             
        if total_ubicaciones > 1:
            excel_fields = ["Username", "Nombre Completo",
                            "Departamento", "Puesto"]
            
            for i in range(0, total_ubicaciones):
                excel_fields.append(f"Ubicacion_{i + 1}")
                
                 
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output, {"in_memory": True})
        worksheet = workbook.add_worksheet()
        worksheet.write_row('A1', excel_fields)
        for i, funcionario in enumerate(funcionarios, start=2):
            row = [
                funcionario["username"],
                funcionario["nombre_completo"],
                funcionario["departamento_desc"],
                funcionario["puesto_desc"]
            ]
            ubicaciones:list = funcionario["ubicacion"].split(",")
            
            if len(ubicaciones) < total_ubicaciones:
                ubicaciones.extend(['Aun no asignada'] * (total_ubicaciones - len(ubicaciones)))

            for ubicacion in ubicaciones:
                row.append(ubicacion)

            worksheet.write_row(f'A{i}', row)
        workbook.close()
        output.seek(0)
        response = HttpResponse(output.read(), 
                            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response['Content-Disposition'] = "attachment; filename=.xlsx"
        output.close()

        return response

@api_view(['GET'])
@permission_classes([])
def get_funcionario_by_id(request:Request, pk: int | None = None) -> Response:
    try: 
        funcionario = Funcionarios.objects.get(id = pk)
        serializer = ReadFuncionariosSerializer(instance = funcionario)
        return Response(serializer.data, 
                       status = status.HTTP_200_OK)

    except Funcionarios.DoesNotExist:
        return Response({"error": "funcionario does not exist"},
                        status = status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([])
def get_all_funcionarios(request:Request) -> Response:
        try:
            funcionarios = Funcionarios.objects.all()
            serializer = ReadFuncionariosSerializer(instance = funcionarios,
                                                    many = True)
            return Response(serializer.data,
                           status = status.HTTP_200_OK)

        except Funcionarios.DoesNotExist:
            return Response({"error": "there are not 'funcionarios'"},
                            status = status.HTTP_404_NOT_FOUND)
