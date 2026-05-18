# FreshCart Grocery Shopping List

A simple, clean, and minimal grocery shopping list application designed for speed and ease of use.

## Features

- **Add Items**: Quickly add grocery items with optional notes and quantities.
- **Edit Items**: Modify existing items easily.
- **Mark as Completed**: Check off items as you shop.
- **Delete Items**: Remove items individually.
- **Clear Completed**: One-click cleanup for all bought items.
- **Sorting**: Organize your list by priority (pending first), newest, oldest, or alphabetically.
- **Data Persistence**: Your list is automatically saved to your browser's local storage.
- **Responsive Design**: Works beautifully on both desktop and mobile devices.
- **Visual Feedback**: smooth animations and distinct styles for completed items.

## Built With

- **React + TypeScript**
- **Tailwind CSS**
- **Supabase** (Auth, Database, Realtime)
- **Framer Motion** for animations
- **Lucide React** for icons

## Supabase Setup (Required)

To make the app work, you need to set up your Supabase project as follows:

### 1. Database Table

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create grocery_items table with standard snake_case
create table grocery_items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  note text,
  quantity int default 1,
  is_completed boolean default false,
  is_archived boolean default false,
  created_at bigint not null,
  user_id uuid references auth.users(id)
);

-- Enable Realtime for the new table
alter publication supabase_realtime add table grocery_items;

-- Enable RLS (Row Level Security)
alter table grocery_items enable row level security;

-- Create policy for family sharing
create policy "Authenticated users can manage all items" 
on public.grocery_items for all 
to authenticated 
using (true)
with check (true);
```

### 2. Row Level Security (RLS)

For a shared family list where everyone sees the same items:
1. Go to **Authentication > Policies**.
2. For `grocery_items`, create a policy: "Enable read/write for authenticated users".
3. SQL: `CREATE POLICY "Any authenticated user can do everything" ON public.grocery_items FOR ALL TO authenticated USING (true);`

*Note: Item completion history (suggestions) is stored locally on each device to maintain individual typing habits.*

### 3. Environment Variables

Set these in your AI Studio Secrets or `.env`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 4. User Accounts

Create 3 user accounts for your family members in the **Authentication > Users** section of the Supabase dashboard.

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Start the development server**:
    ```bash
    npm run dev
    ```
3.  **Build for production**:
    ```bash
    npm run build
    ```

## Deployment
### 1. Push to GitHub
1. Create a new repository on [GitHub](https://github.com/new).
2. Open your terminal in the project folder.
3. Initialize git and push:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

### 2. Deploy to Vercel
1. Go to [Vercel](https://vercel.com/new).
2. Connect your GitHub account and import your new repository.
3. In the "Environment Variables" section, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**.

## PWA (iPhone Support)
This app is PWA-ready. To install on iPhone:
1. Open the app URL in **Safari**.
2. Tap the **Share** button (box with upward arrow).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add**.

## Usage Tips

- Click the checkbox or the item name to toggle completion.
- Hover over an item (on desktop) to reveal the edit and delete actions.
- Use the sort menu to change the organization of your list.
- On mobile, a progress bar appears at the bottom to show how much of your shopping is done.
