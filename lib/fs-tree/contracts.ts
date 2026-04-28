import type { ApiResponse } from "@/lib/http/contracts";

export const FS_TREE_API_ROUTE = "/api/fs-tree";

export type TreeNode = {
	id: string;
	name: string;
	children?: TreeNode[];
};

export type FsTreePayload = {
	tree: TreeNode;
};

export type FsTreeResponse = ApiResponse<FsTreePayload>;

