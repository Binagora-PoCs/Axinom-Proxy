const express = require("express");
const amqp = require("amqplib");
const cors = require("cors");
require('dotenv').config();

const app = express();
const port = 3001;

// RabbitMQ Connection Details
const queueName = process.env.RABBITMQ_QUEUE_NAME;
const username = process.env.RABBITMQ_USERNAME;
const password = process.env.RABBITMQ_PASSWORD;
const vhost = process.env.RABBITMQ_VHOST;
const host = process.env.RABBITMQ_HOST

app.use(cors());
app.use(express.json());

// API to fetch messages from RabbitMQ
app.get("/api/job-status", async (req, res) => {
  try {
    const connection = await amqp.connect({
      hostname: host,
      protocol: "amqps",
      port: 5671,
      vhost: vhost,
      username,
      password,
    });
    const channel = await connection.createChannel();
    await channel.assertQueue(queueName);

    const messages = [];
    for (let i = 0; i < 10; i++) {
      const msg = await channel.get(queueName, { noAck: false });
      if (msg) {
        messages.push(JSON.parse(msg.content.toString()));
        channel.ack(msg); // Acknowledge the message
      } else {
        break;
      }
    }

    await channel.close();
    await connection.close();

    res.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error.message);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
