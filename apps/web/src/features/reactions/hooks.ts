import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleReaction } from "./api";

export function useToggleReaction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: toggleReaction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"], exact: false });
      qc.invalidateQueries({ queryKey: ["post"], exact: false });
      qc.invalidateQueries({ queryKey: ["comments"], exact: false });
      qc.invalidateQueries({ queryKey: ["comments-resource"], exact: false });
      qc.invalidateQueries({ queryKey: ["articles"], exact: false });
      qc.invalidateQueries({ queryKey: ["article"], exact: false });
      qc.invalidateQueries({ queryKey: ["collections"], exact: false });
      qc.invalidateQueries({ queryKey: ["collection"], exact: false });
    },
    throwOnError: false,
  });
}
