## User story

As a member, I want to record that someone paid for something and say exactly how the cost should be divided, so that the group's numbers match what actually happened rather than an approximation of it.

## Acceptance criteria

### AC-1

Given I belong to a group
When I record a valid expense with one payer, a description, a date, a total amount, and at least one participant
Then I see the expense with its payer, description, date, total amount, participants, and final shares

### AC-2

Given I am dividing an expense equally among its participants
When I review the division
Then I see a final share for every participant and the shares add up exactly to the total amount

### AC-3

Given I am dividing an expense by exact amounts
When the participants' shares add up exactly to the total amount
Then I can record the expense without any amount being added, removed, or changed

### AC-4

Given I am dividing an expense by percentages
When the participants' percentages total 100 percent
Then I see each participant's final share and the shares add up exactly to the total amount

### AC-5

Given an equal or percentage division leaves paise that cannot be divided evenly
When the final shares are calculated
Then one leftover paisa at a time is assigned in the displayed participant order until the shares equal the total amount

### AC-6

Given I have chosen equal shares, exact amounts, or percentages
When I am ready to record the expense
Then I see every final share before I confirm it

### AC-7

Given I am dividing an expense by exact amounts
When the participants' shares do not add up exactly to the total amount
Then the expense is not recorded and I am told that the shares must equal the total amount

### AC-8

Given I am recording an expense
When I enter a total of zero, a negative total, or a negative share
Then the expense is not recorded and I am told that amounts must be greater than zero and shares cannot be negative

### AC-9

Given I am recording an expense
When I enter an amount in INR
Then the expense and every final share are shown to the nearest paisa without losing or adding any money

### AC-10

Given I belong to a group with other members
When I record an expense paid by another current member
Then that member is the expense's only payer

### AC-11

Given I am recording an expense for a group
When I choose a payer or participant
Then I can choose only from the group's current members

### AC-12

Given a member is the payer of an expense
When I also include that member as a participant
Then I can record the expense

### AC-13

Given a participant is already included in an expense
When I try to include that participant again
Then the participant is not added again and I see “This participant is already included.”

### AC-14

Given I enter an expense description with surrounding whitespace and between 1 and 120 characters after trimming
When I record the expense
Then the expense shows the description without the surrounding whitespace

### AC-15

Given I enter a blank description or a description longer than 120 characters after trimming
When I try to record the expense
Then the expense is not recorded and I am told that the description must contain between 1 and 120 characters

### AC-16

Given I am recording an expense
When I do not change its date
Then the expense date is today

### AC-17

Given I am recording an expense
When I choose today or a past date
Then I can record the expense with that date

### AC-18

Given I am recording an expense
When I choose a future date
Then the expense is not recorded and I am told that its date cannot be in the future

### AC-19

Given an identical expense has already been recorded
When I record another expense with the same group, payer, description, date, amount, participants, and shares
Then the new expense is recorded without a duplicate warning

### AC-20

Given a group has no recorded expenses
When I view its expenses
Then I see that no expenses have been recorded and can choose to record one

### AC-21

Given I do not belong to a group
When I try to record or view an expense for that group
Then I cannot record or view it

## Out of scope

- Calculating balances or suggesting how members should settle up
- Recording settlements
- Attaching receipts or other files to an expense
- Deleting or correcting a recorded expense
- Dividing an expense by weighted shares
- Recording refunds or other negative amounts
- Recording more than one payer on a single expense
- Warning about otherwise identical expenses

## Open questions

- ~~Answered: Version 1 includes equal shares, exact amounts, and percentages; weighted shares are out of scope.~~
- ~~Answered: Amounts use INR and are calculated to the nearest paisa.~~
- ~~Answered: Leftover paise are assigned one at a time in displayed participant order, and final shares are shown before recording.~~
- ~~Answered: Expense totals must be greater than zero.~~
- ~~Answered: Negative totals and shares are out of scope.~~
- ~~Answered: A participant cannot be included twice; the message is “This participant is already included.”~~
- ~~Answered: Version 1 does not warn about otherwise identical expenses.~~
- ~~Answered: A trimmed description between 1 and 120 characters is required.~~
- ~~Answered: A date is required, defaults to today, may be in the past, and cannot be in the future.~~
- ~~Answered: Each expense has exactly one payer.~~
- ~~Answered: The payer may also be a participant.~~

## Done means

- A group member can record one payer, a description, a date, an INR total, and the participants in an expense.
- A group member can divide an expense equally, by exact amounts, or by percentages and review the final shares before recording it.
- Every recorded expense's shares add up to its total exactly, including when leftover paise must be distributed.
- Invalid descriptions, future dates, duplicate participants, zero totals, and negative amounts are refused with clear explanations.
- A recorded expense shows its payer, description, date, total, participants, and final shares.
