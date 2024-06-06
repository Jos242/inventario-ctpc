import MySQLdb
import pandas as pd
import numpy as np
import csv
import re


# print(id_couple_array)
def testing():
    conn = MySQLdb.connect(
        host="localhost",
        user="ctpc",
        password="YFqut12#",
        db="SGICA"
    )
    cursor = conn.cursor()

 
    df = pd.read_csv("observaciones_part1_CSV.csv", sep= ";", names=['id_registro', 'asiento', 'descripcion', 'id_activo']) 
    no_identificacion = ""
    last_id_registro   = ""
    counter = 0
    for value in df['descripcion'].values:
        no_identificacion = search_pattern(value)  
        if no_identificacion is None: 
           df.loc[counter, 'id_activo'] = last_id_registro
           counter += 1
           continue
        cursor.execute("SELECT id_registro FROM activos WHERE no_identificacion  = %s", (no_identificacion,))
        result = cursor.fetchall()
        for row in result:
            last_id_registro = row[0]
        df.loc[counter, 'id_activo'] = last_id_registro
        counter += 1 
    print(df)
    cursor.close()
    conn.close()

    df.to_csv('testing.csv', sep=";", index=False) 
def search_pattern(value: str) -> str:

    pattern = r'6105-\d+'

    match = re.search(pattern, value)
    if not match:
        return None
    return match.group()

testing()