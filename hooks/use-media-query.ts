"use client"

import { useMediaQuery as useBaseMediaQuery } from "@base-ui/react/unstable-use-media-query"

export function useMediaQuery(query: string) {
  return useBaseMediaQuery(query, {})
}
