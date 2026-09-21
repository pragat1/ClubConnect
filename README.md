# Campus Connect Hub

Build a complete, production-ready full-stack web application called "Club Connect".

Club Connect is a college-exclusive platform that connects students with college clubs, events, activities, communities, and opportunities.

The initial college supported is:

Guru Nanak Dev Engineering College (GNDEC), Ludhiana, Punjab, India.

The application should be designed so that additional colleges can be added in the future without redesigning the database or authentication architecture.

IMPORTANT:
- Do NOT use demo data.
- Do NOT use fake clubs.
- Do NOT use fake events.
- Do NOT use placeholder names.
- Do NOT use lorem ipsum.
- Do NOT hardcode fake users, member counts, event counts, notifications, testimonials, or statistics.
- Do NOT display sample content just to make the UI look populated.
- All dynamic content must come from the database.
- If the database has no records, show a clean empty state explaining what the user can do.
- Do not create fake API responses.
- Do not create fake authentication.
- All important interactions should actually work.
- Use real database persistence.
- Do not leave buttons that do nothing.
- Every navigation item and CTA must lead somewhere meaningful.
- Keep the UI clean and submission-ready.

==================================================
1. TECHNOLOGY STACK
==================================================

Use:

Frontend:
- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- Lucide React icons

Backend:
- Supabase

Use Supabase for:
- Authentication
- PostgreSQL database
- Row Level Security
- User profiles
- Clubs
- Club memberships
- Events
- Event registrations
- Notifications
- User interests
- Premium status
- Roles
- Admin functionality

Use React Query where useful for server state.

Do not create a separate backend unless absolutely necessary.

==================================================
2. VISUAL DESIGN SYSTEM
==================================================

Create a modern, minimal, premium-looking college platform.

Overall visual direction:

- Clean white background
- Minimal use of gradients
- Teal as the primary brand color
- Warm coral/orange as a secondary accent
- Soft purple can be used sparingly
- Dark charcoal text
- Light gray borders
- Very subtle shadows
- Rounded cards
- Generous but controlled spacing
- Modern typography
- Professional rather than childish
- Avoid excessive glassmorphism
- Avoid excessive animations
- Avoid overly colorful backgrounds

Primary visual palette:

Primary:
Teal approximately #008080

Secondary:
Warm coral/orange approximately #FF7043

Background:
White / near-white

Text:
Dark charcoal

Muted text:
Neutral gray

Cards:
White with subtle border and shadow

The entire website should feel similar to a modern SaaS product combined with a university community platform.

Use Poppins or a similarly clean modern sans-serif font.

==================================================
3. GLOBAL NAVBAR
==================================================

Create a compact centered navbar.

The navbar should NOT span the entire screen.

Use a rounded/pill-shaped structure with a clean white/transparent appearance.

Left side:
- Club Connect logo
- "Club Connect" text

Center:
- Clubs
- Events
- Discover

Right:
- Small notification bell icon
- Sign In / Profile button

Do NOT include:
- LinkedIn
- Twitter
- Instagram

The notification bell should use the project's bell.png asset if available.

The navbar should:
- remain visually compact
- have subtle shadow
- have rounded corners
- work responsively
- collapse appropriately on mobile

Use the existing project logo asset if available.

Do not create a fake logo.

==================================================
4. HOME PAGE
==================================================

Create a polished landing page for Club Connect.

The homepage should immediately explain the purpose of the platform.

Hero section:

Headline:

"CONNECT. PARTICIPATE. GROW."

Supporting text:

"Discover college clubs, events and communities that match your interests."

Primary CTA:
"Explore Clubs"

Secondary CTA:
"Explore Events"

If the user is authenticated:
replace generic authentication CTA with:
"Go to Dashboard"

Hero design:
- White background
- Large typography
- Minimal abstract visual elements
- Clean campus/community-inspired illustration or visual
- No fake statistics
- No fake testimonials

Do not claim a number of users, clubs, events, or colleges unless the number is calculated from the database.

==================================================
5. HOMEPAGE FEATURES
==================================================

Create a feature section with three or four real platform capabilities.

