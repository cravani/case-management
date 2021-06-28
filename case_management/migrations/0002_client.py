# Generated by Django 3.2.4 on 2021-06-28 11:50

from django.db import migrations, models
import phonenumber_field.modelfields


class Migration(migrations.Migration):

    dependencies = [
        ('case_management', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Client',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('preferred_name', models.CharField(max_length=128)),
                ('official_identifier', models.CharField(max_length=64)),
                ('official_identifier_type', models.IntegerField(choices=[(0, 'National Identity Number'), (1, 'Passport Number')])),
                ('contact_number', phonenumber_field.modelfields.PhoneNumberField(max_length=128, region=None)),
                ('contact_email', models.EmailField(max_length=254)),
            ],
        ),
    ]