import requests
import xlsxwriter


url = "http://127.0.0.1:8000/agregar-activo/"
data = {
    "descripcion": "Azul",
    "ubicacion":"Aula01",
    "modo_adquisicion": "Donacion",
    "marca": "Alcatel",
    "modelo": "V2",
    "serie": "23443903",
    "estado": "Bueno",
    "precio": 200    
}

#testing for all activos--------------------

def test_all_activos():
    url = "http://127.0.0.1:8000/agregar-activo/"
    data = {
        "descripcion": "Azul",
        "ubicacion":"Aula01",
        "modo_adquisicion": "Donacion",
        "marca": "Alcatel",
        "modelo": "V2",
        "serie": "23443903",
        "estado": "Bueno",
        "precio": 200    
    }


    for i in range(20):
        x = requests.post(
            url = url,
            json = data
        )

#testing for all observaciones--------------
def test_observaciones():
    url = "http://127.0.0.1:8000/nueva-observacion/"
    data = {
        "descripcion": "Hola",
        "activo": "1,124,31"
    }

    #41
    for i in range(82):
        x = requests.post(
            url = url,
            json = data
        )

    print(x.text)
    
#testing for observaciones and activos------
def test_observaciones_y_activos():
    pass

test_observaciones()
test_all_activos()


# def update_id_registro_and_asiento(id_registro:str) -> dict:
#     """
#     Este metodo toma como el param el id_registro y le resta uno,
#     esto haciendo que el output sea un nuevo value valido para escri
#     birlo en la base de datos.
#     """
#     nums = id_registro.split(",")

#     if int(nums[2]) -1 < 10 and int(nums[2]) > 2:
#         nums[2] = f"0{int(nums[2]) - 1}"
#         return {
#             "id_registro": ",".join(nums),
#             "asiento": nums[2]
#         }
    
#     if int(nums[2]) == 2:
#         nums[1] = str(int(nums[1]) -1)
#         nums[2] = "41"
#         return {
#             "id_registro": ",".join(nums),
#             "asiento": nums[2]
#         }

    
#     if int(nums[2]) -1 >= 10: 
#         nums[2] = f"{int(nums[2]) - 1}"
#         return {
#             "id_registro": ",".join(nums),
#             "asiento": nums[2]
#         }

# print(update_id_registro_and_asiento('1,138,11'))
