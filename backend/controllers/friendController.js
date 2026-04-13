import User from "../models/User.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import Notification from "../models/Notification.js";

// Helper: convert ObjectId to string
const toId = (id) => id.toString();

/* ---------------------------------------------------------
   1) SEND FRIEND REQUEST
---------------------------------------------------------- */
export const sendFriendRequest = async (req, res) => {
  try {
    const me = req.user._id.toString();
    const other = req.params.id;

    if (me === other)
      return res.status(400).json({ message: "You cannot send request to yourself" });

    const myData = await User.findById(me);
    const otherData = await User.findById(other);

    if (!otherData) return res.status(404).json({ message: "User not found" });

    // already friends
    if (myData.friends.map(toId).includes(other))
      return res.json({ message: "Already friends" });

    // already sent
    if (myData.friendRequestsSent.map(toId).includes(other))
      return res.json({ message: "Request already sent" });

    // if user received a request from them → auto accept?
    if (myData.friendRequestsReceived.map(toId).includes(other)) {
      return res.status(400).json({
        message: "User already sent you a request — accept instead",
      });
    }

    myData.friendRequestsSent.push(other);
    otherData.friendRequestsReceived.push(me);

    await myData.save();
    await otherData.save();

    // Create Notification for recipient
    await Notification.create({
      recipient: other, // The person receiving the request
      sender: me,       // The person sending the request
      message: `${myData.name} sent you a friend request`,
      type: "friend_request",
      relatedId: me, // Link to the user who sent it
    });

    res.json({ message: "Friend request sent" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------------------------------------------------------
   2) CANCEL FRIEND REQUEST
---------------------------------------------------------- */
export const cancelFriendRequest = async (req, res) => {
  try {
    const me = req.user._id.toString();
    const other = req.params.id;

    const myData = await User.findById(me);
    const otherData = await User.findById(other);

    myData.friendRequestsSent = myData.friendRequestsSent.filter(
      (id) => toId(id) !== other
    );
    otherData.friendRequestsReceived = otherData.friendRequestsReceived.filter(
      (id) => toId(id) !== me
    );

    await myData.save();
    await otherData.save();

    // Remove pending notification
    await Notification.deleteMany({
      recipient: other,
      sender: me,
      type: "friend_request"
    });

    res.json({ message: "Friend request cancelled" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------------------------------------------------------
   3) ACCEPT FRIEND REQUEST
---------------------------------------------------------- */
export const acceptFriendRequest = async (req, res) => {
  try {
    const me = req.user._id.toString();
    const other = req.params.id;

    const myData = await User.findById(me);
    const otherData = await User.findById(other);

    // remove from received
    myData.friendRequestsReceived = myData.friendRequestsReceived.filter(
      (id) => toId(id) !== other
    );

    // remove from their sent
    otherData.friendRequestsSent = otherData.friendRequestsSent.filter(
      (id) => toId(id) !== me
    );

    // add to friends list
    myData.friends.push(other);
    otherData.friends.push(me);

    await myData.save();
    await otherData.save();

    // Create Notification for sender (who is now accepted)
    await Notification.create({
      recipient: other, // The person who sent the request originally
      sender: me,       // The person accepting the request
      message: `${myData.name} accepted your friend request`,
      type: "system", // or separate 'friend_accept' type if added to enum
      relatedId: me,
    });

    // REAL-TIME: Notify original sender that their request was accepted!
    const targetSocketId = getReceiverSocketId(other);
    if (targetSocketId) {
        io.to(targetSocketId).emit("friendRequestAccepted", me);
    }

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------------------------------------------------------
   4) REJECT FRIEND REQUEST
---------------------------------------------------------- */
export const rejectFriendRequest = async (req, res) => {
  try {
    const me = req.user._id.toString();
    const other = req.params.id;

    const myData = await User.findById(me);
    const otherData = await User.findById(other);

    // remove request
    myData.friendRequestsReceived = myData.friendRequestsReceived.filter(
      (id) => toId(id) !== other
    );
    otherData.friendRequestsSent = otherData.friendRequestsSent.filter(
      (id) => toId(id) !== me
    );

    await myData.save();
    await otherData.save();

    // Remove pending notification
    await Notification.deleteMany({
      recipient: me,
      sender: other,
      type: "friend_request"
    });

    // REAL-TIME: Notify sender that their request was rejected
    const targetSocketId = getReceiverSocketId(other);
    if (targetSocketId) {
        io.to(targetSocketId).emit("friendRequestRejected", me);
    }

    res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------------------------------------------------------
   5) UNFRIEND
---------------------------------------------------------- */
export const unfriendUser = async (req, res) => {
  try {
    const me = req.user._id.toString();
    const other = req.params.id;

    const myData = await User.findById(me);
    const otherData = await User.findById(other);

    myData.friends = myData.friends.filter((id) => toId(id) !== other);
    otherData.friends = otherData.friends.filter((id) => toId(id) !== me);

    await myData.save();
    await otherData.save();

    // REAL-TIME: Notify the other user that they have been unfriended
    const targetSocketId = getReceiverSocketId(other);
    if (targetSocketId) {
        io.to(targetSocketId).emit("userUnfriended", me);
    }

    res.status(200).json({ message: "Unfriended" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------------------------------------------------------
   6) GET FRIEND STATUS
---------------------------------------------------------- */
export const getFriendStatus = async (req, res) => {
  try {
    const me = req.user._id.toString();
    const other = req.params.id;

    if (me === other) return res.json({ status: "self" });

    const user = await User.findById(me);

    if (user.friends.map(toId).includes(other))
      return res.json({ status: "friends" });

    if (user.friendRequestsSent.map(toId).includes(other))
      return res.json({ status: "request_sent" });

    if (user.friendRequestsReceived.map(toId).includes(other))
      return res.json({ status: "request_received" });

    res.json({ status: "not_friends" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------------------------------------------------------
   7) GET RECEIVED REQUESTS
---------------------------------------------------------- */
export const getReceivedRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "friendRequestsReceived",
      "name profilePic"
    );

    res.json(user.friendRequestsReceived);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------------------------------------------------------
   8) GET FRIENDS LIST
---------------------------------------------------------- */
export const getFriendsList = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "friends",
      "name profilePic nickname email"
    );

    res.json(user.friends);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
