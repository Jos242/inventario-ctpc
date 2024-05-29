from inventario.models import Activos
from rest_framework import serializers

class ActivoSerializer(serializers.Serializer): 

    no_identificacion = serializers.CharField(max_length=150)
    descripcion = serializers.CharField(max_length=150)
    ubicacion = serializers.CharField(max_length=255)
    modo_adquisicion = serializers.CharField(max_length=255)

    # Campos opcionales
    marca = serializers.CharField(max_length=150, required=False, allow_blank=True, allow_null=True)
    modelo = serializers.CharField(max_length=150, required=False, allow_blank=True, allow_null=True)
    serie = serializers.CharField(max_length=150, required=False, allow_blank=True, allow_null=True)
    estado = serializers.ChoiceField(choices=[
        ("BUENO", "BUENO"),
        ("MALO", "MALO"),
        ("REGULAR", "REGULAR")
    ], required=False, allow_blank=True, allow_null=True)
    precio = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
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