"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils/date";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserCreditTransactions } from "@/features/stripe/hooks";
import { useSessionUser } from "@/features/auth/hooks";

export function CreditsSection() {
  const router = useRouter();
  const { data: credits, isLoading, error } = useUserCreditTransactions(1, 5);
  const { data: user } = useSessionUser();

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credits : {user.credits}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            className="cursor-pointer"
            variant="outline"
            size="sm"
            onClick={() => router.push("/purchases/credits")}
          >
            Full history
          </Button>
          <Link href="/pricing#credits">
            <Button className="cursor-pointer" size="sm">
              Buy more credits
            </Button>
          </Link>
        </div>
        <Table>
          <TableCaption>Recent transactions.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Before</TableHead>
              <TableHead>After</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {credits?.items?.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-sm">
                  {formatDate(row.createdAt as any)}
                </TableCell>
                <TableCell className="text-sm">{row.balanceBefore}</TableCell>
                <TableCell className="text-sm">{row.balanceAfter}</TableCell>
                <TableCell className="text-sm">{row.amount}</TableCell>
                <TableCell className="text-sm">{row.type}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
