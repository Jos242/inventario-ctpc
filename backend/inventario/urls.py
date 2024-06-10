from django.urls import path
from . import views
urlpatterns = [
    path("agregar-activo/", views.ActivosView.as_view()),
    # path("eliminar-activo/")
    # path("editar-activo/")
    path("todos-los-activos/", views.ActivosView.as_view()),
    path("activos-filtrados-columna/", views.ActivosView.as_view()),
    path("todas-las-observaciones/", views.ObservacionesView.as_view())
    # path("obtener-un-activo/")

]