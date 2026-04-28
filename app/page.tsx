"use client";

import { useState } from "react";
import { useTree } from "@/lib/tree-context";
import type { TreeNode } from "@/lib/fs-tree/contracts";

type SizePreset = "sm" | "md" | "lg";
type Align = "left" | "right";

const SIZE_MAP: Record<SizePreset, { w: number; h: number; label: string }> = {
sm: { w: 240, h: 144, label: "소" },
md: { w: 375, h: 225, label: "중" },
lg: { w: 500, h: 300, label: "대" },
};

// iframe renders at full desktop resolution, then CSS-scaled down to fit
const CONTENT_W = 1280;
const CONTENT_H = 768;

type FolderBlock = {
folder: TreeNode;
htmlFiles: TreeNode[];
};

function collectFolderBlocks(node: TreeNode, result: FolderBlock[] = []): FolderBlock[] {
if (!node.children) return result;

const htmlFiles = node.children.filter(
(child) => !child.children && child.name.toLowerCase().endsWith(".html"),
);

if (htmlFiles.length > 0) {
result.push({ folder: node, htmlFiles });
}

for (const child of node.children) {
if (child.children !== undefined) {
collectFolderBlocks(child, result);
}
}

return result;
}

export default function Home() {
const { tree } = useTree();
const [size, setSize] = useState<SizePreset>("lg");
const [align, setAlign] = useState<Align>("left");
const { w, h } = SIZE_MAP[size];
const scale = w / CONTENT_W;

if (!tree) {
return (
<div className="flex h-screen items-center justify-center text-zinc-400 text-sm">
사이드바에서 폴더를 로드하세요.
</div>
);
}

const blocks = collectFolderBlocks(tree);

if (blocks.length === 0) {
return (
<div className="flex h-screen items-center justify-center text-zinc-400 text-sm">
HTML 파일이 없습니다.
</div>
);
}

return (
<div className="flex h-screen flex-col overflow-hidden">
{/* Toolbar */}
<div className="flex shrink-0 items-center gap-4 border-b border-zinc-200 bg-white px-5 py-2.5">
{/* Size presets */}
<div className="flex items-center gap-1.5">
<span className="text-xs text-zinc-400">크기</span>
{(["sm", "md", "lg"] as SizePreset[]).map((s) => (
<button
key={s}
type="button"
onClick={() => setSize(s)}
className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
style={{
background: size === s ? "#171717" : "transparent",
color: size === s ? "#fff" : "#71717a",
border: "1px solid",
borderColor: size === s ? "#171717" : "rgba(0,0,0,0.12)",
}}
>
{SIZE_MAP[s].label}
</button>
))}
</div>

<div className="h-4 w-px bg-zinc-200" />

{/* Align */}
<div className="flex items-center gap-1.5">
<span className="text-xs text-zinc-400">정렬</span>
{(
[
{
key: "left",
label: "좌",
icon: (
<svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
<rect x="1" y="2" width="10" height="2" rx="1" />
<rect x="1" y="6" width="14" height="2" rx="1" />
<rect x="1" y="10" width="8" height="2" rx="1" />
<rect x="1" y="14" width="12" height="2" rx="1" />
</svg>
),
},
{
key: "right",
label: "우",
icon: (
<svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
<rect x="5" y="2" width="10" height="2" rx="1" />
<rect x="1" y="6" width="14" height="2" rx="1" />
<rect x="7" y="10" width="8" height="2" rx="1" />
<rect x="3" y="14" width="12" height="2" rx="1" />
</svg>
),
},
] as { key: Align; label: string; icon: React.ReactNode }[]
).map(({ key, label, icon }) => (
<button
key={key}
type="button"
onClick={() => setAlign(key)}
className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
style={{
background: align === key ? "#171717" : "transparent",
color: align === key ? "#fff" : "#71717a",
border: "1px solid",
borderColor: align === key ? "#171717" : "rgba(0,0,0,0.12)",
}}
>
{icon}
{label}
</button>
))}
</div>
</div>

{/* Content */}
<div className="flex-1 overflow-y-auto p-6">
<div
className="flex flex-col gap-10"
style={{ alignItems: align === "right" ? "flex-end" : "flex-start" }}
>
{blocks.map(({ folder, htmlFiles }) => (
<section key={folder.id} style={{ width: "100%" }}>
<div
className="mb-3 flex items-center gap-2"
style={{ justifyContent: align === "right" ? "flex-end" : "flex-start" }}
>
<svg
aria-hidden="true"
viewBox="0 0 24 24"
className="h-4 w-4 text-amber-500"
fill="currentColor"
>
<path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h3.4c.6 0 1.17.24 1.6.66l1.34 1.34c.16.16.38.25.6.25H18.5A2.5 2.5 0 0 1 21 10.75v5.75A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
</svg>
<h3 className="text-sm font-semibold text-zinc-700">{folder.name}</h3>
<span className="text-xs text-zinc-400">{htmlFiles.length}개 파일</span>
</div>

<div
className="flex flex-wrap gap-4"
style={{ justifyContent: align === "right" ? "flex-end" : "flex-start" }}
>
{htmlFiles.map((file) => (
<div key={file.id} className="flex flex-col gap-1.5">
<div
className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
style={{ width: w, height: h, position: "relative" }}
>
<iframe
src={`/api/fs-file?path=${encodeURIComponent(file.id)}`}
className="border-0"
title={file.name}
sandbox="allow-scripts allow-same-origin"
style={{
width: CONTENT_W,
height: CONTENT_H,
transform: `scale(${scale})`,
transformOrigin: "top left",
pointerEvents: "none",
}}
/>
</div>
<span className="truncate text-xs text-zinc-500" style={{ maxWidth: w }}>
{file.name}
</span>
</div>
))}
</div>
</section>
))}
</div>
</div>
</div>
);
}
