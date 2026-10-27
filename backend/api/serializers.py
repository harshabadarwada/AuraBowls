from rest_framework import serializers
from .models import Category, FoodItem, MealPlan, Subscription, Order, OrderItem, MonthlyMenu, DeliveryRoute, DeliveryPartner

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class FoodItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_url = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = FoodItem
        fields = '__all__'

class MealPlanSerializer(serializers.ModelSerializer):
    features_list = serializers.SerializerMethodField()
    image_url = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = MealPlan
        fields = '__all__'

    def get_features_list(self, obj):
        return [f.strip() for f in obj.features.split(',') if f.strip()]

class SubscriptionSerializer(serializers.ModelSerializer):
    plan_details = MealPlanSerializer(source='plan', read_only=True)

    class Meta:
        model = Subscription
        fields = '__all__'

class DeliveryPartnerSerializer(serializers.ModelSerializer):
    active_orders_count = serializers.SerializerMethodField()

    class Meta:
        model = DeliveryPartner
        fields = '__all__'

    def get_active_orders_count(self, obj):
        return obj.orders.exclude(status__in=['Delivered', 'Cancelled']).count()

class OrderItemSerializer(serializers.ModelSerializer):
    food_name = serializers.CharField(source='food_item.name', read_only=True)
    food_image = serializers.CharField(source='food_item.image_url', read_only=True)

    class Meta:
        model = OrderItem
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    delivery_partner_details = DeliveryPartnerSerializer(source='delivery_partner', read_only=True)

    class Meta:
        model = Order
        fields = '__all__'

class CreateOrderItemSerializer(serializers.Serializer):
    food_item_id = serializers.IntegerField()
    quantity = serializers.IntegerField(default=1)

class CreateOrderSerializer(serializers.Serializer):
    customer_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    delivery_address = serializers.CharField()
    landmark = serializers.CharField(required=False, allow_blank=True, default='')
    delivery_area = serializers.CharField()
    payment_method = serializers.CharField(default='UPI')
    items = CreateOrderItemSerializer(many=True)

class MonthlyMenuSerializer(serializers.ModelSerializer):
    items = FoodItemSerializer(many=True, read_only=True)
    item_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=FoodItem.objects.all(), write_only=True, required=False, source='items'
    )

    class Meta:
        model = MonthlyMenu
        fields = '__all__'

class DeliveryRouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryRoute
        fields = '__all__'

from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined', 'password', 'role']

    def get_role(self, obj):
        if obj.is_superuser or obj.is_staff:
            return 'admin'
        if DeliveryPartner.objects.filter(email__iexact=obj.email).exists():
            return 'delivery'
        return 'customer'


