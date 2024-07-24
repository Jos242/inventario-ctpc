import requests
import xlsxwriter
import pandas as pd
import random
import MySQLdb
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

def get_unique_locations():
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
    query = "SELECT DISTINCT ubicacion FROM activos"
    
    try:
        # Ejecutar la consulta
        cursor.execute(query)
        
        # Obtener todos los resultados
        results = cursor.fetchall()
        
        # Convertir los resultados en una lista
        locations = [row[0] for row in results]
        
        return locations
    except MySQLdb.Error as e:
        print(f"Error al ejecutar la consulta: {e}")
        return []
    finally:
        # Cerrar el cursor y la conexión a la base de datos
        cursor.close()
        db.close()

def get_unique_adquisition_mode():
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
    query = "SELECT DISTINCT modo_adquisicion FROM activos"
    
    try:
        # Ejecutar la consulta
        cursor.execute(query)
        
        # Obtener todos los resultados
        results = cursor.fetchall()
        
        # Convertir los resultados en una lista
        locations = [row[0] for row in results]
        
        return locations
    except MySQLdb.Error as e:
        print(f"Error al ejecutar la consulta: {e}")
        return []
    finally:
        # Cerrar el cursor y la conexión a la base de datos
        cursor.close()
        db.close()

def load_funcionarios(): #MODIFICAR EL PATH DE ACA CUANDO SE EJECUTE EN WINDOWS
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
    workbook = xlsxwriter.Workbook('aqui.xlsx') 
    worksheet = workbook.add_worksheet()
    worksheet.write(f'A1', 'username')
    worksheet.write(f'B1', 'password')
    counter = 2
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
        worksheet.write(f'A{counter}', f"{data['username']}")
        worksheet.write(f'B{counter}', f"{data['password']}")
        counter += 1

    workbook.close()
    #  for i in range(20):
    #     x = requests.post(
    #         url = url,
    #         json = data
    #     )

def load_modo_adquisicion():
    MODOS_DE_ADQUISICION = get_unique_adquisition_mode() 
    
    print(len(MODOS_DE_ADQUISICION))
    url = "http://127.0.0.1:8000/nuevo/modo-adquisicion/"
    data = {
        'descripcion': None
    }

    for modo in MODOS_DE_ADQUISICION:
        data['descripcion'] = modo    
        x = requests.post(
                url = url,
                json = data
            )

    print(x.text)

def load_ubicaciones():
    url = "http://127.0.0.1:8000/nueva-ubicacion/"
    data = {
        "nombre_oficial": None,
    }
    UBICACIONES = get_unique_locations()
    print(UBICACIONES)
    for ubicacion in UBICACIONES:
        data["nombre_oficial"] = ubicacion
        
        x = requests.post(
                url = url,
                json = data
            )

        print(x.text)

def modify_activos():
    # Conectar a la base de datos
    db = MySQLdb.connect(
        host="localhost",
        user="ctpc",
        passwd="YFqut12#",
        db="SGICA"
    )
    
    cursor = db.cursor()
    
    # Obtener modos de adquisición únicos
    MODOS_DE_ADQUISICION = get_unique_adquisition_mode()
    UBICACIONES = get_unique_locations()
    for modo in MODOS_DE_ADQUISICION:
        query_1 = "SELECT id FROM modoadquisicion WHERE descripcion = %s"
        cursor.execute(query_1, (modo,))
        result = cursor.fetchone()
        
        if result:
            id_value = result[0]
            query_2 = "UPDATE activos SET modo_adquisicion = %s WHERE modo_adquisicion = %s"
            cursor.execute(query_2, (id_value, modo))

    for ubicacion in UBICACIONES:
        if ubicacion == 'ORIENTACION':
           1+1
        query_1 = "SELECT id FROM ubicaciones WHERE nombre_oficial = %s"
        cursor.execute(query_1, (ubicacion,))
        result = cursor.fetchone()
        
        if result:
            id_value = result[0]
            query_2 = "UPDATE activos SET ubicacion = %s WHERE ubicacion = %s"
            cursor.execute(query_2, (id_value, ubicacion))

    db.commit()
    cursor.close()
    db.close()

def add_foreign_keys():
    db = MySQLdb.connect(
        host="localhost",
        user="ctpc",
        passwd="YFqut12#",
        db="SGICA"
    )
    
    cursor = db.cursor()
    
    query = "ALTER TABLE activos CHANGE ubicacion ubicacion_original INT"
    cursor.execute(query) 
   
    query = "ALTER TABLE activos ADD CONSTRAINT fk_ubicacion_original FOREIGN KEY (ubicacion_original) REFERENCES ubicaciones(id)"
    cursor.execute(query)
    

    query = "ALTER TABLE activos MODIFY modo_adquisicion INT"
    cursor.execute(query) 
   
    query = "ALTER TABLE activos ADD CONSTRAINT fk_modo_adquisicion FOREIGN KEY (modo_adquisicion) REFERENCES modoadquisicion(id)"
    cursor.execute(query)

    query = "ALTER TABLE activos ADD CONSTRAINT fk_ubicacion_actual FOREIGN KEY (ubicacion_actual) REFERENCES ubicaciones(id)"
    cursor.execute(query)
    
    db.commit()    
    cursor.close()
    db.close()

load_funcionarios()
load_modo_adquisicion()
load_ubicaciones()
modify_activos()
add_foreign_keys()


