from django.contrib import admin
from .models import Menu, MenuItem
from .admin_site import no_auth_admin


class MenuItemInline(admin.TabularInline):
    model = MenuItem
    extra = 0
    fields = ('title', 'url', 'order', 'is_external', 'is_active')
    ordering = ('order',)


class MenuAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'slug', 'description')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [MenuItemInline]


class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'menu', 'parent', 'order', 'url', 'is_active')
    list_filter = ('menu', 'is_active', 'is_external', 'parent')
    search_fields = ('title', 'url')
    ordering = ('menu', 'order')
    raw_id_fields = ('parent',)


# Register models with the no-auth admin site
no_auth_admin.register(Menu, MenuAdmin)
no_auth_admin.register(MenuItem, MenuItemAdmin)
