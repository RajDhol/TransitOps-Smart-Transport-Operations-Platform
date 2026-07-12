# TransitOps - Smart Transport Operations Platform

TransitOps is an end-to-end smart transport operations platform designed to digitize fleet management, driver dispatch, maintenance logs, expense tracking, and provide real-time operational insights. 

## 🚀 Technology Stack
* **Frontend**: Next.js (React) + TypeScript (App Router)
* **Styling**: TailwindCSS v3 (Flat theme, zero shadows)
* **Backend**: Python (FastAPI)
* **Database**: SQLite (SQLModel / SQLAlchemy ORM)

## 📦 Key Modules
1. **Authentication & RBAC**: Roles for Fleet Managers, Drivers, Safety Officers, and Financial Analysts.
2. **Dashboard**: Live KPIs (Active/Available vehicles, Fleet Utilization, Pending Trips).
3. **Vehicle Registry**: Master list of vehicles with load capacities, status (`Available`, `On Trip`, `In Shop`, `Retired`), and odometer readings.
4. **Driver Management**: Driver profiles, safety scores, license tracking, and automatic suspension.
5. **Trip Lifecycle**: Trip creation, automated load capacity validations, status transitions (`Draft` → `Dispatched` → `Completed` → `Cancelled`).
6. **Maintenance Logs**: Scheduled services, automated status switches (`In Shop` on maintenance start), and restoration to `Available`.
7. **Fuel & Expenses**: Track fuel efficiency, tolls, and calculate ROI per vehicle.

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### Setup Commands
*(Instructions on setup will be updated as the folders are populated)*
