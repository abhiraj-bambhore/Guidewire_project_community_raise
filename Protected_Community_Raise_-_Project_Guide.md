Protected Community Raise: Project Guide

1\. Problem statement

Imagine your favorite cafe needs 50 lakh rupees to open another outlet. Instead of going to a bank, what if its own customers funded it? Sounds crazy, but abroad, there's a company called Honeycomb Credit that helps local businesses raise money from their communities.

Now imagine this in India. Your favorite cafe says, guys, we're opening another outlet. We need 50 lakh. 500 loyal customers invest 10,000 rupees each. Done. The cafe gets funding. Customers get a financial stake depending on the investment structure. And imagine the loyalty after that. Your friend says, bro, let's go to Starbucks. Excuse me, I have invested 10,000 rupees in that cafe downstairs. We are going there.

And this isn't just cafes, gyms, bakeries, salons, restaurants. Imagine your gym needs new equipment. Instead of complaining about the broken treadmill, you help fund the new one. The platform could earn fees for arranging compliant financing. Obviously, this needs proper financial regulations, investor protections, and risk disclosures

2\. The problem in easy words

Funding a local business from its own customers is a good idea. But it has one big weakness: the customers can lose their money.

What if the new outlet has a fire? What if it stays closed for months? What if the main equipment breaks down? Then 500 people who trusted their favorite cafe could lose their savings, and the loyalty turns into anger.

There is a second problem. Many things happen at the same time: money coming in, an insurance policy, premium payments, and claims. If even one of these does not match the others, someone loses money or trust, and nobody notices until it is too late.

So the real problem is simple: how do we let a community fund a local business and still keep the money protected and the records honest?

3\. Our solution in easy words

We add a safety layer to every campaign. The moment a campaign starts, the outlet gets an insurance package. The platform then checks the whole system again and again, to make sure money, policy and claims always agree with each other.

The platform has three jobs:

1.  Run the campaign (collect money from many people and hold it safely).

2.  Insure the outlet (policy, premium and claims) using a Guidewire-style insurance system.

3.  Check that everything is consistent (a checker that catches mistakes).

4\. What Guidewire does here

Guidewire is software that insurance companies use. It has three main parts. We use all three.

| **Guidewire part** | **Plain meaning**                      | **What it does in our project**                                   |
|--------------------|----------------------------------------|-------------------------------------------------------------------|
| PolicyCenter       | Creates and manages insurance policies | Gives a quote and issues a policy for each campaign's outlet      |
| BillingCenter      | Handles premium payments               | Sends the premium invoice and records the payment                 |
| ClaimCenter        | Handles claims                         | Opens a claim if the outlet has a loss and records claim payments |

Guidewire does not collect investor money and does not pay investors their share. That part is done by our own platform.

How the insurance is decided

The premium is the price of the insurance. It depends on how much is insured, the type of outlet and the city. Two things make it higher: 20 percent extra if the outlet has no fire safety certificate, and 10 percent extra if the outlet is larger than 2000 square feet. This is only an example for the project, not real insurance pricing.

| **Outlet type** | **Base premium rate** |
|-----------------|-----------------------|
| Cafe            | 0.35 percent          |
| Gym             | 0.45 percent          |
| Bakery          | 0.55 percent          |
| Salon           | 0.30 percent          |
| Restaurant      | 0.60 percent          |

Rules for approval:

- Decline if the outlet type is not supported.

- Send for manual review if there is no fire safety certificate and the insured amount is above 25 lakh rupees.

- Otherwise approve.

Default cover: fire and special perils, business interruption, equipment breakdown and public liability.

5\. Two honest points before you start

**Point 1: Real Guidewire access.** Real Guidewire needs a licence and a practice setup, which usually comes only through a course or an employer. So build a practice version of Guidewire that copies the style of PolicyCenter, BillingCenter and ClaimCenter (same ideas, same events). If your course gives a real setup, you only swap the practice version for the real one. The rest of the project stays the same.

**Point 2: Law.** In India, raising equity money from the public is not clearly permitted, and securities rules are strict. So this project is a simulation with fake money. No real payments are made and no real returns are promised. Show a risk disclosure on every campaign page. Before any real launch, talk to a lawyer.

6\. Block diagram (simple view)

