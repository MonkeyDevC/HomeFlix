import { redirect } from "next/navigation";

export default function LoginPage() {
  redirect("/auth/login?next=%2F");
}
