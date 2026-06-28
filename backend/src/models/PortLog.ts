import { Schema, model, Document, Types } from "mongoose";

export interface IPortLog extends Document {
  portId: Types.ObjectId;
  portNumber: number;
  status: "open" | "closed" | "filtered";
  responseTime: number;
  checkedAt: Date;
  errorMessage?: string;
}

const portLogSchema = new Schema<IPortLog>(
  {
    portId: {
      type: Schema.Types.ObjectId,
      ref: "Port",
      required: true,
      index: true,
    },
    portNumber: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "closed", "filtered"],
      required: true,
    },
    responseTime: {
      type: Number,
      required: true,
    },
    checkedAt: {
      type: Date,
      default: Date.now,
      // Automatically clean up logs older than 7 days to conserve database space
      index: { expires: "7d" },
    },
    errorMessage: {
      type: String,
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
  },
);

export const PortLog = model<IPortLog>("PortLog", portLogSchema);
