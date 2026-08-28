## REMOVED Requirements

### Requirement: Feed page with Following and Explore tabs
**Reason**: WhyRunner has pivoted to an educational platform; the social activity feed has no role in the classroom (teacher/student) workflow and is being removed outright.
**Migration**: None. The `/feed` route, its tabs, and the `activityFeed` table are deleted. No replacement page.

### Requirement: Explore surfaces followable users
**Reason**: Depends on both the feed and the follow relationship, both removed in this change.
**Migration**: None.

### Requirement: Feed page header follows shared design system pattern
**Reason**: The page it describes no longer exists.
**Migration**: None.
