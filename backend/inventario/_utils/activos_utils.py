#inventario modules--------------------------------------
from inventario.models                       import Docs, Activos, Observaciones 
#--------------------------------------------------------

#Django modules------------------------------------------
from django.db.models                        import QuerySet, Value
from django.db.models                        import CharField
#--------------------------------------------------------

#Django rest frameworks modules--------------------------
from rest_framework import status
from rest_framework.response                 import Response
#--------------------------------------------------------

#xlsxwriter modules--------------------------------------
import xlsxwriter
#--------------------------------------------------------

#python/general modules----------------------------------
from typing                                  import Any
#--------------------------------------------------------


bold_param        = {'bold': True}
center_text_param = {'align': 'center'}
font_type         = {'font_name': 'Arial'}
font_size         = {'font_size': 11}

def restar_uno(id_registro:str) -> str:
    """
    Este metodo toma como param el id_registro y le resta uno,
    esto haciendo que el output sea un str valido para escribirlo
    en el excel de impresiones.
    """
    nums = id_registro.split(',')
    nums[2] = f"0{int(nums[2]) - 1}" if int(nums[2])-1 < 10 else f"{int(nums[2])-1}"
    return ",".join(nums)


def update_id_registro_and_asiento(id_registro:str):
    """
    Este metodo toma como el param el id_registro y le resta uno,
    esto haciendo que el output sea un nuevo value valido para escri
    birlo en la base de datos.
    """
    nums = id_registro.split(",")
    # [1, 140, 03] - [1, 140, 10]
    #   (10 - 1) < 10 && 10 > 2 -> True

    if int(nums[2]) -1 < 10 and int(nums[2]) > 2:
        nums[2] = f"0{int(nums[2]) - 1}" # (10 - 1) = 09
        return {
            "id_registro": ",".join(nums), # 1, 140,09
            "asiento": nums[2] # 09
        }

    if int(nums[2]) == 2:
        nums[1] = str(int(nums[1]) -1)
        nums[2] = "41"
        return {
            "id_registro": ",".join(nums),
            "asiento": nums[2]
        }
    # [1, 140, 11] - [1,140, 41]
    # (41-1) >= 10 -> True
    if int(nums[2]) -1 >= 10: 
        nums[2] = f"{int(nums[2]) - 1}" # 40
        return {
            "id_registro": ",".join(nums), # 1,140, 40
            "asiento": nums[2] # 40
        }

def next_entries_minus_one() -> str:
    query_activos = Activos.objects.filter(impreso=0) \
                            .annotate(origen=Value('activos', output_field=CharField())) \
                            .values('id_registro', 'asiento', 'origen', 'descripcion')

    # Query for Observaciones
    query_observaciones = Observaciones.objects.filter(impreso=0) \
                                            .annotate(origen=Value('observaciones', output_field=CharField())) \
                                            .values('id_registro', 'asiento', 'origen', 'descripcion')

    # Combine both queries using union
    resultados = query_activos.union(query_observaciones).order_by('id_registro')
    
    resultados_list = list(resultados)
    print(f"Resultados list length -> {len(resultados_list)}")

    if not resultados: 
        return "Not possible to substract one, no extra entries"
    
 
    for resultado in resultados_list:
        print(f"""(next_entries_minus_one) -> id_registro:
              {resultado['id_registro']} asiento: {resultado['asiento']} """)

        if resultado['origen'] == 'activos':                         
            activo:Activos = Activos.objects.get(id_registro = resultado['id_registro'])
            updated_values = update_id_registro_and_asiento(str(activo.id_registro))
            activo.id_registro = updated_values.get("id_registro")
            activo.asiento = updated_values.get("asiento")
            activo.save() 

        if resultado['origen'] == 'observaciones':
            observacion = Observaciones.objects.get(id_registro = resultado['id_registro'])
            updated_values = update_id_registro_and_asiento(observacion.id_registro)
            observacion.id_registro = updated_values.get("id_registro")
            observacion.asiento = updated_values.get("asiento")
            observacion.save()                       

    return "Success, all entries have had one substracted" 



def get_combined_results() -> QuerySet:
    entries_activos = Activos.objects.filter(impreso=0) \
                           .annotate(origen=Value('activos', output_field=CharField())) \
                           .values('id_registro', 'asiento', 'no_identificacion',
                                   'descripcion', 'marca', 'modelo', 'serie',
                                   'origen')

    # Query for Observaciones
    entries_observaciones:QuerySet = Observaciones.objects.filter(impreso=0) \
                                            .annotate(
                                                no_identificacion = Value(None, output_field = CharField()),
                                                marca=Value(None, output_field=CharField()),
                                                modelo=Value(None, output_field=CharField()),
                                                serie=Value(None, output_field=CharField()),
                                                estado=Value(None, output_field=CharField()),
                                                origen=Value('observaciones', output_field=CharField())) \
                                            .values('id_registro', 'asiento',
                                                    'no_identificacion','descripcion',
                                                    'marca', 'modelo', 'serie',
                                                    'origen')

    # Combine both queries using union
    resultados:QuerySet = entries_activos.union(entries_observaciones)\
                                         .order_by('id_registro')
    return resultados

