from django.urls import path
from . import views
urlpatterns = [
    path("crear-usuario/", views.UserView.as_view()),

    #Endpoints relacionados a los activos------------------------------------
    path("todos-los-activos/", views.ActivosView.as_view()),
    path("activos-filtrados-columna/", views.ActivosView.as_view()),
    path("activo/<int:pk>/", views.ActivosViewNoAuth.as_view()),
    path("activo/<str:no_identificacion>/", views.ActivosViewNoAuth.as_view()),
    path("activo/ubicacion-actual/<int:ubicacion_actual>/", views.ActivosViewNoAuth.as_view()),
    path("excel/todos-los-activos/", views.ActivosViewNoAuth.as_view()),
    path("agregar-activo/", views.ActivosView.as_view()),
    path("activos/select-columns/", views.ActivosView.as_view()),
    path("update-activo/<int:pk>/", views.ActivosView.as_view()),
   
    #Endpoints relacionados a las observaciones------------------------------
    path("todas-las-observaciones/", views.ObservacionesView.as_view()),
    path("observacion/<str:activo>/", views.ObservacionesView.as_view()),
    path("nueva-observacion/", views.ObservacionesView.as_view()),
    path("observaciones-excel/", views.ObservacionesView.as_view()),

    #Endpoints relacionados a los documentos--------------------------------- 
    path("guardar-acta/", views.DocsView.as_view()), 
    path("obtener-documentos/", views.DocsView.as_view()),
    path("obtener-documento/<int:pk>/", views.DocsView.as_view()),
    path("crear-excel/impresiones/", views.DocsView.as_view()),
    path("excel/activos-observaciones/", views.DocsView.as_view()),
    path("update-doc-info/<int:pk>/", views.DocsView.as_view()),

    #Endpoints relacionados a los cierres de inventarios----------------------
    path("cierre/<int:pk>/", views.CierreInventarioView.as_view()),
    path("all-cierres/", views.CierreInventarioView.as_view()), 
    path("nuevo-cierre/", views.CierreInventarioView.as_view()),
    path("update-cierre/<int:pk>/", views.CierreInventarioView.as_view()),
    path("delete-cierre/<int:pk>/", views.CierreInventarioView.as_view()),

    #Endpoints relacionados a las Revisiones----------------------------------
    path("revision/<int:pk>/", views.RevisionesView.as_view()),
    path("no-existe/revisiones/", views.RevisionesView.as_view()),
    path("all-revisiones/", views.RevisionesView.as_view()),
    path("nueva-revision/", views.RevisionesView.as_view()),
    path("update-revision/<int:pk>/", views.RevisionesView.as_view()),
    path("delete-revision/<int:pk>/", views.RevisionesView.as_view()),

    #Endpoints relacionados a la ubicaciones----------------------------------
    path("ubicacion/<int:pk>/", views.UbicacionesView.as_view()),
    path("nueva-ubicacion/", views.UbicacionesView.as_view()),
    path("ubicaciones-excel/", views.UbicacionesView.as_view()),
    path("update/ubicacion/<int:pk>/", views.UbicacionesView.as_view()),
    path("delete/ubicacion/<int:pk>/", views.UbicacionesView.as_view()),
    #Endpoints relacionados a los funcionarios--------------------------------
    path("funcionario/<int:pk>/", views.FuncionariosView.as_view()),
    path("all-funcionarios/", views.FuncionariosView.as_view()),

    #Endpoints relacionados a el modo de aquisicion---------------------------
    path("modo-adquisicion/<int:pk>/", views.ModoAdquisicionView.as_view()),
    path("all/modo-adquisicion/", views.ModoAdquisicionView.as_view()),
    path("nuevo/modo-adquisicion/", views.ModoAdquisicionView.as_view()),
    path("update/modo-adquisicion/<int:pk>/", views.ModoAdquisicionView.as_view()),
    path("delete/modo-adquisicion/<int:pk>/", views.ModoAdquisicionView.as_view()),

    #Endpoints relaciondaos a las plantillas-----------------------------------
    path("all-plantillas/", views.PlantillasView.as_view()),
    path("plantilla/<int:pk>/", views.PlantillasView.as_view()),
    path("nueva-plantilla/", views.PlantillasView.as_view()),
    path("update-plantilla/<int:pk>/", views.PlantillasView.as_view()),
    path("delete-plantilla/<int:pk>/", views.PlantillasView.as_view())
    
]
