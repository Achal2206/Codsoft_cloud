// CodSoft Task 3: Cloud Bus Ticket Reservation Client Application

let currentRoutes = [];
let activeBus = null;
let activeDate = null;
let selectedSeats = [];
let currentLeaseToken = null;
let leaseTimerInterval = null;
let leaseRemainingSeconds = 300;

// DOM Elements - Navigation & Views
const tabSearchBuses = document.getElementById('tabSearchBuses');
const tabManageBookings = document.getElementById('tabManageBookings');
const btnCloudArch = document.getElementById('btnCloudArch');
const bookingView = document.getElementById('bookingView');
const manageView = document.getElementById('manageView');

// Search elements
const searchFrom = document.getElementById('searchFrom');
const searchTo = document.getElementById('searchTo');
const searchDate = document.getElementById('searchDate');
const searchBusType = document.getElementById('searchBusType');
const btnSearch = document.getElementById('btnSearch');
const btnSwapCities = document.getElementById('btnSwapCities');
const sortRoutes = document.getElementById('sortRoutes');
const busList = document.getElementById('busList');
const routesResultCount = document.getElementById('routesResultCount');
const routeSubtitle = document.getElementById('routeSubtitle');

// Seat Modal elements
const seatModal = document.getElementById('seatModal');
const btnCloseSeatModal = document.getElementById('btnCloseSeatModal');
const seatModalBusName = document.getElementById('seatModalBusName');
const seatModalSub = document.getElementById('seatModalSub');
const seatGridContainer = document.getElementById('seatGridContainer');
const selectedSeatsChips = document.getElementById('selectedSeatsChips');
const seatCountText = document.getElementById('seatCountText');
const baseFareText = document.getElementById('baseFareText');
const gstFareText = document.getElementById('gstFareText');
const totalFareText = document.getElementById('totalFareText');
const btnConfirmBooking = document.getElementById('btnConfirmBooking');
const btnPayAmount = document.getElementById('btnPayAmount');
const passengerInputsContainer = document.getElementById('passengerInputsContainer');
const selectBoarding = document.getElementById('selectBoarding');
const selectDropping = document.getElementById('selectDropping');
const inputEmail = document.getElementById('inputEmail');
const inputPhone = document.getElementById('inputPhone');

const leaseTimerBox = document.getElementById('leaseTimerBox');
const leaseTimerDisplay = document.getElementById('leaseTimerDisplay');

// Ticket Modal elements
const ticketModal = document.getElementById('ticketModal');
const btnCloseTicketModal = document.getElementById('btnCloseTicketModal');
const btnDoneTicket = document.getElementById('btnDoneTicket');
const ticketPnr = document.getElementById('ticketPnr');
const ticketFrom = document.getElementById('ticketFrom');
const ticketTo = document.getElementById('ticketTo');
const ticketDepTime = document.getElementById('ticketDepTime');
const ticketArrTime = document.getElementById('ticketArrTime');
const ticketDuration = document.getElementById('ticketDuration');
const ticketOperator = document.getElementById('ticketOperator');
const ticketDate = document.getElementById('ticketDate');
const ticketSeats = document.getElementById('ticketSeats');
const ticketFare = document.getElementById('ticketFare');
const ticketBoarding = document.getElementById('ticketBoarding');
const ticketDropping = document.getElementById('ticketDropping');
const ticketPassengersList = document.getElementById('ticketPassengersList');

// Manage view elements
const manageQueryInput = document.getElementById('manageQueryInput');
const btnFindBooking = document.getElementById('btnFindBooking');
const manageResultContainer = document.getElementById('manageResultContainer');

// Arch modal & Toast
const archModal = document.getElementById('archModal');
const btnCloseArchModal = document.getElementById('btnCloseArchModal');
const toastContainer = document.getElementById('toastContainer');

// Init
document.addEventListener('DOMContentLoaded', () => {
  // Set default search date to today
  const today = new Date().toISOString().split('T')[0];
  searchDate.value = today;
  searchDate.min = today;
  activeDate = today;

  setupEventListeners();
  fetchRoutes();
});

