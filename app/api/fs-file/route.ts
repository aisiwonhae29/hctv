import fs from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";

function isAllowedPath(inputPath: string) {
	// Windows absolute path only
	return /^[a-zA-Z]:\\/.test(inputPath);
}

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const filePath = searchParams.get("path");

	if (!filePath) {
		return new NextResponse("path query is required", { status: 400 });
	}

	if (!isAllowedPath(filePath)) {
		return new NextResponse("Invalid path", { status: 400 });
	}

	if (!filePath.toLowerCase().endsWith(".html")) {
		return new NextResponse("Only HTML files are allowed", { status: 400 });
	}

	try {
		const content = await fs.readFile(filePath, "utf-8");
		return new NextResponse(content, {
			headers: { "Content-Type": "text/html; charset=utf-8" },
		});
	} catch {
		return new NextResponse("File not found", { status: 404 });
	}
}
