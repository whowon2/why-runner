"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import Editor from "@monaco-editor/react";
import type { Language, Problem } from "@repo/db";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { OK } from "zod";

export function UploadSubmission({ problem }: { problem: Problem }) {
	const fileRef = useRef<HTMLInputElement | null>(null);
	const [code, setCode] = useState("");
	const [language, setLanguage] = useState<Language | null>(null);
	const [theme, setTheme] = useState<string | null>(null);
	const { mutate } = api.submission.create.useMutation();

	const extensions = {
		rust: ["rs"],
		python: ["py"],
		cpp: ["cpp", "cc", "cxx", "c++"],
		java: ["java"],
	};
	const themes = ["vs", "vs-dark", "hc-black"];

	function handleUpload() {
		if (!language) {
			toast.warning("Please select a language");
			return;
		}

		if (!code.length) {
			toast.warning("You can't submit empty code");
			return;
		}

		console.log(code.trim().length);

		mutate(
			{
				code,
				language,
				problemId: problem.id,
			},
			{
				onSuccess: () => {
					toast.success("Code Submitted");
				},
				onError: (error) => {
					toast.error("Failed to submit code");
				},
			},
		);
	}

	function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];

		if (!language || !file) return;

		const extension = file.name.split(".").pop();

		if (
			!extension ||
			!extensions[language as keyof typeof extensions]?.includes(extension)
		) {
			toast.warning("Invalid file extension", {
				description: `Expected: ${extensions[language as keyof typeof extensions].join(", ")}`,
			});

			if (fileRef.current) {
				fileRef.current.value = "";
			}
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			setCode(reader.result as string);
		};
		reader.readAsText(file);
	}

	function handleLanguageChange(value: string) {
		setLanguage(value as Language);
	}

	function handleThemeChange(value: string) {
		setTheme(value);
	}

	function handleSaveCode() {
		if (code) {
			localStorage.setItem(`code-${problem.id}-${language}`, code);

			toast.success("Code saved successfully");
		}
	}

	useEffect(() => {
		if (language) {
			if (!code) {
				const savedCode = localStorage.getItem(
					`code-${problem.id}-${language}`,
				);

				if (savedCode) {
					toast("Do you want to load the saved code?", {
						action: {
							label: "Load",
							onClick: () => setCode(savedCode),
						},
						duration: 100000,
						cancel: {
							label: "Cancel",
							onClick: () => {},
						},
					});
				}
			}
		}
	}, [code, problem.id, language]);

	return (
		<div className="flex w-full flex-col gap-4">
			<div className="grid w-full items-center gap-1.5">
				<div className="flex justify-between gap-2">
					<Select onValueChange={handleLanguageChange}>
						<Label htmlFor="picture">Language</Label>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Language" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="rust">rust</SelectItem>
							<SelectItem value="cpp">cpp</SelectItem>
							<SelectItem value="java">java</SelectItem>
							<SelectItem value="python">python</SelectItem>
						</SelectContent>
					</Select>

					<Label htmlFor="picture">Theme</Label>
					<Select onValueChange={handleThemeChange}>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Theme" />
						</SelectTrigger>
						<SelectContent>
							{themes.map((theme) => (
								<SelectItem key={theme} value={theme}>
									{theme}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{language && (
						<>
							<Input
								id="picture"
								type="file"
								className="w-full"
								onChange={handleFileChange}
								ref={fileRef}
							/>
							<Button variant={"outline"} onClick={handleSaveCode}>
								Save
							</Button>
							<Button onClick={handleUpload}>Upload</Button>
						</>
					)}
				</div>
			</div>
			<Editor
				className="border"
				language={language || ""}
				value={code}
				theme={theme || ""}
				onChange={(c) => {
					if (c) {
						setCode(c);
					}
				}}
				height={"60vh"}
				width={"100%"}
			/>
		</div>
	);
}
