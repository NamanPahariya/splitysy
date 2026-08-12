## User story

As a member of a group, I want one number telling me whether I am owed money or owe it, and the shortest list of settlements that would bring every balance in the group to zero, so that we can settle up without anyone doing arithmetic.

## Acceptance criteria

### AC-1

Given I belong to a group with recorded expenses
When I view my balance for that group
Then I see one number that tells me either how much I am owed, how much I owe, or that I am settled up

### AC-2

Given every expense recorded in a group
When the balance of every member of that group is added together
Then the total is exactly zero

### AC-3

Given a group has no recorded expenses
When I view my balance for that group
Then I see that I am settled up, owing nothing and owed nothing

### AC-4

Given a group has no recorded expenses
When I view the settle-up list for that group
Then I see that no settlements are needed

### AC-5

Given a group whose members' balances are not all zero
When I view the settle-up list for that group
Then I see a list of settlements, each naming one member who pays, one member who receives, and an amount

### AC-6

Given I view the settle-up list for a group
When every settlement in that list is carried out
Then every member of the group ends with a balance of exactly zero

### AC-7

Given a group whose balances are not all zero
When the settle-up list for that group is built
Then it is built by repeatedly matching whichever member is owed the most against whichever member owes the most, recording one settlement between them, and continuing until every balance is zero

### AC-8

Given two or more members are tied for owing, or tied for being owed, the largest amount at some point while the settle-up list is being built
When that list is built
Then the member among those tied who joined the group earliest is matched first

### AC-9

Given a group's balances have not changed
When I view its settle-up list more than once
Then I see the same settlements, in the same order, every time

### AC-10

Given a member's balance is exactly zero
When I view the settle-up list for their group
Then that member does not appear as paying or receiving in any settlement

### AC-11

Given the same expense has been recorded more than once with identical details
When balances are worked out for the group
Then each recorded expense is included separately in the balance of every member it involves

### AC-12

Given a member's balance is a positive amount
When they view their balance
Then they see that they are owed that amount, not only a positive number

### AC-13

Given a member's balance is a negative amount
When they view their balance
Then they see that they owe that amount, not only a negative number

### AC-14

Given every amount involved is in INR
When a member's balance or a settlement amount is shown
Then it is shown to the nearest paisa, and no rupee is lost or added across every member's balance combined

### AC-15

Given I do not belong to a group
When I try to view its balances or its settle-up list
Then I cannot view them

### AC-16

Given a member has left a group while still owing money or being owed money from expenses recorded while they were a member
When I view the settle-up list for that group
Then that member still appears as paying or receiving until their balance reaches zero

## Out of scope

- Recording a settlement or repayment as an action that changes balances
- Editing or deleting a recorded expense
- Marking a suggested settlement as paid, undoing it, or otherwise recording that it happened
- Reminding, notifying, or messaging members about their balance or the settle-up list
- Interest, fees, or currency conversion applied to a balance
- Viewing balances or a settle-up list as they stood at some past point in time
- Splitting a suggested settlement into smaller payments, or otherwise partially settling it
- Showing a member a breakdown of who they owe or are owed by beyond the one balance number and the group's settle-up list
- Limiting balances to a time window or billing period — every expense ever recorded in the group counts

## Open questions

- ~~Answered: When multiple equally-short settle-up lists are possible, the list is built by repeatedly matching whoever is owed the most against whoever owes the most, breaking ties by who joined the group earliest.~~
- ~~Answered: A member sees only the one balance number and the group's settle-up list; no separate per-member breakdown is shown.~~
- ~~Answered: A member who has left a group still appears in balances and the settle-up list until their balance reaches zero.~~
- ~~Answered: Balances are worked out from every expense ever recorded in the group, with no time window.~~

## Done means

- A member can look at a group and immediately tell whether they are owed money, owe money, or are settled up, and by how much.
- A member can see a list of who should pay whom, and how much, to bring everyone in the group to zero.
- Carrying out every settlement in that list leaves every member of the group exactly settled up, with nothing left over or missing.
- A group with no recorded expenses shows every member settled up and no settlements needed.
- The settle-up list shown is never longer than the fixed rule for building it requires, and is built the same deterministic way every time.
- Two people looking at the same group's settle-up list at the same time see the exact same list, in the same order.