function setupEventListeners() {
  // Navigation tabs
  tabSearchBuses.addEventListener('click', () => {
    tabSearchBuses.classList.add('active');
    tabManageBookings.classList.remove('active');
    bookingView.style.display = 'block';
    manageView.style.display = 'none';
  });

  tabManageBookings.addEventListener('click', () => {
    tabManageBookings.classList.add('active');
    tabSearchBuses.classList.remove('active');
    manageView.style.display = 'block';
    bookingView.style.display = 'none';
  });

  btnCloudArch.addEventListener('click', () => archModal.style.display = 'flex');
  btnCloseArchModal.addEventListener('click', () => archModal.style.display = 'none');

  // Search actions
  btnSearch.addEventListener('click', fetchRoutes);
  btnSwapCities.addEventListener('click', () => {
    const temp = searchFrom.value;
    searchFrom.value = searchTo.value;
    searchTo.value = temp;
  });

  sortRoutes.addEventListener('change', () => sortAndRenderRoutes());

  // Seat Modal close
  btnCloseSeatModal.addEventListener('click', closeSeatModal);
  btnCloseTicketModal.addEventListener('click', () => ticketModal.style.display = 'none');
  btnDoneTicket.addEventListener('click', () => {
    ticketModal.style.display = 'none';
    fetchRoutes();
  });

  // Manage Bookings
  btnFindBooking.addEventListener('click', searchBooking);

  // Confirm booking
  btnConfirmBooking.addEventListener('click', finalizeBooking);

  // Backdrop modal close
  [seatModal, ticketModal, archModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        if (modal === seatModal) closeSeatModal();
        else modal.style.display = 'none';
      }
    });
  });
}

// Fetch Routes
async function fetchRoutes() {
  const from = searchFrom.value;
  const to = searchTo.value;
  const date = searchDate.value || new Date().toISOString().split('T')[0];
  const busType = searchBusType.value;
  activeDate = date;

  let query = `?date=${encodeURIComponent(date)}`;
  if (from) query += `&from=${encodeURIComponent(from)}`;
  if (to) query += `&to=${encodeURIComponent(to)}`;
  if (busType && busType !== 'all') query += `&busType=${encodeURIComponent(busType)}`;

  busList.innerHTML = '<div style="text-align:center; padding:3rem; color:var(--text-muted);"><div class="upload-spinner" style="margin:0 auto 1rem;"></div>Searching cloud bus routes...</div>';

  try {
    const res = await fetch(`/api/routes${query}`);
    const data = await res.json();
    if (data.success) {
      currentRoutes = data.routes;
      routesResultCount.textContent = `${currentRoutes.length} Buses Found`;
      routeSubtitle.textContent = `${from || 'All Routes'} ➔ ${to || 'All Destinations'} • ${new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}`;
      sortAndRenderRoutes();
    }
  } catch (err) {
    showToast('Failed to load routes from cloud server.', 'error');
  }
}

function sortAndRenderRoutes() {
  const sortBy = sortRoutes.value;
  let sorted = [...currentRoutes];

  if (sortBy === 'rating') {
    sorted.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'price_low') {
    sorted.sort((a, b) => a.basePrice - b.basePrice);
  } else if (sortBy === 'price_high') {
    sorted.sort((a, b) => b.basePrice - a.basePrice);
  }

  renderRoutes(sorted);
}