def determine_print_type(resultados) -> str:
    origins           = [result['origen'] for result in resultados]
    has_activos       = 'activos' in origins
    has_observaciones = 'observaciones' in origins 
    
    if has_activos and not has_observaciones:
        return "SoloActivos"
    elif not has_activos and has_observaciones:
        return "SoloObservaciones"
   
    return "ObservacionesYActivos"

def handle_solo_activos(resultados, path_to_save, file_name) -> Response:
    activos_list:Any = resultados[:40] 
    workbook = xlsxwriter.Workbook(path_to_save)
    worksheet = workbook.add_worksheet()
    outer_borders_black ={'top': 1,
                          'left': 1,
                          'bottom': 1,
                          'right': 1}
    
    a_column_format = workbook.add_format({'bold': True, 
                                           'align': 'center'} | outer_borders_black)
    b_column_format = workbook.add_format({'align': 'center'} | outer_borders_black)
    #Para aumentar el ancho de la columna-------------------------------------
    outer_borders_black_format = workbook.add_format(outer_borders_black) 
    #Crea un objeto 'Format' para dar formato al texto------------------------
                
    
    for i, activo in enumerate(activos_list, start = 1):
        row = [
            activo["asiento"],
            activo["no_identificacion"],
            activo["descripcion"],
            activo["marca"],
            activo["modelo"],
            activo["serie"]
        ]

        worksheet.write_row(row = i,
                            col = 0,
                            data = row)

    worksheet.write(f'A1', "1", 
            workbook.add_format(bold_param | center_text_param |
                                        outer_borders_black))                
    worksheet.write(f'B1', "No. Identificacion", 
                    workbook.add_format(bold_param | center_text_param |
                                        outer_borders_black))
    worksheet.write(f'C1', "Descripción",
                    workbook.add_format(bold_param | outer_borders_black))
    worksheet.write(f'D1', "Marca", 
                    workbook.add_format(bold_param | outer_borders_black))
    worksheet.write(f'E1', "Modelo",
                    workbook.add_format(bold_param | outer_borders_black))
    worksheet.write(f'F1', "Serie",
                    workbook.add_format(bold_param | outer_borders_black))

    worksheet.set_column('A:A', 2.29, a_column_format) 
    worksheet.set_column('B:B', 16.86, b_column_format) 
    worksheet.set_column('C:C', 20.29, outer_borders_black_format) 
    worksheet.set_column('D:D', 11.86, outer_borders_black_format) 
    worksheet.set_column('E:E', 17.57, outer_borders_black_format)
    worksheet.set_column('F:F', 19.71, outer_borders_black_format)


    worksheet.set_margins(left = 0.669, right = 0.354,
                          top = 0.984, bottom = 0.196)
    worksheet.set_header('&L', {'margin': 0.314})
    worksheet.set_footer('&R', {'margin': 0.314})
    worksheet.fit_to_pages(1, 1)
    workbook.close()

    for activo in activos_list:
        id_registro:str = activo.get("id_registro")
        origen:str = activo.get("origen")
        activo:Activos = Activos.objects.get(id_registro = id_registro)
        activo.impreso = True
        activo.save()
    
    ruta = f"media/documentos_de_impresion/{file_name}/"
    doc:Docs = Docs(titulo = file_name, tipo = "EXCEL",
                    ruta = ruta, impreso = False)
    doc.save()
    
    msg = f"go to '/media/documentos_de_impresion/{file_name}/' to download the file"
    return Response({"success": msg},
           status = status.HTTP_200_OK)

