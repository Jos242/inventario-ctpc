# using this path to search for modules
# >>> ~/Desktop/projects/inventario-ctpc/backend/ 

from django.urls import path
from inventario  import views
from inventario  import _views

urlpatterns = [

    #Endpoints relacionados a los usuarios
    path("crear-usuario/", _views.UserView.as_view()),
    path("actualizar-usuario/<int:pk>/", _views.UserView.as_view()),
    path("borrar-usuario/<int:pk>/", _views.UserView.as_view()),

    #Endpoints relacionados a los activos------------------------------------
    path("activos-filtrados-columna/", views.ActivosView.as_view()),
    path("activo/<int:pk>/", views.ActivosViewNoAuth.as_view()),
    path("activo/<str:no_identificacion>/", views.ActivosViewNoAuth.as_view()),
    path("activo/ubicacion-actual/<int:ubicacion_actual>/", views.ActivosViewNoAuth.as_view()),
    path("activo/aleatorio/<int:cant>/", views.ActivosViewNoAuth.as_view()),
    path("agregar-activo/", views.ActivosView.as_view()),
    path("agregar-multiples-activos/", views.ActivosView.as_view()),
    path("activos/select-columns/", views.ActivosViewNoAuth.as_view()),
    path("activos/no-baja/select-columns/", views.ActivosViewNoAuth.as_view()),
    path("activos/historial/select-columns/", views.ActivosViewNoAuth.as_view()),
    path("activos/excel/", views.ActivosView.as_view()),
    path("registro/no-impreso/count/", views.ActivosViewNoAuth.as_view()),
    path("update-activo/<int:pk>/", views.ActivosView.as_view()),
    path("delete/last/id-registro/", views.ActivosView.as_view()),

    path("registros/all/", views.ActivosView.as_view()),
    path("registros/guardar-cambios/", views.ActivosView.as_view()),

    #Endpoints relacionados a las observaciones------------------------------
    path("todas-las-observaciones/", views.ObservacionesViewNoAuth.as_view()),
    path("observacion/activo/<str:activo>/", views.ObservacionesViewNoAuth.as_view()),
    path("nueva-observacion/", views.ObservacionesView.as_view()),
    path("create-observacion-revision/", views.ObservacionesView.as_view()),

    #Endpoints relacionados a las activoobservacion------------------------------
    path("create-activo-observacion/", views.ActivoObservacionView.as_view()),

    #Endpoints relacionados a los documentos--------------------------------- 
    path("generar-acta/", _views.DocsView.as_view()),
    path("crear-excel/impresiones/", _views.DocsView.as_view()),
    path("exportar-excel/todo/", _views.DocsView.as_view()),
    
    path("excel/todos-los-activos/", views.ActivosView.as_view()),
    path("observaciones-excel/", views.ObservacionesView.as_view()),
    path("excel/activos-observaciones/", _views.DocsView.as_view()),
    path("ubicaciones-excel/", _views.UbicacionesView.as_view()),
    path("funcionarios/as-excel-file/", _views.FuncionariosView.as_view()),
    path("activos/excel/by/nos-identificacion/", views.ActivosView.as_view()),

    path("guardar-acta/", _views.DocsView.as_view()),
    path("obtener-documentos/", _views.DocsView.as_view()),
    path("obtener-documento/<int:pk>/", _views.DocsView.as_view()),
    path("update-doc-info/<int:pk>/", _views.DocsView.as_view()),
    path("delete-document/<int:pk>/", _views.DocsView.as_view()),

    #Endpoints relacionados a los cierres de inventarios----------------------
    path("cierre/<int:pk>/", _views.CierreInventarioView.as_view()),
    path("all-cierres/", _views.CierreInventarioView.as_view()), 
    path("cierres/finalizado", _views.CierreInventarioView.as_view()), 
    path("nuevo-cierre/", _views.new_cierre, name = 'new_cierre'),
    path("update-cierre/<int:pk>/", _views.update_cierre, name = 'update_cierre'),
    path("delete-cierre/<int:pk>/", _views.CierreInventarioView.as_view()),
    path("delete-all-progreso-cierre/<int:fId>/<int:uId>/", _views.CierreInventarioView.as_view()),

    #Endpoints relacionados a las Revisiones----------------------------------
    path("revision/<int:pk>/", _views.RevisionesView.as_view()),
    path("revision/cierre/<int:pk>/", _views.RevisionesView.as_view()),
    path("no-existe/revisiones/", _views.RevisionesView.as_view()),
    path("all-revisiones/", _views.get_all_revisiones, name = "get_all_revisiones"),
    path("nueva-revision/", _views.RevisionesView.as_view()),
    path("update-revision/<int:pk>/", _views.RevisionesView.as_view()),
    path("delete-revision/<int:pk>/", _views.RevisionesView.as_view()),

    #Endpoints relacionados a la ubicaciones----------------------------------
    path("all-ubicaciones/", _views.UbicacionesView.as_view()),
    path("ubicacion/<int:pk>/", _views.UbicacionesView.as_view()),
    path("ubicacion/funcionario-id/<int:funcionario_id>/",
         _views.get_ubicacion_by_funcionarios,
         name = 'get_ubicacion_by_funcionarios'),
    path("nueva-ubicacion/", _views.UbicacionesView.as_view()),
    path("update/ubicacion/<int:pk>/", _views.UbicacionesView.as_view()),
    path("delete/ubicacion/<int:pk>/", _views.UbicacionesView.as_view()),

    #Endpoints relacionados a los funcionarios--------------------------------
    path("funcionario/<int:pk>/",
         _views.get_funcionario_by_id,
         name = 'get_funcionario_by_id'),
    path("funcionario/usuario/<int:pk>/",
         _views.get_funcionario_by_id_usuario,
         name = 'get_funcionario_by_id_usuario'),
    path("all-funcionarios/",
         _views.get_all_funcionarios,
         name = 'get_all_funcionarios'),

    #Endpoints relacionados a el modo de aquisicion---------------------------
    path("modo-adquisicion/<int:pk>/", _views.ModoAdquisicionView.as_view()),
    path("all/modo-adquisicion/", _views.ModoAdquisicionView.as_view()),
    path("nuevo/modo-adquisicion/", _views.ModoAdquisicionView.as_view()),
    path("update/modo-adquisicion/<int:pk>/", _views.ModoAdquisicionView.as_view()),
    path("delete/modo-adquisicion/<int:pk>/", _views.ModoAdquisicionView.as_view()),

    #Endpoints relaciondaos a las plantillas-----------------------------------
    path("all-plantillas/", _views.PlantillasView.as_view()),
    path("plantilla/<int:pk>/", _views.PlantillasView.as_view()),
    path("nueva-plantilla/", _views.PlantillasView.as_view()),
    path("update-plantilla/<int:pk>/", _views.PlantillasView.as_view()),
    path("delete-plantilla/<int:pk>/", _views.PlantillasView.as_view()),

    #Endpoints relaciondos a los departamentos----------------------------
    path("all-departamentos/", _views.DepartamentosView.as_view()),

    #Endpoints relaciondos a los puestos----------------------------
    path("all-puestos/", _views.PuestosView.as_view()),

    #Endpoints relaciondos a el historial de acceso----------------------------
    path("all/historial-acceso/", _views.HistorialDeAccesoView.as_view()),
    path("historial-acceso/<int:user_id>/", _views.HistorialDeAccesoView.as_view()),

    #Endpoints relaciondos a el historial de ubicaciones----------------------------
    path("historial-ubicacion-activo/<int:pk>/", _views.HistorialUbicacionView.as_view()),
    path("create-historial-ubicacion/", _views.HistorialUbicacionView.as_view()),

    #Mover observaciones a la tabla intermedia----------------------------
    path("mover-observaciones/", views.ObservacionesViewNoAuth.as_view()),
]
