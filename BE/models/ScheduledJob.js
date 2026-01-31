import mongoose from "mongoose";

const ScheduledJobSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["email", "notification", "cleanup"]
    },

    payload: { // Lưu nội dung công việc cụ thể
      type: mongoose.Schema.Types.Mixed,
      required: true
    },

    runAt: {
      type: Date,
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: ["pending", "processing", "done", "failed"],
      default: "pending",
      index: true
    },

    retryCount: {
      type: Number,
      default: 0
    },

    maxRetries: {
      type: Number,
      default: 3
    },

    lockedAt: {
      type: Date,
      default: null
    },

    lastError: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const ScheduledJob =
  mongoose.models.ScheduledJob ||
  mongoose.model("ScheduledJob", ScheduledJobSchema);
