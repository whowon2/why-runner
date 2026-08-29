## REMOVED Requirements

### Requirement: Like an activity feed item
**Reason**: WhyRunner has pivoted to an educational platform; the activity feed and engagement on it are removed outright.
**Migration**: None. The `activityLike` table and its server actions/hooks are dropped.

### Requirement: Comment on an activity feed item
**Reason**: Depends on the activity feed being removed.
**Migration**: None. The `activityComment` table and its server actions/hooks are dropped.

### Requirement: Engagement visible on both feed surfaces
**Reason**: Both surfaces it describes (`/feed` and the profile Activity Feed tab) are removed.
**Migration**: None.

### Requirement: Delete own activity item
**Reason**: Depends on the activity feed being removed.
**Migration**: None. The `activityFeed` table itself is dropped.
