async function fetchHistoricalData(ticker, num_days_history) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - num_days_history);

    const endDateStr = endDate.toISOString().split('T')[0];
    const startDateStr = startDate.toISOString().split('T')[0];


    const url = `https://api.coingecko.com/api/v3/coins/${ticker}/market_chart/range?vs_currency=usd&from=${Math.floor(startDate.getTime() / 1000)}&to=${Math.floor(endDate.getTime() / 1000)}`;



    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        const prices = data.prices.map(price => price[1]);

        return prices;
    } catch (error) {
        console.error('Fetch error:', error);
        alert('Error fetching historical data.');
        return [];
    }
}

async function populateCryptosDropdown() {
    const url = 'https://api.coingecko.com/api/v3/coins/list';

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        const datalist = document.getElementById('cryptos');
        data.forEach(crypto => {
            const option = document.createElement('option');
            option.value = crypto.id;
            option.textContent = crypto.name;
            datalist.appendChild(option);
        });
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

function generateNormalRandom() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function monteCarloSimulation(prices, num_days_simulation, num_simulations = 1000) {
    const returns = prices.slice(1).map((price, index) => price / prices[index] - 1);
    const lastPrice = prices[prices.length - 1];
    const dailyVolatility = math.std(returns);

    const simulationResults = [];

    for (let i = 0; i < num_simulations; i++) {
        const priceSeries = [lastPrice];
        for (let j = 0; j < num_days_simulation; j++) {
            const randomValue = generateNormalRandom();
            const nextPrice = priceSeries[j] * (1 + randomValue * dailyVolatility);
            priceSeries.push(nextPrice);
        }
        simulationResults.push(priceSeries);
    }

    return simulationResults;
}

async function runSimulation() {
    const ticker = document.getElementById('ticker').value;
    const num_days_history = parseInt(document.getElementById('num_days_history').value);
    const num_days_simulation = parseInt(document.getElementById('num_days_simulation').value);

    if (num_days_history < 60 || num_days_simulation <= 0) {
        alert("Please enter valid values: minimum 60 historical days and a positive simulation period!");
        return;
    }

 if (num_days_history > 360 || num_days_simulation <= 0) {
        alert("Please enter valid values: maximum 360 historical days and a positive simulation period!");
        return;
    }

    document.getElementById('graph').innerHTML = '';
    document.getElementById('result').innerHTML = '';

    const prices = await fetchHistoricalData(ticker, num_days_history);
    if (!prices || prices.length === 0) {
        alert('Unable to fetch historical data for the selected cryptocurrency.');
        return;
    }

    const simulationResults = monteCarloSimulation(prices, num_days_simulation);

    const graphData = simulationResults.map(simulation => ({
        x: [...Array(simulation.length).keys()],
        y: simulation,
        mode: 'lines',
        line: { width: 1 },
        opacity: 0.2,
    }));

    const lastPrice = prices[prices.length - 1];
    const finalPrices = simulationResults.map(simulation => simulation[simulation.length - 1]);
    const prob_up = finalPrices.filter(price => price > lastPrice).length / finalPrices.length;
    const prob_down = finalPrices.filter(price => price < lastPrice).length / finalPrices.length;

    graphData.push({
        x: [0, num_days_simulation],
        y: [lastPrice, lastPrice],
        mode: 'lines',
        line: { color: 'red', dash: 'dash' },
        name: 'Current Price',
    });
	
	 

    const layout = {
        title: `Monte Carlo Simulation for ${ticker} Price in the Next ${num_days_simulation} Days`,
        xaxis: { title: 'Days' },
        yaxis: { title: `${ticker} Price` },
        showlegend: false,
    };

    Plotly.newPlot('graph', graphData, layout);

    document.getElementById('result').innerHTML = `
        Probability of price increase: ${(prob_up * 100).toFixed(2)}%<br>
        Probability of price decrease: ${(prob_down * 100).toFixed(2)}%
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    populateCryptosDropdown();
});
