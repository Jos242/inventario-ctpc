"""
URL configuration for sgica project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings
from rest_framework.request import Request
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenViewBase
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework.response import Response
from rest_framework import generics, status
from inventario.models import HistorialDeAcceso
from django.contrib.auth.models import User

class AuthUser(TokenViewBase):
    _serializer_class = api_settings.TOKEN_OBTAIN_SERIALIZER

    def post(self, request: Request, *args, **kwargs) -> Response:
        serializer = self.get_serializer(data=request.data)
         
        try:
            serializer.is_valid(raise_exception=True)
            user = User.objects.get(username = request.data['username']) 
            tipo_usuario = None
            if user.is_staff == 0 and user.is_superuser == 0:
                tipo_usuario = 'Observador'
            
            if user.is_staff == 1 and user.is_superuser == 0:
                tipo_usuario = 'Funcionario'

            if user.is_staff == 0 and user.is_superuser == 1:
                tipo_usuario = 'Administrador'

            historial_de_acceso = HistorialDeAcceso(usuario = user,
                                                    tipo_usuario = tipo_usuario)
            historial_de_acceso.save()
        
        except TokenError as e:
            raise InvalidToken(e.args[0])

        serializer.validated_data["user_type"] = tipo_usuario

        return Response(serializer.validated_data,
                        status=status.HTTP_200_OK)


urlpatterns = [
    # path('admin/', admin.site.urls),
    path("", include("inventario.urls")),
    path("login/", AuthUser.as_view(), name = 'token_obtain_pair'),
    path("api/token/refresh/", TokenRefreshView.as_view(), name = 'token_refresh'),
]

urlpatterns += static(settings.MEDIA_URL, 
                      document_root = settings.MEDIA_ROOT) 
