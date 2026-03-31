import { redirect } from "@/navigation";

export default function DashboardPage({
  params,
}: {
  params: { locale: string };
}) {
  redirect({ href: "/dashboard/buyurtmalar", locale: params.locale });
}