function renderRoutes(routes) {
  if (routes.length === 0) {
    busList.innerHTML = `
      <div class="glass-panel" style="padding: 4rem 2rem; text-align: center; color: var(--text-muted);">
        <div style="font-size:3rem; margin-bottom:1rem;">🚌</div>
        <h3>No buses found on this route</h3>
        <p>Try searching different cities or selecting "All Cities".</p>
      </div>
    `;
    return;
  }

  busList.innerHTML = routes.map(route => {
    return `
      <div class="bus-card glass-panel" data-id="${route.id}">
        <div class="bus-card-left">
          <div class="bus-operator-row">
            <span class="bus-name">${route.operator}</span>
            <span class="bus-type-badge">${route.busType}</span>
            <span class="bus-rating-badge">★ ${route.rating}</span>
          </div>

          <div class="bus-timeline">
            <div class="time-box">
              <h4>${route.departureTime}</h4>
              <p>${route.from}</p>
            </div>
            <div class="timeline-divider">
              <span class="duration-tag">${route.duration}</span>
              <div class="duration-line"></div>
            </div>
            <div class="time-box">
              <h4>${route.arrivalTime}</h4>
              <p>${route.to}</p>
            </div>
          </div>

          <div class="amenities-row">
            ${route.amenities.map(a => `<span class="amenity-pill">${a}</span>`).join('')}
          </div>
        </div>

        <div class="bus-card-right">
          <div class="price-box">
            <span class="price-sub">Starts from</span>
            <div class="price-amount">₹${route.basePrice}</div>
            <span class="seats-avail-tag ${route.availableSeats < 10 ? 'low' : ''}">
              ${route.availableSeats} Seats Available
            </span>
          </div>

          <button class="btn-primary" onclick="openSeatModal('${route.id}')">
            Select Seats
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Seat Selection Modal
async function openSeatModal(busId) {
  const bus = currentRoutes.find(r => r.id === busId);
  if (!bus) return;

  activeBus = bus;
  selectedSeats = [];
  currentLeaseToken = null;
  clearInterval(leaseTimerInterval);
  leaseTimerBox.style.display = 'none';

  seatModalBusName.textContent = bus.operator;
  seatModalSub.textContent = `${bus.from} ➔ ${bus.to} | Dep: ${bus.departureTime} | Date: ${activeDate}`;

  // Populate boarding & dropping points
  selectBoarding.innerHTML = bus.boardingPoints.map(p => `<option value="${p}">${p}</option>`).join('');
  selectDropping.innerHTML = bus.droppingPoints.map(p => `<option value="${p}">${p}</option>`).join('');

  seatGridContainer.innerHTML = '<div style="text-align:center; padding:2rem;"><div class="upload-spinner" style="margin:0 auto 1rem;"></div>Loading seat availability...</div>';
  seatModal.style.display = 'flex';

  updateCheckoutSummary();

  try {
    const res = await fetch(`/api/buses/${busId}/seats?date=${encodeURIComponent(activeDate)}`);
    const data = await res.json();
    if (data.success) {
      renderSeatMatrix(data.seats);
    }
  } catch (err) {
    showToast('Failed to load bus seat layout.', 'error');
  }
}

function renderSeatMatrix(seats) {
  // Split into rows of 4 (2 on left, aisle, 2 on right)
  const rows = [];
  const rowCount = Math.ceil(seats.length / 4);

  for (let r = 1; r <= rowCount; r++) {
    const rowSeats = seats.filter(s => s.row === r);
    const leftPair = rowSeats.slice(0, 2);
    const rightPair = rowSeats.slice(2, 4);
    rows.push({ leftPair, rightPair });
  }

  const html = rows.map((r, idx) => `
    <div class="seat-row">
      <div class="seat-pair">
        ${r.leftPair.map(s => renderSeatButton(s)).join('')}
      </div>
      <div class="bus-aisle">|</div>
      <div class="seat-pair">
        ${r.rightPair.map(s => renderSeatButton(s)).join('')}
      </div>
    </div>
  `).join('');

  seatGridContainer.innerHTML = html;
}

function renderSeatButton(seat) {
  let statusClass = seat.status.toLowerCase();
  let disabled = seat.status === 'BOOKED' || seat.status === 'HELD' ? 'disabled' : '';
  let womenClass = seat.isWomenPreferred ? 'women-preferred' : '';
  let isSelected = selectedSeats.includes(seat.seatNumber) ? 'selected' : '';

  return `
    <button class="seat-btn ${statusClass} ${womenClass} ${isSelected}" 
      data-seat="${seat.seatNumber}" 
      data-price="${seat.price}"
      ${disabled}
      onclick="handleSeatClick('${seat.seatNumber}', ${seat.price})"
      title="Seat ${seat.seatNumber} - ${seat.status} (₹${seat.price})">
      <span class="seat-num">${seat.seatNumber}</span>
      <span class="seat-window-tag">${seat.isWindow ? 'WIN' : 'AIS'}</span>
    </button>
  `;
}

function handleSeatClick(seatNumber, price) {
  const index = selectedSeats.indexOf(seatNumber);
  if (index > -1) {
    selectedSeats.splice(index, 1);
  } else {
    if (selectedSeats.length >= 6) {
      showToast('Maximum 6 seats allowed per booking.', 'info');
      return;
    }
    selectedSeats.push(seatNumber);
  }

  // Update UI selection classes
  document.querySelectorAll('.seat-btn').forEach(btn => {
    const s = btn.dataset.seat;
    if (selectedSeats.includes(s)) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });

  // Attempt optimistic seat lock lease if seats are selected
  if (selectedSeats.length > 0) {
    requestSeatHoldLease();
  } else {
    releaseSeatHoldLease();
  }

  updateCheckoutSummary();
}

// Ephemeral Concurrency Seat Hold
async function requestSeatHoldLease() {
  try {
    const res = await fetch('/api/seats/hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        busId: activeBus.id,
        journeyDate: activeDate,
        seats: selectedSeats
      })
    });
    const data = await res.json();
    if (data.success) {
      currentLeaseToken = data.leaseToken;
      startLeaseCountdown(300); // 5 minutes
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    console.error('Hold error', err);
  }
}

async function releaseSeatHoldLease() {
  if (!currentLeaseToken) return;
  try {
    await fetch('/api/seats/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leaseToken: currentLeaseToken })
    });
  } catch (e) {}
  currentLeaseToken = null;
  clearInterval(leaseTimerInterval);
  leaseTimerBox.style.display = 'none';
}

function startLeaseCountdown(seconds) {
  clearInterval(leaseTimerInterval);
  leaseRemainingSeconds = seconds;
  leaseTimerBox.style.display = 'block';

  function update() {
    const mins = Math.floor(leaseRemainingSeconds / 60).toString().padStart(2, '0');
    const secs = (leaseRemainingSeconds % 60).toString().padStart(2, '0');
    leaseTimerDisplay.textContent = `${mins}:${secs}`;

    if (leaseRemainingSeconds <= 0) {
      clearInterval(leaseTimerInterval);
      showToast('⌛ Seat hold expired! Please re-select your seats.', 'info');
      closeSeatModal();
    }
    leaseRemainingSeconds--;
  }

  update();
  leaseTimerInterval = setInterval(update, 1000);
}

function updateCheckoutSummary() {
  const count = selectedSeats.length;
  seatCountText.textContent = count;

  if (count === 0) {
    selectedSeatsChips.innerHTML = '<span class="no-seat-text">Click seats to select</span>';
    baseFareText.textContent = '₹0';
    gstFareText.textContent = '₹0';
    totalFareText.textContent = '₹0';
    btnPayAmount.textContent = '0';
    btnConfirmBooking.disabled = true;
    passengerInputsContainer.innerHTML = '';
    return;
  }

  selectedSeatsChips.innerHTML = selectedSeats.map(s => `<span class="seat-chip">${s}</span>`).join('');

  const basePricePerSeat = activeBus.basePrice;
  const baseFare = basePricePerSeat * count;
  const gst = Math.round(baseFare * 0.05);
  const platformFee = 25;
  const total = baseFare + gst + platformFee;

  baseFareText.textContent = `₹${baseFare}`;
  gstFareText.textContent = `₹${gst}`;
  totalFareText.textContent = `₹${total}`;
  btnPayAmount.textContent = total;
  btnConfirmBooking.disabled = false;

  // Render passenger input forms
  passengerInputsContainer.innerHTML = selectedSeats.map((seat, i) => `
    <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); padding:0.6rem; border-radius:6px; margin-bottom:0.5rem;">
      <div style="font-size:0.78rem; font-weight:700; color:#38bdf8; margin-bottom:0.35rem;">
        Seat ${seat} Passenger
      </div>
      <div style="display:flex; gap:0.5rem;">
        <input type="text" class="passenger-name" placeholder="Full Name" value="${i === 0 ? 'Rahul Sharma' : 'Passenger ' + (i + 1)}" style="flex:2;" required>
        <input type="number" class="passenger-age" placeholder="Age" value="28" style="flex:1;" min="5" max="99" required>
        <select class="passenger-gender select-styled" style="flex:1.2;">
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>
    </div>
  `).join('');
}

function closeSeatModal() {
  releaseSeatHoldLease();
  seatModal.style.display = 'none';
}

// Finalize Booking
async function finalizeBooking() {
  if (selectedSeats.length === 0) return;

  const email = inputEmail.value.trim();
  const phone = inputPhone.value.trim();

  if (!email || !phone) {
    showToast('Please enter contact email and phone number.', 'error');
    return;
  }

  // Collect passengers
  const names = document.querySelectorAll('.passenger-name');
  const ages = document.querySelectorAll('.passenger-age');
  const genders = document.querySelectorAll('.passenger-gender');

  const passengers = [];
  for (let i = 0; i < selectedSeats.length; i++) {
    passengers.push({
      seat: selectedSeats[i],
      name: names[i].value || `Passenger ${i+1}`,
      age: parseInt(ages[i].value) || 25,
      gender: genders[i].value
    });
  }

  btnConfirmBooking.disabled = true;
  btnConfirmBooking.textContent = 'Processing Payment & Cloud DB Commit...';

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        busId: activeBus.id,
        journeyDate: activeDate,
        seats: selectedSeats,
        passengers,
        contactEmail: email,
        contactPhone: phone,
        boardingPoint: selectBoarding.value,
        droppingPoint: selectDropping.value,
        leaseToken: currentLeaseToken
      })
    });

    const data = await res.json();
    btnConfirmBooking.disabled = false;
    btnConfirmBooking.textContent = 'Confirm Booking';

    if (data.success) {
      clearInterval(leaseTimerInterval);
      seatModal.style.display = 'none';
      displayTicketModal(data.booking);
      showToast('🎉 Booking Confirmed Successfully!', 'success');
    } else {
      showToast(data.message || 'Booking failed.', 'error');
    }
  } catch (err) {
    btnConfirmBooking.disabled = false;
    btnConfirmBooking.textContent = 'Confirm Booking';
    showToast('Failed to complete reservation.', 'error');
  }
}

// Display Digital E-Ticket
function displayTicketModal(b) {
  ticketPnr.textContent = b.pnr;
  ticketFrom.textContent = b.from;
  ticketTo.textContent = b.to;
  ticketDepTime.textContent = b.departureTime;
  ticketArrTime.textContent = b.arrivalTime;
  ticketDuration.textContent = b.journeyDate;
  ticketOperator.textContent = `${b.busOperator} (${b.busType})`;
  ticketDate.textContent = b.journeyDate;
  ticketSeats.textContent = b.seats.join(', ');
  ticketFare.textContent = `₹${b.fareDetails.totalFare}`;
  ticketBoarding.textContent = b.boardingPoint;
  ticketDropping.textContent = b.droppingPoint;

  ticketPassengersList.innerHTML = b.passengers.map(p => `
    <div class="passenger-tag">
      <strong>${p.name}</strong> (${p.gender}, ${p.age} yrs) - <em>Seat ${p.seat || ''}</em>
    </div>
  `).join('');

  ticketModal.style.display = 'flex';
}

// Search & Manage Existing Booking
async function searchBooking() {
  const q = manageQueryInput.value.trim();
  if (!q) {
    showToast('Please enter a PNR or mobile number', 'info');
    return;
  }

  manageResultContainer.innerHTML = '<div style="text-align:center; padding:2rem;"><div class="upload-spinner" style="margin:0 auto 1rem;"></div>Searching database...</div>';

  try {
    const res = await fetch(`/api/bookings/${encodeURIComponent(q)}`);
    const data = await res.json();

    if (data.success) {
      renderManageBookingCard(data.booking);
    } else {
      manageResultContainer.innerHTML = `
        <div class="glass-panel" style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
          <h3>No Booking Found</h3>
          <p>${data.message}</p>
        </div>
      `;
    }
  } catch (e) {
    showToast('Error looking up booking.', 'error');
  }
}

function renderManageBookingCard(b) {
  const isCancelled = b.status === 'CANCELLED';
  const refundInfo = b.refundDetails ? `
    <div style="margin-top:0.75rem; padding:0.75rem; background:rgba(239, 68, 68, 0.1); border-radius:6px; font-size:0.85rem; color:#fca5a5;">
      Refund Amount: <strong>₹${b.refundDetails.refundAmount}</strong> (Initiated to Original Source)
    </div>
  ` : '';

  manageResultContainer.innerHTML = `
    <div class="bus-card glass-panel" style="max-width: 800px; margin: 0 auto; flex-direction: column; align-items: stretch;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
        <div>
          <span style="font-size:0.8rem; color:var(--text-muted);">PNR Number</span>
          <h3 style="color:#38bdf8; font-family:'Outfit', sans-serif;">${b.pnr}</h3>
        </div>
        <div style="text-align:right;">
          <span class="ticket-status-pill" style="background:${isCancelled ? '#ef4444' : '#10b981'};">
            ${b.status}
          </span>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:1rem; margin:1rem 0;">
        <div>
          <span style="font-size:0.75rem; color:var(--text-muted);">ROUTE</span>
          <p><strong>${b.from} ➔ ${b.to}</strong></p>
        </div>
        <div>
          <span style="font-size:0.75rem; color:var(--text-muted);">DATE & TIME</span>
          <p><strong>${b.journeyDate} (${b.departureTime})</strong></p>
        </div>
        <div>
          <span style="font-size:0.75rem; color:var(--text-muted);">SEATS</span>
          <p><strong style="color:#818cf8;">${b.seats.join(', ')}</strong></p>
        </div>
        <div>
          <span style="font-size:0.75rem; color:var(--text-muted);">TOTAL FARE</span>
          <p><strong>₹${b.fareDetails.totalFare}</strong></p>
        </div>
      </div>

      <div style="margin-bottom:1rem;">
        <span style="font-size:0.75rem; color:var(--text-muted);">PASSENGERS</span>
        <div style="display:flex; gap:0.5rem; margin-top:0.35rem; flex-wrap:wrap;">
          ${b.passengers.map(p => `<span class="passenger-tag">${p.name} (${p.gender}, ${p.age})</span>`).join('')}
        </div>
      </div>

      ${refundInfo}

      <div style="display:flex; justify-content:flex-end; gap:0.75rem; border-top:1px solid var(--border-color); padding-top:1rem; margin-top:0.5rem;">
        <button class="btn-secondary" onclick='displayTicketModal(${JSON.stringify(b)})'>View Digital Ticket</button>
        ${!isCancelled ? `<button class="btn-danger" onclick="cancelTicket('${b.pnr}')">Cancel Booking</button>` : ''}
      </div>
    </div>
  `;
}

// Cancel Ticket
async function cancelTicket(pnr) {
  if (!confirm(`Are you sure you want to cancel booking ${pnr}? A 90% refund will be credited to your payment method.`)) {
    return;
  }

  try {
    const res = await fetch(`/api/bookings/${pnr}/cancel`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      searchBooking();
    } else {
      showToast(data.message, 'error');
    }
  } catch (e) {
    showToast('Failed to cancel booking', 'error');
  }
}

// Toast helper
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}
