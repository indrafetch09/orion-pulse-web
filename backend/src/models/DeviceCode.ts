import { Schema, model, Document, Types } from 'mongoose';

export interface IDeviceCode extends Document {
  deviceCode: string;
  userCode: string;
  userId?: Types.ObjectId | null;
  status: 'pending' | 'authorized' | 'expired';
  createdAt: Date;
}

const deviceCodeSchema = new Schema<IDeviceCode>(
  {
    deviceCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userCode: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'authorized', 'expired'],
      default: 'pending',
    },
    createdAt: {
      type: Date,
      default: Date.now,
      // Expires after 10 minutes (600 seconds)
      index: { expires: 600 },
    },
  },
  {
    timestamps: false,
    toJSON: {
      transform(doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

export const DeviceCode = model<IDeviceCode>('DeviceCode', deviceCodeSchema);
