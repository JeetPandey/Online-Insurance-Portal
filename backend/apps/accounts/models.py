from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Django's username/password account, extended with a unique email address."""
    email = models.EmailField(unique=True)


class Role(models.Model):
    role_id = models.AutoField(primary_key=True)
    role_name = models.CharField(max_length=50, unique=True)
    is_active = models.BooleanField(default=True)
    is_delete = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="role_created"
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="role_updated"
    )

    class Meta:
        db_table = "tblrole"
        app_label = "accounts"

    def __str__(self):
        return self.role_name


class UserProfile(models.Model):
    profile_id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    mobile_no = models.CharField(max_length=15, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_delete = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="profile_created"
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="profile_updated"
    )

    class Meta:
        db_table = "tbluserprofile"
        app_label = "accounts"

    def __str__(self):
        return self.user.username


class UserRole(models.Model):
    user_role_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user_roles")
    role = models.ForeignKey(Role, on_delete=models.PROTECT, related_name="user_roles")
    is_active = models.BooleanField(default=True)
    is_delete = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="user_role_created"
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="user_role_updated"
    )

    class Meta:
        db_table = "tbluserrole"
        app_label = "accounts"
        constraints = [models.UniqueConstraint(fields=("user", "role"), name="unique_user_role")]

    def __str__(self):
        return f"{self.user.username} - {self.role.role_name}"


class CustomerProfile(models.Model):
    class Gender(models.TextChoices):
        FEMALE = "Female", "Female"
        MALE = "Male", "Male"
        OTHER = "Other", "Other"

    auto_id = models.BigAutoField(primary_key=True)
    customer = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="customer_profile", db_column="customer_id"
    )
    first_name = models.CharField(max_length=50, db_column="customer_f_name")
    middle_name = models.CharField(max_length=50, blank=True, db_column="customer_m_name")
    last_name = models.CharField(max_length=50, db_column="customer_l_name")
    date_of_birth = models.DateField(db_column="customer_dob")
    gender = models.CharField(max_length=50, choices=Gender.choices, db_column="customer_gender")
    address = models.CharField(max_length=250, db_column="customer_address")
    city = models.CharField(max_length=50, db_column="city")
    email_id = models.EmailField(max_length=255, db_column="email_id")
    phone_number = models.CharField(max_length=20, db_column="customer_phone_no")
    mobile_number = models.CharField(max_length=20, db_column="customer_mobile_no")

    class Meta:
        db_table = "customer_master_details"
        app_label = "accounts"
        ordering = ("customer_id",)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.customer.username})"
