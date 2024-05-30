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
from .serializers import ActivoSerializer, ReadActivoSerializer
from datetime import datetime
from .utils import get_remaining_fields, all_activos, activos_filter_column
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
    def get(self, request):
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
        return Response({"data": "Did not match an endpoint for an HTTP GET Method"}, status= status.HTTP_404_NOT_FOUND)
    def post(self, request):
        remaining_fields = get_remaining_fields()
        print(f"The new entry: {remaining_fields}")
        serializer = ActivoSerializer(data = request.data)
        if serializer.is_valid():
            valid_activo = serializer.data | remaining_fields
            activo = Activos(**valid_activo)
            activo.save()
 
        return Response("Esto es para responder a lo request de el HTTP Post Method", status = status.HTTP_200_OK)
      