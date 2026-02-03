import mongoose from "mongoose";

const AuctionItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    startingPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    currentBid: {
      type: Number,
      required: true,
      min: 0,
    },

    highestBidderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    auctionEndTime: {
      type: Date,
      required: true,
      index: true,
    },

    itemStatus: {
      type: String,
      enum: ["LIVE", "ENDED"],
      default: "LIVE",
      index: true,
    },

    winnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    finalPrice: {
      type: Number,
      default: null,
    },

    version: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);


//Helpful compound index for fast live auction queries

AuctionItemSchema.index({ itemStatus: 1, auctionEndTime: 1 });

export default mongoose.model("AuctionItem", AuctionItemSchema);