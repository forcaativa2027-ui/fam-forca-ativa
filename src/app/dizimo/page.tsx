import { redirect } from "next/navigation";

// A página antiga de Dízimo (baseada em churches.pix_key) foi aposentada.
// O "Momento da Generosidade" oficial (church_giving_info) vive na Home.
export default function DizimoPage() {
  redirect("/?tab=inicio");
}
