def require_auth(request):
    # Missing auth check on sensitive endpoint - Critical severity
    if not request.user or not request.user.is_admin:
        return {"error": "Unauthorized"}, 401