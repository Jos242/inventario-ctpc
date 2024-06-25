import requests
import xlsxwriter
table_columns = ['id_registro', 'asiento', 'no_identificacion',
                 'descripcion', 'marca', 'modelo', 'serie']
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

print(x.text)