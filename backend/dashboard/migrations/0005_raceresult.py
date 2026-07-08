import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("dashboard", "0004_driverresult_points_decimal"),
    ]

    operations = [
        migrations.CreateModel(
            name="RaceResult",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("order", models.PositiveIntegerField()),
                ("position_display", models.CharField(max_length=8)),
                ("driver_id", models.CharField(max_length=80)),
                ("driver_name", models.CharField(max_length=160)),
                ("driver_code", models.CharField(blank=True, max_length=8)),
                ("constructor", models.CharField(blank=True, max_length=120)),
                ("grid", models.PositiveIntegerField(default=0)),
                ("laps", models.PositiveIntegerField(default=0)),
                ("status", models.CharField(blank=True, max_length=80)),
                ("time", models.CharField(blank=True, max_length=32)),
                (
                    "points",
                    models.DecimalField(decimal_places=1, default=0, max_digits=7),
                ),
                (
                    "race",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="results",
                        to="dashboard.race",
                    ),
                ),
            ],
            options={
                "ordering": ["order"],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("race", "driver_id"), name="unique_race_result_driver"
                    )
                ],
            },
        ),
    ]
