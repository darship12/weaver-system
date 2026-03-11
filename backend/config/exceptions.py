from rest_framework.views import exception_handler
from rest_framework.response import Response
import logging

logger = logging.getLogger('apps')

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
    else:
        logger.exception('Unhandled exception', exc_info=exc)
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
