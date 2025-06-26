# using this path to search for modules
# >>> ~/Desktop/projects/inventario-ctpc/backend/ 

from inventario._views.modo_adquisicion           import ModoAdquisicionView
from inventario._views.historial_de_acceso        import HistorialDeAccesoView
from inventario._views.historial_ubicacion        import HistorialUbicacionView
from inventario._views.user_view                  import UserView
from inventario._views.plantillas                 import PlantillasView 
from inventario._views.funcionarios               import FuncionariosView, get_funcionario_by_id, get_funcionario_by_id_usuario, get_all_funcionarios
from inventario._views.ubicaciones                import UbicacionesView, get_ubicacion_by_funcionarios
from inventario._views.revisiones                 import RevisionesView, get_all_revisiones
from inventario._views.cierre_inventario          import CierreInventarioView, new_cierre,update_cierre
from inventario._views.docs                       import DocsView
from inventario._views.departamentos              import DepartamentosView
from inventario._views.puestos                    import PuestosView
