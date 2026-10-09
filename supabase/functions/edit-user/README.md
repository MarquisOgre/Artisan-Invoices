This function is an admin-only endpoint for editing existing users.

Request JSON:
- userId: UUID of the target Auth user
- username: 3-30 characters using letters, numbers, dot, dash, underscore
- email: target email address
- role: "admin" or "user"

It updates Auth email and user_metadata.username, then upserts public.user_login_names and updates public.user_roles. Deploy with the Supabase CLI alongside the frontend edit action.