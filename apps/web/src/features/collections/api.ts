import { fetcher } from "@/lib/fetcher";
import type {
  Collection,
  CollectionsList,
  CollectionInput,
  CollectionItem,
  CollectionWithPaginatedItems,
  CollectionItemInput,
  CollectionRef,
} from "./types/collection";
import { UpdateCollectionInput } from "./schemas/updateCollection.schema";

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

// get collections containing a specific post
export const fetchCollectionsForPost = (postId: number) =>
  fetcher<CollectionRef[]>(`/posts/${postId}/collections`);

//==============
//   Admin
//==============

export const fetchAdminCollections = ({
  query,
  limit = 10,
  offset = 0,
  searchFields,
  sort,
  caseSensitive,
  deleted,
}: {
  query?: string;
  limit?: number;
  offset?: number;
  searchFields?: string;
  sort?: string;
  caseSensitive?: boolean;
  deleted?: boolean;
} = {}) => {
  const searchParams: Record<string, string | number | boolean> = {
    limit,
    offset,
  };
  if (query) searchParams.query = query;
  if (searchFields) searchParams.searchFields = searchFields;
  if (sort) searchParams.sort = sort;
  if (caseSensitive) searchParams.caseSensitive = caseSensitive;
  if (deleted !== undefined) searchParams.deleted = deleted;

  return fetcher<CollectionsList>("/admin/collections", { searchParams });
};

export const fetchAdminCollectionById = (id: number) =>
  fetcher<Collection>(`/admin/collections/${id}`);

export const updateAdminCollection = (
  id: number,
  data: UpdateCollectionInput,
) =>
  fetcher<Collection>(`/admin/collections/${id}`, {
    method: "PATCH",
    json: data,
  });

export const deleteAdminCollection = (id: number) =>
  fetcher<void>(`/admin/collections/${id}`, {
    method: "DELETE",
  });

export const restoreAdminCollection = (id: number) =>
  fetcher<Collection>(`/admin/collections/${id}/restore`, {
    method: "POST",
  });
