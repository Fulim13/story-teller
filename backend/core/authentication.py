from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import User

class TokenAuthentication(BaseAuthentication):
    def authenticate(self, request):
        token = request.headers.get('Authorization')
        if not token:
            return None
        try:
            user = User.objects.get(token=token)
        except User.DoesNotExist:
            raise AuthenticationFailed('Invalid token')
        return (user, None)
