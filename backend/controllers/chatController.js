import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import { analyzeText } from "../services/moderationService.js";

export const sendMessage = async (req, res) => {
    try {
        const { message, originalToxicMessage } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        if (!message) {
            return res.status(400).json({ message: "Message text is required." });
        }

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
            });
        }

        // --- Moderation Gate ---
        // Only runs when moderation is enabled AND user hasn't already accepted the warning
        if (conversation.isModerationEnabled && !originalToxicMessage) {
            const moderationResult = await analyzeText(message);
            if (!moderationResult.safe) {
                // Return 202 — message is NOT saved yet. Frontend shows warning banner.
                return res.status(202).json({
                    isToxic: true,
                    moderatedText: moderationResult.moderatedText,
                    originalText: message,
                });
            }
        }

        // Build the message — use cleaned text if user accepted warning
        const isModerated = !!originalToxicMessage;
        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            message: isModerated ? message : message, // cleaned text passed as `message` from frontend
            isModerated,
            originalMessage: isModerated ? originalToxicMessage : undefined,
        });

        if (newMessage) {
            conversation.messages.push(newMessage._id);
            conversation.lastMessage = newMessage._id;
        }

        await Promise.all([conversation.save(), newMessage.save()]);

        const populatedMessage = await Message.findById(newMessage._id).populate("sender", "name profilePicture");

        // SOCKET.IO FUNCTIONALITY
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", populatedMessage);
        }

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.log("Error in sendMessage controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const senderId = req.user._id;

        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, userToChatId] },
        }).populate("messages"); // Get actual message objects

        if (!conversation) {
            return res.status(200).json([]);
        }

        const messages = conversation.messages;

        // Filter messages the user hasn't deleted
        const visibleMessages = messages.filter(
            (m) => !m.deletedBy?.includes(senderId)
        );

        // Mark incoming messages as read when fetched
        const unreadMessageIds = visibleMessages
            .filter(m => !m.isRead && m.sender.toString() === userToChatId)
            .map(m => m._id);

        if (unreadMessageIds.length > 0) {
            await Message.updateMany(
                { _id: { $in: unreadMessageIds } },
                { $set: { isRead: true } }
            );
        }

        res.status(200).json(visibleMessages);
    } catch (error) {
        console.log("Error in getMessages controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        const conversations = await Conversation.find({
            participants: userId,
        })
            .populate("participants", "-password")
            .populate("lastMessage")
            .populate("messages")
            .sort({ updatedAt: -1 });

        // Filter and calculate for each conversation
        const activeConversations = [];

        conversations.forEach(convo => {
            const visibleMessages = convo.messages.filter(
                (m) => !m.deletedBy?.includes(userId)
            );

            // If user deleted all messages, don't show the conversation
            if (visibleMessages.length === 0) return;

            const unreadCount = visibleMessages.filter(
                (m) => m.receiver && m.receiver.toString() === userId.toString() && !m.isRead
            ).length;

            const convoObj = convo.toObject();
            delete convoObj.messages;
            convoObj.unreadCount = unreadCount;
            // The true last message for this user is the last visible one
            convoObj.lastMessage = visibleMessages[visibleMessages.length - 1];

            activeConversations.push(convoObj);
        });

        // Re-sort by actual lastMessage's createdAt in case it changed due to deletions
        activeConversations.sort((a, b) => {
            const dateA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : new Date(a.updatedAt);
            const dateB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : new Date(b.updatedAt);
            return dateB - dateA;
        });

        res.status(200).json(activeConversations);
    } catch (error) {
        console.log("Error in getConversations controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const markMessagesAsRead = async (req, res) => {
    try {
        const { id: senderId } = req.params;
        const receiverId = req.user._id;

        await Message.updateMany(
            { sender: senderId, receiver: receiverId, isRead: false },
            { $set: { isRead: true } }
        );

        res.status(200).json({ message: "Messages marked as read" });
    } catch (error) {
        console.log("Error in markMessagesAsRead controller:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const editMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const { message: newText } = req.body;
        const senderId = req.user._id;

        if (!newText) {
            return res.status(400).json({ message: "Message text is required." });
        }

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        if (message.sender.toString() !== senderId.toString()) {
            return res.status(403).json({ message: "Unauthorized to edit this message" });
        }

        message.message = newText;
        message.isEdited = true;
        await message.save();

        const populatedMessage = await Message.findById(message._id).populate("sender", "name profilePicture");

        const receiverSocketId = getReceiverSocketId(message.receiver);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageEdited", populatedMessage);
        }

        res.status(200).json(populatedMessage);
    } catch (error) {
        console.log("Error in editMessage controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const senderId = req.user._id;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        if (message.sender.toString() !== senderId.toString()) {
            return res.status(403).json({ message: "Unauthorized to delete this message" });
        }

        const receiverId = message.receiver;

        // Find the conversation to remove the message from its array
        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        });

        if (conversation) {
            conversation.messages = conversation.messages.filter(
                (msgId) => msgId.toString() !== messageId.toString()
            );

            // If it was the last message, update lastMessage pointer
            if (conversation.lastMessage?.toString() === messageId.toString()) {
                conversation.lastMessage = conversation.messages.length > 0
                    ? conversation.messages[conversation.messages.length - 1]
                    : null;
            }

            await conversation.save();
        }

        await Message.findByIdAndDelete(messageId);

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageDeleted", messageId);
        }

        res.status(200).json({ message: "Message deleted successfully", messageId });
    } catch (error) {
        console.log("Error in deleteMessage controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const clearConversation = async (req, res) => {
    try {
        const { id: friendId } = req.params;
        const userId = req.user._id;

        const conversation = await Conversation.findOne({
            participants: { $all: [userId, friendId] },
        });

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        // Add the current user to the deletedBy array for all messages in this conversation
        await Message.updateMany(
            { _id: { $in: conversation.messages } },
            { $addToSet: { deletedBy: userId } }
        );

        res.status(200).json({ message: "Conversation cleared successfully" });
    } catch (error) {
        console.log("Error in clearConversation controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getUnreadConversationsCount = async (req, res) => {
    try {
        const userId = req.user._id;

        const conversations = await Conversation.find({
            participants: userId,
        }).populate("messages");

        let unreadCount = 0;

        conversations.forEach((convo) => {
            const hasUnread = convo.messages.some(
                (m) => m.receiver && m.receiver.toString() === userId.toString() && !m.isRead && !m.deletedBy?.includes(userId)
            );
            if (hasUnread) {
                unreadCount++;
            }
        });

        res.status(200).json({ count: unreadCount });
    } catch (error) {
        console.log("Error in getUnreadConversationsCount controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const toggleModeration = async (req, res) => {
    try {
        const { id: conversationId } = req.params;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        // Verify user is a participant
        const isParticipant = conversation.participants.some(
            (p) => p.toString() === userId.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        conversation.isModerationEnabled = !conversation.isModerationEnabled;
        await conversation.save();

        // SOCKET.IO: Notify the other participant
        const otherParticipantId = conversation.participants.find(
            (p) => p.toString() !== userId.toString()
        );

        if (otherParticipantId) {
            const receiverSocketId = getReceiverSocketId(otherParticipantId.toString());
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("moderationToggled", {
                    conversationId: conversation._id,
                    isModerationEnabled: conversation.isModerationEnabled
                });
            }
        }

        res.status(200).json({
            isModerationEnabled: conversation.isModerationEnabled,
            conversationId: conversation._id,
        });
    } catch (error) {
        console.log("Error in toggleModeration controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getMessageModerationLogs = async (req, res) => {
    try {
        const userId = req.user._id;

        const logs = await Message.find({
            sender: userId,
            isModerated: true,
        })
            .sort({ createdAt: -1 })
            .populate("sender", "name profilePicture")
            .populate("receiver", "name profilePicture");

        res.status(200).json(logs);
    } catch (error) {
        console.log("Error in getMessageModerationLogs controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};
