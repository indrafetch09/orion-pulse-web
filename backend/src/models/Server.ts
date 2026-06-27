import { Schema, model, Document, Types } from 'mongoose';

export interface IServer extends Document {
  name: string;
  hostname: string;
  status: 'online' | 'offline' | 'warning';
  lastHeartbeat: Date;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const serverSchema = new Schema<IServer>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    hostname: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'warning'],
      default: 'offline',
    },
    lastHeartbeat: {
      type: Date,
      default: Date.now,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

export const Server = model<IServer>('Server', serverSchema);
