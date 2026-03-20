import requests
import xlsxwriter
import pandas as pd
import random
import MySQLdb
from MySQLdb.connections import Connection
from MySQLdb.cursors import Cursor
import xlsxwriter
import os
import subprocess
import sys
import argparse
import threading
CWD = os.getcwd() 
USER = None
PASSWORD = None
HOST = None
SECURE_FILE_PRIV = None
run_server_now = False
server_running = False

def get_file_priv_path(*args, **kwargs):
    global SECURE_FILE_PRIV
    db:Connection = MySQLdb.connect(**kwargs) 
    cursor:Cursor = db.cursor()
    cursor.execute("SHOW VARIABLES LIKE 'secure_file_priv'")
    result = cursor.fetchone()[1]
    print("RESULTADO: ",result)
    SECURE_FILE_PRIV = "/var/lib/mysql-files/"
    cursor.close()
    db.close()

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
            return result[-1]
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
    db:Connection = MySQLdb.connect(
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
            return result[-1]
        else:
            return None
    except MySQLdb.Error as e:
        print(f"Error al ejecutar la consulta: {e}")
    finally:
        # Cerrar el cursor y la conexión a la base de datos
        cursor.close()
        db.close()

def load_funcionarios():
    global server_running
    a = True
    while a:
        try:
            url = "http://127.0.0.1:8000/crear-usuario/"
            data = {
                    "username": None,
                    "password": None,
                    "user_type": "FUNCIONARIO",
                    "nombre_completo": None,
                    "departamento": None, 
                    "puesto": None
                }
            all_funcionarios = os.path.join(CWD, "csvs", "all_funcionarios_diurno.csv")
            df = pd.read_csv(all_funcionarios)
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
            a = False
        except:
            continue
        
def build_project():

    global run_server_now
    make_migration = "python3 manage.py makemigrations inventario"
    migrate = "python3 manage.py migrate"
    run = "python3 manage.py runserver"
    if os.name != "posix":
        make_migration = "python manage.py makemigrations inventario"
        migrate = "python manage.py migrate"
        run = "python manage.py runserver"     
    
    result = subprocess.run(make_migration, shell = True,
                            stdout=sys.stdout,
                            stderr=sys.stderr)
    
    result = subprocess.run(migrate, shell = True,
                            stdout=sys.stdout,
                            stderr=sys.stderr)
    
def run_server():
    global run_server_now
    global server_running
    run = "python3 manage.py runserver"
   
    if os.name != "posix":
        run = "python manage.py runserver"     
    
    while run_server_now == False: 
        continue
    
    result = subprocess.run(run, shell = True,
                            stdout=sys.stdout,
                            stderr=sys.stderr)



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


def connection_like_root(*args, **kwargs):
   
    db:Connection = MySQLdb.connect(**kwargs) 
    cursor:Cursor = db.cursor()
    cursor.execute("DROP DATABASE IF EXISTS SGICA;")
    cursor.execute("CREATE DATABASE SGICA;")
    cursor.execute("DROP USER IF EXISTS 'ctpc'@'localhost';")
    cursor.execute("CREATE USER 'ctpc'@'localhost' IDENTIFIED BY 'YFqut12#';")
    cursor.execute("GRANT ALL PRIVILEGES ON SGICA.* TO 'ctpc'@'localhost';")
    cursor.execute("FLUSH PRIVILEGES;")
    db.commit()
    cursor.close()
    db.close()
  
def load_modo_adquisiciones(*args, **kwargs):
    kwargs['db'] = 'SGICA'
    file_path = os.path.join(SECURE_FILE_PRIV, "all_modos_de_adquisicion.csv")
    print(file_path)
    db:Connection = MySQLdb.connect(**kwargs)
    # Crear un cursor para ejecutar consultas
    cursor:Cursor = db.cursor()
    
    # Definir la consulta SQL
    query = f"""
            LOAD DATA INFILE '{file_path}'
            INTO TABLE modoadquisicion 
            FIELDS TERMINATED BY ';' 
            ENCLOSED BY '"'
            LINES TERMINATED BY '\\r\\n'
            (id, descripcion);
            """

    cursor.execute(query)
    db.commit()
    cursor.close()
    db.close()
    print("Done loading modos de adquisicion!")

def load_ubicaciones(*args, **kwargs):
    kwargs['db'] = 'SGICA'
    file_path = os.path.join(SECURE_FILE_PRIV,"all_ubicaciones.csv")
    db:Connection = MySQLdb.connect(**kwargs)
    # Crear un cursor para ejecutar consultas
    cursor:Cursor = db.cursor()

    # Definir la consulta SQL
    query = f"""
            LOAD DATA INFILE '{file_path}'
            INTO TABLE ubicaciones 
            FIELDS TERMINATED BY ';' 
            ENCLOSED BY '"'
            LINES TERMINATED BY '\\r\\n'
            (id, nombre_oficial, alias, img_path);
            """

    cursor.execute(query)
    db.commit()
    cursor.close()
    db.close()
    print("Done loading ubicaciones!")

def load_all_activos(*args, **kwargs):
    kwargs['db'] = 'SGICA'
    file_path = os.path.join(SECURE_FILE_PRIV,"all_activos.csv")
    db:Connection = MySQLdb.connect(**kwargs)
    # Crear un cursor para ejecutar consultas
    cursor:Cursor = db.cursor()

    # Definir la consulta SQL
    query = f"""LOAD DATA INFILE '{file_path}'
               INTO TABLE activos 
               FIELDS TERMINATED BY ';' 
               ENCLOSED BY '"'
               LINES TERMINATED BY '\\r\\n'
               (id_registro, asiento, no_identificacion, descripcion, marca, modelo, serie, estado, 
                ubicacion_original, modo_adquisicion, precio, fecha, observacion, impreso, ubicacion_actual, conectividad,
                seguridad, placa, baja);"""

    cursor.execute(query)
    print("Done loading activos!")
    db.commit()
    cursor.close()
    db.close()

def load_all_observaciones(*args, **kwargs):
    global run_server_now
    kwargs['db'] = 'SGICA'
    file_path = os.path.join(SECURE_FILE_PRIV,"all_observaciones.csv")
    db:Connection = MySQLdb.connect(**kwargs)
    # Crear un cursor para ejecutar consultas
    cursor:Cursor = db.cursor()

    # Definir la consulta SQL
    query = f"""
            LOAD DATA INFILE '{file_path}'
            INTO TABLE observaciones
            FIELDS TERMINATED BY ';' 
            ENCLOSED BY '"'
            LINES TERMINATED BY '\\r\\n'
            (id_registro, asiento, descripcion, activo_id, impreso);
             """
    run_server_now = True
    cursor.execute(query)
    print("Done loading observaciones!")
    db.commit()
    cursor.close()
    db.close() 

def load_puesto_and_departamentos(*args, **kwargs):
    kwargs['db'] = 'SGICA'
 
    db:Connection = MySQLdb.connect(**kwargs)
    # Crear un cursor para ejecutar consultas
    cursor:Cursor = db.cursor()

    # Definir la consulta SQL
    query = f"""
            INSERT INTO puestos (descripcion) VALUES
            ('AGENTE DE SEGURIDAD'),
            ('AUX. ADMINISTRATIVA'),
            ('AUX. ADMINISTRATIVO'),
            ('CONSERJE'),
            ('COORD. CON LA EMPRESA'),
            ('COORDINADOR ACADÉMICO'),
            ('COORDINADOR TÉCNICO'),
            ('DIRECTORA'),
            ('DOCENTE'),
            ('GEST. INFRAESTRUCTURA TI'),
            ('GESTOR DE INNOVACIÓN'),
            ('OFICINISTA'),
            ('ORIENTADOR'),
            ('ORIENTADORA'),
            ('SUB-DIRECTORA');
             """

    cursor.execute(query)
    query = f"""
            INSERT INTO departamentos (descripcion) VALUES
            ('DIRECTORA'),
            ('SUB-DIRECTORA'),
            ('DEPARTAMENTO AUX. ADMINISTRATIVO'),
            ('DEPARTAMENTO DE ORIENTACIÓN'),
            ('GESTIÓN DE INFRAESTRUCTURA DE TI'),
            ('DEPARTAMENTO MATEMÁTICAS'),
            ('COORDINACIÓN TÉCNICA'),
            ('COORDINACIÓN CON EMPRESAS'),
            ('OFICINISTA'),
            ('AGENTE DE SEGURIDAD Y VIGILANCIA'),
            ('CONSERJE'),
            ('CONSERJE REUBICADA'),
            ('GESTOR DE INNOVACIÓN'),
            ('DEPARTAMENTO DE ESPAÑOL'),
            ('DEPARTAMENTO ESTUDIOS SOC.'),
            ('DEPARTAMENTO CIENCIAS'),
            ('DEPARTAMENTO QUIMICA, FISICA Y BIOLOGÍA'),
            ('DEPARTAMENTO INGLÉS'),
            ('DEPARTAMENTO FRANCÉS'),
            ('DEPARTAMENTO EDUC. FISICA'),
            ('DEPARTAMENTO MÚSICA'),
            ('DEPARTAMENTO RELIGIÓN'),
            ('ETICA Y PSICOLOGÍA'),
            ('PROG. NAC. FORMACIÓN TECNOLÓGICA'),
            ('DOCENTES REUBICADAS'),
            ('TALLER EXPLORATORIO'),
            ('ESPECIALIDAD ADUANAS'),
            ('ESPECIALIDAD CONTABILIDAD'),
            ('ESPECIALIDAD EJECUTIVO'),
            ('ESPECIALIDAD ELECTRÓNICA'),
            ('DIBUJO TÉCNICO'),
            ('ESPECIALIDAD TURISMO'),
            ('DESARROLLO DEL SOFTWARE'),
            ('BANCA Y FINANZAS'),
            ('INGLÉS ESPECIALIZADO');
             """    
    
    cursor.execute(query)
    db.commit()
    print("Done loading puestos and departamentos!")
    cursor.close()
    db.close()

    pass
def main():
    parser = argparse.ArgumentParser(description=":)")

    # Añadir argumentos
    parser.add_argument('--USER', type=str,
                        help='Database User Password',
                        required = True)

    parser.add_argument('--PASSWORD', type=str,
                         help='Database Password',
                         required = True)

    parser.add_argument('--HOST',
                        type = str, help = 'Database Host',
                        required = True)

    # Parsear los argumentos
    args = parser.parse_args()

    # Usar los argumentos
    db_params = {"user": args.USER,
                 "passwd": args.PASSWORD,
                 "host": args.HOST,
                 "db": ""}

    get_file_priv_path(**db_params) 
    connection_like_root(**db_params)
    build_project()
    my_thread = threading.Thread(target = run_server)
    funcionario_thread = threading.Thread(target = load_funcionarios)
    funcionario_thread.start()
    my_thread.start() 
    load_modo_adquisiciones(**db_params)
    load_ubicaciones(**db_params)
    load_all_activos(**db_params)
    load_puesto_and_departamentos(**db_params)
    load_all_observaciones(**db_params)
    funcionario_thread.join()
    my_thread.join() 

if __name__ == '__main__':
    main()
    
