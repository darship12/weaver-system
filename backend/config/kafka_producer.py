import json
import logging
from django.conf import settings

logger = logging.getLogger('apps')

def produce_event(topic: str, payload: dict):
    """Produce a Kafka event. Fails silently if Kafka is not available."""
    try:
        from confluent_kafka import Producer
        p = Producer({'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS})
        p.produce(topic, json.dumps(payload).encode('utf-8'))
        p.flush(timeout=5)
        logger.debug(f'Kafka event sent to {topic}: {payload}')
    except ImportError:
        logger.warning('confluent_kafka not installed, skipping event production')
    except Exception as e:
        # Kafka is optional in local/dev setups. Log at warning level to avoid alarming errors.
        logger.warning(f'Kafka produce skipped for topic {topic}: {e}')
