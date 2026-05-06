import api from "./api.js";

export const getComplaints = () => api.get("/complaints");
export const updateComplaintStatus = (complaintId, payload) => api.patch(`/complaints/${complaintId}`, payload);