Feature 1:
Club Discovery

"Find student clubs based on interests, categories and activities."

Feature 2:
Event Hub

"Discover upcoming college events and manage your event participation from one place."

Feature 3:
Personalized Discover

"Get club and event recommendations based on your interests."

Feature 4:
Student Community

"Build your campus profile through club participation and events."

These descriptions should reflect functionality actually implemented.

Do NOT mention "comprehensive calendar" or "personalized notifications" unless those features are actually implemented.

==================================================
6. COLLEGE SELECTION
==================================================

Create a dedicated college selection page.

Route:

/college

Heading:

"Choose Your College"

Show the currently supported institution:

Guru Nanak Dev Engineering College
Ludhiana, Punjab

Use the real GNDEC logo asset if available.

Do not show fake colleges.

The architecture should support adding more colleges later through the database.

After selecting the college:

Continue to authentication.

==================================================
7. AUTHENTICATION
==================================================

Create a real authentication system using Supabase Auth.

Authentication flow:

Step 1:
Choose college.

Step 2:
Sign In or Register.

For GNDEC:

Allowed college email format:

nameCRN@gndec.ac.in

The form should validate that the email belongs to:

@gndec.ac.in

Registration should collect:

- Full Name
- College ID / CRN
- College email
- Password
- Confirm password
- Branch / Department
- Academic year
- Interests

Do not store passwords manually.

Use Supabase authentication.

After registration:
- create a user profile in the profiles table
- associate the profile with GNDEC
- assign normal student role by default
- allow the user to select interests

After login:
redirect to the Dashboard.

Include:
- Forgot Password
- Sign Out
- Session persistence
- Authentication error handling
- Loading states

Do not create fake login credentials.

==================================================
8. USER PROFILE
==================================================

Create:

/profile

Profile should contain:

- Profile photo
- Full name
- College
- CRN
- Branch
- Academic year
- Interests
- Joined clubs
- Registered events
- Participation history
- Achievements

Allow the user to edit appropriate profile information.

CRN and college email should not be freely editable after registration without verification.

==================================================
9. DASHBOARD
==================================================

Create:

/dashboard

The dashboard should be personalized using actual database information.

Sections:

Welcome message:
"Welcome, [user's name]"

Upcoming registered events

Joined clubs

Recommended clubs

Recommended events

Recent notifications

Participation summary

If the user has no activity yet:

show useful empty states such as:

"You haven't joined any clubs yet."

CTA:
"Explore Clubs"

Do not populate empty sections with fake data.

==================================================
10. CLUBS PAGE
==================================================

Create:

/clubs

Display clubs retrieved from Supabase.

Each club card should contain:

- Club logo/image
- Club name
- Category
- Short description
- Actual member count
- Actual upcoming event count
- View Club button

Member and event counts must be calculated from database relationships.

Do not hardcode counts.

Include:
- Search
- Category filter
- Sorting if useful

Categories should come from actual club records or a controlled category list.

If no clubs exist:

Show:

"No clubs are available yet."

For authorized club administrators, provide a clear CTA to create/manage clubs.

==================================================
11. CLUB DETAILS PAGE
==================================================

Create dynamic route:

/clubs/:id

When a user clicks "View Club", display the complete club profile.

Sections:

Club header:
- Club image/logo
- Club name
- Category
- Description
- Member count

About:
- Full description
- Objectives
- Activities
- Contact information

Upcoming Events:
- Events created by this club
- Date
- Time
- Location
- Registration status

Membership:
- Join Club button

If already a member:
show:

"Joined"

and optionally:
"Leave Club"

Do not show Join Club repeatedly if the user is already a member.

Joining a club must create a real record in:

club_memberships

Require authentication before joining.

If unauthenticated:
redirect to authentication.

==================================================
12. EVENTS PAGE
==================================================

Create:

/events

Show actual events from Supabase.

Each EventCard should display:

- Event image
- Event title
- Club
- Date
- Time
- Location
- Event type
- Current registered attendees
- Registration status

Include:

Search bar:
Search by event title, club, category, or location.

