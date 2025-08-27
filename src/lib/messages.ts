
import dbConnect from "@/lib/db";
import MessageModel from "@/models/Message";
import UserModel from "@/models/User";
import mongoose from "mongoose";

export interface Conversation {
  otherUser: {
    _id: string;
    name: string;
    avatar?: string;
  };
  lastMessage: {
    messageText: string;
    createdAt: Date;
  };
  unreadCount: number;
}

export async function getConversations(userId: mongoose.Types.ObjectId): Promise<Conversation[]> {
    await dbConnect();
    
    // Using a more robust aggregation pipeline to avoid issues with the $first operator.
    // Sorting ascending and using $last is often more stable.
    const conversations = await MessageModel.aggregate([
        { $match: { $or: [{ senderId: userId }, { receiverId: userId }] } },
        { $sort: { createdAt: 1 } }, // Sort ascending to use $last
        {
            $group: {
                _id: {
                    $cond: {
                        if: { $gt: ["$senderId", "$receiverId"] },
                        then: { $concat: [{ $toString: "$senderId" }, "-", { $toString: "$receiverId" }] },
                        else: { $concat: [{ $toString: "$receiverId" }, "-", { $toString: "$senderId" }] }
                    }
                },
                lastMessage: { $last: "$$ROOT" }, // Use $last with ascending sort
                unreadCount: {
                    $sum: {
                        $cond: [ { $and: [ { $eq: ["$isRead", false] }, { $eq: ["$receiverId", userId] } ] }, 1, 0 ]
                    }
                }
            }
        },
        { $sort: { 'lastMessage.createdAt': -1 } }, // Now sort conversations by most recent
        {
            $addFields: {
                otherUserId: {
                    $arrayElemAt: [
                        { $filter: { input: ["$lastMessage.senderId", "$lastMessage.receiverId"], as: "p", cond: { $ne: ["$$p", userId] } } },
                        0
                    ]
                }
            }
        },
        {
            $lookup: {
                from: UserModel.collection.name,
                localField: 'otherUserId',
                foreignField: '_id',
                as: 'otherUserDetails'
            }
        },
        { $unwind: '$otherUserDetails' },
        {
            $project: {
                _id: 0,
                otherUser: { _id: '$otherUserDetails._id', name: '$otherUserDetails.name', avatar: '$otherUserDetails.avatar' },
                lastMessage: { messageText: '$lastMessage.messageText', createdAt: '$lastMessage.createdAt' },
                unreadCount: 1
            }
        }
    ]);

    return JSON.parse(JSON.stringify(conversations));
}
