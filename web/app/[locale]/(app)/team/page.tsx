import { redirect } from "next/navigation";

/** The old team panel's address; everything moved to the admin panel. */
export default function TeamRedirect() {
  redirect("/admin");
}
