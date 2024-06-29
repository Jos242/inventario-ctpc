from django.urls import path
from . import views
urlpatterns = [
    path("crear-usuario/", views.UserView.as_view()),
    path("iniciar-sesion/", views.UserView.as_view()),
    path("salir/", views.UserView.as_view()), 

    # path("eliminar-activo/")
    # path("editar-activo/")

    #Endpoints relacionados a los activos------------------------------------
    path("agregar-activo/", views.ActivosView.as_view()),
    path("todos-los-activos/", views.ActivosView.as_view()),
    path("activos-filtrados-columna/", views.ActivosView.as_view()),
    path("activo/<int:pk>/", views.ActivosView.as_view()),
    path("activo/<str:no_identificacion>/", views.ActivosView.as_view()),
    #Endpoints relacionados a las observaciones------------------------------
    path("todas-las-observaciones/", views.ObservacionesView.as_view()),
    path("observacion/<str:activo>/", views.ObservacionesView.as_view()),
    path("nueva-observacion/", views.ObservacionesView.as_view()),

    #Endpoints relacionados a los documentos--------------------------------- 
    path("guardar-acta/", views.DocsView.as_view()), 
    path("obtener-documentos/", views.DocsView.as_view()),
    path("obtener-documento/<int:pk>/", views.DocsView.as_view()),
    path("crear-excel/impresiones/", views.DocsView.as_view())


]
