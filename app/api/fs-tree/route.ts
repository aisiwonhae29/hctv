import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { apiFailure, apiSuccess } from "@/lib/http/contracts";
import type { TreeNode } from "@/lib/fs-tree/contracts";

const MAX_DEPTH = 4;
const MAX_ITEMS_PER_DIR = 200;

async function buildTree(targetPath: string, depth = 0): Promise<TreeNode> {
	const stat = await fs.stat(targetPath);
	const name = path.basename(targetPath) || targetPath;

	if (!stat.isDirectory()) {
		return {
			id: targetPath,
			name,
		};
	}

	if (depth >= MAX_DEPTH) {
		return {
			id: targetPath,
			name,
			children: [],
		};
	}

	let entries = await fs.readdir(targetPath, { withFileTypes: true });

	// Directories first, then files, both alphabetically.
	entries = entries.sort((a, b) => {
		if (a.isDirectory() && !b.isDirectory()) return -1;
		if (!a.isDirectory() && b.isDirectory()) return 1;
		return a.name.localeCompare(b.name);
	});

	entries = entries.slice(0, MAX_ITEMS_PER_DIR);

	const children: TreeNode[] = [];

	for (const entry of entries) {
		const fullPath = path.join(targetPath, entry.name);

		try {
			if (entry.isDirectory()) {
				children.push(await buildTree(fullPath, depth + 1));
			} else {
				children.push({
					id: fullPath,
					name: entry.name,
				});
			}
		} catch {
			children.push({
				id: fullPath,
				name: `${entry.name} (unreadable)`,
			});
		}
	}

	return {
		id: targetPath,
		name,
		children,
	};
}

function isAllowedWindowsPath(inputPath: string) {
	return /^[a-zA-Z]:\\/.test(inputPath);
}

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const targetPath = searchParams.get("path");

	if (!targetPath) {
		return NextResponse.json(
			apiFailure("path query is required", "PATH_REQUIRED"),
			{ status: 400 },
		);
	}

	if (!isAllowedWindowsPath(targetPath)) {
		return NextResponse.json(
			apiFailure(
				"Only absolute Windows paths are allowed. Example: C:\\Users\\ksw",
				"INVALID_PATH",
			),
			{ status: 400 },
		);
	}

	try {
		const tree = await buildTree(targetPath);
		const result = apiSuccess({ tree });
		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			apiFailure(
				error instanceof Error
					? error.message
					: "Failed to read the requested directory",
				"FS_TREE_READ_FAILED",
			),
			{ status: 500 },
		);
	}
}
