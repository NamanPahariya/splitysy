## User story

As a signed-in person, I want to create groups and manage their members, so that I can organise the people with whom I share costs.

## Acceptance criteria

### AC-1

Given I am signed in
When I create a group with a name containing at least one non-whitespace character
Then I see the new group among the groups I belong to and I am a member of it

### AC-2

Given I am signed in
When I try to create a group with an empty or whitespace-only name
Then the group is not created and I am told that a group name is required

### AC-3

Given I belong to a group and another person has an account
When I add that person using their email address with any capitalisation
Then that person becomes a member and both of us see the group among the groups we belong to

### AC-4

Given I belong to a group
When I try to add an email address that has no account
Then nobody is added and I see “No account exists for that email address.”

### AC-5

Given a person is already a member of my group
When I try to add that person again using their email address with any capitalisation
Then no duplicate member is added and I see “This person is already a member of the group.”

### AC-6

Given I am a current member of a group I did not create
When I add another account holder using their email address
Then that person becomes a member

### AC-7

Given I belong to no groups
When I view my groups
Then I see that I do not belong to any groups and can choose to create one

### AC-8

Given I belong to one or more groups
When I view my groups
Then I see every group I belong to and do not see groups I do not belong to

### AC-9

Given I belong to a group
When I view that group
Then I see its name and every current member

### AC-10

Given a group already has a name
When I create another group with the same name
Then the new group is created and both groups appear among the groups I belong to

### AC-11

Given I belong to a group with at least one other member
When I leave the group
Then I no longer see it among the groups I belong to and I am no longer shown as a member

### AC-12

Given I created a group with at least one other member
When I leave the group
Then I no longer see or control the group while its remaining members continue to see it

### AC-13

Given I am the final member of a group
When I leave the group
Then the empty group is deleted and no longer exists

### AC-14

Given I did not create a group
When I view that group
Then I cannot delete it

### AC-15

Given I created a group
When I delete the group
Then it immediately disappears from every member’s groups and no longer exists

## Out of scope

- Recording expenses, shares, balances, settlements, or any other money
- Money amounts, rounding, zero amounts, and negative amounts
- Inviting a person who does not already have an account
- Renaming a group
- Removing another member from a group
- Restoring a group after it has been deleted

## Open questions

- ~~Answered: Email matching ignores capitalisation.~~
- ~~Answered: An email address with no account shows “No account exists for that email address.”~~
- ~~Answered: Adding an existing member again shows “This person is already a member of the group.”~~
- ~~Answered: Different groups may share a name, but a group name cannot be empty or only whitespace.~~
- ~~Answered: Every current member may add other members.~~
- ~~Answered: Only the person who created a group may delete it.~~
- ~~Answered: Deleting a group removes it from every member immediately.~~
- ~~Answered: The person who created a group may leave while another member remains and loses continuing control.~~
- ~~Answered: The group is deleted automatically when its final member leaves.~~

## Done means

- A signed-in person can create a named group and see themselves as a member.
- Any current member can add another account holder by email address and both people can see the group.
- A person can see all groups they belong to, including a clear message when there are none.
- A person can view the current members of a group they belong to.
- A member can leave a group, and only its creator can delete it for everyone.
