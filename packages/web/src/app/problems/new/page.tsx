"use client";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Delete } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
	title: z.string().min(1),
	description: z.string().min(1),
	difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
	inputs: z.array(z.string().min(1)).min(1),
	outputs: z.array(z.string().min(1)).min(1),
});

export default function NewProblem() {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: "Weird Algorithm",
			description:
				"Consider an algorithm that takes as input a positive integer n. If n is even, the algorithm divides it by two, and if n is odd, the algorithm multiplies it by three and adds one. The algorithm repeats this, until n is one. For example, the sequence for n=3 is as follows:",
			inputs: [],
			outputs: [],
		},
		shouldFocusError: false,
	});

	// Using useFieldArray to handle dynamic input and output fields
	const inputs = useFieldArray({
		control: form.control,
		name: "inputs" as never,
	});

	const outputs = useFieldArray({
		control: form.control,
		name: "outputs" as never,
	});

	const router = useRouter();

	const { mutate, isPending } = api.problem.create.useMutation();

	function onSubmit(values: z.infer<typeof formSchema>) {
		// Handle form submission
		console.log("submited", values);

		mutate(values, {
			onSuccess(data) {
				toast("Problem added!");
				router.push("/problems");
			},
			onError(error) {
				console.error(error);
				toast.error("An error occurred", {
					description: error.message,
				});
			},
		});
	}

	function addInput() {
		// update error state
		form.trigger();
		// if there are no errors, add a new input and output field
		if (
			form.formState.errors.inputs === undefined &&
			form.formState.errors.outputs === undefined
		) {
			inputs.append("");
			outputs.append("");
		}
	}

	useEffect(() => {
		if (inputs.fields.length === 0) {
			inputs.append("");
		}
		if (outputs.fields.length === 0) {
			outputs.append("");
		}
	}, [inputs, outputs]);

	useEffect(() => {
		console.log(form.formState.errors);
	}, [form.formState.errors]);

	return (
		<div className="flex flex-col p-8">
			<div className="flex justify-between">
				<h1 className="font-bold text-2xl">Create Problem</h1>
			</div>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex flex-col space-y-8"
				>
					<FormField
						control={form.control}
						name="title"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormLabel>Title</FormLabel>
								<FormControl>
									<Input placeholder="1 2 3" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormLabel>Description</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Consider an algorithm that takes as input a positive integer n."
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="difficulty"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Difficulty</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select a difficulty" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem className="text-green-400" value="EASY">
											Easy
										</SelectItem>
										<SelectItem className="text-orange-400" value="MEDIUM">
											Medium
										</SelectItem>
										<SelectItem className="text-red-400" value="HARD">
											Hard
										</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="flex gap-4">
						<div className="flex w-full flex-col">
							{inputs.fields.map((input, index) => (
								<div key={input.id} className="flex justify-between gap-4">
									<FormField
										control={form.control}
										name={`inputs.${index}`}
										render={({ field }) => (
											<FormItem className="w-full">
												<FormLabel>Input {index + 1}</FormLabel>
												<FormControl>
													<Input placeholder="1 2 3" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							))}
						</div>

						<div className="flex w-full flex-col">
							{outputs.fields.map((input, index) => (
								<div key={input.id} className="flex justify-between gap-4">
									<FormField
										control={form.control}
										name={`outputs.${index}`}
										render={({ field }) => (
											<FormItem className="w-full">
												<FormLabel>Output {index + 1}</FormLabel>
												<FormControl>
													<Input placeholder="1 2 3" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<Button
										type="button"
										onClick={() => {
											inputs.remove(index);
											outputs.remove(index);
										}}
										className="mt-7 max-w-min"
									>
										<Delete />
									</Button>
								</div>
							))}
						</div>
					</div>
					<Button type="button" className="max-w-min" onClick={addInput}>
						Add Input/Output
					</Button>

					<Button disabled={isPending} type="submit">
						{isPending ? "Submitting..." : "Submit"}
					</Button>
				</form>
			</Form>
		</div>
	);
}
