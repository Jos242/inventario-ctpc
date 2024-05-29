from django.urls import path
from . import views
urlpatterns = [
    path("agregar-activo/", views.ActivosView.as_view(), name= "agregar-activo")
    # path("eliminar-activo/")
    # path("editar-activo/")
    # path("todos-los-activos/")
    # path("obtener-un-activo/")

]