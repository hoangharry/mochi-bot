import { Kafka, Partitioners, Producer } from "kafkajs"
import { KAFKA_BROKERS, KAFKA_CLIENT_ID, KAFKA_TOPIC } from "../env"

export default class Queue {
  private producer: Producer
  private kafka: Kafka
  private topic: string = KAFKA_TOPIC

  constructor() {
    this.kafka = new Kafka({
      brokers: KAFKA_BROKERS.split(","),
      clientId: KAFKA_CLIENT_ID,
    })

    this.producer = this.kafka.producer({
      createPartitioner: Partitioners.DefaultPartitioner,
      allowAutoTopicCreation: true,
    })
  }

  async connect() {
    await this.producer.connect()
  }

  async disconnect() {
    await this.producer.disconnect()
  }

  async produceBatch(messages: string[]) {
    // check if message is json
    for (const message of messages) {
      try {
        JSON.parse(message)
      } catch (e) {
        throw new Error("Message is not a valid json")
      }
    }

    await this.producer.send({
      topic: this.topic,
      messages: messages.map((m) => ({ value: m })),
    })
  }
}