"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm, useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ShareToFeedModal } from "@/components/share-to-feed-modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCreateContest } from "@/hooks/use-create-contest";
import { useProblems } from "@/hooks/use-problems";
import { createActivity } from "@/lib/actions/activity/create-activity";
import { authClient } from "@/lib/auth/client";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  startDate: z.string().refine(
    (dateStr) => {
      const date = new Date(dateStr);
      return !Number.isNaN(date.getTime()) && date > new Date();
    },
    {
      message: "Start Date must be in the future",
    },
  ),
  duration: z.string().min(1, "Duration must be set"),
  isPrivate: z.boolean(),
  problems: z.array(z.string()).min(1, "You must select at least one problem"),
});

type FormValues = z.infer<typeof formSchema>;

function BasicInfoStep() {
  const { control } = useFormContext<FormValues>();
  const t = useTranslations("ContestsPage.createDialog");

  return (
    <div className="space-y-4 pt-2">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("name")}</FormLabel>
            <FormControl>
              <Input placeholder="Do You Have Brio 2024" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="startDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("date")}</FormLabel>
            <FormControl>
              <Input
                placeholder="Do You Have Brio 2024"
                type="datetime-local"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="duration"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("duration")} (minutes)</FormLabel>
            <FormControl>
              <Input placeholder="15" type="number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="isPrivate"
        render={({ field }) => (
          <FormItem className="flex items-center gap-3 rounded border p-3">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="leading-none">
              <FormLabel className="cursor-pointer">Private contest</FormLabel>
              <p className="text-xs text-muted-foreground mt-1">
                Participants must be approved before joining.
              </p>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}

function ProblemsStep() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<FormValues>();
  const { data, isLoading } = useProblems({ page: 1, pageSize: 50 });
  const selectedProblems = watch("problems");

  const toggleProblem = (id: string, checked: boolean) => {
    if (!checked) {
      setValue(
        "problems",
        selectedProblems.filter((pid) => pid !== id),
      );
    } else {
      setValue("problems", [...selectedProblems, id]);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1">
        <h3 className="font-semibold text-lg leading-none tracking-tight">
          Select Problems
        </h3>
        <p className="text-sm text-muted-foreground">
          Select the problems to include in this contest.
        </p>
        {errors.problems && (
          <p className="text-[0.8rem] font-medium text-destructive">
            {errors.problems.message}
          </p>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-center py-4">Loading problems...</p>
      ) : (
        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 rounded-md">
          {(!data?.data || data.data.length === 0) && (
            <p className="text-sm text-center py-4">No problems found.</p>
          )}
          {data?.data?.map((problem) => (
            <div
              key={problem.id}
              className="flex flex-row items-center space-x-3 rounded-md border p-3 hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={`problem-${problem.id}`}
                checked={selectedProblems.includes(problem.id)}
                onCheckedChange={(checked) =>
                  toggleProblem(problem.id, !!checked)
                }
              />
              <div
                className="space-y-0.5 leading-none cursor-pointer flex-1"
                onClick={() =>
                  toggleProblem(
                    problem.id,
                    !selectedProblems.includes(problem.id),
                  )
                }
              >
                <FormLabel className="cursor-pointer font-medium">
                  {problem.title}
                </FormLabel>
                <p className="text-xs text-muted-foreground">
                  Difficulty: {problem.difficulty || "Normal"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewStep() {
  const { getValues } = useFormContext<FormValues>();
  const values = getValues();

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1">
        <h3 className="font-semibold text-lg leading-none tracking-tight">
          Review Details
        </h3>
        <p className="text-sm text-muted-foreground">
          Verify your contest information before creation.
        </p>
      </div>

      <div className="rounded-md border bg-muted/20 p-4 space-y-3 text-sm">
        <div className="flex justify-between items-center border-b pb-2">
          <span className="font-medium text-muted-foreground">Name</span>
          <span className="font-medium">{values.name}</span>
        </div>
        <div className="flex justify-between items-center border-b pb-2">
          <span className="font-medium text-muted-foreground">Start Date</span>
          <span className="font-medium">
            {new Date(values.startDate).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center border-b pb-2">
          <span className="font-medium text-muted-foreground">Duration</span>
          <span className="font-medium">{values.duration} minutes</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium text-muted-foreground">Questions</span>
          <span className="font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {values.problems?.length || 0} selected
          </span>
        </div>
      </div>
    </div>
  );
}

export function CreateContestForm({
  onSuccessAction,
}: {
  onSuccessAction: () => void;
}) {
  const { data: session } = authClient.useSession();
  const { mutate: createContest, isPending } = useCreateContest();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [createdContest, setCreatedContest] = useState<any>(null);

  const form = useForm<FormValues>({
    defaultValues: {
      name: "New Contest",
      startDate: new Date(Date.now() + 1000 * 60 * 60)
        .toISOString()
        .slice(0, 16),
      duration: "15",
      isPrivate: false,
      problems: [],
    },
    resolver: zodResolver(formSchema),
    mode: "onChange",
  });

  const nextStep = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (step === 0) {
      const isValid = await form.trigger(["name", "startDate", "duration"]);
      if (isValid) setStep(1);
    } else if (step === 1) {
      const isValid = await form.trigger(["problems"]);
      if (isValid) setStep(2);
    }
  };

  const prevStep = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  function onSubmit(values: FormValues) {
    if (!session) return;

    if (step < 2) {
      // Prevent accidental early submission via Enter key
      nextStep();
      return;
    }

    const startDate = new Date(values.startDate);
    const endDate = new Date(
      startDate.getTime() + Number(values.duration) * 60 * 1000,
    );

    createContest(
      {
        name: values.name,
        description: "",
        startDate,
        endDate,
        isPrivate: values.isPrivate,
        problems: values.problems,
      },
      {
        onError: (error) => {
          toast.error("Failed to create contest", {
            description: error.message,
          });
        },
        onSuccess: (data) => {
          toast.success("Contest Created");
          queryClient.invalidateQueries({ queryKey: ["contests"] });
          setCreatedContest(data);
          setShowShareModal(true);
        },
      },
    );
  }

  const steps = [
    { id: 0, title: "Basic Info", component: <BasicInfoStep /> },
    { id: 1, title: "Problems", component: <ProblemsStep /> },
    { id: 2, title: "Review", component: <ReviewStep /> },
  ];

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        {/* Stepper Header */}
        <div className="flex items-center justify-between mb-4 mt-2">
          {steps.map((s) => (
            <div
              key={s.id}
              className="flex flex-col items-center gap-1 w-full relative"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium z-10 transition-colors ${
                  step === s.id
                    ? "bg-primary text-primary-foreground border-2 border-primary"
                    : step > s.id
                      ? "bg-primary/20 text-primary border-2 border-primary/20"
                      : "bg-muted text-muted-foreground border-2 border-muted"
                }`}
              >
                {step > s.id ? "✓" : s.id + 1}
              </div>
              <span
                className={`text-[10px] font-medium uppercase tracking-wider ${
                  step >= s.id ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.title}
              </span>

              {/* Line connector */}
              {s.id !== steps.length - 1 && (
                <div
                  className={`absolute top-4 left-[50%] w-full h-[2px] -z-0 ${
                    step > s.id ? "bg-primary/50" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="min-h-[220px]">{steps[step].component}</div>

        <DialogFooter className="flex flex-row gap-2 justify-between w-full sm:justify-between items-center pt-4 border-t mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={step === 0 || isPending}
            className="w-24"
          >
            Back
          </Button>

          {step < steps.length - 1 ? (
            <Button type="button" onClick={nextStep} className="w-24">
              Next
            </Button>
          ) : (
            <Button disabled={isPending} type="submit" className="min-w-24">
              {isPending ? "Creating..." : "Confirm"}
            </Button>
          )}
        </DialogFooter>
      </form>

      <ShareToFeedModal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          onSuccessAction();
          if (createdContest?.id) {
            router.push(`/contests/${createdContest.id}`);
          }
        }}
        onShare={async (description) => {
          if (createdContest) {
            await createActivity({
              type: "CONTEST_CREATED",
              description,
              contestId: createdContest.id,
            });
            toast.success("Shared to your activity feed!");
          }
          setShowShareModal(false);
          onSuccessAction();
          if (createdContest?.id) {
            router.push(`/contests/${createdContest.id}`);
          }
        }}
        title="Share your new Contest"
        descriptionText={`Let your followers know you've created "${createdContest?.name || "a new contest"}"!`}
      />
    </Form>
  );
}
