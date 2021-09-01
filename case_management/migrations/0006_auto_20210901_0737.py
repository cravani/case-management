# Generated by Django 3.2.4 on 2021-09-01 07:37

from django.db import migrations, models
import phonenumber_field.modelfields


class Migration(migrations.Migration):

    dependencies = [
        ('case_management', '0005_user_case_office'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='contact_number',
            field=phonenumber_field.modelfields.PhoneNumberField(blank=True, default='', max_length=128, region=None),
        ),
        migrations.AlterField(
            model_name='user',
            name='name',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
    ]
