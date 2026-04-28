"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { TreeNode } from "@/lib/fs-tree/contracts";

type TreeContextValue = {
	tree: TreeNode | null;
	setTree: (tree: TreeNode | null) => void;
};

export const TreeContext = createContext<TreeContextValue>({
	tree: null,
	setTree: () => {},
});

export function TreeProvider({ children }: { children: ReactNode }) {
	const [tree, setTree] = useState<TreeNode | null>(null);
	return (
		<TreeContext.Provider value={{ tree, setTree }}>
			{children}
		</TreeContext.Provider>
	);
}

export function useTree() {
	return useContext(TreeContext);
}
