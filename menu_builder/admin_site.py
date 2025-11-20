from django.contrib.admin import AdminSite
from django.views.decorators.cache import never_cache


class NoAuthAdminSite(AdminSite):
    """
    Custom admin site that doesn't require authentication
    """
    site_header = "Menu Builder Administration"
    site_title = "Menu Builder Admin"
    index_title = "Welcome to Menu Builder Administration"
    
    def has_permission(self, request):
        """
        Always return True to bypass authentication
        """
        return True
    
    @never_cache
    def login(self, request, extra_context=None):
        """
        Override login to redirect directly to admin index
        """
        from django.shortcuts import redirect
        return redirect(self.index)
    
    def logout(self, request, extra_context=None):
        """
        Override logout to redirect to admin index
        """
        from django.shortcuts import redirect
        return redirect(self.index)


# Create custom admin site instance
no_auth_admin = NoAuthAdminSite(name='no_auth_admin')

