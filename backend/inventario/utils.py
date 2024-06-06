#----------------------------------------------
from rest_framework             import status
from rest_framework.response    import Response
#----------------------------------------------
from .models import Activos, ReadActivos
from .serializers import ActivoSerializer, ReadActivoSerializer
from datetime import datetime
#----------------------------------------------

def get_remaining_fields():
    MAX_NUMBER = 41
    REMAINING_FIELDS = {
            "id_registro": None,
            "asiento": None,
            "no_identificacion": None
    } 
    latest_entry = Activos.objects.values("id", "id_registro", "no_identificacion").latest("id")
    print(f"This is the latest entry: {latest_entry}")
    split_registro  = latest_entry.get("id_registro").split(",", 3)
    REMAINING_FIELDS["no_identificacion"] = calculate_no_identificacion(latest_entry.get("no_identificacion")) 
    if int(split_registro[2]) == MAX_NUMBER:
        next_id_registro = int(f"{split_registro[0]}{split_registro[1]}")+1
        formatted_number = "{:,}".format(next_id_registro)
        REMAINING_FIELDS["asiento"] = 2
        REMAINING_FIELDS["id_registro"] = f"{formatted_number},0{REMAINING_FIELDS.get('asiento')}"
        return REMAINING_FIELDS
    next_asiento = int(split_registro[2])+1  
    REMAINING_FIELDS["asiento"] = next_asiento
    if next_asiento < 10:  
        next_id_registro = (f"{split_registro[0]},{split_registro[1]},0{next_asiento}")
        REMAINING_FIELDS["id_registro"] = next_id_registro
        return REMAINING_FIELDS
    next_id_registro = (f"{split_registro[0]},{split_registro[1]},{next_asiento}")
    REMAINING_FIELDS["id_registro"] = next_id_registro
    return REMAINING_FIELDS

def calculate_no_identificacion(no_identificacion: str):
    input_str = no_identificacion
    cleaned_str = input_str.replace('-', '')
    number = int(cleaned_str) + 1
    number_str = str(number)
    new_no_identificacion = number_str[:4] + '-' + number_str[4:]
    return new_no_identificacion

def all_activos():
   activos = ReadActivos.objects.all()
   serializer = ActivoSerializer(instance = activos, many = True)
   return Response(serializer.data, status = status.HTTP_200_OK)

def activos_filter_column():
    filter_all_activos = Activos.objects.values('id_registro', 'no_identificacion', 'descripcion', 'ubicacion')
    serializer = ReadActivoSerializer(instance = filter_all_activos, many = True)
    return Response(serializer.data, status = status.HTTP_200_OK)