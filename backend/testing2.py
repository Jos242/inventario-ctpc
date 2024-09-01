import requests

def test_all_activos():
    url = "http://127.0.0.1:8000/agregar-activo/"
    data = {
        "descripcion": "Azul",
        "ubicacion_original": 6,
        "modo_adquisicion": 1,
        "marca": "Alcatel",
        "modelo": "V2",
        "serie": "23443903",
        "estado": "BUENO",
        "precio": 200,
        "de_baja": "DADO DE BAJA SIN PLACA",
        "ubicacion_actual": 7
    }


    for i in range(33):
        x = requests.post(
            url = url,
            json = data
        )

#test_all_activos()

def test_observaciones():
    url = "http://127.0.0.1:8000/nueva-observacion/"
    data = {
        "descripcion": "Hola",
        "activo": "1,124,31"
    }

    #41
    for i in range(1): 
        x = requests.post(
            url = url,
            json = data
        )

    print(x.text)

test_observaciones()

