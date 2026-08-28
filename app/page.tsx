import { redirect } from "next/navigation";

/** The lab lives at /lab/good-tools-bad-tools so this app's routes line up
 *  with eleganceai.ai/lab/<slug>. The root just forwards there. */
export default function Home() {
  redirect("/lab/good-tools-bad-tools");
}
