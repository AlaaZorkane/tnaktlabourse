const fs = require('fs');
const got = require('got')
// const sleep = require('sleep')
const credentials = {
	client: {
		id: 'b889fbbd24fff204cc72870ef4edc3326960de9c3c587a5cad5296b36f806486',
		secret: '48cded28c7c995e990862b8843d1d9ada91ceb0db490cdf14ac0d6717f05fcbe'
	},
	auth: {
		tokenHost: 'https://api.intra.42.fr'
	}
};
const oauth2 = require('simple-oauth2').create(credentials);
const config = {
	promo: "2019-09-ben"
};
function msleep(n) {
	Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}
function sleep(n) {
	msleep(n * 1000);
}
(async () => {
	let filtered = [];
	let token;
	let currentPromo;
	const baseUrl = "https://api.intra.42.fr"
	let page = 1;
	const gibUsers = async (page) => new Promise(async (res, rej) => {
		try {
			const users = (await got(`/v2/cursus/21/cursus_users?filter[campus_id]=21&page[number]=${page}&page[size]=100`, {
				baseUrl,
				headers: {
					Authorization: `Bearer ${token}`,
				},
				json: true
			})).body;
			if (!users.length)
				res(false);
			currentPromo = fs.readFileSync(`promo${config.promo}`, 'utf8', (err, data) => {
				if (err) throw err;
				return (data);
			});
			users.forEach(element => {
				if (element.grade != "null")
				fs.appendFile(`promo${config.promo}`, `${element.user.login}\n`, 'utf8', () => console.log(`Added ${element.user.login}`))
			});
			res(true);
		} catch (err) {
			rej(err)
		}
	})
	try {
		const result = oauth2.clientCredentials.getToken();
		const accessToken = oauth2.accessToken.create(await result);
		token = accessToken.token.access_token;
	} catch (error) {
		console.log('Access Token error', error.message);
	}
	while (await gibUsers(page++))
		;
})();
