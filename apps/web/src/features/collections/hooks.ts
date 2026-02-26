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
  fetchCollectionsForPost,
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
 * Get collections containing a specific post for current user
 */
export function useCollectionsForPost(postId: number) {
  return useQuery({
    queryKey: ["post-collections", postId],
    queryFn: () => fetchCollectionsForPost(postId),
    enabled: !!postId,
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
