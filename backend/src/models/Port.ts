import { Schema, model, Document, Types } from 'mongoose';

export interface IPort extends Document {
  portNumber: number;
  protocol: 'TCP' | 'UDP';
  label: string;
  status: 'open' | 'closed' | 'filtered';
  serverId: Types.ObjectId;
  lastChecked: Date;
  responseTime: number;
  createdAt: Date;
  updatedAt: Date;
}

const portSchema = new Schema<IPort>(
  {
    portNumber: {
      type: Number,
      required: true,
    },
    protocol: {
      type: String,
      enum: ['TCP', 'UDP'],
      default: 'TCP',
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'filtered'],
      default: 'closed',
    },
    serverId: {
      type: Schema.Types.ObjectId,
      ref: 'Server',
      required: true,
    },
    lastChecked: {
      type: Date,
      default: Date.now,
    },
    responseTime: {
      type: Number,
      default: 0,
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

// Unique compound index so a port/protocol combo is unique per server node
portSchema.index({ serverId: 1, portNumber: 1, protocol: 1 }, { unique: true });

export const Port = model<IPort>('Port', portSchema);
