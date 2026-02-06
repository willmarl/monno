import { fetcher } from "@/lib/fetcher";
import type {
  Collection,
  CollectionsList,
  CollectionInput,
  CollectionItem,
  CollectionWithPaginatedItems,
  CollectionItemInput,
} from "./types/collection";

// get all of user's collections
export const fetchCollectionByUserId = (
  id: number,
  limit: number = 10,
  offset: number = 0,
) =>
  fetcher<CollectionsList>(`/users/${id}/collections`, {
    searchParams: { limit, offset },
  });

// get collection by id
export const fetchCollectionById = (
  id: number,
  limit: number = 10,
  offset: number = 0,
) =>
  fetcher<CollectionWithPaginatedItems>(`/collections/${id}`, {
    searchParams: { limit, offset },
  });

// create collection
export const createCollection = (data: CollectionInput) =>
  fetcher<Collection>("/collections", {
    method: "POST",
    json: data,
  });

// update collection
export const updateCollection = (id: number, data: CollectionInput) =>
  fetcher<Collection>(`/collections/${id}`, {
    method: "PATCH",
    json: data,
  });

// delete collection
export const deleteCollection = (id: number) =>
  fetcher<void>(`/collections/${id}`, {
    method: "DELETE",
  });

// add collection item
export const addCollectionItem = (id: number, data: CollectionItemInput) =>
  fetcher<CollectionItem>(`/collections/${id}/items`, {
    method: "POST",
    json: data,
  });

// remove collection item
export const removeCollectionItem = (id: number, data: CollectionItemInput) =>
  fetcher<void>(`/collections/${id}/items`, {
    method: "DELETE",
    json: data,
  });
