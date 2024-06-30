import requests
import xlsxwriter


# UPDATE observaciones
# SET impreso = 1
# WHERE impreso = 0 AND id_registro = '1,137,01';

# UPDATE observaciones
# SET impreso = 0
# WHERE impreso = 1 AND id_registro = '1,137,02';



# DELETE FROM observaciones
# WHERE id_registro = '1,137,01';

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


    for i in range(41):
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

    for i in range(41):
        x = requests.post(
            url = url,
            json = data
        )

    print(x.text)
    

#testing for observaciones and activos------
def test_observaciones_y_activos():
    pass


test_observaciones()