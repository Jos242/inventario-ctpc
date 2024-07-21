import requests
import xlsxwriter
import pandas as pd
import random
import MySQLdb

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

# test_observaciones()
# test_all_activos()


def generate_password(full_name, number):
    # Eliminar espacios adicionales y convertir a mayúsculas
    full_name = " ".join(full_name.split()).upper()
    
    # Dividir el nombre completo en partes
    name_parts = full_name.split()
    
    # Verificar que hay al menos dos partes (nombre y apellido)
    if len(name_parts) < 2:
        raise ValueError("El nombre completo debe contener al menos un nombre y un apellido.")
    
    # Tomar la primera letra del primer nombre y el primer apellido
    first_letter = name_parts[0][0]
    last_name = name_parts[1]
    
    # Generar el nombre de usuario base y convertir a minúsculas
    username_base = (first_letter + last_name).lower()
    
    # Limpiar el número para eliminar caracteres no numéricos
    digits = ''.join(filter(str.isdigit, number))
    
    # Verificar que el número tenga al menos 3 dígitos
    if len(digits) < 3:
        raise ValueError("El número debe contener al menos 3 dígitos.")
    
    # Seleccionar 3 dígitos aleatorios del número
    random_digits = ''.join(random.sample(digits, 3))
    
    # Concatenar los dígitos aleatorios al nombre de usuario base
    username = username_base + random_digits
    
    return username


def get_department_id(description):
    # Conectar a la base de datos
    db = MySQLdb.connect(
        host="localhost",
        user="ctpc",
        passwd="YFqut12#",
        db="SGICA"
    )

   # Crear un cursor para ejecutar consultas
    cursor = db.cursor()
    
    # Definir la consulta SQL
    query = "SELECT id FROM departamentos WHERE descripcion=%s LIMIT 1"
    
    try:
        # Ejecutar la consulta
        cursor.execute(query, (description,))
        
        # Obtener el primer resultado
        result = cursor.fetchone()
        
        if result:
            return result[0]
        else:
            return None
    except MySQLdb.Error as e:
        print(f"Error al ejecutar la consulta: {e}")
    finally:
        # Cerrar el cursor y la conexión a la base de datos
        cursor.close()
        db.close()

def get_puesto_id(description):
    # Conectar a la base de datos
    db = MySQLdb.connect(
        host="localhost",
        user="ctpc",
        passwd="YFqut12#",
        db="SGICA"
    )

   # Crear un cursor para ejecutar consultas
    cursor = db.cursor()
    
    # Definir la consulta SQL
    query = "SELECT id FROM puestos WHERE descripcion=%s LIMIT 1"
    
    try:
        # Ejecutar la consulta
        cursor.execute(query, (description,))
        
        # Obtener el primer resultado
        result = cursor.fetchone()
        
        if result:
            return result[0]
        else:
            return None
    except MySQLdb.Error as e:
        print(f"Error al ejecutar la consulta: {e}")
    finally:
        # Cerrar el cursor y la conexión a la base de datos
        cursor.close()
        db.close()


def load_funcionarios():
    url = "http://127.0.0.1:8000/crear-usuario/"
    data = {
            "username": None,
            "password": None,
            "user_type": "FUNCIONARIO",
            "nombre_completo": None,
            "departamento": None, 
            "puesto": None
          }

    df = pd.read_csv('/home/david/Documents/tarea_de_hoy/funcionarios_diurno.csv')
    print(df)

    for index, row in df.iterrows(): 
        data['username'] = str(row.cedula).replace('-', '')
        data['password'] = generate_password(row.nombre, row.cedula) 
        data['nombre_completo'] = row.nombre
        data['departamento'] = get_department_id(row.departamento)
        data['puesto'] = get_puesto_id(row.puesto) 
        x = requests.post(
             url = url,
             json = data
         )
        
        print(f"USERNAME: {data['username']} SERVER RESPONSE:{x.text}")

           

    #  for i in range(20):
    #     x = requests.post(
    #         url = url,
    #         json = data
    #     )

# Ejemplo de uso de generate_username
# full_name = "PRISCILLA CAMPOS  ROSALES"
# number = "1-0848-0432"
# username = generate_username(full_name, number)
# print(username)  # Ejemplo de salida: pcampos432

load_funcionarios()

