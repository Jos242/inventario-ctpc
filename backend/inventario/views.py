from django.shortcuts import render
#----------------------------------------------
from rest_framework.parsers     import JSONParser
from rest_framework             import status
from rest_framework.response    import Response
from rest_framework.views       import APIView
from rest_framework.parsers     import FormParser, MultiPartParser, JSONParser 
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
#----------------------------------------------
from .models import Activos
from .serializers import ActivoSerializer
from datetime import datetime
from .utils import (get_remaining_fields, all_activos, all_observaciones, 
                    activos_filter_column, add_activo, get_activo_by_id,
                    get_observacion_by_id_registro)
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
    def get(self, request, pk = None):
        """
        Los metodos HTTP llevan como param el request,
        que en pocas palabras es el HTTP Header que el 
        cliente manda, con toda la info, a partir de aqui
        nosotros generamos la respuesta necesaria en base 
        al request
        """
        path = request.path
        print(path)

        if path == "/todos-los-activos/": 
            return all_activos()
        if path == "/activos-filtrados-columna/":
            return activos_filter_column()
        if path == f"/activo/{pk}/":
            return get_activo_by_id(pk)
        return Response({"data": "Did not match an endpoint for a HTTP GET Method"}, status= status.HTTP_404_NOT_FOUND)
    def post(self, request):
        path = request.path
        if path == "/agregar-activo/":
            resp = add_activo(request)
            return resp
        return Response({"data": "Did not match an endpoint for a HTTP POST Method"}, status = status.HTTP_404_NOT_FOUND)

class ObservacionesView(APIView):
    parser_classes = (FormParser, MultiPartParser, JSONParser)
    
    def get(self, request, id_registro = None):
        path = request.path
        print(path)
        if path == "/todas-las-observaciones/":
            return all_observaciones()
        if path == f"/observacion/{id_registro}/":
            return get_observacion_by_id_registro(id_registro) 