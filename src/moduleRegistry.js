// ============================================================
// MODULE REGISTRY — Add or remove modules here
// To add a new module: import it and add an entry below.
// The app will automatically show it in the sidebar & routing.
// ============================================================

import ContactsModule from './modules/contacts/ContactsModule.jsx'
import CampaignsModule from './modules/campaigns/CampaignsModule.jsx'
import TrackingModule from './modules/tracking/TrackingModule.jsx'
import SettingsModule from './modules/settings/SettingsModule.jsx'

import {
  Users,
  Send,
  BarChart2,
  Settings,
} from 'lucide-react'

const modules = [
  {
    id: 'contacts',
    label: 'Contacts',
    icon: Users,
    path: '/contacts',
    component: ContactsModule,
    description: 'Upload & manage your contacts',
    enabled: true,
  },
  {
    id: 'campaigns',
    label: 'Campaigns',
    icon: Send,
    path: '/campaigns',
    component: CampaignsModule,
    description: 'Compose & send email campaigns',
    enabled: true,
  },
  {
    id: 'tracking',
    label: 'Tracking',
    icon: BarChart2,
    path: '/tracking',
    component: TrackingModule,
    description: 'Opens, clicks & campaign stats',
    enabled: true,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings',
    component: SettingsModule,
    description: 'API keys & app configuration',
    enabled: true,
  },
]

export default modules
