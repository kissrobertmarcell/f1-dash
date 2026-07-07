from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("dashboard", "0003_driverresult"),
    ]

    operations = [
        migrations.AlterField(
            model_name="driverresult",
            name="points",
            field=models.DecimalField(decimal_places=1, default=0, max_digits=7),
        ),
    ]
