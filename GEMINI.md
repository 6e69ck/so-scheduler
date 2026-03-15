# Soaring Eagles Project Context

## Database Data Formats (MongoDB)

The project uses a shared MongoDB database with an `events` collection. The data is managed via Mongoose models.

## Database Modification
- Ensure any modifications to schema or logic maintain backwards-compatibility with old data.

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
