from django.http import JsonResponse

class SPAMixin:
    """Mixin to handle SPA requests"""
    
    def get_template_names(self):
        if self.request.headers.get('HX-Request'):
            # Return partial template for HTMX requests
            return [f"partials/{self.template_name}"]
        return [self.template_name]
    
    def form_valid(self, form):
        response = super().form_valid(form)
        if self.request.headers.get('HX-Request'):
            # Return JSON response for HTMX form submissions
            return JsonResponse({
                'success': True,
                'message': 'Operation completed successfully',
                'redirect_url': self.get_success_url()
            })
        return response
    
    def form_invalid(self, form):
        if self.request.headers.get('HX-Request'):
            return JsonResponse({
                'success': False,
                'errors': form.errors
            }, status=400)
        return super().form_invalid(form)