import json
import pika


def publish_bug_update(
    bug_id: int,
    description: str
):

    conn = pika.BlockingConnection(
        pika.ConnectionParameters(
            host="rabbitmq"
        )
    )

    channel = conn.channel()

    channel.queue_declare(
        queue="bug_updates"
    )

    channel.basic_publish(
        exchange="",
        routing_key="bug_updates",
        body=json.dumps({
            "bug_id": bug_id,
            "description": description
        })
    )

    conn.close()
