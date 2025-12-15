import { User } from "better-auth";
import { CreateContestDialog } from "../../contests/_components/create/dialog";

export function MyContests() {
  return (
    <div>
      <h1>My Contests</h1>
      <CreateContestDialog />
    </div>
  );
}
