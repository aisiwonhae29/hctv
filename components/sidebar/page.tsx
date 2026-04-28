"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Tree } from "react-arborist";
import { getFsTree } from "@/lib/api/fs-tree";
import { isApiError } from "@/lib/http/client";
import { useTree } from "@/lib/tree-context";

function NodeIcon({
	isLeaf,
	isOpen,
}: {
	isLeaf: boolean;
	isOpen: boolean;
}) {
	if (isLeaf) {
		return (
			<svg
				aria-hidden="true"
				viewBox="0 0 24 24"
				className="h-4 w-4 text-zinc-500"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
				<path d="M14 3v5h5" />
			</svg>
		);
	}

	if (isOpen) {
		return (
			<svg
				aria-hidden="true"
				viewBox="0 0 24 24"
				className="h-4 w-4 text-amber-500"
				fill="currentColor"
			>
				<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.4c.6 0 1.17.24 1.6.66l1.34 1.34c.16.16.38.25.6.25H18.5A2.5 2.5 0 0 1 21 9.75v.15a2 2 0 0 1-.1.62l-1.86 6.1A2.5 2.5 0 0 1 16.65 19H5.5A2.5 2.5 0 0 1 3 16.5z" />
			</svg>
		);
	}

	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			className="h-4 w-4 text-amber-500"
			fill="currentColor"
		>
			<path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h3.4c.6 0 1.17.24 1.6.66l1.34 1.34c.16.16.38.25.6.25H18.5A2.5 2.5 0 0 1 21 10.75v5.75A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
		</svg>
	);
}

export default function SidebarPage() {
	const [inputPath, setInputPath] = useState(
		"C:\\Users\\ksw\\Desktop\\coding\\trend\\mockup_des",
	);
	const { tree, setTree } = useTree();
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const activeRequestRef = useRef<AbortController | null>(null);
	const treeViewportRef = useRef<HTMLDivElement | null>(null);
	const [treeViewportSize, setTreeViewportSize] = useState({
		width: 0,
		height: 0,
	});

	const treeData = useMemo(() => {
		return tree ? [tree] : [];
	}, [tree]);

	useEffect(() => {
		const element = treeViewportRef.current;

		if (!element) {
			return;
		}

		const updateSize = () => {
			setTreeViewportSize({
				width: element.clientWidth,
				height: element.clientHeight,
			});
		};

		updateSize();

		const observer = new ResizeObserver(updateSize);
		observer.observe(element);

		return () => observer.disconnect();
	}, []);

	const handleLoadTree = async () => {
		activeRequestRef.current?.abort();

		const controller = new AbortController();
		activeRequestRef.current = controller;

		setLoading(true);
		setMessage("");

		try {
			const nextTree = await getFsTree({
				path: inputPath,
				signal: controller.signal,
			});

			setTree(nextTree);
		} catch (error) {
			if (isApiError(error) && error.code === "REQUEST_ABORTED") {
				return;
			}

			setTree(null);
			setMessage(
				isApiError(error)
					? error.message
					: "An unexpected error occurred while loading the tree.",
			);
		} finally {
			if (activeRequestRef.current === controller) {
				activeRequestRef.current = null;
				setLoading(false);
			}
		}
	};

	return (
		<aside
			className="flex h-screen w-[360px] min-w-[320px] flex-col gap-4 border-r px-5 py-6"
			style={{
				background: "var(--background)",
				borderColor: "rgba(0,0,0,0.08)",
				color: "var(--foreground)",
			}}
		>
			<div className="flex flex-col gap-1">
				<h2 className="text-2xl font-bold">Explorer</h2>
				<p className="text-sm" style={{ color: "rgba(23, 23, 23, 0.6)" }}>
					Enter a folder path and load its tree structure.
				</p>
			</div>

			<div className="flex gap-2">
				<input
					className="flex-1 rounded-xl border px-3 py-2.5 text-sm outline-none"
					style={{
						background: "#ffffff",
						borderColor: "rgba(0,0,0,0.1)",
						color: "var(--foreground)",
					}}
					value={inputPath}
					onChange={(event) => setInputPath(event.target.value)}
					placeholder="e.g. C:\\Users\\ksw\\Desktop\\coding"
				/>
				<button
					type="button"
					className="relative z-50 cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold"
					style={{
						background: "#171717",
						color: "#ffffff",
						opacity: loading ? 0.7 : 1,
					}}
					onClick={handleLoadTree}
					disabled={loading}
				>
					{loading ? "Loading..." : "Load"}
				</button>
			</div>

			{message && (
				<p className="text-sm" style={{ color: "#dc2626" }}>
					{message}
				</p>
			)}

			<div
				className="flex-1 min-h-0 overflow-hidden rounded-2xl border"
				style={{
					background: "rgba(0,0,0,0.015)",
					borderColor: "rgba(0,0,0,0.08)",
				}}
			>
				<div
					className="border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide"
					style={{
						borderColor: "rgba(0,0,0,0.08)",
						color: "rgba(23, 23, 23, 0.6)",
					}}
				>
					Folder Tree
				</div>

				<div className="h-[calc(100%-45px)] px-[20px] pt-[10px]">
					<div ref={treeViewportRef} className="h-full w-full">
					{tree && treeViewportSize.width > 0 && treeViewportSize.height > 0 ? (
						<Tree
							data={treeData}
							openByDefault
							width={treeViewportSize.width}
							height={treeViewportSize.height}
							indent={20}
							rowHeight={36}
						>
							{({ node, style }) => (
								<div
									style={style}
									className="flex cursor-pointer items-center gap-2 px-4 text-sm"
									onClick={() => {
										if (!node.isLeaf) {
											node.toggle();
										}
									}}
								>
									<NodeIcon isLeaf={node.isLeaf} isOpen={node.isOpen} />
									<span
										className="min-w-0 flex-1 truncate"
										style={{ color: "var(--foreground)" }}
									>
										{node.data.name}
									</span>
									{!node.isLeaf ? (
										<button
											type="button"
											className="flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-semibold leading-none"
											style={{
												borderColor: "rgba(0,0,0,0.12)",
												color: "rgba(23, 23, 23, 0.7)",
												background: "rgba(255,255,255,0.9)",
											}}
											onClick={(event) => {
												event.stopPropagation();
												node.toggle();
											}}
											aria-label={node.isOpen ? "Collapse folder" : "Expand folder"}
										>
											{node.isOpen ? "-" : "+"}
										</button>
									) : null}
								</div>
							)}
						</Tree>
					) : (
						<div
							className="p-4 text-sm"
							style={{ color: "rgba(23, 23, 23, 0.6)" }}
						>
							No tree has been loaded yet.
						</div>
					)}
					</div>
				</div>
			</div>
		</aside>
	);
}
