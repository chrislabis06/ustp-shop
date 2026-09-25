export type Listing = {
  id: string
  title: string
  category: string
  price: number
  condition: string
  seller: string
  location: string
  posted: string
  description: string
  accent: string
}

export const categories = ['All items', 'Uniforms', 'PE gear', 'School supplies', 'Books']

export const listings: Listing[] = [
  {
    id: 'ustp-uniform-set',
    title: 'USTP college uniform set',
    category: 'Uniforms',
    price: 850,
    condition: 'Good',
    seller: 'Mika Dela Cruz',
    location: 'Main Campus',
    posted: '12 min ago',
    description: 'Complete college uniform set with blouse and skirt. Clean, lightly used, and ready for a new student.',
     accent: '#e6edf5',
  },
  {
    id: 'pe-uniform-set',
    title: 'PE uniform set',
    category: 'PE gear',
    price: 450,
    condition: 'Good',
    seller: 'Jules Manalo',
    location: 'West Campus gate',
    posted: '38 min ago',
    description: 'Pre-loved PE shirt and jogging pants. Comfortable fit with plenty of wear left.',
     accent: '#90908f',
  },
  {
    id: 'school-shoes',
    title: 'Black school shoes',
    category: 'Uniforms',
    price: 700,
    condition: 'Good',
    seller: 'Anton Reyes',
    location: 'Carmen Campus',
    posted: '1 hr ago',
    description: 'Comfortable black lace-up shoes for daily uniform wear. Size 9, with clean soles.',
     accent: '#d2dce6',
  },
  {
    id: 'pe-rubber-shoes',
    title: 'PE rubber shoes',
    category: 'PE gear',
    price: 950,
    condition: 'Like new',
    seller: 'Sam Uy',
    location: 'Library gate',
    posted: '2 hrs ago',
    description: 'Lightweight training shoes used for one semester. Good for PE class and campus walks.',
     accent: '#8a8a8a',
  },
  {
    id: 'engineering-books',
    title: 'Engineering textbooks bundle',
    category: 'Books',
    price: 1200,
    condition: 'Good',
    seller: 'Nico Lim',
    location: 'Student center',
    posted: '3 hrs ago',
    description: 'Second-hand math and engineering textbooks with useful notes and highlighted chapters.',
     accent: '#f4f6f9',
  },
  {
    id: 'school-supplies-bundle',
    title: 'School supplies bundle',
    category: 'School supplies',
    price: 280,
    condition: 'Good',
    seller: 'Bea Santos',
    location: 'Main Campus',
    posted: 'Yesterday',
    description: 'Notebooks, folders, pens, and a lightly used scientific calculator for the coming semester.',
     accent: '#a2a2a2',
  },
]

export function formatPrice(price: number) {
  return `₱${price.toLocaleString('en-PH')}`
}
