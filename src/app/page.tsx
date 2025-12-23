import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to signin page since other landing pages are removed
  redirect('/signin');
}
