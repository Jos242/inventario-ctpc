from inventario.models import Activos
from rest_framework import serializers

class ActivoSerializer(serializers.Serializer):

    id_registro = serializers.CharField(max_length = 150, required = False) 
    asiento = serializers.IntegerField(required = False)
    no_identificacion = serializers.CharField(max_length=150, required = False) 
    descripcion = serializers.CharField(max_length=150)
    marca = serializers.CharField(max_length=150, required=False, allow_blank=True)
    modelo = serializers.CharField(max_length=150, required=False, allow_blank=True)
    serie = serializers.CharField(max_length=150, required=False, allow_blank=True)
    estado = serializers.ChoiceField(choices=[
        ("Bueno", "Bueno"),
        ("Malo", "Malo"),
        ("Regular", "Regular")
    ], required=False, allow_blank=True)
      
    ubicacion = serializers.CharField(max_length=255)
    modo_adquisicion = serializers.CharField(max_length=255)
    precio = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)   
    creado_el = serializers.DateTimeField(required = False)

    def create(self, validated_data):
        print(validated_data)
        return Activos.objects.create(**validated_data)

    def update(self, instance, validated_data):
        instance.id_registro = validated_data.get('id_registro', instance.id_registro)
        instance.asiento = validated_data.get('asiento', instance.asiento)
        instance.no_identificacion = validated_data.get('no_identificacion', instance.no_identificacion)
        instance.descripcion = validated_data.get('descripcion', instance.descripcion)
        instance.marca = validated_data.get('marca', instance.marca)
        instance.modelo = validated_data.get('modelo', instance.modelo)
        instance.serie = validated_data.get('serie', instance.serie)
        instance.estado = validated_data.get('estado', instance.estado)
        instance.ubicacion = validated_data.get('ubicacion', instance.ubicacion)
        instance.modo_adquisicion = validated_data.get('modo_adquisicion', instance.modo_adquisicion)
        instance.precio = validated_data.get('precio', instance.precio)
        instance.creado_el = validated_data.get('creado_el', instance.creado_el)
        instance.save()
        return instance
    
class ReadActivoSerializer(serializers.Serializer):
    id_registro = serializers.CharField(max_length = 150, required = False) 
    no_identificacion = serializers.CharField(max_length=150, required = False) 
    descripcion = serializers.CharField(max_length=150, required = False)
    ubicacion = serializers.CharField(max_length=255, required = False)

class ObservacionesSerializer(serializers.Serializer):
    id_registro = serializers.CharField(max_length=150)
    asiento = serializers.IntegerField()
    descripcion = serializers.CharField()
    activo = serializers.CharField(source='activo.id_registro')

    # def create(self, validated_data):
    #     """
    #     Create and return a new `Observaciones` instance, given the validated data.
    #     """
    #     return Observaciones.objects.create(**validated_data)

    # def update(self, instance, validated_data):
    #     """
    #     Update and return an existing `Observaciones` instance, given the validated data.
    #     """
    #     instance.id_registro = validated_data.get('id_registro', instance.id_registro)
    #     instance.asiento = validated_data.get('asiento', instance.asiento)
    #     instance.descripcion = validated_data.get('descripcion', instance.descripcion)
    #     instance.activo_id = validated_data.get('activo')['id_registro']
    #     instance.save()
    #     return instance
