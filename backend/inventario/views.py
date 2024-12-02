from typing import Any
from django.shortcuts import render
#----------------------------------------------
from rest_framework.parsers     import JSONParser
from rest_framework             import status
from rest_framework.response    import Response
from rest_framework.views       import APIView
from rest_framework.parsers     import FormParser, MultiPartParser, JSONParser 
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework_simplejwt.authentication import JWTAuthentication
from .permissions import IsAdminOrFuncionarioUser, IsAdminUser
#----------------------------------------------
from .utils import *
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
    activos_do:ActivosActions = None
    #authentication_classes = [JWTAuthentication]
    #permission_classes = [IsAuthenticated, IsAdminUser]
    authentication_classes = []
    permission_classes = []

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.activos_do = ActivosActions()     

    def get(self, request):
        """
        Los metodos HTTP llevan como param el request,
        que en pocas palabras es el HTTP Header que el 
        cliente manda, con toda la info, a partir de aqui
        nosotros generamos la respuesta necesaria en base 
        al request
        """
        path = request.path
 
        if path == f"/excel/todos-los-activos/":
            rp:Response = self.activos_do.get_excel_all_activos()
            return rp
       
        return Response({"data": "did not match an endpoint for a HTTP GET Method"},
                         status= status.HTTP_404_NOT_FOUND)

    def post(self, request):
        path = request.path

        if path == "/agregar-activo/":
            print(request.data)
            resp = self.activos_do.add_activo(request)  
            return resp
        
                
        if path == "/activos/excel/by/nos-identificacion/":
            rp:Response = self.activos_do.create_excel_by_nos_identificacion(request)
            return rp
  
        return Response({"data": "did not match an endpoint for a HTTP POST Method"},
                         status = status.HTTP_404_NOT_FOUND)
    
    def patch(self, request, pk:int):
        path = request.path

        if f'/update-activo/{pk}/' == path:
            rp:Response = self.activos_do.update_activo(request = request,
                                                        pk = pk)
            return rp

    def delete(self, request):
        path = request.path

        if path == "/delete/last/id-registro/":
            rp:Response = self.activos_do.delete_last_id_registro()
            return rp
       
class ActivosViewNoAuth(APIView):

    permission_classes = []
    authentication_classes = []

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.activos_do = ActivosActions()
    
    def get(self, request, *args, **kwargs):
        path = request.path
        pk = kwargs.get("pk", None)
        no_identificacion = kwargs.get("no_identificacion", None)
        ubicacion_actual = kwargs.get("ubicacion_actual", None)

        if path == f"/activo/{pk}/":
            return self.activos_do.get_activo_by_id(pk)

        if path == f"/activo/{no_identificacion}/":
            rp:Response = self.activos_do.get_activo_by_no_identificacion(no_identificacion)
            return rp

        if path == f"/activo/ubicacion-actual/{ubicacion_actual}/":
            rp:Response = self.activos_do.get_activo_by_ubicacion_id(ubicacion_actual)
            return rp

        if path == "/activos-filtrados-columna/":
            rp:Response = self.activos_do.activos_filter_column()    
            return rp
        
        return Response({"data": "did not match an endpoint for a HTTP GET Method"},
                        status= status.HTTP_404_NOT_FOUND)

    def post(self, request:Request):
        path:str = request.path
        if path == "/activos/select-columns/":
            rp:Response = self.activos_do.select_columns_to_filter(request)
            return rp
 

class ObservacionesView(APIView):
    parser_classes = (FormParser, MultiPartParser, JSONParser)
    #authentication_classes = [JWTAuthentication]
    #permission_classes = [IsAuthenticated, IsAdminUser] 
    observaciones_do:ObservacionesActions = None
    authentication_classes = []
    permission_classes = []


    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.observaciones_do = ObservacionesActions()    
    
    def get(self, request, activo = None): 
        path = request.path
                
        if path == f"/observaciones-excel/":
            rp:Response = self.observaciones_do.observaciones_excel()
            return rp

    def post(self, request): 
        path = request.path
        
        if path == "/nueva-observacion/":
            print(request.data)
            return self.observaciones_do.add_new_observacion(request)

class ObservacionesViewNoAuth(APIView):
    parser_classes = (FormParser, MultiPartParser, JSONParser)
    authentication_classes = []
    permission_classes = []
    observaciones_do:ObservacionesActions = None
    
    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.observaciones_do = ObservacionesActions()    

    def get(self, request:Request, activo = None):
        path = request.path
        if path == f"/observacion/{activo}/":
            rp:Response = self.observaciones_do.get_observacion_by_activo(activo = activo) 
            return rp

        if path == "/todas-las-observaciones/":
            return self.observaciones_do.all_observaciones() 


