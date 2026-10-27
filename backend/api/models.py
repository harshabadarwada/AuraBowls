from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, default='Utensils')
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class FoodItem(models.Model):
    DIET_TYPES = [
        ('veg', 'Vegetarian'),
        ('non_veg', 'Non-Vegetarian'),
        ('vegan', 'Vegan'),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    category = models.ForeignKey(Category, related_name='items', on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    unit_info = models.CharField(max_length=100, blank=True, help_text='e.g. 3 EGGS or 450 kcal bowl')
    calories = models.IntegerField(default=350, help_text='kcal')
    protein = models.DecimalField(max_digits=5, decimal_places=1, default=20.0, help_text='grams')
    carbs = models.DecimalField(max_digits=5, decimal_places=1, default=30.0, help_text='grams')
    fat = models.DecimalField(max_digits=5, decimal_places=1, default=10.0, help_text='grams')
    fiber = models.DecimalField(max_digits=5, decimal_places=1, default=5.0, help_text='grams')
    ingredients = models.TextField(blank=True, default='Fresh healthy ingredients', help_text='Comma separated ingredients')
    diet_type = models.CharField(max_length=20, choices=DIET_TYPES, default='veg')
    is_bestseller = models.BooleanField(default=False)
    is_available = models.BooleanField(default=True)
    image_url = models.TextField(blank=True, default='')

    def __str__(self):
        return self.name

class MealPlan(models.Model):
    name = models.CharField(max_length=100) # Starter, Standard, Premium, Custom
    tag = models.CharField(max_length=100)
    meals_per_day = models.IntegerField(default=1)
    total_meals = models.IntegerField(default=26)
    duration_days = models.IntegerField(default=30)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    features = models.TextField(help_text='Comma separated list of features')
    image_url = models.TextField(blank=True, default='')

    def __str__(self):
        return self.name

class Subscription(models.Model):
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Paused', 'Paused'),
        ('Cancelled', 'Cancelled'),
    ]

    customer_name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    plan = models.ForeignKey(MealPlan, on_delete=models.SET_NULL, null=True)
    start_date = models.DateField()
    end_date = models.DateField()
    delivery_address = models.TextField()
    delivery_area = models.CharField(max_length=100, default='Hitech City')
    meal_timings = models.CharField(max_length=100, default='Breakfast & Lunch')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    remaining_meals = models.IntegerField(default=26)
    total_meals = models.IntegerField(default=26)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.customer_name} - {self.plan.name if self.plan else 'Subscription'}"

class DeliveryPartner(models.Model):
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    vehicle_number = models.CharField(max_length=50, default='TS 09 AB 1234')
    assigned_area = models.CharField(max_length=100, default='Hitech City & Madhapur')
    is_active = models.BooleanField(default=True)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=4.9)
    total_deliveries = models.IntegerField(default=45)

    def __str__(self):
        return f"{self.name} ({self.phone})"

class Order(models.Model):
    STATUS_CHOICES = [
        ('Placed', 'Order Placed'),
        ('Confirmed', 'Order Confirmed'),
        ('Preparing', 'Food Being Prepared'),
        ('Ready', 'Ready for Delivery'),
        ('Collected', 'Collected at Restaurant'),
        ('Out for Delivery', 'Out for Delivery'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled'),
    ]

    order_number = models.CharField(max_length=50, unique=True)
    customer_name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    delivery_address = models.TextField()
    landmark = models.CharField(max_length=150, blank=True, default='')
    delivery_area = models.CharField(max_length=100, default='Hitech City')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=50, default='UPI')
    payment_status = models.CharField(max_length=20, default='Paid')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Placed')
    delivery_partner = models.ForeignKey(DeliveryPartner, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    delivery_notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.order_number} - {self.customer_name}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    food_item = models.ForeignKey(FoodItem, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"{self.quantity}x {self.food_item.name}"

class MonthlyMenu(models.Model):
    day_number = models.IntegerField(unique=True) # 1 to 30
    breakfast = models.CharField(max_length=200)
    lunch = models.CharField(max_length=200)
    dinner = models.CharField(max_length=200)
    total_calories = models.IntegerField(default=1450)
    items = models.ManyToManyField(FoodItem, blank=True, related_name='monthly_menus')

    def __str__(self):
        return f"Day {self.day_number} Menu"

class DeliveryRoute(models.Model):
    route_name = models.CharField(max_length=100) # e.g., Morning Route A, Lunch Route B
    areas_covered = models.CharField(max_length=300) # e.g. Hitech City -> Madhapur -> Kondapur
    driver_name = models.CharField(max_length=100)
    driver_phone = models.CharField(max_length=20)
    active_orders_count = models.IntegerField(default=12)

    def __str__(self):
        return self.route_name

