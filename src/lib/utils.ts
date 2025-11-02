import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate initials from name
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

// Get color for patient avatars based on index
export function getAvatarColor(index: number): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500', 
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500'
  ]
  return colors[index % colors.length]
}

// Generate case ID
export function generateCaseId(id: string): string {
  if (!id || typeof id !== 'string') {
    return '#C000000'
  }
  return `#C${id.slice(-6).toUpperCase()}`
}

// Generate invoice number
export function generateInvoiceNumber(id: string): string {
  const year = new Date().getFullYear()
  if (!id || typeof id !== 'string') {
    return `INV-${year}-000000`
  }
  return `INV-${year}-${id.slice(-6).toUpperCase()}`
}

// Calculate age from date of birth
export function calculateAge(dateOfBirth: string | null | undefined): number {
  if (!dateOfBirth) return 0;
  
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

// Get status color
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'in progress':
    case 'confirmed':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
    case 'scheduled':
    case 'consultation':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
    case 'overdue':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Get priority color
export function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'emergency':
      return 'bg-red-100 text-red-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
