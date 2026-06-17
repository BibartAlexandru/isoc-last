import pika
import json
import asyncio


async def consume(
    queue: asyncio.Queue
):

    connection = pika.BlockingConnection(
        pika.ConnectionParameters(
            host="rabbitmq"
        )
    )

    channel = connection.channel()


    channel.queue_declare(
        queue="bug_updates"
    )


    def callback(
        ch,
        method,
        properties,
        body
    ):

        event = json.loads(body)


        asyncio.run_coroutine_threadsafe(
            queue.put(event),
            asyncio.get_event_loop()
        )


    channel.basic_consume(
        queue="bug_updates",
        on_message_callback=callback,
        auto_ack=True
    )


    channel.start_consuming()
