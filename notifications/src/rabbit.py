import pika
import json
import asyncio


def consume():
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(
            "rabbitmq"
        )
    )

    channel = connection.channel()
    channel.queue_declare(
        queue="bug_updates"
    )


    def callback(ch, method, props, body):
        event=json.loads(body)
        print(
            "BUG UPDATE:",
            event
        )


    channel.basic_consume(
        queue="bug_updates",
        on_message_callback=callback,
        auto_ack=True
    )


    channel.start_consuming()
