import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CollectionInput, CollectionItemInput } from "./types/collection";
import {
  createCollection,
  fetchCollectionByUserId,
  fetchCollectionById,
  updateCollection,
  deleteCollection,
  addCollectionItem,
  removeCollectionItem,
  fetchCollectionsForResource,
  fetchAdminCollections,
  fetchAdminCollectionById,
  deleteAdminCollection,
  updateAdminCollection,
  restoreAdminCollection,
} from "./api";

/**
 * Get all collections for a user
 */
export function useCollectionsByUserId(
  userId: number,
  page: number = 1,
  limit: number = 10,
) {
  const offset = (page - 1) * limit;
  return useQuery({
    queryKey: ["collections-by-user", userId, page, limit],
    queryFn: () => fetchCollectionByUserId(userId, limit, offset),
    enabled: !!userId,
  });
}

/**
 * Get a specific collection with all its items
 */
export function useCollectionById(
  id: number,
  page: number = 1,
  limit: number = 10,
) {
  const offset = (page - 1) * limit;
  return useQuery({
    queryKey: ["collection", id, page, limit],
    queryFn: () => fetchCollectionById(id, limit, offset),
    enabled: !!id,
  });
}

/**
 * Get collections containing a specific resource for current user
 */
export function useCollectionsForResource(
  resourceType: string,
  resourceId: number,
) {
  return useQuery({
    queryKey: ["resource-collections", resourceType, resourceId],
    queryFn: () => fetchCollectionsForResource(resourceType, resourceId),
    enabled: !!resourceId && !!resourceType,
  });
}

/**
 * Create a new collection
 */
export function useCreateCollection() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createCollection,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collections"] });
      qc.invalidateQueries({ queryKey: ["collections-by-user"] });
    },
    throwOnError: false,
  });
}

/**
 * Update a collection
 */
export function useUpdateCollection() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CollectionInput }) =>
      updateCollection(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["collections"] });
      qc.invalidateQueries({ queryKey: ["collection", id] });
    },
    throwOnError: false,
  });
}

/**
 * Delete a collection
 */
export function useDeleteCollection() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteCollection,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["collections"] });
      qc.removeQueries({ queryKey: ["collection", id] });
    },
    throwOnError: false,
  });
}

/**
 * Add an item to a collection
 */
export function useAddCollectionItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      collectionId,
      data,
    }: {
      collectionId: number;
      data: CollectionItemInput;
    }) => addCollectionItem(collectionId, data),
    onSuccess: (_, { collectionId }) => {
      qc.invalidateQueries({ queryKey: ["collection", collectionId] });
    },
    throwOnError: false,
  });
}

/**
 * Remove an item from a collection
 */
export function useRemoveCollectionItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      collectionId,
      data,
    }: {
      collectionId: number;
      data: CollectionItemInput;
    }) => removeCollectionItem(collectionId, data),
    onSuccess: (_, { collectionId }) => {
      qc.invalidateQueries({ queryKey: ["collection", collectionId] });
    },
    throwOnError: false,
  });
}

//==============
//   Admin
//==============

export function useAdminCollections(
  page: number = 1,
  limit: number = 10,
  query?: string,
  options?: {
    searchFields?: string;
    sort?: string;
    caseSensitive?: boolean;
    deleted?: boolean;
  },
) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: [
      "adminCollections",
      page,
      query,
      options?.searchFields,
      options?.sort,
      options?.caseSensitive,
      options?.deleted,
    ],
    queryFn: () =>
      fetchAdminCollections({
        query,
        limit,
        offset,
        searchFields: options?.searchFields,
        sort: options?.sort,
        caseSensitive: options?.caseSensitive,
        deleted: options?.deleted,
      }),
  });
}

export function useAdminCollectionById(id: number) {
  return useQuery({
    queryKey: ["adminCollection", id],
    queryFn: () => fetchAdminCollectionById(id),
    enabled: !!id,
  });
}

export function useAdminUpdateCollection() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof updateCollection>[1];
    }) => updateAdminCollection(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["adminCollections"] });
      qc.invalidateQueries({ queryKey: ["adminCollection", id] });
    },
    throwOnError: false,
  });
}

export function useAdminDeleteCollection() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteAdminCollection,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["adminCollections"] });
      qc.removeQueries({ queryKey: ["adminCollection", id] });
    },
    throwOnError: false,
  });
}

export function useAdminRestoreCollection() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: restoreAdminCollection,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["adminCollections"] });
      qc.invalidateQueries({ queryKey: ["adminCollection", id] });
    },
    throwOnError: false,
  });
}
