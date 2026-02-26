# Soaring Eagles Project Context

## Database Data Formats (MongoDB)

The project uses a shared MongoDB database with an `events` collection. The data is managed via Mongoose models.

### Event Model (`models/Event.ts`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `show` | String | (Required) Name of the show/event |
| `clientName` | String | Name of the primary contact person |
| `companyName` | String | (Optional) Name of the company |
| `date` | Date | (Required) Date of the event |
| `startTime` | String | Start time in 24h format (e.g., "10:00") |
| `endTime` | String | End time in 24h format (e.g., "11:00") |
| `location` | String | Physical address/location of the event |
| `notes` | String | General notes about the event |
| `status` | String | Enum: `None`, `Planning`, `Confirmed`, `Completed` |
| `salesAssoc` | String | Name of the sales associate |
| `clientPhone` | String | Sanitized phone number (digits only) |
| `clientEmail` | String | Client contact email |
| `totalPrice` | Number | Total cost of the event |
| `paidBalance` | Number | Amount already paid |
| `gear` | [String] | Array of equipment items needed |
| `staff` | [String] | Array of staff names assigned/registered |
| `neededPeople`| Number | Total number of staff required |
| `eventNumber` | Number | Auto-incremented unique ID (zero-padded to 4 digits in UI) |
| `tips` | Number | Tip amount |

**Virtuals:**
- `remainingBalance`: `totalPrice` - `paidBalance`

---

## API Routes

### so-scheduling (Admin App)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/events` | List all events sorted by date |
| `POST` | `/api/events` | Create a new event (auto-increments `eventNumber`) |
| `PUT` | `/api/events/[id]` | Update event details |
| `DELETE`| `/api/events/[id]` | Remove an event |
| `POST` | `/api/stripe/checkout`| Placeholder for Stripe payment link generation |

### so-scheduling-viewer (Team App)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/events` | List all events (filtered/sorted in frontend) |
| `POST` | `/api/events/[id]/staff` | Add a staff name to an event (`{ name: string }`) |
| `POST` | `/api/events/[id]/staff/remove` | Remove a staff name from an event (`{ name: string }`) |

---

## UI Conventions
- **Phone Numbers:** Stored as digits, displayed as `XXX-XXX-XXXX`. Clickable (`tel:`).
- **Emails:** Clickable (`mailto:`).
- **Invoice IDs:** Formatted as `#{eventNumber}` padded to 4 digits (e.g., `#0001`).
- **Staffing Indicators:** Displayed as `(Assigned/Needed)`. Color-coded: Red (low), Yellow (partial), Green (full).
