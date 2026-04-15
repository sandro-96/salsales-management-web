import axiosInstance from "./axiosInstance";

export const getTableGroups = (shopId, branchId) =>
  axiosInstance.get("/table-groups", { params: { shopId, branchId } });

export const createTableGroup = (shopId, branchId, data) =>
  axiosInstance.post("/table-groups", data, { params: { shopId, branchId } });

export const updateTableGroup = (id, shopId, branchId, data) =>
  axiosInstance.put(`/table-groups/${id}`, data, { params: { shopId, branchId } });

export const deleteTableGroup = (id, shopId, branchId) =>
  axiosInstance.delete(`/table-groups/${id}`, { params: { shopId, branchId } });

