# Generated by Django 5.1.4 on 2024-12-27 07:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_alter_story_summary'),
    ]

    operations = [
        migrations.AlterField(
            model_name='story',
            name='genre',
            field=models.CharField(max_length=30),
        ),
    ]
