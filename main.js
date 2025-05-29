const currencyToConvert = document.getElementById("currency-to-convert-list");
const convertedCurrency = document.getElementById("converted-currency-list");
const amountInput = document.querySelector(".amount input");
const convertedAmountInput = document.querySelector(".converted-amount input");
const chartContainer = document.getElementById('currencyChart').parentElement;

let currencyChart = null;

// Populate dropdowns
currencyCode.forEach(currency => {
  const option1 = document.createElement("option");
  option1.value = currency;
  option1.textContent = currency;
  currencyToConvert.add(option1);

  const option2 = document.createElement("option");
  option2.value = currency;
  option2.textContent = currency;
  convertedCurrency.add(option2);
});

// Fetch chart data from Frankfurter for last 7 days
async function fetchCurrencyData(base = 'EUR', target = 'USD') {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);

  const formatDate = (date) => date.toISOString().split('T')[0];
  const url = `https://api.frankfurter.app/${formatDate(startDate)}..${formatDate(endDate)}?from=${base}&to=${target}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    // Check if data has rates and they are not empty
    if (!data.rates || Object.keys(data.rates).length === 0) {
      return null; // no data to show
    }
    return data;
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return null;
  }
}

// Create or update the chart or display fallback message
async function createChart(base, target) {
  const data = await fetchCurrencyData(base, target);

  if (!data) {
    // Remove canvas if chart exists
    if (currencyChart) {
      currencyChart.destroy();
      currencyChart = null;
    }
    // Replace canvas with message
    chartContainer.innerHTML = `<p style="text-align:center; padding:20px; font-style: italic; color: #555;">
      Work in progress: Chart feature is under development for this currency pair.
    </p>`;
    return;
  }

  // If chartContainer doesn't have the canvas, put it back (in case message was shown before)
  if (!document.getElementById('currencyChart')) {
    chartContainer.innerHTML = `<canvas id="currencyChart"></canvas>`;
  }

  const ctx = document.getElementById('currencyChart').getContext('2d');
  const dates = Object.keys(data.rates);
  const rates = dates.map(date => data.rates[date][target]);

  if (currencyChart) currencyChart.destroy();

  currencyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: `${base} to ${target}`,
        data: rates,
        borderColor: '#3e95cd',
        fill: false,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: '7-Day Exchange Rate History'
        }
      }
    }
  });
}

// Convert currency using ExchangeRate-API
async function convertCurrency() {
  const from = currencyToConvert.value;
  const to = convertedCurrency.value;
  const amount = amountInput.value;

  if (!amount || isNaN(amount)) {
    convertedAmountInput.value = '';
    return;
  }

  // API key stored as array for security purposes, then joined
  const apiKeyParts = ['738d6178', '3225ef02', '3a4e369f'];
  const API_KEY = apiKeyParts.join('');

  const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/pair/${from}/${to}/${amount}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    if (data.result === 'success') {
     const formatter = new Intl.NumberFormat(undefined, {
     style: 'currency',
     currency: to,
     minimumFractionDigits: 2
});
convertedAmountInput.value = formatter.format(data.conversion_result);

    } else {
      convertedAmountInput.value = '';
      console.error('Conversion failed:', data);
    }
  } catch (error) {
    convertedAmountInput.value = '';
    console.error('Conversion failed:', error);
  }
}

// Update everything on any change
async function updateAll() {
  await convertCurrency();
  await createChart(currencyToConvert.value, convertedCurrency.value);
}

// Event listeners for changes on dropdowns and amount input
currencyToConvert.addEventListener('change', updateAll);
convertedCurrency.addEventListener('change', updateAll);
amountInput.addEventListener('input', updateAll);

// Initialize defaults and chart on page load
document.addEventListener('DOMContentLoaded', async () => {
  // You may set defaults here if you want, e.g. USD/EUR
  currencyToConvert.value = 'USD';
  convertedCurrency.value = 'EUR';
  amountInput.value = '1';
  await updateAll();
});
