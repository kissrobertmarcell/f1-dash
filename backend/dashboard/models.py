from django.db import models


class DriverStanding(models.Model):
    position = models.PositiveIntegerField()
    driver_id = models.CharField(max_length=80, unique=True)
    given_name = models.CharField(max_length=80)
    family_name = models.CharField(max_length=80)
    code = models.CharField(max_length=8, blank=True)
    nationality = models.CharField(max_length=80, blank=True, default="")
    constructor = models.CharField(max_length=120)
    points = models.DecimalField(max_digits=7, decimal_places=1)
    wins = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["position"]

    def __str__(self):
        return f"{self.position}. {self.given_name} {self.family_name}"


class ConstructorStanding(models.Model):
    position = models.PositiveIntegerField()
    constructor_id = models.CharField(max_length=80, unique=True)
    name = models.CharField(max_length=120)
    nationality = models.CharField(max_length=80, blank=True)
    points = models.DecimalField(max_digits=7, decimal_places=1)
    wins = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["position"]

    def __str__(self):
        return f"{self.position}. {self.name}"


class DriverResult(models.Model):
    driver = models.ForeignKey(
        DriverStanding, on_delete=models.CASCADE, related_name="results"
    )
    round = models.PositiveIntegerField()
    race_name = models.CharField(max_length=160)
    circuit_name = models.CharField(max_length=160)
    date = models.DateField(null=True, blank=True)
    position = models.PositiveIntegerField()
    points = models.DecimalField(max_digits=7, decimal_places=1, default=0)
    grid = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=80, blank=True)
    constructor = models.CharField(max_length=120, blank=True)

    class Meta:
        ordering = ["round"]
        constraints = [
            models.UniqueConstraint(
                fields=["driver", "round"], name="unique_driver_result_round"
            )
        ]

    def __str__(self):
        return f"{self.driver} - R{self.round}"


class Race(models.Model):
    round = models.PositiveIntegerField(unique=True)
    race_name = models.CharField(max_length=160)
    circuit_name = models.CharField(max_length=160)
    locality = models.CharField(max_length=120)
    country = models.CharField(max_length=120)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    race_start_at = models.DateTimeField()
    first_practice_at = models.DateTimeField(null=True, blank=True)
    second_practice_at = models.DateTimeField(null=True, blank=True)
    third_practice_at = models.DateTimeField(null=True, blank=True)
    qualifying_at = models.DateTimeField(null=True, blank=True)
    sprint_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["race_start_at"]

    def __str__(self):
        return f"{self.race_name} ({self.race_start_at:%Y-%m-%d})"


class SyncState(models.Model):
    key = models.CharField(max_length=80, unique=True)
    last_success_at = models.DateTimeField(null=True, blank=True)
    next_refresh_at = models.DateTimeField(null=True, blank=True)
    error = models.TextField(blank=True)

    def __str__(self):
        return self.key