<img src="md_assets/media/0486bbe5cd68e90fb03614a559b336aff7f183bb.png" title="Block diagram of the platform" style="width:6in;height:3.71875in" alt="Block diagram of the platform" />

*Block diagram: five blocks*

The website talks only to the campaign platform. The platform saves records, asks the insurance system for policy details, and the safety checker reads both sides to catch any mismatch.

7\. How a campaign works

<img src="md_assets/media/666e3317a56ed99bf5d0f311958c0e964e13a91c.png" title="Campaign flow diagram" style="width:6in;height:3.60417in" alt="Campaign flow diagram" />

*Campaign flow: from Draft to Active*

Step by step:

1.  **Draft:** The merchant fills in outlet details and the target amount.

2.  **Underwriting:** The platform asks PolicyCenter for a quote. The rules decide approve, review or decline.

3.  **Live:** The campaign is open. Investors put in money (fake) and it is held safely.

4.  **Funded:** The target is reached before the deadline. The policy is issued and BillingCenter sends the first premium invoice.

5.  **Active:** The first premium is paid, so money goes to the merchant in parts (for example 50 percent now, 25 percent at opening and 25 percent after 3 months).

6.  **Under Claim:** A claim is opened in ClaimCenter. Investors are told. The claim payment goes to the safe holding account, not to the merchant.

7.  **Failed:** The target is not reached by the deadline. All money is refunded.

8.  **Paused:** The policy is cancelled or has lapsed. No more money is released until it is fixed.

9.  **Declined:** The insurer refuses the outlet, so the campaign never goes live.

8\. The safety checker (the unique part)

After every important event, and again in a full check every few minutes, the checker runs the rules below. If a rule fails, it records the problem and shows a red banner on the audit page.

| **Rule** | **Plain meaning**                                                                                                |
|----------|------------------------------------------------------------------------------------------------------------------|
| Rule 1   | The total of confirmed investments equals the total money received in the safe holding account for that campaign |
| Rule 2   | A campaign that is Funded or Active must have a policy that is in force                                          |
| Rule 3   | No money is released to the merchant unless the first premium invoice is paid                                    |
| Rule 4   | Every claim payment goes to the person named on the policy, which is the safe holding account                    |
| Rule 5   | If a policy is cancelled or lapsed, the campaign must be Paused                                                  |
| Rule 6   | Money held, money released and money refunded add up to the total invested                                       |
| Rule 7   | No investment is above the allowed limit, and the total raised is never above the target                         |
| Rule 8   | A Failed campaign has every investment refunded                                                                  |

For the demo, add a button called "Inject fault" that breaks one rule on purpose (for example, deleting a money entry) so you can show the checker catching it.

9\. Website pages

Style: clean white or light grey, lots of space, rounded cards, one accent colour, simple words, no emojis.

1.  **Campaigns list:** cards with name, outlet type, progress bar, amount raised, days left and a small "Insured" tag.

2.  **Campaign detail:** story, progress, coverage summary (what is insured and for how much), risk disclosure box, invest form and timeline.

3.  **My investments:** list with status (Funding, Active, Under Claim, Refunded).

4.  **Merchant dashboard:** create a campaign, see the underwriting result, see money released in parts, and trigger "Simulate loss".

5.  **Audit page:** event timeline and rule checks (green ticks or red warnings).

Risk disclosure text (put on every campaign page)

> "This is a simulation for learning. No real money is involved. In a real launch, investing in a local business can result in loss of the full amount. Insurance reduces some risks but does not guarantee returns. Past performance does not predict future results."

10\. Demo script (5 minutes)

1.  Merchant "Brew House" creates a 50 lakh campaign. Underwriting approves it with a quote.

2.  Investors put in fake money. The progress bar fills. Show that the campaign can never be overfunded.

3.  The target is reached. The policy is issued, the invoice is paid and the first part of the money is released.

4.  Click "Simulate loss". A claim opens, investors are told and the campaign shows Under Claim.

5.  Click "Inject fault". The checker shows a red rule violation. Fix it and show it turn green.

6.  Close with the risk disclosure and the real-world legal note.

11\. Later improvements (optional)

- Swap the practice version for a real Guidewire setup if your course provides one.

- Add revenue-share payouts to investors in your own records.

- Add flood or fire risk data from open sources into the quote rules.

- Add a legal structure page describing options after talking to a lawyer.