def handle_solo_observaciones(resultados, path_to_save, file_name):
    workbook = xlsxwriter.Workbook(path_to_save) 
    worksheet = workbook.add_worksheet() 
    observaciones_list:QuerySet = resultados

    if len(observaciones_list) < 41:
        return Response(data = {"error": ("there is not enough information "
                                          "to generate the 'observaciones' excel")},
                        status = status.HTTP_400_BAD_REQUEST)

    who_is_last = list(observaciones_list[:41])[-1]
    last_origen:str = who_is_last.get("origen", 0)

    if last_origen == 'activos':
        return Response({"error": "40 observaciones and 1 activos'"},
                        status = status.HTTP_400_BAD_REQUEST)

    
    #Para aumentar el ancho de la columna-------------------------------------
    worksheet.set_column('A:A', 2.29) 
    worksheet.set_column('B:B', 86.29) 
    counter:int = 1
    # no_identificacion IS descripcion, because the query needs to be
    # fixed 
    outer_borders_black ={'top': 1,
                          'left': 1,
                          'bottom': 1,
                          'right': 1}
    
    for observacion in observaciones_list:
        obs:Observaciones = Observaciones.objects.get(id_registro = observacion['id_registro']) 
        new_id_registro = restar_uno(observacion['id_registro'])
        new_asiento = int(observacion['asiento'] -1) 
        
        if int(observacion['asiento']) == 2 and counter > 30:
            nums = observacion['id_registro'].split(',') 
            nums[2] = "41"
            nums[1] = f"{int(nums[1]) - 1}"
            result =  ",".join(nums) # ID_REGISTRO MINUS ONE

            print(observacion['id_registro'])
            print(nums[1]) 
            worksheet.write(f'A{counter}', "41",
                            workbook.add_format(bold_param |
                                                center_text_param |
                                                outer_borders_black))
            worksheet.write(f'B{counter}',
                            observacion['no_identificacion'],
                            workbook.add_format(outer_borders_black))
            obs.id_registro = result
            obs.asiento = 41
            obs.impreso = True 
            obs.save()
            break

        worksheet.write(f'A{counter}', new_asiento,
                        workbook.add_format(bold_param |
                                            center_text_param | outer_borders_black))

        obs.id_registro = new_id_registro
        obs.asiento = new_asiento
        obs.impreso = True
        obs.save()
        worksheet.write(f'B{counter}', observacion['no_identificacion'],
                        workbook.add_format(outer_borders_black))
        counter += 1
    
    worksheet.set_margins(left = 0.669, right = 0.354,
                          top = 0.984, bottom = 0.196)

    worksheet.set_header('&L', {'margin': 0.314})
    worksheet.set_footer('&R', {'margin': 0.314})
    worksheet.fit_to_pages(1, 1)

    workbook.close()
    next_entries_minus_one()

    ruta = f"media/documentos_de_impresion/{file_name}/"
    doc:Docs = Docs(titulo = file_name, tipo = "EXCEL",
                    ruta = ruta, impreso = False)
    doc.save()

    return Response({"testing": "SoloObservaciones"},
                    status = status.HTTP_200_OK)


def handle_observaciones_y_activos(resultados, path_to_save, file_name):
    activos_observaciones_list:Any = resultados[:40]
    workbook = xlsxwriter.Workbook(path_to_save)
    worksheet = workbook.add_worksheet()
    #Para aumentar el ancho de la columna-------------------------------------
    outer_borders_black ={'top': 1,
                          'left': 1,
                          'bottom': 1,
                          'right': 1}

    #Crea un objeto 'Format' para dar formato al texto------------------------
    bold = workbook.add_format({'bold': True} | outer_borders_black)
    
    worksheet.write(f'A1', "1", 
                    workbook.add_format(bold_param | center_text_param |
                                        outer_borders_black))
                    
    worksheet.write(f'B1', "No. Identificacion", 
                    workbook.add_format(bold_param | center_text_param |
                                        outer_borders_black))
    worksheet.write(f'C1', "Descripción", bold)
    worksheet.write(f'D1', "Marca", bold)
    worksheet.write(f'E1', "Modelo", bold)
    worksheet.write(f'F1', "Serie", bold)

    for i, element in enumerate(activos_observaciones_list, start = 1):
        row = [
            element["asiento"],
            element["no_identificacion"],
            element["descripcion"],
            element["marca"],
            element["modelo"],
            element["serie"]
        ]

        worksheet.write_row(row = i,
                            col = 0,
                            data = row)

                
    b_column_format = workbook.add_format({'bold': True, 
                                           'align': 'center'} | outer_borders_black)

    c_column_format = workbook.add_format({'align': 'center'} | outer_borders_black)

    worksheet.set_column("A:A", 2.29, b_column_format)
    worksheet.set_column("B:B", 16.86, c_column_format) 
    worksheet.set_column('C:C', 20.29,
                         workbook.add_format(outer_borders_black)) 
    worksheet.set_column('D:D', 11.86,
                         workbook.add_format(outer_borders_black)) 
    worksheet.set_column('E:E', 17.57,
                         workbook.add_format(outer_borders_black))
    worksheet.set_column('F:F', 19.71,
                         workbook.add_format(outer_borders_black))
     
    worksheet.set_margins(left = 0.669, right = 0.354,
                          top = 0.984, bottom = 0.196)

    worksheet.set_header('&L', {'margin': 0.314})
    worksheet.set_footer('&R', {'margin': 0.314})
    worksheet.fit_to_pages(1, 1)
    workbook.close()

    for element in activos_observaciones_list:
        id_registro:str = element.get("id_registro")
        origen:str = element.get("origen")

        if (origen == "observaciones"): 
            obs:Observaciones = Observaciones.objects \
                                             .get(id_registro = id_registro)
            obs.impreso = True
            obs.save()
            continue

        activo:Activos = Activos.objects.get(id_registro = id_registro)
        activo.impreso = True
        activo.save()
    
    ruta = f"media/documentos_de_impresion/{file_name}/"
    doc:Docs = Docs(titulo = file_name, tipo = "EXCEL",
                    ruta = ruta, impreso = False)
    doc.save() 
    context = {"success": (f"go to/media/documentos_de_impresion/{file_name}/ to "
                           "download the file")}
    return Response(context,
           status = status.HTTP_200_OK) 

