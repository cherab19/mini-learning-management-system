from django.views.generic import TemplateView
from django.http import HttpResponse
from lms_core.mixins import SPAMixin

class HomeView(SPAMixin, TemplateView):
    template_name = 'home.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['featured_courses'] = Course.objects.filter(is_approved=True)[:6]
        return context

    def get(self, request, *args, **kwargs):
        response = super().get(request, *args, **kwargs)
        # Add header for HTMX to update browser URL
        if request.headers.get('HX-Request'):
            response['HX-Push-Url'] = request.path
        return response