Filters:
- Date
- Event type
- Club

Use actual database values.

Do not display old/sample dates.

Only show events according to their actual status.

Include:

"Calendar View"

button.

==================================================
13. EVENT DETAILS
==================================================

Create a dynamic event details page:

/events/:id

Display:

- Event banner
- Event title
- Organizing club
- Full description
- Date
- Time
- Location
- Capacity if defined
- Current registration count
- Registration deadline if defined
- Event category

Primary CTA:

"Register for Event"

After registration:

"Registered"

Allow cancellation if appropriate.

Prevent:
- duplicate registrations
- registration after deadline
- registration after capacity is reached

Store registrations in:

event_registrations

==================================================
14. CALENDAR VIEW
==================================================

Create:

/calendar

Build an actual interactive event calendar.

The calendar must use events from Supabase.

Do not hardcode event dates.

Requirements:

- Month navigation
- Date selection
- Event indicators
- Selected date event list
- Upcoming events
- Responsive layout

When a date containing events is selected:

show the actual events for that date.

Each event should link to its event details page.

If no event exists on the selected date:

"No events scheduled for this date."

Use the existing back.png asset instead of a text "Back to Events" button if the asset exists.

Keep the calendar centered and compact.

==================================================
15. DISCOVER PAGE
==================================================

Create:

/discover

This should be a real discovery and recommendation page.

Sections:

Trending Categories

Most Active Clubs

Recommended Clubs

Recommended Events

Recommendations must be based on actual data.

For authenticated users:
use their selected interests, joined clubs and registered events.

For unauthenticated users:
show general discovery based on actual database popularity/activity.

Do not use fake recommendation data.

If there is insufficient information:

show:

"Build your profile to get personalized recommendations."

CTA:
"Complete Profile"

==================================================
16. NOTIFICATION SYSTEM
==================================================

The navbar notification bell must be functional.

Create:

/notifications

Notifications should come from the database.

Possible real notification types:

- Event registration confirmation
- Event reminder
- Club membership confirmation
- New event from a joined club
- Event time/location update
- Club announcement
- Registration cancellation
- Important admin notification

Each notification should contain:

- Title
- Message
- Timestamp
- Read/unread state
- Optional link

The bell should show an unread count badge only when unread notifications actually exist.

Do not create fake notification counts.

Users should be able to:

- Mark notification as read
- Mark all as read
- Open linked content

==================================================
17. EVENT REMINDERS
==================================================

Implement event reminder functionality.

For registered events:

Users should receive an in-app notification before the event.

Do not claim push notifications unless actual browser push notification functionality is implemented.

At minimum implement:

- In-app reminders
- Notification center

If browser notifications are implemented, request permission properly.

==================================================
18. FREEMIUM MODEL
==================================================

Club Connect follows a freemium model.

FREE STUDENT FEATURES:

- Browse clubs
- Browse events
- Search and filter
- Join clubs
- Register for events
- Basic profile
- Basic calendar
- Basic notifications
- Basic recommendations

PREMIUM STUDENT FEATURES:

Create a premium architecture that can support:

1. Advanced personalized recommendations
2. Participation analytics
3. Advanced skill/achievement profile
4. Priority event registration
5. Advanced calendar features
6. Cross-club networking
7. Advanced participation history
8. Exportable activity/achievement profile

Premium features must be controlled through the user's subscription status.

Do not fake payment processing.

If payment integration is not configured, do not pretend that payment has occurred.

Instead, structure the application so Stripe or another payment provider can be integrated later.

Premium status should exist in the database.

==================================================
19. CLUB ADMIN SYSTEM
==================================================

Create role-based access control.

Roles:

student
club_admin
college_admin

Students:
- Browse
- Join clubs
- Register for events
- Manage profile

Club Admin:
- Manage their club
- Edit club information
- Create events
- Edit events
- View registrations
- Manage announcements
- View club activity

College Admin:
- Manage clubs
- Manage users
- Manage events
- Manage categories
- View platform analytics
- Manage reported content

Protect admin routes.

Do not rely only on frontend route hiding.

