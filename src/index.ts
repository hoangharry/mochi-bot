import Discord from "discord.js"
import { APPLICATION_ID, DISCORD_TOKEN, PORT } from "./env"
import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9"
import { logger } from "logger"
import { slashCommands } from "commands"
import { createServer, IncomingMessage, ServerResponse } from "http"
import { assignKafka } from "queue/kafka/queue"
import { run } from "queue/kafka/producer"
import { IS_READY } from "listeners/discord/ready"
import events from "listeners/discord"

const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.DIRECT_MESSAGES,
    Discord.Intents.FLAGS.GUILD_INVITES,
    Discord.Intents.FLAGS.GUILD_PRESENCES,
    Discord.Intents.FLAGS.GUILD_VOICE_STATES,
  ],
  partials: ["MESSAGE", "REACTION", "CHANNEL"],
})

// discord client
client.login(DISCORD_TOKEN)
for (const e of events) {
  if (e.once) {
    client.once(e.name, e.execute as any)
  } else {
    client.on(e.name, e.execute as any)
  }
}

process.on("SIGTERM", () => {
  process.exit(0)
})

// register slash commands
const body = Object.values(slashCommands).map((c) => c.prepare().toJSON())
const rest = new REST({ version: "9" }).setToken(DISCORD_TOKEN)

;(async () => {
  try {
    logger.info("Started refreshing application (/) commands.")
    await rest.put(Routes.applicationCommands(APPLICATION_ID), {
      body,
    })
    logger.info("Successfully reloaded application (/) commands.")

    await runHttpServer()
  } catch (error) {
    logger.error("Failed to refresh application (/) commands.")
  }
})()
;(async () => {
  try {
    logger.info("Connecting to Kafka.")
    // start queue
    assignKafka(await run())
    logger.info("Successfully connected to Kafka.")
  } catch (error) {
    logger.error("Failed to connect to Kafka.")
  }
})()

async function runHttpServer() {
  const server = createServer(
    (request: IncomingMessage, response: ServerResponse) => {
      if (request.url === "/healthz") {
        if (IS_READY) {
          response.statusCode = 200
          response.setHeader("Content-Type", "text/plain")
          response.end("OK")
          return
        }

        response.statusCode = 503
        response.end()
        return
      }

      response.statusCode = 404
      response.end()
    }
  )

  server.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`)
  })
}

export default client
