"use client";
import { useFetchUserByUsername } from "@/features/users/hooks";
import { useParams } from "next/navigation";

function userDoesNotExist() {
  return (
    <div>
      <h1 className="text-2xl font-bold">User Not Found</h1>
      <p>The user you are looking for does not exist.</p>
    </div>
  );
}

export default function UserPage() {
  const { username } = useParams();
  const {
    data: user,
    isLoading,
    error,
  } = useFetchUserByUsername(
    typeof username === "string" ? username : username?.[0] || ""
  );

  if (isLoading) {
    return (
      <div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !user) {
    return userDoesNotExist();
  }

  return (
    <div>
      <p>Username: {user?.username}</p>
      <p>Created At: {user?.createdAt}</p>
    </div>
  );
}
