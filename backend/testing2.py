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
    token = """eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzI1MzQyNTg1LCJpYXQiOjE3MjUzMzUzODUsImp0aSI6ImQ4MTdjNDljY2IzYzQ5MjhhMWZlZmYxZjEzNjc4ZGI4IiwidXNlcl9pZCI6MTA0fQ.sbEA8_HYqCBYRrVC19obKKv8wwyHlnvtiKvxAVDvJGQ"""

    headers = {
        'Authorization': f'Bearer {token}'
    }

    for i in range(33):
        x = requests.post(
            url=url,
            json=data,
            headers=headers
        )
        print(f"Request {i+1}: {x.status_code}")


def test_observaciones():

    url = "http://127.0.0.1:8000/nueva-observacion/"
    data = {
        "descripcion": "Hola",
        "activo": "1,124,31"
    }
    token = """eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzI1MzQyNTg1LCJpYXQiOjE3MjUzMzUzODUsImp0aSI6ImQ4MTdjNDljY2IzYzQ5MjhhMWZlZmYxZjEzNjc4ZGI4IiwidXNlcl9pZCI6MTA0fQ.sbEA8_HYqCBYRrVC19obKKv8wwyHlnvtiKvxAVDvJGQ"""

    headers = {
        'Authorization': f'Bearer {token}'
    }



    #41
    for i in range(41): 
        x = requests.post(
            url = url,
            json = data,
            headers = headers
        )

    print(x.text)

test_observaciones()
test_all_activos()

