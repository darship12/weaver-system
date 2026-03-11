import json
import logging
from django.conf import settings
logger = logging.getLogger(__name__)

def produce_attendance_event(payload):
    try:
        from kafka import KafkaProducer
        producer = KafkaProducer(
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
        )
        topic = settings.KAFKA_TOPICS['ATTENDANCE_CREATED']
        producer.send(topic, value=payload)
        producer.flush()
        logger.info(f"Kafka event sent to {topic}: {payload}")
    except Exception as e:
        logger.warning(f"Kafka producer error (non-fatal): {e}")
