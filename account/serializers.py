from rest_framework import serializers
from .models import User
from django.core.validators import validate_email
from file.models import File
from django.conf import settings

from rest_framework import serializers

from .models import User
from .tokens import account_activation_token

# 회원 정보 Serializer
class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('__all__')
        extra_kwargs = {
            'password' : {'write_only' : True }
        }

    def validate(self, attrs):

        email = attrs['email']
        user = User.objects.filter(email=email)
        if(user.exists()):
            raise serializers.ValidationError("Email is already in use")

        if(validate_email(email)):
            raise serializers.ValidationError("Email is not correct")
        return attrs

    def create(self, validated_data):
        username = validated_data['username']
        email = validated_data['email']
        password = validated_data['password']



        user = User.objects.create_user(email=email, password=password, username=username)
        user.active = False
        user.save()

        return validated_data