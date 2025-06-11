import { createClient } from '@/utils/supabase/server_new'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

// Function to determine badge variant based on status
const getBadgeVariant = (status: string) => {
  switch (status) {
    case 'approved':
      return 'success'
    case 'pending_verification':
      return 'secondary'
    case 'rejected':
      return 'destructive'
    default:
      return 'outline'
  }
}

interface Application {
  id: string
  created_at: string
  status: string
  profiles:
    | {
        first_name: string | null
        last_name: string | null
        email: string | null
      }[]
    | null
}

async function getWasherApplications(): Promise<Application[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('washer_applications')
    .select(
      `
      id,
      created_at,
      status,
      profiles (
        first_name,
        last_name,
        email
      )
    `
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching washer applications:', error)
    return []
  }
  return data
}

export default async function AdminWashersPage() {
  const applications = await getWasherApplications()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Washer Applications</CardTitle>
        <CardDescription>
          View and manage all washer applications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Submitted On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications && applications.length > 0 ? (
              applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    {app.profiles?.[0]?.first_name || 'N/A'}{' '}
                    {app.profiles?.[0]?.last_name || ''}
                  </TableCell>
                  <TableCell>{app.profiles?.[0]?.email}</TableCell>
                  <TableCell className='hidden md:table-cell'>
                    {new Date(app.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(app.status)}>
                      {app.status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/washers/${app.id}`}>
                      <Button variant='outline' size='sm'>
                        View Details
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className='text-center'>
                  No applications found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
