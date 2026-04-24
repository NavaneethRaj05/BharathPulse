const formatPayload = (complaint) => ({
  complaintId: complaint._id,
  complaintCode: complaint.complaintCode,
  status: complaint.status,
  title: complaint.title,
  location: complaint.location,
  assignedDept: complaint.assignedDept,
});

const sendStatusNotification = async (complaint) => {
  const payload = formatPayload(complaint);

  // Placeholder integration point for Twilio/FCM.
  // In production, replace with provider SDK calls.
  console.log('[notification] status update', payload);
  return payload;
};

module.exports = { sendStatusNotification };
