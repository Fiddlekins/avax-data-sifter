import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';

// Enter target amount here, AVAX uses 9 decimal places (eg. 1.23 AVAX = 1230000000)
const target = '1234567890';

function process(tx) {
	const amounts = [
		...Object.values(tx.inputTotals),
		...Object.values(tx.outputTotals),
		...tx.inputs.map(input => input.output.amount),
		...tx.outputs.map(output => output.amount)
	];
	if (amounts.some(amount => amount === target)) {
		console.log(`Found possible match! ${tx.id}`);
		fs.writeFileSync(path.join('output', `${tx.id}.json`), JSON.stringify(tx, null, '\t'), 'utf8');
	}
}

async function query(params) {
	const searchParams = new URLSearchParams(params);
	const url = new URL(`https://explorerapi.avax.network/v2/transactions?${searchParams.toString()}`);
	const res = await fetch(url.toString());
	return res.json();
}

async function main() {
	try {
		fs.mkdirSync('output');
	} catch (err) {
		// don't care
	}
	let startTime = (new Date('2020-10-04 00:00:00 GMT+0')) / 1000;
	const endTime = (new Date('2020-10-06 24:00:00 GMT+0')) / 1000;
	const limit = 50;
	let queryParams = {startTime, sort: 'timestamp-asc', limit};
	let queryIndex = 0;
	while (startTime < endTime) {
		queryIndex++;
		const data = await query(queryParams);
		data.transactions.forEach(process);
		const lastTxTimestamp = data.transactions[data.transactions.length - 1].timestamp;
		startTime = (new Date(lastTxTimestamp)) / 1000;
		queryParams = data.next;
		console.log(`query ${queryIndex}: ${queryIndex * limit} txs processed, latest startTime is ${startTime} (${lastTxTimestamp})`);
	}
}

main().catch(console.error);
