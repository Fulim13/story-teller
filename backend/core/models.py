from django.core.exceptions import ValidationError
from django.db import models
from django.utils.crypto import get_random_string
import hashlib


class User(models.Model):
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=255, blank=True, null=True)
    password = models.CharField(max_length=255)  # Store hashed passwords
    token = models.CharField(max_length=64, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email

    def set_password(self, raw_password):
        # Hash the password for security
        hashed_password = hashlib.sha256(raw_password.encode()).hexdigest()
        self.password = hashed_password

    def check_password(self, raw_password):
        # Check if the hashed password matches
        hashed_password = hashlib.sha256(raw_password.encode()).hexdigest()
        return self.password == hashed_password

    def generate_token(self):
        # Generate a random token and save it
        # Generates a 64-character random string
        self.token = get_random_string(64)
        self.save()
        return self.token


class Story(models.Model):
    title = models.CharField(max_length=255)
    genre = models.CharField(
        max_length=30)
    summary = models.TextField(null=True, blank=True)
    last_update = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    author = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='stories')
    image = models.ImageField(upload_to='story_images/', null=True, blank=True)

    def delete(self, *args, **kwargs):
        # Delete related chapters and characters explicitly
        self.chapters.all().delete()
        self.characters.all().delete()
        super().delete(*args, **kwargs)

    def __str__(self):
        return self.title


class Chapter(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    story = models.ForeignKey(
        Story, on_delete=models.CASCADE, related_name='chapters')
    characters = models.ManyToManyField("Character", related_name='chapters')
    position = models.PositiveIntegerField()

    class Meta:
        ordering = ['position']
        unique_together = ('story', 'position')

    def __str__(self):
        return f"{self.story.title} - {self.title}"

    def delete(self, *args, **kwargs):
        # Remove character associations from the chapter
        self.characters.clear()
        super().delete(*args, **kwargs)


class Character(models.Model):
    name = models.CharField(max_length=255)
    appearance = models.TextField()
    biography = models.TextField()
    story = models.ForeignKey(
        Story, on_delete=models.CASCADE, related_name='characters')
    image = models.ImageField(
        upload_to='character_images/', null=True, blank=True)

    def __str__(self):
        return self.name

    def delete(self, *args, **kwargs):
        # Check if the character is associated with any chapters
        if self.chapters.exists():
            raise ValidationError(
                "Cannot delete character. It is still associated with chapters.")
        super().delete(*args, **kwargs)
