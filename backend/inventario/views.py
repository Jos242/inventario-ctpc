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
    # permission_classes = [IsAuthenticated]
    # authentication_classes = [JWTAuthentication]
    activos_do:ActivosActions = None
    permission_classes = []
    authentication_classes = []


    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.activos_do = ActivosActions()     

    def get(self, request, pk:int = None, no_identificacion:str = None):
        """
        Los metodos HTTP llevan como param el request,
        que en pocas palabras es el HTTP Header que el 
        cliente manda, con toda la info, a partir de aqui
        nosotros generamos la respuesta necesaria en base 
        al request
        """
        path = request.path

        if path == "/todos-los-activos/":
            return self.activos_do.all_activos()
        
        if path == "/activos-filtrados-columna/":
            return self.activos_do.activos_filter_column()   

        return Response({"data": "did not match an endpoint for a HTTP GET Method"}, status= status.HTTP_404_NOT_FOUND)

    def post(self, request):
        path = request.path

        if path == "/agregar-activo/":
            resp = self.activos_do.add_activo(request)  
            return resp
        return Response({"data": "did not match an endpoint for a HTTP POST Method"}, status = status.HTTP_404_NOT_FOUND)

class ActivosViewNoAuth(APIView):

    permission_classes = []
    authentication_classes = []

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.activos_do = ActivosActions()
    
    def get(self, request, pk:int = None, no_identificacion:str = None):
        path = request.path

        if path == f"/activo/{pk}/":
            return self.activos_do.get_activo_by_id(pk)

        if path == f"/activo/{no_identificacion}/":
            rp:Response = self.activos_do.get_activo_by_no_identificacion(no_identificacion)
            return rp

        return Response({"data": "did not match an endpoint for a HTTP GET Method"}, status= status.HTTP_404_NOT_FOUND)

class ObservacionesView(APIView):
    parser_classes = (FormParser, MultiPartParser, JSONParser)
    # authentication_classes = [JWTAuthentication]
    # permission_classes = [IsAuthenticatedOrReadOnly] 
    authentication_classes = []
    permission_classes = []
    observaciones_do:ObservacionesActivos = None

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.observaciones_do = ObservacionesActivos()    
    
    def get(self, request, activo = None): 
        path = request.path

        if path == "/todas-las-observaciones/":
            return self.observaciones_do.all_observaciones() 
        
        if path == f"/observacion/{activo}/":
            print("Hola entre aqui")
            rp:Response = self.observaciones_do.get_observacion_by_id_registro(activo = activo) 
            return rp
        
    def post(self, request): 
        path = request.path
        
        if path == "/nueva-observacion/":
            return self.observaciones_do.add_new_observacion(request)
        
class UserView(APIView):

    authentication_classes = []
    permission_classes = [] 
    user_do:UserActions = None
    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.user_do = UserActions()

    def post(self, request):
        path = request.path
        if path == "/crear-usuario/":  
            return self.user_do.new_usuario(request)
        if path == "/iniciar-sesion/":
            return self.user_do.sign_up(request)
        if path == "/salir/":
            return self.user_do.log_out(request)

class DocsView(APIView):
    parser_classes   = (MultiPartParser, FormParser, JSONParser)
    # authentication_classes = [JWTAuthentication]
    # permission_classes = [IsAuthenticated] 
    authentication_classes = []
    permission_classes = []
    docs_do:DocsActions = None
    
    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.docs_do = DocsActions()

    def get(self, request, pk:int = None):
        path = request.path
        if path == "/obtener-documentos/":  
            return self.docs_do.get_all_docs()

        if path == f"/obtener-documento/{pk}/":
            return self.docs_do.get_doc_by_id(pk)
        
        return Response({"error": "not a valid get request"},
                        status = status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        path = request.path
        if path == "/guardar-acta/":
            return self.docs_do.save_acta(request) 

        if path == f"/crear-excel/impresiones/":
            return self.docs_do.create_print_doc(request = request)

        return Response({"error": "not a valid post request"},
                        status = status.HTTP_400_BAD_REQUEST)

class CierreInventarioView(APIView):
    parser_classes   = (MultiPartParser, FormParser, JSONParser)
    # authentication_classes = [JWTAuthentication]
    # permission_classes = [IsAuthenticated] 
    authentication_classes = []
    permission_classes = []
    cierre_do:CierreInventarioActions = None 

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.cierre_do = CierreInventarioActions()

    def get(self, request, pk = None) -> Response:
       path = request.path
       if f'/cierre/{pk}/' == path:
           rp:Response = self.cierre_do.cierre_by_pk(pk)
           return rp 
       if '/all-cierres/' == path:
           rp:Response = self.cierre_do.all_cierres()
           return rp

       return Response({"error": "not a valid endpoint"},
                       status = status.HTTP_400_BAD_REQUEST) 

    def post(self, request) -> Response:
       path = request.path
       if '/nuevo-cierre/' == path:
           rp:Response = self.cierre_do.nuevo_cierre(request)
           return rp

       return Response({"error": "not a valid endpoint"},
                       status = status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk = None):
        path = request.path
        if f"/update-cierre/{pk}/" == path:
            rp:Response = self.cierre_do.update_cierre(request = request,
                                                       pk = pk)
            return rp 

    def delete(self, request, pk = None) -> Response:
        path = request.path
        if f"/delete-cierre/{pk}/" == path:
            rp:Response = self.cierre_do.delete_cierre(pk)
            return rp

        return Response({"error": "not a valid endpoint"},
                       status = status.HTTP_400_BAD_REQUEST)

class RevisionesView(APIView):
    parser_classes   = (MultiPartParser, FormParser, JSONParser)
    # authentication_classes = [JWTAuthentication]
    # permission_classes = [IsAuthenticated] 
    authentication_classes = []
    permission_classes = []
    revisiones_do:RevisionesActions = None

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.revisiones_do = RevisionesActions()
    
    def get(self, request, pk = None):
       path = request.path

       if f"/revision/{pk}/" == path:
            rp:Response = self.revisiones_do.revision_by_id(pk)
            return rp

       if "/no-existe/revisiones/" == path:
            rp:Response = self.revisiones_do.revision_by_no_existe()
            return rp

       if "/all-revisiones/" == path:
            rp:Response = self.revisiones_do.all_revisiones()
            return rp
           

    def post(self, request) -> Response:
        path = request.path

        if "/nueva-revision/" == path:
            rp:Response = self.revisiones_do.nueva_revision(request)
            return rp
    def patch(self, request, pk = None) -> Response:
        path = request.path

        if f"/update-revision/{pk}/" == path:
            rp:Response = self.revisiones_do.update_revision(request = request,
                                                             pk = pk)
            return rp
    def delete(self, request, pk = None) -> Response:
        path = request.path

        if f"/delete-revision/{pk}/" == path:
            rp:Response = self.revisiones_do.delete_revision_by_id(pk) 
            return rp
        

class UbicacionesView(APIView):
    parser_classes   = (MultiPartParser, FormParser, JSONParser)
    # authentication_classes = [JWTAuthentication]
    # permission_classes = [IsAuthenticated] 
    authentication_classes = []
    permission_classes = []
    ubicaciones_do:UbicacionesActions = None

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.ubicaciones_do = UbicacionesActions()

    def get(self, request, pk:int = None):
        path = request.path

        if f"/ubicacion/{pk}/" == path:
            rp:Response = self.ubicaciones_do.ubicacion_by_id(pk)
            return rp
    def post(self, request):
        path = request.path

        if f"/nueva-ubicacion/" == path:
            rp:Response = self.ubicaciones_do.nueva_ubicacion(request)
            return rp


