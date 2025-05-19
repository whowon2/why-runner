"use client";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import React from "react";

export function BreadCrumbs() {
	const pathname = usePathname(); // Get current path
	const segments = pathname.split("/").filter(Boolean); // Remove empty strings

	return (
		<Breadcrumb className="p-2">
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink href="/">Home</BreadcrumbLink>
				</BreadcrumbItem>

				{segments.map((segment, idx) => {
					const href = `/${segments.slice(0, idx + 1).join("/")}`;
					const isLast = idx === segments.length - 1;

					return (
						<React.Fragment key={href}>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								{isLast ? (
									<BreadcrumbPage>{decodeURIComponent(segment)}</BreadcrumbPage>
								) : (
									<BreadcrumbLink href={href}>
										{decodeURIComponent(segment)}
									</BreadcrumbLink>
								)}
							</BreadcrumbItem>
						</React.Fragment>
					);
				})}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
