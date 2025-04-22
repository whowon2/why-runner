import { Button } from "@/components/ui/button";
import { useFormStatus } from "react-dom";

export const SignupButton = () => {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full">
      Sign up
    </Button>
  );
};
