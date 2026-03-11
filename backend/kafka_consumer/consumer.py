#!/usr/bin/env python3
"""
Standalone Kafka Consumer Service
Reads events from Kafka topics and processes them.
"""
import os
import sys
import json
import logging
import signal
import time

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from django.conf import settings

logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(asctime)s %(name)s | %(message)s'
)
logger = logging.getLogger('kafka_consumer')


class WeaverKafkaConsumer:
    def __init__(self):
        self.running = True
        self.consumer = None
        self.topics = list(settings.KAFKA_TOPICS.values())

    def connect(self):
        try:
            from confluent_kafka import Consumer, KafkaError
            self.consumer = Consumer({
                'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
                'group.id': 'weaver-consumer-group',
                'auto.offset.reset': 'earliest',
                'enable.auto.commit': False,
            })
            self.consumer.subscribe(self.topics)
            logger.info(f'Subscribed to topics: {self.topics}')
            return True
        except ImportError:
            logger.error('confluent_kafka not installed')
            return False
        except Exception as e:
            logger.error(f'Failed to connect to Kafka: {e}')
            return False

    def process_attendance(self, payload):
        from apps.attendance.models import Attendance
        from apps.employee.models import Employee
        try:
            employee = Employee.objects.get(id=payload['employee_id'])
            logger.info(f'Attendance event: {employee.name} | {payload["date"]} | {payload["status"]}')
        except Exception as e:
            logger.error(f'Error processing attendance event: {e}')

    def process_production(self, payload):
        logger.info(f'Production event: employee={payload.get("employee_id")} qty={payload.get("quantity")}')

    def process_salary(self, payload):
        logger.info(f'Salary event: employee={payload.get("employee_id")} wage={payload.get("total_wage")}')

    def handle_message(self, topic, payload):
        handlers = {
            settings.KAFKA_TOPICS['ATTENDANCE_CREATED']: self.process_attendance,
            settings.KAFKA_TOPICS['PRODUCTION_CREATED']: self.process_production,
            settings.KAFKA_TOPICS['SALARY_CALCULATED']: self.process_salary,
        }
        handler = handlers.get(topic)
        if handler:
            handler(payload)
        else:
            logger.warning(f'No handler for topic: {topic}')

    def run(self):
        if not self.connect():
            logger.warning('Running without Kafka — consumer is idle')
            while self.running:
                time.sleep(5)
            return

        signal.signal(signal.SIGTERM, self._shutdown)
        signal.signal(signal.SIGINT, self._shutdown)

        from confluent_kafka import KafkaError
        logger.info('Kafka consumer started')
        while self.running:
            msg = self.consumer.poll(timeout=1.0)
            if msg is None:
                continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                logger.error(f'Kafka error: {msg.error()}')
                continue
            try:
                payload = json.loads(msg.value().decode('utf-8'))
                self.handle_message(msg.topic(), payload)
                self.consumer.commit(asynchronous=False)
            except Exception as e:
                logger.error(f'Message processing error: {e}')

        self.consumer.close()

    def _shutdown(self, signum, frame):
        logger.info('Shutting down consumer...')
        self.running = False


if __name__ == '__main__':
    consumer = WeaverKafkaConsumer()
    consumer.run()
