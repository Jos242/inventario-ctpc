import os
from sgica.settings          import MEDIA_ROOT
from pathlib import Path

def count_files_in_directory(directory):
    count = 1
    for _, _, files in os.walk(directory):
        count += len(files)
    return count

def handle_file_directories(doc_type:str | None = None,
                            folder_name:str | None = None) -> list:
    """
        It creates a directory for the file in case that is a new product otherwise
        it returns the path for the specified product
    """
    if doc_type is None:
        absolute_path = Path(MEDIA_ROOT) / "uploads" / "actas"
        relative_path = Path("uploads") / "actas"

    if doc_type == "ubicacion_img":
        absolute_path = Path(MEDIA_ROOT) / "uploads" / "ubicaciones" / folder_name
        relative_path = Path("uploads") / "ubicaciones" / folder_name

    if absolute_path.exists():
        return [str(relative_path), str(absolute_path)]

    absolute_path.mkdir(parents = True, exist_ok = True)
    return [str(relative_path), str(absolute_path)]


def handle_uploaded_file(files: list,
                         doc_type:str | None = None,
                         **kwargs) -> str:
    nombre_oficial:str = kwargs.get("nombre_oficial", "")
    nombre_oficial = nombre_oficial.replace(" ", "_") if nombre_oficial != "" else ""
       
    paths_list = handle_file_directories(doc_type = doc_type,
                                         folder_name = nombre_oficial)
    absolute_path = paths_list[1] 
    relative_path = paths_list[0]
    
    if doc_type is None: 
        for file in files:
            relative_path = os.path.join(relative_path, str(file))
            path_to_write = os.path.join(absolute_path, str(file)) 
            with open(path_to_write, 'wb') as destination: 
                for chunk in file.chunks():
                    destination.write(chunk)

    if doc_type == "ubicacion_img":
        img_name = "img"
        count = count_files_in_directory(directory = absolute_path)

        for file in files:
            ext = str(file).split(".")[1]  
            path_to_write = os.path.join(absolute_path,
                                         f"{img_name}{count}.{ext}")  
            
            with open(path_to_write, 'wb') as destination: 
                for chunk in file.chunks():
                    destination.write(chunk)
            
            count+=1 

    return relative_path

def store_acta(file, file_name: str):
    # Build paths
    absolute_dir = os.path.join(MEDIA_ROOT, 'uploads', 'actas')
    Path(absolute_dir).mkdir(parents=True, exist_ok=True)  # Ensure directory exists

    path_to_write = os.path.join(absolute_dir, file_name)
    relative_path = os.path.join(Path("media"), 'uploads', 'actas', file_name)

    # Write the file
    with open(path_to_write, 'wb') as destination:
        destination.write(file.read())
        
    return str(relative_path)

















