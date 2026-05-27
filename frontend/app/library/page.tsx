"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, MoreHorizontal, Search, Settings2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listAssignmentsRequest } from "@/services/api";
import { useAssignmentStore } from "@/store/assignmentStore";
import { isDemoMode } from "@/lib/env";
import type { Assignment } from "@/types/assignment";

export default function LibraryPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const localAssignments = useAssignmentStore((state) => state.assignments);

  useEffect(() => {
    if (isDemoMode) {
      setAssignments(localAssignments);
      setLoading(false);
      return;
    }

    listAssignmentsRequest()
      .then((data) => {
        setAssignments(data);
      })
      .catch((err) => {
        console.error("Failed to load assignments", err);
        setAssignments(localAssignments); // Fallback
      })
      .finally(() => {
        setLoading(false);
      });
  }, [localAssignments]);

  return (
    <AppShell 
      title="My Library" 
      subtitle="Manage and view your generated assessments and drafts."
      actions={
        <Link href="/create">
          <Button>Create Assessment</Button>
        </Link>
      }
    >
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Assessments</CardTitle>
            <CardDescription>A list of your recent assignment generations.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search assignments..." className="pl-9 h-10" />
              </div>
              <Button variant="outline" size="sm" className="h-10">
                <Settings2 className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : assignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No assignments found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {assignment.title}
                          </div>
                        </TableCell>
                        <TableCell>{assignment.subject}</TableCell>
                        <TableCell>{assignment.grade}</TableCell>
                        <TableCell>
                          <StatusBadge status={assignment.status as any} />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(assignment.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={assignment.status === "completed" ? `/assignments/${assignment.id}/paper` : `/generate/${assignment.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
