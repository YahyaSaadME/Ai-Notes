import mongoose from 'mongoose'

function getMongoUri() {
  const defaultMongoUri =
    process.env.DOCKER_ENV === 'true'
      ? 'mongodb://mongo:27017/notes'
      : process.env.NODE_ENV !== 'production'
        ? 'mongodb://127.0.0.1:27017/notes'
        : ''

  const mongoUri = process.env.MONGODB_URI || defaultMongoUri

  if (!mongoUri) {
    throw new Error(
      'MONGODB_URI is required in production. Configure it in your hosting provider environment variables.'
    )
  }

  return mongoUri
}

interface GlobalMongoose {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var mongoose: GlobalMongoose
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    }

    cached.promise = mongoose.connect(getMongoUri(), opts)
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default connectDB
