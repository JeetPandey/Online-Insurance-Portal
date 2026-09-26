from django.http import JsonResponse


def success_response(message="Success", data=None, status_code=200):
    return JsonResponse({"status": True, "message": message, "data": data}, status=status_code)


def error_response(message="Something went wrong", data=None, status_code=400):
    return JsonResponse({"status": False, "message": message, "data": data}, status=status_code)
