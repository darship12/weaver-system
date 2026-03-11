from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import exception_handler
from rest_framework import status
import logging
import time

logger = logging.getLogger('apps')


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'results': data,
        })


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        error_data = {
            'error': True,
            'status_code': response.status_code,
            'message': _extract_message(response.data),
            'details': response.data,
        }
        response.data = error_data
    return response


def _extract_message(data):
    if isinstance(data, dict):
        for key in ('detail', 'non_field_errors', 'message'):
            if key in data:
                val = data[key]
                if hasattr(val, '__iter__') and not isinstance(val, str):
                    return str(val[0])
                return str(val)
    if isinstance(data, list) and data:
        return str(data[0])
    return 'An error occurred'


class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.time()
        response = self.get_response(request)
        duration = round((time.time() - start) * 1000, 2)
        if request.path.startswith('/api/'):
            logger.info(
                f'{request.method} {request.path} → {response.status_code} ({duration}ms)'
            )
        return response
