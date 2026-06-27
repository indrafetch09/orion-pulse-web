import { Schema, model, Document, Types } from 'mongoose';

export interface IAISolution extends Document {
  portLogId: Types.ObjectId;
  portNumber: number;
  analysis: string;
  solution: string;
  confidence: number;
  isFromCache: boolean;
  errorKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const aiSolutionSchema = new Schema<IAISolution>(
  {
    portLogId: {
      type: Schema.Types.ObjectId,
      ref: 'PortLog',
      required: true,
      index: true,
    },
    portNumber: {
      type: Number,
      required: true,
      index: true,
    },
    analysis: {
      type: String,
      required: true,
    },
    solution: {
      type: String,
      required: true,
    },
    confidence: {
      type: Number,
      default: 85,
    },
    isFromCache: {
      type: Boolean,
      default: false,
    },
    errorKey: {
      type: String,
      index: true,
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

export const AISolution = model<IAISolution>('AISolution', aiSolutionSchema);
