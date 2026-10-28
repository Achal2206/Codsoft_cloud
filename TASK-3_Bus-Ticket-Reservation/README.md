# 🚌 CodSoft Cloud Computing Internship - Task 3: Cloud-Based Bus Ticket Reservation System

A production-grade, scalable **Cloud-Hosted Online Bus Ticket Reservation Platform** engineered for high-concurrency traffic and seamless passenger experience, built for the **CodSoft Cloud Computing Internship**.

---

## 🌟 Key Features

1. **Intelligent Route & Fleet Search**:
   - Real-time search across major intercity routes (e.g., Mumbai ➔ Pune, Bangalore ➔ Hyderabad, Delhi ➔ Jaipur, Chennai ➔ Bangalore, Mumbai ➔ Goa).
   - Filter by Bus Operator, Class (Volvo Multi-Axle AC, Scania Sleeper, Electric Express), Price Range, and Departure Time.
   - Live seat inventory counting per route and date.

2. **Interactive 2D Bus Seat Layout**:
   - Detailed visual coach map featuring Driver Cabin, Window seats, Aisle separation, and Lower/Upper Deck beds.
   - Status indicators: `Available (Green)`, `Selected (Indigo)`, `Booked (Grey)`, `On Hold (Amber)`, and `Women-Preferred (Purple)`.
   - Multi-seat booking support with dynamic fare breakdown (Base Fare + GST + Platform Fee).

3. **High-Concurrency Architecture (Scalable Traffic Design)**:
   - **Distributed Seat-Lease Mechanism**: To prevent the classic **Double-Booking / Race Condition** under high user surges, selecting seats creates an atomic 5-minute hold with a live countdown timer (`04:59`).
   - Other users concurrently viewing the same bus immediately see the seat flagged as `On Hold`.
   - **Automated Sweeper**: Ephemeral worker automatically sweeps expired leases, unlocking seats back to the public pool without database contention.

4. **Digital E-Ticket & Boarding Pass**:
   - Generates unique PNRs (e.g. `CS-BUS-849201`).
   - Beautiful digital boarding pass containing passenger rosters, boarding address, departure time, journey date, seat numbers, fare receipt, and digital QR code for bus check-in.
   - Print-ready format.

5. **Reservation Management & Instant Cancellation**:
   - Lookup existing bookings via PNR or registered mobile number.
   - 1-click ticket cancellation with instant 90% refund computation and immediate seat reallocation.

---

## 📐 Cloud Architecture & Concurrency Model

```
                    [ 10,000+ Concurrent Users ]
                                  │
                                  ▼
               [ Cloud Application Load Balancer ]
                                  │
             ┌────────────────────┴────────────────────┐
             ▼                                         ▼
   [ Node.js Worker 1 ]                      [ Node.js Worker 2 ]
             │                                         │
             ├─────────────────┬───────────────────────┤
             ▼                 ▼                       ▼
    [ Routes Catalog ]  [ Seat Lease Lock ]     [ Bookings Store ]
                        (5-Min Atomic TTL)      (ACID Confirmed)
```

---

## 🚀 Quick Start Guide

### 1. Installation
Navigate to the Task 3 directory and install dependencies:
```bash
npm install
```

### 2. Start the Server
```bash
npm start
# or
node server.js
```

### 3. Open Application
Navigate in your browser to:
```
http://localhost:5002
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/routes` | Search routes with date, cities, and bus type filters |
| `GET` | `/api/buses/:busId/seats` | Retrieve real-time seat matrix for a bus on a specific date |
| `POST` | `/api/seats/hold` | Atomic 5-minute lease hold on selected seats |
| `POST` | `/api/seats/release` | Explicitly release a seat lease |
| `POST` | `/api/bookings` | Finalize ticket booking, commit to cloud database, generate PNR |
| `GET` | `/api/bookings/:identifier` | Retrieve booking details by PNR or phone number |
| `POST` | `/api/bookings/:pnr/cancel` | Cancel booking, calculate refund, and release seats |
| `GET` | `/api/metrics` | System scalability and concurrency telemetry |

---

## 🎥 LinkedIn Video Demonstration Tips
1. Search buses from **Mumbai** to **Pune**.
2. Click **Select Seats** on "Zingbus Electric Superfast".
3. Select seats `S5` and `S6` to highlight the **5-minute concurrency countdown timer** and price breakdown.
4. Click **Confirm Booking** to instantly view the generated digital boarding pass with PNR and QR code.
5. Go to the **Manage Booking** tab, enter the PNR to show the booking details, then cancel the ticket to show the 90% refund calculation and instant seat release.
