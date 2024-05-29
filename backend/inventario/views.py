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
        return Response("Hola mundo", status = status.HTTP_200_OK)
    
    def post(self, request):
        REMAINING_FIELDS = {
            "id_registro": "200,04",
            "asiento": 4
        } 
        serializer = ActivoSerializer(data = request.data)
        ultimo = Activos.objects.order_by('-id').values_list('id_registro', flat=True).first()
        if serializer.is_valid():
            valid_activo = serializer.data | REMAINING_FIELDS
            activo = Activos(**valid_activo)
            activo.save()
            

    
        return Response("Esto es para responder a lo request de el HTTP Post Method", status = status.HTTP_200_OK)