import { httpClient, unwrapApiResponse } from "@/lib/http/client";
import {
	FS_TREE_API_ROUTE,
	type FsTreeResponse,
	type TreeNode,
} from "@/lib/fs-tree/contracts";

type GetFsTreeOptions = {
	path: string;
	signal?: AbortSignal;
};

export async function getFsTree({
	path,
	signal,
}: GetFsTreeOptions): Promise<TreeNode> {
	const response = await httpClient.get<FsTreeResponse>(FS_TREE_API_ROUTE, {
		query: { path },
		signal,
	});

	return unwrapApiResponse(response, {
		url: FS_TREE_API_ROUTE,
	}).tree;
}
