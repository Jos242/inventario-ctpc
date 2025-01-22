# using this path to search for modules
# >>> ~/Desktop/projects/inventario-ctpc/backend/ 

from inventario.models                       import User
from inventario.serializers                  import UpdateUserSerializer, UserSerializer, FuncionariosSerializer
from rest_framework.response                 import Response
from rest_framework                          import status
from inventario.permissions                  import IsAdminUser
from rest_framework.permissions              import IsAuthenticated
from rest_framework.views                    import APIView
from rest_framework.request                  import Request
from rest_framework_simplejwt.authentication import JWTAuthentication

class UserView(APIView):

    #authentication_classes = [JWTAuthentication]
    #permission_classes = [IsAuthenticated, IsAdminUser] 
    
    #TODO: Delete these two lines-----------
    authentication_classes = []
    permission_classes = [] 

    def post(self, request:Request):
        USER_TYPES = ["ADMINISTRADOR", "OBSERVADOR", "FUNCIONARIO"]
        
        try: 
            user_type = request.data.get("user_type")

            if user_type not in USER_TYPES:
                return Response({"error": f"not a valid user type, valid user types: {USER_TYPES}"},
                                status = status.HTTP_400_BAD_REQUEST)

            else:
                user_type = request.data.pop("user_type")

        except KeyError as e:
            return Response({"error": "required field: 'user_type'"},
                            status = status.HTTP_400_BAD_REQUEST)

        serializer:UserSerializer = UserSerializer(data = request.data)

        if serializer.is_valid():   
            user:User = serializer.create(serializer.validated_data)

            if user_type == 'OBSERVADOR':
                user.is_staff = False
                user.is_superuser = False
                user.set_password(serializer.validated_data['password'])
                user.save()

            if user_type == 'ADMINISTRADOR':
                user.is_staff = False
                user.is_superuser = True 
                user.set_password(serializer.validated_data['password'])
                user.save()

            if user_type == 'FUNCIONARIO':
                
                user.is_staff = True
                user.is_superuser = False 
                user.set_password(serializer.validated_data['password'])
                user.save() 
                data = request.data | {"user": user.pk}
                funcionario_serializer= FuncionariosSerializer(data = data)

                if funcionario_serializer.is_valid():
                    validated_data = funcionario_serializer.validated_data
                    funcionario:Funcionarios = funcionario_serializer.create(validated_data)  
                    serializer = FuncionariosSerializer(instance = funcionario)

                    return Response(serializer.data,
                                    status = status.HTTP_200_OK)
               
                User.objects.get(pk = user.pk).delete() 
                print(funcionario_serializer.errors) 
                return Response(funcionario_serializer.errors)

            return Response(serializer.validated_data, 
                            status = status.HTTP_200_OK) 
   
        return Response(serializer.errors,
                         status = status.HTTP_200_OK)    

    def patch(self, request:Request, pk:int) -> Response:
        serializer:UpdateUserSerializer = UpdateUserSerializer(data = request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, 
                            status = status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id = pk)

        except User.DoesNotExist:
            return Response({"error": "user does not exist"},
                            status = status.HTTP_400_BAD_REQUEST)

        user = serializer.update(instance = user,
                                 validated_data = serializer.validated_data)
        
        return Response({"success": "user was updated"},
                         status = status.HTTP_200_OK ) 
        
    def delete(self, request:Request, pk:int) -> Response:
        
        try: 
            user = User.objects.get(id = pk)
            user.delete()
        
        except User.DoesNotExist:
            return Response({"error": "user does not exist"},
                            status = status.HTTP_404_NOT_FOUND)
          
        return Response({"status": "user deleted"}, 
                        status = status.HTTP_200_OK)
