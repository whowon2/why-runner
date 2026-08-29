## REMOVED Requirements

### Requirement: Follow and unfollow another user
**Reason**: WhyRunner has pivoted to an educational platform; follower/following relationships have no role in the classroom (teacher/student) workflow.
**Migration**: None. The `userFollow` table and its server actions are dropped.

### Requirement: Self-follow is rejected
**Reason**: Depends on the follow relationship being removed.
**Migration**: None.

### Requirement: Profile shows follow state and counts
**Reason**: Depends on the follow relationship being removed; the profile info card no longer shows follower/following counts or a follow control.
**Migration**: None.

### Requirement: Dedicated followers/following list pages
**Reason**: Depends on the follow relationship being removed.
**Migration**: None. `/user/[username]/followers` and `/user/[username]/following` routes are deleted.
