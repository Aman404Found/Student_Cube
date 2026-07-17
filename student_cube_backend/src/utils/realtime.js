let sendRealtimeEvent = null;

const getId = (value) => value?._id || value;

export const setRealtimeSender = (sender) => {
  sendRealtimeEvent = sender;
};

export const notifyUser = (userId, payload) => {
  if (!sendRealtimeEvent || !userId) return;
  sendRealtimeEvent(getId(userId).toString(), payload);
};

export const notifyUsers = (userIds = [], payload) => {
  const uniqueIds = [...new Set(userIds.filter(Boolean).map((userId) => getId(userId).toString()))];
  uniqueIds.forEach((userId) => notifyUser(userId, payload));
};
