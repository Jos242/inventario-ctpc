from django.shortcuts import render
#----------------------------------------------
from rest_framework.parsers     import JSONParser
from rest_framework             import status
from rest_framework.response    import Response
from rest_framework.views       import APIView
from rest_framework.parsers     import FormParser, MultiPartParser, JSONParser 
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
#----------------------------------------------
from .models import Activos
from .serializers import ActivoSerializer
from datetime import datetime
from .utils import (get_remaining_fields, all_activos, all_observaciones, 
                    activos_filter_column, add_activo, get_activo_by_id,
                    get_observacion_by_id_registro, add_new_observacion, 
                    new_usuario, sign_up, log_out, save_acta, get_all_docs,
                    get_doc_by_id)
#----------------------------------------------

"""
Las clases que se encuentren en cualquier archivo 
que se llame views.py, se encargan de generar la 
accion a realizar (POST, GET, PUT...) que solicite
el cliente.
"""
class ActivosView(APIView):
    """
    Los metodos llevan el nombre de el metodo HTTP
    al cual queramos responder.
    """

    parser_classes = (FormParser, MultiPartParser, JSONParser)
    # permission_classes = [IsAuthenticated]
    # authentication_classes = [SessionAuthentication, BasicAuthentication]

    def get(self, request, pk = None):
        """
        Los metodos HTTP llevan como param el request,
        que en pocas palabras es el HTTP Header que el 
        cliente manda, con toda la info, a partir de aqui
        nosotros generamos la respuesta necesaria en base 
        al request
        """

        path = request.path
        if path == "/todos-los-activos/": 
            return all_activos()
        if path == "/activos-filtrados-columna/":
            return activos_filter_column()
        if path == f"/activo/{pk}/":
            return get_activo_by_id(pk)
        return Response({"data": "did not match an endpoint for a HTTP GET Method"}, status= status.HTTP_404_NOT_FOUND)

    def post(self, request):
        path = request.path
        if path == "/agregar-activo/":
            resp = add_activo(request)
            return resp
        return Response({"data": "did not match an endpoint for a HTTP POST Method"}, status = status.HTTP_404_NOT_FOUND)

class ObservacionesView(APIView):
    parser_classes = (FormParser, MultiPartParser, JSONParser)
    
    def get(self, request, activo = None):
        
        path = request.path
        print(path)
        if path == "/todas-las-observaciones/":
            return all_observaciones()
        if path == f"/observacion/{activo}/":
            return get_observacion_by_id_registro(activo)
        
    def post(self, request):
        
        path = request.path
        if path == "/nueva-observacion/":
            return add_new_observacion(request)
        

class UserView(APIView):
    
    def post(self, request):
        path = request.path
        if path == "/crear-usuario/": 
            return new_usuario(request)
        if path == "/iniciar-sesion/":
            return sign_up(request)
        if path == "/salir/":
            return log_out(request)

class DocsView(APIView):
    parser_classes   = (MultiPartParser, FormParser, JSONParser)
    
    def get(self, request, pk:int = None):
        path = request.path
        if path == "/obtener-documentos/": 
            return get_all_docs()
        if path == f"/obtener-documento/{pk}/":
            return get_doc_by_id(pk)

        return Response({"error": "not a valid get request"},
                        status = status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        path = request.path
        if path == "/guardar-acta/":
            return save_acta(request)

        return Response({"error": "not a valid post request"},
                        status = status.HTTP_400_BAD_REQUEST)
