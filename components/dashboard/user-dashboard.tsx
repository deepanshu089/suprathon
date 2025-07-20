"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormItem, FormControl } from '@/components/ui/form';
import { UserList } from '@/components/dashboard/user-list';
import { UserType } from '@/types/user';
import { fetchUsers } from '@/lib/api';
import { Loader2, Plus, Search } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

type SearchFormValues = {
  searchQuery: string;
};

export default function UserDashboard() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SearchFormValues>({
    defaultValues: {
      searchQuery: '',
    },
  });

  useEffect(() => {
    const getUsers = async () => {
      try {
        setIsLoading(true);
        const data = await fetchUsers();
        setUsers(data);
        setFilteredUsers(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch users. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    getUsers();
  }, []);

  useEffect(() => {
    const searchQuery = form.watch('searchQuery');
    
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(query) || 
      user.address.city.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }, [form.watch('searchQuery'), users]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">User Management</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/dashboard/add" passHref>
              <Button className="gap-2">
                <Plus size={16} />
                Add User
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <Form {...form}>
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage your users and their information.
              </CardDescription>
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <FormField
                  control={form.control}
                  name="searchQuery"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="Search by name or city..."
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-60">
                  <Loader2 className="animate-spin h-8 w-8 text-primary" />
                  <span className="ml-2">Loading users...</span>
                </div>
              ) : error ? (
                <div className="text-center p-8 text-destructive">
                  <p>{error}</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <UserList users={filteredUsers} />
              )}
            </CardContent>
          </Card>
        </Form>
      </main>
    </div>
  );
}