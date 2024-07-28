import sys
import test_module

def slicin_python_string() -> None:
    # +---+---+---+---+---+---+
    # | P | y | t | h | o | n |
    # +---+---+---+---+---+---+
    # 0   1   2   3   4   5   6
    #-6  -5  -4  -3  -2  -1
    _word = "python"
    print(f"Word to slice {_word}")
    print(f"_word[1:]  -> {_word[1:]}")    # output -> ython
    print(f"_word[2:5] -> {_word[2:5]}")   # output -> tho
    print(f"_word[2:6] -> {_word [2:6]}")  # output -> thon


# 3.1.3 Lists
# Lists can be indexed and sliced 
def python_lists() -> None:
    squares = [1, 4, 9, 16, 25]
    print(squares[2:3]) # Slicing return a new list
    print(squares[2:4]) # Slicing return a new list

    for item in squares[2:4]:
        print(item)

    #Lists are mutable unlike strings
    squares[1] = 8

    #Lists also support concatenation
    squares + ["new", "elements"]
    print(squares)

    #Using the method 'append()' you can add new elements at the end of the list
    squares.append("yes")

    # Doing this reference the same list
    rgb = ["red", "green", "blue"]
    rgba = rgb
    rgba.append("Alph")
    if rgba == rgb:
        print("we are still the same list")

    #Using slices to alternate the item values is also possible
    letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
    print(letters)
    # replace some values
    letters[2:5] = ['C', 'D', 'E']
    print(letters)
    #deleting the specific values in the slice
    letters[2:5] = []
    print(letters)
    #Deleting all items in the list
    letters[:] = []
    print(letters)
    #In lists we can also use the built-in 'len()' method
    letters = ['a', 'b', 'c', 'd']
    print(len(letters))

    #A list can contain other lists
    a = ['a', 'b', 'c']
    n = [1, 2, 3]
    x = [a, n]

    print(x)
    print(x[0])
    print(x[0][1])

def python_str_class() -> None:
    pass

def python_str() -> None:
    class Persona:
        def __init__(self, nombre, edad, genero, *args, **kwargs):
            self.nombre = nombre
            self.edad = edad
            self.genero = genero
        
        def saludar(self):
            return f"Hola, mi nombre es {self.nombre}."
        
        def cumplir_anos(self):
            self.edad += 1
            return f"{self.nombre} ahora tiene {self.edad} años."
        
        def describir(self):
            return f"{self.nombre} es una persona de {self.edad} años y género {self.genero}."

    persona_args = {
        "nombre": "David",
        "edad": 12,
        "genero": "Masculino"
    }
    persona_1 = Persona(**persona_args)
    que_hace_esto = repr(persona_1) 

def f(a, L:list=[]):
    L.append(a)
    return L

def python_data_structures():
    a = []
    print(type(a))

def custom_function(x):
    return x * 2

def using_map_function():
    numbers = [1, 2, 3, 4, 5]

    result = list(map(custom_function, numbers))
    print(result)

def list_comprehension():
    using_for_loop = [custom_function(x) for x in range(100)]
    tuple_list_comprehension = [(x, y) for x in range (100) for y in range(100)]
    print(tuple_list_comprehension)

def nest_list_comprehension():
    matrix = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    ]
    nest_list = [[row[i] for row in matrix] for i in range(4)]
    print(nest_list)

def working_with_tuples():
    # A tuple consists of a number of values separated by commas, for instance
    a = 1, 2 ,3, 4
    # They are inmmutable
        # a[0] = 20 -> Is not possible to do this
    #They can be nested
    b = a, (5, 6, 7)
    # A tuple might contain mutable objects
    c = ([1, 2, 3])

    c[0] = 15 

    print(c)

# print(f(1))
# print(f(2))
# print(f(3))
# python_lists()
# python_str()
# python_data_structures()
# using_map_function()
# list_comprehension()

#nest_list_comprehension()

# working_with_tuples()

print(sys.builtin_module_names)

def python_modules():
    # In python we call files the end with the suffix .py a module
    #When importing modules to other modules, the interpreter will check the module's existence in this path
    print(sys.path)
    #Is a list of valid directories to import from

def python_standard_modules():
    pass
        




 