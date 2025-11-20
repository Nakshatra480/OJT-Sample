from django.db import models
from django.core.validators import MinValueValidator


class Menu(models.Model):
    """Represents a menu container"""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class MenuItem(models.Model):
    """Represents a single menu item that can be nested"""
    menu = models.ForeignKey(Menu, related_name='items', on_delete=models.CASCADE)
    parent = models.ForeignKey('self', null=True, blank=True, related_name='children', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    url = models.CharField(max_length=500, help_text="URL or path (e.g., /about/, https://example.com)")
    order = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    is_external = models.BooleanField(default=False, help_text="Check if this is an external URL")
    css_class = models.CharField(max_length=100, blank=True, help_text="Optional CSS class")
    icon = models.CharField(max_length=50, blank=True, help_text="Optional icon class (e.g., 'fa fa-home')")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'title']

    def __str__(self):
        return f"{self.title} ({self.menu.name})"

    def get_children(self):
        """Get all active children of this menu item"""
        return self.children.filter(is_active=True).order_by('order')

    def get_full_url(self):
        """Get the full URL for this menu item"""
        if self.is_external:
            return self.url
        return self.url