Use Supabase Row Level Security.

==================================================
20. CLUB ADMIN DASHBOARD
==================================================

Create:

/admin/club

Show actual database analytics:

- Total members
- Upcoming events
- Event registrations
- Attendance/participation if attendance tracking exists
- Recent activity

Allow:

Create Event
Edit Event
Delete Event
Create Announcement
Manage Members

Do not show fake analytics.

If there is no data:
show meaningful empty states.

==================================================
21. COLLEGE ADMIN DASHBOARD
==================================================

Create:

/admin

Dashboard sections:

- Total registered students
- Total clubs
- Total upcoming events
- Total registrations
- Most active clubs
- Event participation

All metrics must be calculated from Supabase.

Do not hardcode numbers.

Include management interfaces for:

Students
Clubs
Events
Categories
Announcements

==================================================
22. DATABASE STRUCTURE
==================================================

Create a normalized Supabase PostgreSQL database.

Suggested tables:

colleges
- id
- name
- city
- state
- domain
- logo_url
- created_at

profiles
- id
- full_name
- college_id
- crn
- email
- branch
- academic_year
- avatar_url
- bio
- role
- is_premium
- created_at
- updated_at

interests
- id
- name

user_interests
- user_id
- interest_id

clubs
- id
- college_id
- name
- category
- description
- full_description
- logo_url
- banner_url
- contact_email
- created_by
- created_at
- updated_at

club_memberships
- id
- club_id
- user_id
- joined_at
- status

events
- id
- club_id
- college_id
- title
- description
- event_type
- event_date
- start_time
- end_time
- location
- image_url
- capacity
- registration_deadline
- created_by
- created_at
- updated_at

event_registrations
- id
- event_id
- user_id
- registered_at
- status

notifications
- id
- user_id
- title
- message
- type
- link
- is_read
- created_at

announcements
- id
- club_id
- title
- content
- created_by
- created_at

subscriptions
- id
- user_id
- plan
- status
- start_date
- end_date
- provider
- provider_subscription_id
- created_at

==================================================
23. DATABASE SECURITY
==================================================

Implement Row Level Security.

Students should only be able to:

- Read public club information
- Read public event information
- Manage their own profile
- Manage their own memberships
- Manage their own event registrations
- Read/manage their own notifications

Club admins should only manage clubs/events they are authorized to manage.

College admins should have institution-level management access.

Never expose service-role keys in frontend code.

Never store passwords in the database manually.

==================================================
24. EMPTY STATES
==================================================

Because there must be NO demo data, create beautiful empty states.

Examples:

No clubs:

"No clubs have been added yet."

No events:

"No upcoming events."

No notifications:

"You're all caught up."

No joined clubs:

"You haven't joined any clubs yet."

No registrations:

"You haven't registered for any events yet."

No recommendations:

"Complete your profile to receive personalized recommendations."

Empty states should include useful CTAs.

==================================================
25. ERROR HANDLING
==================================================

Every database operation should have:

- Loading state
- Success state
- Error state

Use toast notifications for important actions.

Examples:

"Club joined successfully."

"Event registration successful."

"Unable to register for this event."

"Profile updated successfully."

Avoid exposing technical database errors directly to users.

==================================================
26. RESPONSIVE DESIGN
==================================================

The website must work properly on:

- Desktop
- Laptop
- Tablet
- Mobile

Navbar should collapse on mobile.

Cards should switch from multi-column layouts to one-column layouts.

Forms should remain usable on small screens.

Calendar should remain readable on mobile.

==================================================
27. ACCESSIBILITY
==================================================

Implement:

- Semantic HTML
- Accessible buttons
- Proper labels
- Alt text for real images
- Keyboard navigation
- Visible focus states
- Sufficient color contrast
- Accessible dialogs
- Accessible form errors

Do not rely only on color to communicate status.

==================================================
28. ANIMATIONS
==================================================

Use subtle animations only.

Allowed:

- Card hover
- Button hover
- Small scale effects
- Fade-in sections
- Smooth transitions

Avoid:

- Excessive animations
- Large moving backgrounds
- Distracting particles
- Auto-playing animations
- Heavy parallax

The application should remain professional and fast.

==================================================
29. REAL DATA POLICY
==================================================

THIS IS CRITICAL.

Do NOT seed the database with:

- fake clubs
- fake students
- fake events
- fake registrations
- fake notifications
- fake testimonials
- fake statistics

The application should initially be empty except for the actual college record:

Guru Nanak Dev Engineering College.

Create proper admin functionality so real clubs and events can be entered.

If an administrator has not created any clubs/events yet, the UI must show an empty state.

==================================================
30. ASSETS
==================================================

Use existing project assets wherever available.

Expected assets may include:

- logo.png
- bell.png
- back.png
- GNDEC logo
- other provided official assets

Do not replace existing assets with random logos.

Do not create a fake GNDEC logo.

If an image is missing, use a clean icon-based layout rather than a random stock image.

==================================================
31. ROUTING
==================================================

Implement these routes:

/
 /college
 /auth
 /dashboard
 /profile
 /clubs
 /clubs/:id
 /events
 /events/:id
 /calendar
 /discover
 /notifications
 /admin
 /admin/club

Create a proper 404 page.

Protected routes should redirect unauthenticated users to authentication.

==================================================
32. NAVIGATION BEHAVIOR
==================================================

Navbar:

Logo → /
Clubs → /clubs
Events → /events
Discover → /discover
Bell → /notifications
Sign In → /college or /dashboard depending on authentication state

Club card:

View Club → /clubs/:id

Event card:

View Event → /events/:id

Calendar:

Event → /events/:id

Do not leave any navigation button non-functional.

==================================================
33. SEARCH FUNCTIONALITY
==================================================

Clubs search:

Search:
- club name
- category
- description

Events search:

Search:
- event title
- club
- event type
- location

Search results must query actual database records.

Show a useful empty state when no results are found.

==================================================
34. RECOMMENDATION LOGIC
==================================================

For authenticated users:

Use:

- selected interests
- joined clubs
- registered events
- branch
- academic year

to calculate simple recommendations.

Do not use an AI API unless necessary.

Start with transparent rule-based recommendations.

Example:

If a user selects "Technology":
show clubs/events categorized as Technology.

If a user joins a club:
prioritize events from that club.

If a user frequently registers for a category:
prioritize that category.

The system should remain explainable.

==================================================
35. PREMIUM UI
==================================================

Create a premium section accessible from the user's dashboard/profile.

Show:

"Club Connect Premium"

Explain the actual premium capabilities.

Use a clean comparison:

Free
vs
Premium

Do not show fake discounts or fake payment success.

If payments are not configured:
show the premium feature information and a controlled "Upgrade" flow that clearly states payment integration is not yet configured, rather than pretending a subscription was purchased.

==================================================
36. PERFORMANCE
==================================================

Optimize:

- Images
- Database queries
- React rendering
- API calls
- Mobile performance

Use lazy loading where appropriate.

Avoid unnecessary database requests.

Use React Query caching where useful.

==================================================
37. FINAL QUALITY REQUIREMENT
==================================================

The final website should feel like a real college technology platform, not a template or prototype.

Prioritize:

1. Functional authentication
2. Real database
3. Real clubs
4. Real events
5. Real event registration
6. Real club membership
7. Real calendar
8. Real notifications
9. Personalized dashboard
10. Secure role-based administration
11. Clean responsive UI
12. Freemium-ready architecture

Before finishing, verify that:

- No demo data exists.
- No lorem ipsum exists.
- No placeholder cards exist.
- No dead buttons exist.
- No fake statistics exist.
- Authentication works.
- Database operations work.
- Club joining works.
- Event registration works.
- Calendar uses database events.
- Notifications use database records.
- Navbar links work.
- Protected routes are protected.
- RLS policies are implemented.
- Mobile layout works.
- Empty states work.

Build the application incrementally, but ensure every completed feature is actually functional rather than visually mocked.                                                                                                    name of the project : club connect

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7ad71e8d-e66d-4144-b1cc-48fff1c7fe7b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
