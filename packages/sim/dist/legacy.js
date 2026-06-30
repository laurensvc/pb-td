import { contentIdSchema } from '@facet/content';
/** Browser-free simulation entry; gameplay systems land in M2+. */
export function isValidBoardId(id) {
    return contentIdSchema.safeParse(id).success;
}
