"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, PlusCircle } from "lucide-react";

export default function GroupsPage() {
  return (
    <AppShell 
      title="Student Groups" 
      subtitle="Organize your students into classes and sections."
      actions={
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      }
    >
      <div className="grid gap-6">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active Classes</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Active Groups</CardTitle>
                <CardDescription>
                  Manage your current academic year student groups.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex items-center gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search groups..." className="pl-9 h-10" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Mock Groups */}
                  {[
                    { name: "Grade 10 Science", students: 32, id: 1 },
                    { name: "Grade 9 Mathematics", students: 28, id: 2 },
                    { name: "Grade 11 Physics", students: 24, id: 3 },
                  ].map((group) => (
                    <Card key={group.id} className="overflow-hidden">
                      <div className="bg-muted p-4 flex items-center gap-3 border-b">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-semibold">{group.name}</h3>
                      </div>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {group.students} Students
                        </div>
                        <Button variant="outline" size="sm">Manage</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="archived">
            <Card>
              <CardHeader>
                <CardTitle>Archived Groups</CardTitle>
                <CardDescription>
                  Past academic year groups.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-12 text-center text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 opacity-20 mb-4" />
                  <p>No archived groups found.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
