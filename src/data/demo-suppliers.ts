import { Supplier } from '../lib/database'

export const demoSuppliers: Supplier[] = [
  {
    id: 's1',
    name: 'Art Supplies Co.',
    email: 'contact@artssupplyco.com',
    phone: '(555) 111-2222',
    address: '123 Art Street, Suite 100',
    materialsSupplied: ['Premium Ceramic Clay', 'Stainless Steel Wire'],
    notes: 'Reliable supplier for clay and metal materials',
    createdAt: new Date('2023-06-15'),
    updatedAt: new Date()
  },
  {
    id: 's2',
    name: 'Wood & Timber Ltd.',
    email: 'sales@woodandtimber.com',
    phone: '(555) 333-4444',
    address: '456 Forest Road, Unit 5',
    materialsSupplied: ['Acacia Wood Planks', 'Natural Wood Finish'],
    notes: 'Premium wood materials, sustainable sourcing',
    createdAt: new Date('2023-08-20'),
    updatedAt: new Date()
  },
  {
    id: 's3',
    name: 'Leather Craft Supplies',
    email: 'info@leathercraftsupplies.com',
    phone: '(555) 555-6666',
    address: '789 Leather Lane, Building A',
    materialsSupplied: ['Genuine Leather Sheets', 'Embroidery Thread Pack'],
    notes: 'High-quality leather and textile materials',
    createdAt: new Date('2023-10-10'),
    updatedAt: new Date()
  },
  {
    id: 's4',
    name: 'Resin & Art Materials',
    email: 'support@resinartmats.com',
    phone: '(555) 777-8888',
    address: '321 Resin Blvd, Suite 20',
    materialsSupplied: ['Resin Casting Material'],
    notes: 'Specialty resin materials for art casting',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date()
  },
  {
    id: 's5',
    name: 'Fabric & Textile Co.',
    email: 'contact@fabricandtextileco.com',
    phone: '(555) 999-0000',
    address: '654 Fabric Avenue, Floor 3',
    materialsSupplied: ['Organic Cotton Fabric'],
    notes: 'Organic and sustainable fabric materials',
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date()
  }
]