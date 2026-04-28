import mongoose, { Schema, Document } from 'mongoose'

interface SubscriptionKeys {
  p256dh: string
  auth: string
}

export interface IPushSubscription extends Document {
  userEmail: string
  endpoint: string
  keys: SubscriptionKeys
  createdAt: Date
  updatedAt: Date
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    keys: {
      p256dh: {
        type: String,
        required: true,
      },
      auth: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
)

PushSubscriptionSchema.index({ userEmail: 1 })

export default mongoose.models.PushSubscription ||
  mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema)
