import { createContext, useState, useEffect, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import io from "socket.io-client";
import { setStatusLocally, fetchFriendStatus } from "../redux/friendsSlice";
import { addFriendLocally, removeFriendLocally } from "../redux/authSlice";

const SocketContext = createContext();

export const useSocketContext = () => {
    return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const user = useSelector((state) => state.auth.user);
    const dispatch = useDispatch();

    useEffect(() => {
        if (user) {
            const socketInstance = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
                query: {
                    userId: user._id,
                },
            });

            setSocket(socketInstance);

            socketInstance.on("getOnlineUsers", (users) => {
                setOnlineUsers(users);
            });

            // REAL-TIME FRIEND SYSTEM LISTENERS
            socketInstance.on("friendRequestReceived", (senderId) => {
                dispatch(setStatusLocally({ userId: senderId, status: "request_received" }));
            });

            socketInstance.on("friendRequestCancelled", (senderId) => {
                dispatch(setStatusLocally({ userId: senderId, status: "not_friends" }));
            });

            socketInstance.on("friendRequestAccepted", (acceptorId) => {
                dispatch(setStatusLocally({ userId: acceptorId, status: "friends" }));
                dispatch(addFriendLocally(acceptorId));
            });

            socketInstance.on("friendRequestRejected", (rejectorId) => {
                dispatch(setStatusLocally({ userId: rejectorId, status: "not_friends" }));
            });

            socketInstance.on("userUnfriended", (unfrienderId) => {
                dispatch(setStatusLocally({ userId: unfrienderId, status: "not_friends" }));
                dispatch(removeFriendLocally(unfrienderId));
            });

            return () => {
                socketInstance.off("getOnlineUsers");
                socketInstance.off("friendRequestReceived");
                socketInstance.off("friendRequestCancelled");
                socketInstance.off("friendRequestAccepted");
                socketInstance.off("friendRequestRejected");
                socketInstance.off("userUnfriended");
                socketInstance.close();
            };
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [user]); // user object changes rarely, but it's okay because we check if(user)

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};
