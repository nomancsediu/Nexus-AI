class ForceCORSMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == 'OPTIONS':
            from django.http import HttpResponse
            response = HttpResponse()
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Accept, Content-Type, Authorization, X-Groq-Api-Key, X-Supadata-Api-Key'
            response['Access-Control-Max-Age'] = '86400'
            return response

        response = self.get_response(request)
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Headers'] = 'Accept, Content-Type, Authorization, X-Groq-Api-Key, X-Supadata-Api-Key'
        return response
