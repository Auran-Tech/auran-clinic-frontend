import { useMutation, useQueryClient } from '@tanstack/react-query'
import { moveQueueEntry } from './api'

export function useMoveQueueEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: moveQueueEntry,
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['queue'] }),
        queryClient.invalidateQueries({
          queryKey: ['queue-transitions', variables.queueEntryId],
        }),
        queryClient.invalidateQueries({ queryKey: ['active-queue'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['active-visit'] }),
      ])
    },
  })
}
