import { redirect } from 'next/navigation'

// Admin sign-in now happens through Clerk; admins land on user management
export default function AdminPage() {
  redirect('/admin/users')
}
