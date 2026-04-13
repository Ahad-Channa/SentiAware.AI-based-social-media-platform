import React, { useState, useEffect } from "react";
import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";
import api from "../../api/api";
import { useSelector, useDispatch } from "react-redux";
import { useSocketContext } from "../../context/SocketContext";
import { useLocation } from "react-router-dom";
import { fetchUnreadChatsCount } from "../../redux/chatSlice";

const ChatPage = () => {
    const [selectedChat, setSelectedChat] = useState(null);
    const [friends, setFriends] = useState([]);
    const user = useSelector((state) => state.auth.user);
    const dispatch = useDispatch();
    const { socket } = useSocketContext();

    // Fetch both friends and conversations to merge the data
    const fetchFriendsAndConversations = async () => {
        try {
            const [friendsRes, convosRes] = await Promise.all([
                api.get("/api/friends/list"),
                api.get("/api/messages/conversations")
            ]);

            const friendsData = friendsRes.data;
            const convosData = convosRes.data;

            // Map friends into a map for fast lookup
            const userMap = new Map();
            friendsData.forEach(friend => {
                userMap.set(friend._id.toString(), friend);
            });

            // Iterate over conversations, add any participant that's not the current user and not in userMap
            convosData.forEach(convo => {
                const otherParticipant = convo.participants.find(p => p._id.toString() !== user._id.toString());
                if (otherParticipant && !userMap.has(otherParticipant._id.toString())) {
                    userMap.set(otherParticipant._id.toString(), otherParticipant);
                }
            });

            const chatUsers = Array.from(userMap.values());

            // Merge conversation data (lastMessage, updatedAt, unreadCount) into chatUsers
            const mergedFriends = chatUsers.map(chatUser => {
                const convo = convosData.find(c =>
                    c.participants.some(p => p._id === chatUser._id)
                );

                return {
                    ...chatUser,
                    lastMessage: convo ? convo.lastMessage : null,
                    updatedAt: convo ? convo.updatedAt : null,
                    unreadCount: convo ? convo.unreadCount || 0 : 0,
                    conversationId: convo ? convo._id : null,
                    isModerationEnabled: convo ? convo.isModerationEnabled || false : false,
                };
            });

            // Sort: Friends with recent conversations first
            mergedFriends.sort((a, b) => {
                if (a.updatedAt && b.updatedAt) {
                    return new Date(b.updatedAt) - new Date(a.updatedAt);
                } else if (a.updatedAt) {
                    return -1;
                } else if (b.updatedAt) {
                    return 1;
                }
                return 0; // if neither has conversations, keep original order
            });

            setFriends(mergedFriends);
        } catch (error) {
            console.error("Failed to fetch friends or conversations", error);
        }
    };

    useEffect(() => {
        fetchFriendsAndConversations();
    }, []);

    // Function to mark messages as read for a specific friend
    const markMessagesAsRead = async (friendId) => {
        try {
            await api.put(`/api/messages/mark-read/${friendId}`);
            setFriends(prevFriends =>
                prevFriends.map(f =>
                    f._id === friendId ? { ...f, unreadCount: 0 } : f
                )
            );
            dispatch(fetchUnreadChatsCount()); // Update the global header badge
        } catch (error) {
            console.error("Failed to mark messages as read", error);
        }
    };

    // When a chat is selected, mark its messages as read
    useEffect(() => {
        if (selectedChat) {
            markMessagesAsRead(selectedChat._id);
        }
    }, [selectedChat]);

    // Listen for new incoming messages via socket to re-sort the list and update unread counts
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message) => {
            setFriends(prevFriends => {
                const senderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
                
                // If it's a completely new person messaging us (unfriended and no visible chat), add them
                const isExistingChat = prevFriends.some(f => f._id === senderId || message.receiver === f._id);
                let updatedFriends = [...prevFriends];

                if (!isExistingChat && senderId !== user._id) {
                    // Populate basic sender info if it's an object from socket
                    if (typeof message.sender === 'object') {
                        updatedFriends.push({
                            ...message.sender,
                            lastMessage: message,
                            updatedAt: new Date().toISOString(),
                            unreadCount: 1
                        });
                    }
                }

                updatedFriends = updatedFriends.map(friend => {
                    // Check if message is relevant to this friend
                    if (senderId === friend._id || message.receiver === friend._id) {

                        // Increment unread count if the message is from them AND we are not currently chatting with them
                        const isFromThem = senderId === friend._id;
                        const isCurrentlyChatting = selectedChat && selectedChat._id === friend._id;

                        let newUnreadCount = friend.unreadCount || 0;
                        if (isFromThem) {
                            if (isCurrentlyChatting) {
                                // If chatting, silently mark it as read on the backend instead of incrementing
                                markMessagesAsRead(friend._id);
                            } else {
                                newUnreadCount += 1;
                            }
                        }

                        return {
                            ...friend,
                            lastMessage: message,
                            updatedAt: new Date().toISOString(),
                            unreadCount: newUnreadCount
                        };
                    }
                    return friend;
                });

                // Re-sort
                return updatedFriends.sort((a, b) => {
                    if (a.updatedAt && b.updatedAt) {
                        return new Date(b.updatedAt) - new Date(a.updatedAt);
                    } else if (a.updatedAt) { return -1; }
                    else if (b.updatedAt) { return 1; }
                    return 0;
                });
            });
        };

        socket.on("newMessage", handleNewMessage);

        const handleModerationToggled = ({ conversationId, isModerationEnabled }) => {
            setFriends(prevFriends =>
                prevFriends.map(f =>
                    f.conversationId === conversationId
                        ? { ...f, isModerationEnabled: isModerationEnabled }
                        : f
                )
            );
            setSelectedChat(prev => {
                if (prev && prev.conversationId === conversationId) {
                    return { ...prev, isModerationEnabled: isModerationEnabled };
                }
                return prev;
            });
        };

        socket.on("moderationToggled", handleModerationToggled);

        return () => {
            socket.off("newMessage", handleNewMessage);
            socket.off("moderationToggled", handleModerationToggled);
        };
    }, [socket, selectedChat]);

    // Callback used by ChatWindow when the current user sends a message
    const handleMessageSent = (newMessage) => {
        setFriends(prevFriends => {
            const updatedFriends = prevFriends.map(friend => {
                // The message receiver is the friend we're chatting with
                if (newMessage.receiver === friend._id) {
                    return {
                        ...friend,
                        lastMessage: newMessage,
                        updatedAt: new Date().toISOString()
                    };
                }
                return friend;
            });

            // Re-sort
            return updatedFriends.sort((a, b) => {
                if (a.updatedAt && b.updatedAt) {
                    return new Date(b.updatedAt) - new Date(a.updatedAt);
                } else if (a.updatedAt) { return -1; }
                else if (b.updatedAt) { return 1; }
                return 0;
            });
        });
    };

    // Callback to toggle AI moderation for a conversation
    const handleToggleModeration = (conversationId, newModerationState) => {
        setFriends(prevFriends =>
            prevFriends.map(f =>
                f.conversationId === conversationId
                    ? { ...f, isModerationEnabled: newModerationState }
                    : f
            )
        );
        // Keep selectedChat in sync if it's the active conversation
        if (selectedChat && selectedChat.conversationId === conversationId) {
            setSelectedChat(prev => ({ ...prev, isModerationEnabled: newModerationState }));
        }
    };

    // Callback to delete a chat history from the current user's perspective
    const handleDeleteChat = async (friendId) => {
        try {
            await api.delete(`/api/messages/conversation/${friendId}`);

            // Remove chat preview locally
            setFriends(prevFriends => {
                const updatedFriends = prevFriends.map(friend => {
                    if (friend._id === friendId) {
                        return {
                            ...friend,
                            lastMessage: null,
                            updatedAt: null,
                            unreadCount: 0
                        };
                    }
                    return friend;
                });

                // Re-sort so this friend drops to the alphabetical/bottom section
                return updatedFriends.sort((a, b) => {
                    if (a.updatedAt && b.updatedAt) {
                        return new Date(b.updatedAt) - new Date(a.updatedAt);
                    } else if (a.updatedAt) { return -1; }
                    else if (b.updatedAt) { return 1; }
                    return 0; // Both have no recent chats
                });
            });

            // If we are currently viewing this chat, close it
            if (selectedChat && selectedChat._id === friendId) {
                setSelectedChat(null);
            }
        } catch (error) {
            console.error("Failed to clear conversation", error);
        }
    };

    return (
        <div className="h-[calc(100vh-64px)] bg-[#1A1A24] py-6 px-4 sm:px-6 flex justify-center overflow-hidden">
            <div className="max-w-[1200px] w-full h-full">
                <div className="bg-[#232330] rounded-xl border border-[#2D2D3B] shadow-sm flex h-full overflow-hidden">

                    {/* Left Sidebar: Conversations */}
                    <div className={`w-full md:w-1/3 border-r border-[#2D2D3B] flex flex-col ${selectedChat ? "hidden md:flex" : "flex"}`}>
                        <ConversationList
                            friends={friends}
                            selectedChat={selectedChat}
                            setSelectedChat={setSelectedChat}
                            onDeleteChat={handleDeleteChat}
                            onToggleModeration={handleToggleModeration}
                        />
                    </div>

                    {/* Right Area: Chat Window */}
                    <div className={`w-full md:w-2/3 flex flex-col ${!selectedChat ? "hidden md:flex" : "flex"}`}>
                        {selectedChat ? (
                            <ChatWindow
                                selectedChat={selectedChat}
                                setSelectedChat={setSelectedChat}
                                currentUser={user}
                                onMessageSent={handleMessageSent}
                                isModerationEnabled={selectedChat?.isModerationEnabled || false}
                            />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                <div className="h-16 w-16 mb-4 text-[#2D2D3B]">
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72A8.966 8.966 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-medium text-white mb-2">Your Messages</h3>
                                <p>Select a friend from the left to start chatting.</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ChatPage;
