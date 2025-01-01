from rest_framework import serializers
from .models import Chapter, Character, User, Story


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email']


class StorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Story
        fields = ['id', 'title', 'summary', 'genre', 'image']


class CharacterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Character
        fields = ['id', 'name']


class ChapterSerializer(serializers.ModelSerializer):
    characters = CharacterSerializer(many=True)

    class Meta:
        model = Chapter
        fields = ['id', 'title', 'content',
                  'position', 'characters']


class ComplexCharacterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Character
        fields = ['id', 'name', 'appearance', 'biography', 'image']
