import { contentIdSchema } from '@facet/content'

/** Browser-free simulation entry; gameplay systems land in M2+. */
export function isValidBoardId(id: string): boolean {
  return contentIdSchema.safeParse(id).success
}
