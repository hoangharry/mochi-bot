import dotenv from "dotenv"
dotenv.config()

export const PROD = process.env.NODE_ENV === "production"
export const TEST = process.env.NODE_ENV === "test"
export const DISCORD_TOKEN = process.env.DISCORD_TOKEN || ""
export const APPLICATION_ID = process.env.APPLICATION_ID || ""
export const PORT = Number(process.env.PORT || "5001")

export const API_SERVER_HOST =
  process.env.API_SERVER_HOST || "http://localhost:8200"

export const PT_API_SERVER_HOST =
  process.env.PT_API_SERVER_HOST || "https://backend.pod.so"

export const INDEXER_API_SERVER_HOST =
  process.env.INDEXER_API_SERVER_HOST || "https://api.indexer.console.so"

// these are category ids (category = a group of channels), not channel ids
const LOCAL_EXPERIMENTAL_CATEGORY_ID =
  process.env.LOCAL_EXPERIMENTAL_CATEGORY_ID || ""
export const EXPERIMENTAL_CATEGORY_CHANNEL_IDS = [
  // pod office
  "886545596222156841",
  // mochi projects
  "904331724970926120",
  ...(LOCAL_EXPERIMENTAL_CATEGORY_ID ? [LOCAL_EXPERIMENTAL_CATEGORY_ID] : []),
]

export const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID || "932579148608729118"
export const ALERT_CHANNEL_ID =
  process.env.ALERT_CHANNEL_ID || "1003709369973735535"
export const SALE_CHANNEL_ID =
  process.env.SALE_CHANNEL_ID || "1002254978360025149"
export const PROPOSAL_INTERNAL_CHANNEL_ID =
  process.env.PROPOSAL_INTERNAL_CHANNEL_ID || "1077425424218464366"
export const MOCHI_GUILD_ID = process.env.MOCHI_GUILD_ID || "962589711841525780"
export const DISCORD_DEFAULT_AVATAR = process.env.DISCORD_DEFAULT_AVATAR || ""
export const FIRESTORE_KEY = process.env.FIRESTORE_KEY || ""
export const TWITTER_TOKEN = process.env.TWITTER_TOKEN || ""
export const TWITTER_CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY || ""
export const TWITTER_CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET || ""
export const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN || ""
export const TWITTER_TOKEN_SECRET = process.env.TWITTER_TOKEN_SECRET || ""
export const USAGE_TRACKING_CHANNEL_ID =
  process.env.USAGE_TRACKING_CHANNEL_ID || "1083591476753211492"
export const CONSOLE_LAB_GUILD_ID =
  process.env.CONSOLE_LAB_GUILD_ID || "891310117658705931"
// Opensea
export const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY || ""

export const MARKETPLACE_BASE_URL =
  process.env.MARKETPLACE_BASE_URL || "https://rarepepe.gg"

export const FEEDBACK_PUBLIC_CHANNEL_ID =
  process.env.FEEDBACK_PUBLIC_CHANNEL_ID || ""

// kafka envs
export const KAFKA_BROKERS = process.env.KAFKA_BROKERS || "localhost:9092"
export const KAFKA_TOPIC = process.env.KAFKA_TOPIC || "testTopic"
export const KAFKA_ACTIVITY_PROFILE_TOPIC =
  process.env.KAFKA_ACTIVITY_PROFILE_TOPIC || "testTopic"
export const KAFKA_NOTIFICATION_TOPIC =
  process.env.KAFKA_NOTIFICATION_TOPIC || "testTopic"
export const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || "mochiDiscord"
export const KAFKA_PRODUCER_TOPIC =
  process.env.KAFKA_PRODUCER_TOPIC || "mochiDiscord.dev"

export const FTMSCAN_API_KEY = process.env.FTMSCAN_API_KEY || ""

export const MOCHI_PROFILE_API_SERVER_HOST =
  process.env.MOCHI_PROFILE_API_SERVER_HOST ||
  "https://api.mochi-profile.console.so"

export const MOCHI_PAY_API_SERVER_HOST =
  process.env.MOCHI_PAY_API_SERVER_HOST || "https://api.mochi-pay.console.so"

export const MOCHI_TELEGRAM_API_SERVER_HOST =
  process.env.MOCHI_TELEGRAM_API_SERVER_HOST ||
  "https://api.mochi-telegram.console.so"

export const GAME_STORE_API_SERVER_HOST =
  process.env.GAME_STORE_API_SERVER_HOST || "https://game-store-api.console.so"
